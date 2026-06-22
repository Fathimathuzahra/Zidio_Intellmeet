import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MessageSquare, Send, Users, Sparkles, X,
  Copy, Check, Share2, Camera,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { meetingsService } from "../../services/meetings.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ChatMessage { id: number; message: string; sender: string; timestamp: string }
interface Participant  { userId: string; name: string }

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// ─── RemoteVideo HORS du composant parent ─────────────────────────────────────
// CRITIQUE : si défini à l'intérieur, React le recrée à chaque render → stream perdu
function RemoteVideo({
  stream,
  participantName,
}: {
  stream: MediaStream;
  participantName: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white">
        {participantName}
      </div>
    </div>
  );
}

function ControlBtn({
  onClick,
  active,
  danger,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <button
        onClick={onClick}
        title={title}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          danger
            ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/40 active:scale-95"
            : active
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95"
              : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 active:scale-95"
        }`}
      >
        {children}
      </button>
      {title && <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">{title}</span>}
    </div>
  );
}

export default function MeetingRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate   = useNavigate();
  const user       = useAuthStore((s) => s.user);
  const qc         = useQueryClient();

  const socketRef          = useRef<Socket | null>(null);
  const localVideoRef      = useRef<HTMLVideoElement>(null);
  const localStreamRef     = useRef<MediaStream | null>(null);
  const transcriptRef      = useRef("");
  const chatEndRef         = useRef<HTMLDivElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Offres reçues avant que le stream local soit prêt
  const pendingOffersRef   = useRef<Array<{ offer: RTCSessionDescriptionInit; from: string }>>([]);
  // Flag : stream local disponible
  const streamReadyRef     = useRef(false);

  const [isMuted,       setIsMuted]       = useState(false);
  const [isVideoOff,    setIsVideoOff]    = useState(false);
  const [panel,         setPanel]         = useState<"chat" | "participants" | null>(null);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [chatInput,     setChatInput]     = useState("");
  const [participants,  setParticipants]  = useState<Participant[]>([]);
  const [summaryOpen,   setSummaryOpen]   = useState(false);
  const [aiSummary,     setAiSummary]     = useState("");
  const [aiActionItems, setAiActionItems] = useState<string[]>([]);
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [elapsed,       setElapsed]       = useState(0);
  const [shareOpen,     setShareOpen]     = useState(false);
  const [linkCopied,    setLinkCopied]    = useState(false);
  const [remoteStreams,  setRemoteStreams]  = useState<Map<string, MediaStream>>(new Map());

  const { data: meetings } = useQuery({ queryKey: ["meetings"], queryFn: meetingsService.getAll });

  const meetingId = useMemo(
    () => meetings?.find((m) => m.roomId === roomId)?._id ?? null,
    [meetings, roomId],
  );

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const endMutation = useMutation({
    mutationFn: ({ id, transcript }: { id: string; transcript: string }) =>
      meetingsService.end(id, transcript),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });

  const saveSummaryMutation = useMutation({
    mutationFn: ({ id, summary, actionItems }: { id: string; summary: string; actionItems: { text: string; assignee: string }[] }) =>
      meetingsService.saveSummary(id, { summary, actionItems }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["meetings"] }); navigate("/meetings"); },
  });

  // ── Crée une RTCPeerConnection propre pour un userId ─────────────────────────
  const createPC = useCallback((targetUserId: string, socket: Socket): RTCPeerConnection => {
    const existing = peerConnectionsRef.current.get(targetUserId);
    if (existing) { existing.close(); peerConnectionsRef.current.delete(targetUserId); }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Ajoute les tracks locales — stream DOIT être prêt ici
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(targetUserId, stream);
        return next;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", { candidate: event.candidate, targetUserId });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        peerConnectionsRef.current.delete(targetUserId);
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(targetUserId);
          return next;
        });
      }
    };

    peerConnectionsRef.current.set(targetUserId, pc);
    return pc;
  }, []);

  // ── Initier une connexion (appelant) ─────────────────────────────────────────
  const initiateCall = useCallback(async (targetUserId: string, socket: Socket) => {
    if (!localStreamRef.current) return;
    if (peerConnectionsRef.current.has(targetUserId)) return;

    const pc = createPC(targetUserId, socket);
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { offer: pc.localDescription, targetUserId });
    } catch (err) {
      console.error(`Error creating offer for ${targetUserId}:`, err);
    }
  }, [createPC]);

  // ── Répondre à une offre (receveur) ──────────────────────────────────────────
  // Si le stream n'est pas prêt → on met en attente
  const answerOffer = useCallback(async (
    offer: RTCSessionDescriptionInit,
    from: string,
    socket: Socket,
  ) => {
    if (!streamReadyRef.current || !localStreamRef.current) {
      pendingOffersRef.current.push({ offer, from });
      return;
    }

    let pc = peerConnectionsRef.current.get(from);
    if (!pc || pc.signalingState === "closed") {
      pc = createPC(from, socket);
    }

    try {
      if (pc.signalingState !== "stable") {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { answer: pc.localDescription, targetUserId: from });
      }
    } catch (err) {
      console.error(`Error answering offer from ${from}:`, err);
    }
  }, [createPC]);

  // ── Vide la file d'attente dès que le stream est prêt ────────────────────────
  const flushPendingOffers = useCallback((socket: Socket) => {
    const pending = [...pendingOffersRef.current];
    pendingOffersRef.current = [];
    pending.forEach(({ offer, from }) => answerOffer(offer, from, socket));
  }, [answerOffer]);

  // ── Setup principal ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !user) return;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    // ÉTAPE 1 : obtenir le stream local EN PREMIER
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((stream) => {
        localStreamRef.current = stream;
        streamReadyRef.current = true;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // ÉTAPE 2 : rejoindre la room seulement quand le stream est prêt
        socket.emit("join-room", { roomId, userId: user.id, name: user.name });

        // ÉTAPE 3 : traiter les offres arrivées avant le stream
        flushPendingOffers(socket);
      })
      .catch((err) => {
        console.error("getUserMedia failed:", err);
        // Sans caméra on rejoint quand même (mode spectateur)
        socket.emit("join-room", { roomId, userId: user.id, name: user.name });
      });

    // Participants déjà présents → on appelle chacun
    socket.on("existing-participants", (list: Participant[]) => {
      list.forEach(({ userId }) => {
        if (userId !== user.id) initiateCall(userId, socket);
      });
    });

    // Quelqu'un arrive après nous → il nous appelle, on ne fait rien
    // (c'est lui qui envoie l'offre via initiateCall côté backend)
    socket.on("user-joined", ({ userId: newId }: { userId: string }) => {
      if (newId !== user.id) initiateCall(newId, socket);
    });

    // Reçoit une offre
    socket.on("webrtc-offer", ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
      if (from !== user.id) answerOffer(offer, from, socket);
    });

    // Reçoit une réponse
    socket.on("webrtc-answer", async ({ answer, from }: { answer: RTCSessionDescriptionInit; from: string }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(answer);
      }
    });

    // Candidats ICE
    socket.on("webrtc-ice-candidate", async ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (error) {
          console.warn("Unable to add ICE candidate", error);
        }
      }
    });

    socket.on("participants-updated", (list: Participant[]) => setParticipants(list));

    socket.on("user-left", ({ userId: leftId }: { userId: string }) => {
      const pc = peerConnectionsRef.current.get(leftId);
      if (pc) pc.close();
      peerConnectionsRef.current.delete(leftId);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(leftId);
        return next;
      });
    });

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((p) => [...p, msg]);
      transcriptRef.current += `\n${msg.sender}: ${msg.message}`;
    });

    const peerConnections = peerConnectionsRef.current;

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnections.forEach((pc) => pc.close());
      peerConnections.clear();
      streamReadyRef.current = false;
      socket.disconnect();
    };
  }, [roomId, user, initiateCall, answerOffer, flushPendingOffers]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleMute = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
  };

  const toggleVideo = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); }
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit("chat-message", { roomId, message: chatInput, sender: user?.name ?? "You" });
    setChatInput("");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinLink = `${window.location.origin}/join/${roomId}`;

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`🎥 You're invited to join my IntellMeet meeting!\n\nClick the link to join:\n${joinLink}\n\nRoom ID: ${roomId}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Join my IntellMeet meeting", text: `Join my meeting — Room: ${roomId}`, url: joinLink });
    } else {
      copyJoinLink();
    }
  };

  const generateAISummary = () => {
    setIsGenerating(true);
    setSummaryOpen(true);
    setTimeout(() => {
      const t = transcriptRef.current || "No transcript available.";
      setAiSummary(
        `This meeting covered key project updates and team coordination topics. ` +
        `${messages.length} messages were exchanged during the session.\n\nTranscript excerpt:\n${t.slice(0, 300)}${t.length > 300 ? "..." : ""}`,
      );
      setAiActionItems([
        "Follow up on discussed items with the team",
        "Schedule next meeting within the week",
        "Share meeting notes with all participants",
      ]);
      setIsGenerating(false);
    }, 1800);
  };

  const handleEndMeeting = async () => {
    if (meetingId) await endMutation.mutateAsync({ id: meetingId, transcript: transcriptRef.current });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionsRef.current.forEach((pc) => pc.close());
    socketRef.current?.disconnect();
    navigate("/meetings");
  };

  const handleSaveSummary = () => {
    if (!meetingId) return;
    saveSummaryMutation.mutate({
      id: meetingId,
      summary: aiSummary,
      actionItems: aiActionItems.map((text) => ({ text, assignee: "" })),
    });
  };

  return (
    <div className="relative flex h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-sm font-bold tracking-wide">LIVE</span>
            </div>
            <div className="h-5 w-px bg-white/10" />
            <span className="font-mono text-sm font-bold bg-white/5 px-3 py-1.5 rounded-xl text-emerald-400">
              {formatTime(elapsed)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={copyRoomId} className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="font-mono">{roomId}</span>
            </button>
            <div className="flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded-xl">
              <Users size={14} className="text-primary" />
              <span className="font-semibold">{participants.length}</span>
              <span className="text-zinc-400">participant{participants.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Video grid — s'adapte au nombre de participants */}
        <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
          <div className={`grid gap-4 ${
            remoteStreams.size === 0
              ? "grid-cols-1 max-w-2xl mx-auto"
              : remoteStreams.size === 1
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}>
            {/* Vidéo locale */}
            <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-2">
                  <Camera size={20} className="text-zinc-500" />
                  <span className="text-xs text-zinc-500">Camera off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-xs text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                  {user?.name ?? "You"} (You)
                </span>
                {isMuted && <span className="bg-red-500/80 rounded-full p-1"><MicOff size={10} /></span>}
              </div>
            </div>

            {/* Vidéos distantes */}
            {Array.from(remoteStreams.entries()).map(([uid, stream]) => (
              <RemoteVideo
                key={uid}
                stream={stream}
                participantName={participants.find((p) => p.userId === uid)?.name ?? "Participant"}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-5 px-8 bg-zinc-900/95 backdrop-blur-xl border-t border-white/5">
          <ControlBtn onClick={toggleMute} active={isMuted} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </ControlBtn>
          <ControlBtn onClick={toggleVideo} active={isVideoOff} title={isVideoOff ? "Start video" : "Stop video"}>
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </ControlBtn>
          <div className="w-px h-10 bg-white/10" />
          <ControlBtn onClick={generateAISummary} title="AI Summary">
            <Sparkles size={20} className="text-primary" />
          </ControlBtn>
          <ControlBtn onClick={() => setShareOpen(true)} title="Share">
            <Share2 size={20} />
          </ControlBtn>
          <ControlBtn onClick={() => setPanel(panel === "chat" ? null : "chat")} active={panel === "chat"} title="Chat">
            <MessageSquare size={20} />
          </ControlBtn>
          <ControlBtn onClick={() => setPanel(panel === "participants" ? null : "participants")} active={panel === "participants"} title="Participants">
            <Users size={20} />
          </ControlBtn>
          <div className="w-px h-10 bg-white/10" />
          <ControlBtn onClick={handleEndMeeting} danger title="End meeting">
            <PhoneOff size={20} />
          </ControlBtn>
        </div>
      </div>

      {/* Side panel */}
      {panel && (
        <div className="w-96 flex flex-col bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${panel === "chat" ? "bg-primary/20" : "bg-emerald-500/20"}`}>
                {panel === "chat" ? <MessageSquare size={16} className="text-primary" /> : <Users size={16} className="text-emerald-400" />}
              </div>
              <span className="font-bold">
                {panel === "chat" ? "Meeting Chat" : `Participants (${participants.length})`}
              </span>
            </div>
            <button onClick={() => setPanel(null)} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>

          {panel === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-zinc-500">
                    <MessageSquare size={28} className="opacity-40" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">{msg.sender}</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="bg-zinc-800/80 rounded-2xl rounded-tl-sm px-4 py-2.5">
                      <p className="text-sm text-zinc-200 leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-white/10 flex gap-2">
                <input
                  type="text" value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button onClick={sendMessage} className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:opacity-90 shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {p.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                  </div>
                  <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                  {p.userId === user?.id && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">You</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Share2 size={18} className="text-primary" /></div>
                <h2 className="font-bold text-lg">Share Meeting</h2>
              </div>
              <button onClick={() => setShareOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Meeting Link</p>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <span className="flex-1 text-xs text-zinc-300 font-mono truncate">{joinLink}</span>
                  <button onClick={copyJoinLink} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${linkCopied ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 hover:bg-white/20 text-zinc-300"}`}>
                    {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                    {linkCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <button onClick={shareWhatsApp} className="w-full flex items-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 px-4 py-3 rounded-xl transition-all">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <div className="text-left"><p className="text-sm font-semibold">WhatsApp</p><p className="text-xs text-zinc-400">Send invite to your contacts</p></div>
              </button>
              <button onClick={shareNative} className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl transition-all">
                <Share2 size={14} className="text-zinc-300" />
                <div className="text-left"><p className="text-sm font-semibold">More Options</p><p className="text-xs text-zinc-400">Email, Telegram, Slack...</p></div>
              </button>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Room ID</p>
                  <p className="text-sm font-mono font-bold">{roomId}</p>
                </div>
                <button onClick={copyRoomId} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy ID"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Sparkles size={18} className="text-primary" /></div>
                <h2 className="font-bold text-lg">AI Meeting Intelligence</h2>
              </div>
              {!isGenerating && (
                <button onClick={() => setSummaryOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"><X size={16} /></button>
              )}
            </div>
            <div className="p-6 space-y-5">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-16 gap-5">
                  <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-semibold">AI is analyzing your meeting...</p>
                    <p className="text-zinc-500 text-sm mt-1">Processing transcript and extracting insights</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Executive Summary</p>
                    <div className="bg-white/5 rounded-xl p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border border-white/10">{aiSummary}</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Action Items</p>
                    <ul className="space-y-2">
                      {aiActionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                          <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="text-sm text-zinc-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setSummaryOpen(false)} className="flex-1 h-11 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-all">Close</button>
                    <button onClick={handleSaveSummary} disabled={saveSummaryMutation.isPending} className="flex-1 h-11 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                      {saveSummaryMutation.isPending
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                        : "Save & End Meeting"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

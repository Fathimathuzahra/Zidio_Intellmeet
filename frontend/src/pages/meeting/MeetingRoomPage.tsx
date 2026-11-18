import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MessageSquare, Send, Users, Sparkles, X,
  Copy, Check, Share2, Camera, ChevronLeft, Shield, Wifi,
  MonitorUp, Circle, FileText,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { meetingsService } from "../../services/meetings.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SOCKET_URL, WEBRTC_ICE_SERVERS } from "@/lib/config";
import type { TranscriptionEntry, SharedNote } from "@/types/meeting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ChatMessage { id: number; message: string; sender: string; timestamp: string; senderId?: string }
interface Participant  { userId: string; name: string; socketId?: string }

const ICE_SERVERS: RTCConfiguration = {
  iceServers: WEBRTC_ICE_SERVERS,
};

// ─── RemoteVideo HORS du composant parent ─────────────────────────────────────
// CRITIQUE : si défini à l'intérieur, React le recrée à chaque render → stream perdu
function RemoteVideo({
  stream,
  participantName,
  micOn = true,
  videoOn = true,
  muted = false,
}: {
  stream: MediaStream;
  participantName: string;
  micOn?: boolean;
  videoOn?: boolean;
  muted?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      {!videoOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 gap-2">
          <Camera size={24} className="text-zinc-400" />
          <span className="text-sm text-zinc-400">Camera off</span>
        </div>
      )}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <span className={`rounded-full p-1 ${micOn ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}>
          {micOn ? <Mic size={12} className="text-white" /> : <MicOff size={12} className="text-white" />}
        </span>
        <span className={`rounded-full p-1 ${videoOn ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}>
          {videoOn ? <Video size={12} className="text-white" /> : <VideoOff size={12} className="text-white" />}
        </span>
      </div>
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
        {participantName}
      </div>
    </div>
  );
}

function ParticipantPreviewCard({
  participantName,
  isHost,
  micOn,
  videoOn,
}: {
  participantName: string;
  isHost?: boolean;
  micOn: boolean;
  videoOn: boolean;
}) {
  return (
    <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-xl flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/70" />
      <div className="relative z-10 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl text-white/80">
          {participantName.charAt(0) || "?"}
        </div>
        <div>
          <p className="text-sm font-semibold text-white truncate">{participantName}</p>
          {isHost && <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80 mt-1">Host</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full p-2 ${micOn ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}>
            {micOn ? <Mic size={14} className="text-white" /> : <MicOff size={14} className="text-white" />}
          </span>
          <span className={`rounded-full p-2 ${videoOn ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}>
            {videoOn ? <Video size={14} className="text-white" /> : <VideoOff size={14} className="text-white" />}
          </span>
        </div>
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
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: ReactNode;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          danger
            ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/40 active:scale-95"
            : active
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95"
              : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 active:scale-95"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestUser   = useMemo(() => {
    try { const g = sessionStorage.getItem('guestUser'); return g ? JSON.parse(g) : null } catch { return null }
  }, []);
  const effectiveUser = user ?? guestUser;
  const qc         = useQueryClient();

  const socketRef          = useRef<Socket | null>(null);
  const localVideoRef      = useRef<HTMLVideoElement>(null);
  const localStreamRef     = useRef<MediaStream | null>(null);
  const screenStreamRef    = useRef<MediaStream | null>(null);
  const recorderRef        = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const transcriptRef      = useRef("");
  const transcriptionEnabledRef = useRef(true);
  const transcriptionStopResolverRef = useRef<(() => void) | null>(null);
  const chatEndRef         = useRef<HTMLDivElement>(null);
  const notesEndRef        = useRef<HTMLDivElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Offres reçues avant que le stream local soit prêt
  const pendingOffersRef   = useRef<Array<{ offer: RTCSessionDescriptionInit; from: string }>>([]);
  // Flag : stream local disponible
  const streamReadyRef     = useRef(false);

  const [isMuted,       setIsMuted]       = useState(false);
  const [isVideoOff,    setIsVideoOff]    = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [panel, setPanel] = useState<"chat" | "transcription" | "notes" | "participants" | null>(null);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [chatInput,     setChatInput]     = useState("");
  const [participants,  setParticipants]  = useState<Participant[]>([]);
  const [summaryOpen,   setSummaryOpen]   = useState(false);
  const [aiSummary,     setAiSummary]     = useState("");
  const [aiActionItems, setAiActionItems] = useState<{ text: string; assignee: string }[]>([]);
  const [aiSource, setAiSource] = useState<"openai" | "demo" | null>(null);
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [elapsed,       setElapsed]       = useState(0);
  const [shareOpen,     setShareOpen]     = useState(false);
  const [linkCopied,    setLinkCopied]    = useState(false);
  const [remoteStreams,  setRemoteStreams]  = useState<Map<string, MediaStream>>(new Map());
  const [pendingGuests, setPendingGuests] = useState<Array<{ socketId: string; name: string }>>([]);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const speechRecognitionSupported = typeof window !== "undefined"
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const [transcriptionStatus, setTranscriptionStatus] = useState(
    speechRecognitionSupported
      ? "Waiting for microphone permission..."
      : "Live captions are not supported in this browser. You can still add meeting notes.",
  );
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const meetingEndedRef = useRef(false);
  const [analysisError, setAnalysisError] = useState("");
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);

  const { data: meetings } = useQuery({ queryKey: ["meetings"], queryFn: meetingsService.getAll });

  const meetingId = useMemo(
    () => meetings?.find((m) => m.roomId === roomId)?._id ?? null,
    [meetings, roomId],
  );

  const meeting = useMemo(() => meetings?.find((m) => m.roomId === roomId) ?? null, [meetings, roomId]);
  const meetingTitle = useMemo(() => meeting?.title ?? `Room ${roomId}`, [meeting, roomId]);
  const isHost = Boolean(effectiveUser && meeting && meeting.host?._id === effectiveUser.id);

  useEffect(() => {
    meetingEndedRef.current = meeting?.status === "ended";
  }, [meeting?.status]);

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
    onError: (error) => {
      console.error("Unable to save AI meeting summary:", error);
      toast.error("Could not save the AI summary. Please retry.");
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: ({ id, transcript }: { id: string; transcript: string }) => meetingsService.analyze(id, transcript),
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
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { answer: pc.localDescription, targetUserId: from });
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
    if (!roomId || !effectiveUser) return;

    const socket = io(SOCKET_URL, { withCredentials: true, auth: accessToken ? { token: accessToken } : {} });
    socketRef.current = socket;

    // ÉTAPE 1 : obtenir le stream local EN PREMIER
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStreamState(stream);
        streamReadyRef.current = true;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // ÉTAPE 2 : rejoindre la room seulement quand le stream est prêt
        const isGuest = !user && !!guestUser;
        socket.emit("join-room", { roomId, userId: effectiveUser.id, name: effectiveUser.name, isGuest });

        // ÉTAPE 3 : traiter les offres arrivées avant le stream
        flushPendingOffers(socket);
      })
      .catch((err) => {
        console.error("getUserMedia failed:", err);
        setTranscriptionStatus("Microphone access is unavailable. You can still add meeting notes.");
        // Sans caméra on rejoint quand même (mode spectateur)
        const isGuest = !user && !!guestUser;
        socket.emit("join-room", { roomId, userId: effectiveUser.id, name: effectiveUser.name, isGuest });
      });

    // Participants déjà présents → on met à jour l'état et on appelle chacun
    socket.on("existing-participants", (list: Participant[]) => {
      setParticipants((prev) => {
        const merged = [...prev];
        list.forEach((p) => {
          if (!merged.some((m) => m.userId === p.userId)) {
            merged.push(p);
          }
        });
        if (effectiveUser && !merged.some((m) => m.userId === effectiveUser.id)) {
          merged.push({ userId: effectiveUser.id, name: effectiveUser.name });
        }
        return merged;
      });
      list.forEach(({ userId }) => {
        if (userId !== effectiveUser.id) initiateCall(userId, socket);
      });
    });

    // Quelqu'un arrive après nous → on met à jour l'état et on appelle
    socket.on("user-joined", ({ userId: newId, name }: { userId: string; name: string }) => {
      if (newId !== effectiveUser.id) {
        setParticipants((prev) => {
          if (prev.some((p) => p.userId === newId)) return prev;
          return [...prev, { userId: newId, name }];
        });
        initiateCall(newId, socket);
      }
    });

    // Reçoit une offre
    socket.on("webrtc-offer", ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
      if (from !== effectiveUser.id) answerOffer(offer, from, socket);
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

    socket.on("room-error", ({ code, message }: { code?: string; message?: string }) => {
      toast.error(message || "Unable to join the meeting.");
      if (code === "MEETING_ACCESS_DENIED") {
        navigate(user ? "/meetings" : `/join/${roomId}`);
      }
    });

    socket.on("participants-updated", (list: Participant[]) => setParticipants(list));

    socket.on("removed", ({ roomId: removedRoomId, reason }: { roomId: string; reason?: string }) => {
      if (removedRoomId === roomId) {
        window.alert(reason ?? "You were removed from the meeting.")
        navigate("/meetings")
      }
    });

    // Lobby: incoming guest requests
    socket.on("guest-requested", ({ socketId, name }: { socketId: string; name: string }) => {
      setPendingGuests((p) => {
        if (p.some((g) => g.socketId === socketId)) return p;
        return [...p, { socketId, name }];
      });
    });

    socket.on("pending-guest-requests", (requests: Array<{ socketId: string; name: string }>) => {
      setPendingGuests(requests);
    });

    socket.on("guest-rejected-notify", ({ guestSocketId }: { guestSocketId: string }) => {
      setPendingGuests((p) => p.filter((g) => g.socketId !== guestSocketId));
    });

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

    socket.on("transcript-entry", (entry: TranscriptionEntry) => {
      if (entry.senderId !== effectiveUser.id) {
        transcriptRef.current += `\n${entry.sender}: ${entry.text}`;
      }
      setTranscriptions((previous) => [
        ...previous.filter((item) => item.isFinal),
        entry,
      ]);
    });
    socket.on("shared-note", (entry: SharedNote) => {
      if (entry.authorId !== effectiveUser.id) {
        transcriptRef.current += `\nMeeting note from ${entry.author}: ${entry.content}`;
      }
      setSharedNotes((p) => [...p, entry]);
    });

    const peerConnections = peerConnectionsRef.current;

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      recorderRef.current?.stop();
      peerConnections.forEach((pc) => pc.close());
      peerConnections.clear();
      streamReadyRef.current = false;
      transcriptionEnabledRef.current = false;
      recognitionRef.current?.stop();
      socket.disconnect();
    };
  }, [roomId, effectiveUser, accessToken, navigate, initiateCall, answerOffer, flushPendingOffers, user, guestUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sharedNotes]);

  // ── Web Speech API transcription ──────────────────────────────────
  useEffect(() => {
    if (!localStreamState) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      transcriptionEnabledRef.current = false;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.addEventListener("start", () => {
      setIsTranscribing(true);
      setTranscriptionStatus("Live captions are on — each participant's speech is transcribed in their browser.");
    });

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      const finalSegments: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          if (transcript.trim()) finalSegments.push(transcript.trim());
        } else {
          interimTranscript += transcript;
        }
      }
      if (interimTranscript.trim()) {
        const interim: TranscriptionEntry = {
          id: "live-interim",
          text: interimTranscript.trim(),
          sender: effectiveUser?.name ?? "You",
          timestamp: new Date().toISOString(),
          isFinal: false,
        };
        setTranscriptions((previous) => [...previous.filter((item) => item.isFinal), interim]);
      } else {
        setTranscriptions((previous) => previous.filter((item) => item.isFinal));
      }

      for (const text of finalSegments) {
        if (socketRef.current?.connected) {
          transcriptRef.current += `\n${effectiveUser?.name ?? "You"}: ${text}`;
          socketRef.current.emit("transcript-entry", { text });
        } else {
          const entry: TranscriptionEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text,
            sender: effectiveUser?.name ?? "You",
            timestamp: new Date().toISOString(),
            isFinal: true,
          };
          transcriptRef.current += `\n${entry.sender}: ${text}`;
          setTranscriptions((previous) => [...previous.filter((item) => item.isFinal), entry]);
        }
      }
    };

    recognition.onend = () => {
      if (transcriptionEnabledRef.current) {
        window.setTimeout(() => {
          if (!transcriptionEnabledRef.current) return;
          try {
            recognition.start();
          } catch {
            setTranscriptionStatus("Reconnecting live captions...");
          }
        }, 250);
      } else {
        transcriptionStopResolverRef.current?.();
        transcriptionStopResolverRef.current = null;
      }
    };

    recognition.onerror = (event: Event) => {
      const error = (event as Event & { error?: string }).error;
      if (error === "no-speech" || error === "aborted") return;
      transcriptionEnabledRef.current = false;
      setIsTranscribing(false);
      setTranscriptionStatus(
        error === "not-allowed" || error === "service-not-allowed"
          ? "Microphone permission is required for live captions. You can still add meeting notes."
          : "Live captions stopped. You can restart them or add meeting notes.",
      );
      transcriptionStopResolverRef.current?.();
      transcriptionStopResolverRef.current = null;
    };

    recognitionRef.current = recognition;
    transcriptionEnabledRef.current = true;
    try {
      recognition.start();
    } catch {
      transcriptionEnabledRef.current = false;
      window.setTimeout(() => {
        if (recognitionRef.current !== recognition) return;
        setIsTranscribing(false);
        setTranscriptionStatus("Could not start live captions. Check microphone permission or add meeting notes.");
      }, 0);
    }
    return () => {
      transcriptionEnabledRef.current = false;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [effectiveUser?.id, effectiveUser?.name, localStreamState, roomId]);

  const acceptGuest = (guestSocketId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('accept-guest', { roomId, guestSocketId });
    setPendingGuests((p) => p.filter((g) => g.socketId !== guestSocketId));
  };

  const rejectGuest = (guestSocketId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('reject-guest', { roomId, guestSocketId });
    setPendingGuests((p) => p.filter((g) => g.socketId !== guestSocketId));
  };

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
    socketRef.current.emit("chat-message", { roomId, message: chatInput, sender: effectiveUser?.name ?? "You", senderId: effectiveUser?.id });
    setChatInput("");
  };

  const toggleTranscription = () => {
    if (transcriptionEnabledRef.current) {
      transcriptionEnabledRef.current = false;
      setIsTranscribing(false);
      setTranscriptionStatus("Live captions paused");
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        setTranscriptionStatus("Live captions are unavailable. Check microphone permission or add meeting notes.");
        return;
      }
      transcriptionEnabledRef.current = true;
      setIsTranscribing(true);
      setTranscriptionStatus("Starting live captions...");
      try {
        recognitionRef.current.start();
      } catch {
        transcriptionEnabledRef.current = false;
        setIsTranscribing(false);
        setTranscriptionStatus("Could not restart live captions. Check microphone permission or add meeting notes.");
      }
    }
  };

  const addNote = () => {
    if (!newNote.trim() || !socketRef.current || !roomId) return;
    const note = newNote.trim();
    const author = effectiveUser?.name ?? "You";
    transcriptRef.current += `\nMeeting note from ${author}: ${note}`;
    socketRef.current.emit("shared-note", { roomId, note, author, authorId: effectiveUser?.id });
    setNewNote("");
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

  const removeParticipant = (targetUserId: string) => {
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit("remove-participant", { roomId, targetUserId });
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Join my IntellMeet meeting", text: `Join my meeting — Room: ${roomId}`, url: joinLink });
    } else {
      copyJoinLink();
    }
  };

  const replaceOutboundVideoTrack = async (track: MediaStreamTrack | null) => {
    await Promise.all([...peerConnectionsRef.current.values()].map(async (connection) => {
      const sender = connection.getSenders().find((candidate) => candidate.track?.kind === 'video');
      if (sender) await sender.replaceTrack(track);
    }));
  };

  const stopScreenShare = async () => {
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
    await replaceOutboundVideoTrack(cameraTrack);
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) { await stopScreenShare(); return; }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) return;
      screenStreamRef.current = stream;
      await replaceOutboundVideoTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      screenTrack.addEventListener('ended', () => { void stopScreenShare(); }, { once: true });
      setIsScreenSharing(true);
    } catch {
      setIsScreenSharing(false);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const toggleRecording = () => {
    if (isRecording) { stopRecording(); return; }
    const stream = isScreenSharing ? screenStreamRef.current : localStreamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined') return;
    const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm' });
    recordingChunksRef.current = [];
    recorder.ondataavailable = (event) => { if (event.data.size) recordingChunksRef.current.push(event.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `intellmeet-${roomId || 'meeting'}-${Date.now()}.webm`;
      anchor.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
      recorderRef.current = null;
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setIsRecording(true);
  };

  const getMeetingContext = () => [
    transcriptRef.current.trim(),
    newNote.trim() ? `Meeting note from ${effectiveUser?.name ?? "You"}: ${newNote.trim()}` : "",
  ].filter(Boolean).join("\n");

  const generateAISummary = async (meetingContext = getMeetingContext()) => {
    setAnalysisError("");
    setAiSummary("");
    setAiActionItems([]);
    setAiSource(null);
    setIsGenerating(true);
    setSummaryOpen(true);
    if (!meetingId) {
      setAnalysisError("Meeting details are still loading. Please wait a moment and retry.");
      setIsGenerating(false);
      return;
    }
    if (!meetingContext.trim()) {
      setAnalysisError("No transcript or meeting notes were captured. Add a note or check microphone permission, then retry.");
      setIsGenerating(false);
      return;
    }
    try {
      const analysis = await analyzeMutation.mutateAsync({ id: meetingId, transcript: meetingContext });
      setAiSummary(analysis.summary);
      setAiActionItems(analysis.actionItems);
      setAiSource(analysis.source ?? null);
    } catch (error: unknown) {
      const backendMessage = typeof error === "object" && error && "response" in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setAnalysisError(backendMessage || "AI analysis failed. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const stopTranscriptionAndWait = async () => {
    if (!recognitionRef.current || !transcriptionEnabledRef.current) return;
    transcriptionEnabledRef.current = false;
    setIsTranscribing(false);
    setTranscriptionStatus("Captions saved with the meeting");
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        transcriptionStopResolverRef.current = null;
        resolve();
      };
      transcriptionStopResolverRef.current = finish;
      window.setTimeout(finish, 1500);
      try {
        recognitionRef.current?.stop();
      } catch {
        finish();
      }
    });
  };

  const handleEndMeeting = async () => {
    if (!isHost || !meetingId || endMutation.isPending || isGenerating) return;
    try {
      if (isRecording) stopRecording();
      if (isScreenSharing) await stopScreenShare();
      await stopTranscriptionAndWait();
      const meetingContext = getMeetingContext();
      if (!meetingEndedRef.current) {
        await endMutation.mutateAsync({ id: meetingId, transcript: meetingContext });
        meetingEndedRef.current = true;
      }
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      setLocalStreamState(null);
      peerConnectionsRef.current.forEach((connection) => connection.close());
      peerConnectionsRef.current.clear();
      socketRef.current?.disconnect();
      await generateAISummary(meetingContext);
    } catch (error) {
      console.error("Unable to finish meeting:", error);
      toast.error("Could not save the meeting transcript. Please retry before leaving.");
    }
  };

  const handleSaveSummary = async () => {
    if (!meetingId || !aiSummary.trim()) return;
    try {
      if (!meetingEndedRef.current) {
        await stopTranscriptionAndWait();
        await endMutation.mutateAsync({ id: meetingId, transcript: getMeetingContext() });
        meetingEndedRef.current = true;
      }
      saveSummaryMutation.mutate({
        id: meetingId,
        summary: aiSummary,
        actionItems: aiActionItems,
      });
    } catch (error) {
      console.error("Unable to save meeting summary:", error);
      toast.error("Could not save the meeting. Please try again.");
    }
  };

  const allParticipants = useMemo(() => {
    const localParticipant = {
      userId: effectiveUser?.id,
      name: effectiveUser?.name ?? "You",
      isLocal: true,
    };
    const remoteParticipants = participants
      .filter((p) => p.userId !== effectiveUser?.id)
      .map((p) => ({ ...p, isLocal: false }));
    return [localParticipant, ...remoteParticipants];
  }, [participants, effectiveUser]);

  return (
    <div className="relative flex h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-zinc-900/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/meetings')} className="p-2 rounded-lg hover:bg-white/6">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-bold tracking-wide">LIVE</span>
              </div>
              <div className="hidden sm:block h-5 w-px bg-white/10" />
              <div className="hidden sm:flex items-center gap-2">
                <h3 className="text-sm font-semibold truncate max-w-xs">{meetingTitle}</h3>
                {meeting?.host?.name && (
                  <span className="text-xs text-white/40">({meeting.host.name} · Host)</span>
                )}
                <span className="text-xs text-white/40">•</span>
                <span className="font-mono text-xs text-emerald-400">{formatTime(elapsed)}</span>
              </div>
            </div>
          </div>
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
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1 text-xs">
                <Shield size={14} className="text-white/60" />
                <span className="text-white/60">Encrypted</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1 text-xs">
                <Wifi size={14} className="text-white/60" />
                <span className="text-white/60">Good</span>
              </div>
            </div>

            <button onClick={() => setShareOpen(true)} className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-all">
              <Share2 size={14} /> Invite
            </button>

            <button onClick={copyRoomId} className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-all">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="font-mono">{roomId}</span>
            </button>

            <div className="flex items-center gap-2 text-sm bg-white/5 px-3 py-2 rounded-xl">
              <Users size={14} className="text-primary" />
              <span className="font-semibold">{participants.length}</span>
            </div>
          </div>
        </div>

        {/* Video grid — s'adapte au nombre de participants */}
        {/* Video grid - unified layout like Google Meet/Zoom */}
        <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
          {/* Responsive grid: adapt columns based on participant count */}
          {(() => {
            const count = allParticipants.length;
            let cols;
            if (count === 1) cols = 1;
            else if (count === 2) cols = 2;
            else if (count <= 4) cols = 2;
            else if (count <= 9) cols = 3;
            else if (count <= 16) cols = 4;
            else cols = 5;
            return (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
                {allParticipants.map((participant) => {
                  const isLocal = participant.isLocal;
                  const stream = isLocal ? localStreamState : remoteStreams.get(participant.userId);
                  const isHost = meeting?.host?._id === participant.userId;
                  const participantName = `${participant.name ?? "Participant"}${isHost ? " (Host)" : ""}`;
                  const videoOn = !!stream && stream.getVideoTracks().some((track) => track.enabled);
                  const micOn = !!stream && stream.getAudioTracks().some((track) => track.enabled);

                  return stream ? (
                    <RemoteVideo
                      key={participant.userId}
                      stream={stream}
                      participantName={participantName}
                      micOn={micOn}
                      videoOn={videoOn}
                      muted={isLocal}
                    />
                  ) : (
                    <ParticipantPreviewCard
                      key={participant.userId}
                      participantName={participantName}
                      isHost={isHost}
                      micOn={false}
                      videoOn={false}
                    />
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-5 px-8 bg-zinc-900/95 backdrop-blur-xl border-t border-white/5">
          <ControlBtn onClick={toggleMute} active={isMuted} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </ControlBtn>
           <ControlBtn onClick={toggleVideo} active={isVideoOff} title={isVideoOff ? "Start video" : "Stop video"}>
             {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
           </ControlBtn>
           <ControlBtn onClick={() => void toggleScreenShare()} active={isScreenSharing} title={isScreenSharing ? "Stop screen share" : "Share screen"}>
             <MonitorUp size={20} />
           </ControlBtn>
           <ControlBtn onClick={toggleRecording} active={isRecording} title={isRecording ? "Stop local recording" : "Start local recording"}>
             <Circle size={18} className={isRecording ? "fill-red-500 text-red-500" : "text-zinc-200"} />
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
          <ControlBtn onClick={toggleTranscription} active={isTranscribing} title={isTranscribing ? "Stop transcription" : "Start transcription"}>
            <Mic size={20} className={isTranscribing ? "text-red-400" : "text-primary"} />
          </ControlBtn>
          <ControlBtn onClick={() => setPanel(panel === "notes" ? null : "notes")} active={panel === "notes"} title="Notes">
            <FileText size={20} />
          </ControlBtn>
          <div className="w-px h-10 bg-white/10" />
          <ControlBtn
            onClick={handleEndMeeting}
            danger
            disabled={!isHost || endMutation.isPending || isGenerating}
            title={!isHost ? "Only the meeting host can end this meeting" : endMutation.isPending || isGenerating ? "Finishing meeting..." : "End meeting and generate AI notes"}
          >
            <PhoneOff size={20} />
          </ControlBtn>
        </div>
      </div>

      {/* Side panel */}
      {panel && (
        <div className="w-96 flex flex-col bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/20">
                <MessageSquare size={16} className="text-primary" />
              </div>
              <span className="font-bold">Meeting Panel</span>
            </div>
            <button onClick={() => setPanel(null)} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>

          <Tabs value={panel ?? ""} onValueChange={(v) => setPanel(v as typeof panel)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 px-2 py-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col">
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
            </TabsContent>

            <TabsContent value="transcription" className="flex-1 flex flex-col">
              <div className={`px-4 py-3 text-xs border-b border-white/10 ${isTranscribing ? "text-emerald-300 bg-emerald-500/5" : "text-amber-200 bg-amber-500/5"}`}>
                {transcriptionStatus}
              </div>
              <ScrollArea className="flex-1 p-4">
                {transcriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-zinc-500">
                    <Mic size={28} className="opacity-40" />
                    <p className="text-sm text-center">Your speech captions will appear here. Add notes if live captions are unavailable.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transcriptions.map((entry) => (
                      <div key={entry.id} className={`rounded-xl px-4 py-2.5 ${entry.isFinal ? "bg-zinc-800/80" : "bg-zinc-800/40 border border-white/5"}`}>
                        <p className={`text-sm leading-relaxed ${entry.isFinal ? "text-zinc-200" : "text-zinc-400 italic"}`}>{entry.text}</p>
                        <span className="text-[10px] text-zinc-500 mt-1 block">{entry.sender}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t border-white/10 flex justify-center">
                <button onClick={toggleTranscription} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isTranscribing ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-primary/20 text-primary hover:bg-primary/30"}`}>
                  {isTranscribing ? "Stop Transcription" : "Start Transcription"}
                </button>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                {sharedNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-zinc-500">
                    <FileText size={28} className="opacity-40" />
                    <p className="text-sm">No notes yet. Add a note to collaborate.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedNotes.map((note) => (
                      <div key={note.id} className="bg-zinc-800/80 rounded-xl px-4 py-3">
                        <p className="text-sm text-zinc-200 leading-relaxed">{note.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-semibold text-primary">{note.author}</span>
                          <span className="text-[10px] text-zinc-500">{new Date(note.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    ))}
                    <div ref={notesEndRef} />
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t border-white/10 flex gap-2">
                <input
                  type="text" value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  placeholder="Add a note..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button onClick={addNote} className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:opacity-90 shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </TabsContent>

            <TabsContent value="participants" className="flex-1 overflow-y-auto p-4 space-y-2">
              {isHost && pendingGuests.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-white/60 font-semibold mb-2">Pending requests</p>
                  <div className="space-y-2">
                    {pendingGuests.map((g) => (
                      <div key={g.socketId} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{g.name?.charAt(0)?.toUpperCase() ?? "?"}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{g.name}</div>
                          <div className="text-[11px] text-white/50">Waiting for host approval</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => acceptGuest(g.socketId)} className="px-3 py-1 rounded-lg bg-emerald-500 text-xs font-semibold">Accept</button>
                          <button onClick={() => rejectGuest(g.socketId)} className="px-3 py-1 rounded-lg bg-white/6 text-xs">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {participants.map((p) => {
                const isParticipantHost = meeting?.host?._id === p.userId;
                const isLocalParticipant = p.userId === effectiveUser?.id;
                const hasVideo = isLocalParticipant ? !isVideoOff : remoteStreams.get(p.userId)?.getVideoTracks().some((track) => track.enabled) ?? false;
                const hasMic = isLocalParticipant ? !isMuted : remoteStreams.get(p.userId)?.getAudioTracks().some((track) => track.enabled) ?? false;
                return (
                  <div key={p.userId} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {p.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400">
                        {isParticipantHost && <span className="uppercase tracking-[0.2em] text-primary/80">Host</span>}
                        {isLocalParticipant && <span className="uppercase tracking-[0.2em] text-emerald-400">You</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full p-1 ${hasMic ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}>
                        {hasMic ? <Mic size={12} className="text-white" /> : <MicOff size={12} className="text-white" />}
                      </span>
                      <span className={`rounded-full p-1 ${hasVideo ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}>
                        {hasVideo ? <Video size={12} className="text-white" /> : <VideoOff size={12} className="text-white" />}
                      </span>
                    </div>
                    {isHost && !isLocalParticipant ? (
                      <button onClick={() => removeParticipant(p.userId)} className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg hover:bg-rose-500/20 transition-colors">
                        Remove
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>
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
                  {aiSource && (
                    <p className="text-xs text-zinc-400">
                      {aiSource === "openai"
                        ? "AI-generated from this meeting's transcript and shared notes."
                        : "Transcript-based demo analysis. Set OPENAI_API_KEY on the backend for model-generated insights."}
                    </p>
                  )}
                  {analysisError && (
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
                      <p>{analysisError}</p>
                      <button
                        onClick={() => void generateAISummary()}
                        className="shrink-0 font-semibold underline underline-offset-2"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Executive Summary</p>
                    <div className="bg-white/5 rounded-xl p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border border-white/10">{aiSummary || "A summary will appear here after analysis."}</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Action Items</p>
                    <ul className="space-y-2">
                      {aiActionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                          <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <span className="text-sm text-zinc-200">{item.assignee ? `${item.text} — ${item.assignee}` : item.text}</span>
                        </li>
                      ))}
                    </ul>
                    {aiActionItems.length === 0 && (
                      <p className="text-sm text-zinc-500">No explicit follow-up actions were found in the transcript or notes.</p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setSummaryOpen(false)} className="flex-1 h-11 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-all">Close</button>
                    <button onClick={handleSaveSummary} disabled={saveSummaryMutation.isPending || !aiSummary.trim()} className="flex-1 h-11 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
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

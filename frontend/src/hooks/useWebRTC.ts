import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { SOCKET_URL } from '../lib/config';

// Types
interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface PeerUser {
  peerID: string;
  peer: Peer.Instance;
  userName: string;
}

interface SocketUser {
  socketId: string;
  userId: string;
  userName: string;
}

interface JoinMeetingPayload {
  meetingId: string;
  userId: string;
  userName: string;
}

interface UserJoinedPayload {
  signal: Peer.SignalData;
  callerId: string;
  userName: string;
}

type AllUsersPayload = SocketUser[];

interface SendingSignalPayload {
  userToSignal: string;
  callerId: string;
  signal: Peer.SignalData;
  userName: string;
}

interface ReturningSignalPayload {
  signal: Peer.SignalData;
  callerId: string;
}

interface ReceivingReturnedSignalPayload {
  id: string;
  signal: Peer.SignalData;
}

interface UseWebRTCReturn {
  peers: PeerUser[];
  localStream: MediaStream | null;
  userVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export const useWebRTC = (meetingId: string, user: User): UseWebRTCReturn => {
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<PeerUser[]>([]); 
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const createPeer = useCallback((userToSignal: string, callerId: string, stream: MediaStream): Peer.Instance => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal: Peer.SignalData) => {
      if (socketRef.current) {
        socketRef.current.emit('sending-signal', {
          userToSignal,
          callerId,
          signal,
          userName: user.name
        } as SendingSignalPayload);
      }
    });

    return peer;
  }, [user.name]);

  const addPeer = useCallback((incomingSignal: Peer.SignalData, callerId: string, stream: MediaStream): Peer.Instance => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal: Peer.SignalData) => {
      if (socketRef.current) {
        socketRef.current.emit('returning-signal', { signal, callerId } as ReturningSignalPayload);
      }
    });

    peer.signal(incomingSignal);
    return peer;
  }, []);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { withCredentials: true });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream: MediaStream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }

        if (!socketRef.current) return;

        socketRef.current.emit('join-meeting', {
          meetingId,
          userId: user.id,
          userName: user.name
        } as JoinMeetingPayload);

        socketRef.current.on('all-users', (users: AllUsersPayload) => {
          const peersList: PeerUser[] = [];
          users.forEach((otherUser) => {
            if (!socketRef.current) return;

            const peer = createPeer(otherUser.socketId, socketRef.current.id || '', stream);
            
            const peerUser: PeerUser = {
              peerID: otherUser.socketId,
              peer,
              userName: otherUser.userName
            };

            peersRef.current.push(peerUser);
            peersList.push(peerUser);
          });
          setPeers(peersList);
        });

        socketRef.current.on('user-joined', (payload: UserJoinedPayload) => {
          if (!socketRef.current) return;

          const peer = addPeer(payload.signal, payload.callerId, stream);
          
          const newPeerObj: PeerUser = {
            peerID: payload.callerId,
            peer,
            userName: payload.userName
          };

          peersRef.current.push(newPeerObj);
          setPeers((prevUsers) => [...prevUsers, newPeerObj]);
        });

        socketRef.current.on('receiving-returned-signal', (payload: ReceivingReturnedSignalPayload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
          }
        });

        socketRef.current.on('user-left', (id: string) => {
          const peerObj = peersRef.current.find((p) => p.peerID === id);
          if (peerObj) {
            peerObj.peer.destroy(); 
          }
          const peersList = peersRef.current.filter((p) => p.peerID !== id);
          peersRef.current = peersList;
          setPeers(peersList);
        });

      })
      .catch((err: Error) => console.error("Impossible d'accéder aux périphériques :", err));

    return () => {
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      peersRef.current.forEach((p) => p.peer.destroy());
    };
  }, [meetingId, user, createPeer, addPeer]);

  return { peers, localStream, userVideoRef };
};

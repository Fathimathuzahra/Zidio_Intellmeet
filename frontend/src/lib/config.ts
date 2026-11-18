const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
);

export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    API_URL.replace(/\/api$/, "")
);

const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

export const WEBRTC_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(turnUrl && turnUsername && turnCredential ? [{ urls: turnUrl, username: turnUsername, credential: turnCredential }] : []),
];

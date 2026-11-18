export interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  timestamp: string;
  isLocal?: boolean;
}

export interface TranscriptionEntry {
  id: string;
  text: string;
  sender: string;
  senderId?: string;
  timestamp: string;
  isFinal: boolean;
}

export interface SharedNote {
  id: string;
  content: string;
  author: string;
  authorId: string;
  timestamp: string;
}

export interface MeetingParticipant {
  userId: string;
  name: string;
  socketId?: string;
}

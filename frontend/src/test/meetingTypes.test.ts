import { describe, it, expect } from 'vitest';
import type { ChatMessage, TranscriptionEntry, SharedNote, MeetingParticipant } from '../types/meeting';

describe('Meeting Types', () => {
  it('should create a valid ChatMessage', () => {
    const message: ChatMessage = {
      id: '1',
      sender: 'Test User',
      senderId: 'user-1',
      text: 'Hello world',
      timestamp: new Date().toISOString(),
      isLocal: true,
    };
    expect(message.sender).toBe('Test User');
    expect(message.text).toBe('Hello world');
  });

  it('should create a valid TranscriptionEntry', () => {
    const entry: TranscriptionEntry = {
      id: '1',
      text: 'Transcribed text',
      sender: 'Speaker',
      timestamp: new Date().toISOString(),
      isFinal: true,
    };
    expect(entry.isFinal).toBe(true);
  });

  it('should create a valid SharedNote', () => {
    const note: SharedNote = {
      id: '1',
      content: 'Note content',
      author: 'Author',
      authorId: 'user-1',
      timestamp: new Date().toISOString(),
    };
    expect(note.content).toBe('Note content');
  });

  it('should create a valid MeetingParticipant', () => {
    const participant: MeetingParticipant = {
      userId: 'user-1',
      name: 'Participant',
      socketId: 'socket-1',
    };
    expect(participant.userId).toBe('user-1');
  });
});

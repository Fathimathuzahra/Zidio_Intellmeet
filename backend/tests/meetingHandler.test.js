const assert = require('node:assert/strict');
const test = require('node:test');
const prisma = require('../config/prisma');
const { initMeetingSockets } = require('../sockets/meetingHandler');

test('meeting messages are restricted to authorized participants and use server-assigned identity', async () => {
  const originalMeetingFindUnique = prisma.meeting.findUnique;
  const originalUserFindUnique = prisma.user.findUnique;
  const ioHandlers = {};
  const roomEvents = [];
  const io = { on(event, handler) { ioHandlers[event] = handler; }, sockets: { sockets: new Map() }, to(roomId) { return { emit(event, payload) { roomEvents.push({ roomId, event, payload }); } }; } };
  const hostHandlers = {}; const outsiderEvents = []; const memberHandlers = []; const memberEvents = [];
  const socket = (id, userId, handlers, events, unauthorized = false) => ({
    id, data: { user: { id: userId } }, on(event, handler) { handlers[event] = handler; },
    join() { if (unauthorized) assert.fail('Unauthorized socket must not join the room'); },
    emit(event, payload) { if (events) events.push({ event, payload }); }, to() { return { emit() {} }; },
  });
  const hostSocket = socket('socket-1', 'user-1', hostHandlers, null);
  const outsiderHandlers = {}; const outsiderSocket = socket('socket-2', 'outsider', outsiderHandlers, outsiderEvents, true);
  const userHandlers = {}; const memberSocket = socket('socket-3', 'member-1', userHandlers, memberEvents);
  io.sockets.sockets.set(hostSocket.id, hostSocket); io.sockets.sockets.set(outsiderSocket.id, outsiderSocket); io.sockets.sockets.set(memberSocket.id, memberSocket);
  prisma.meeting.findUnique = async ({ where }) => where.roomId
    ? { hostId: 'user-1', participants: [{ userId: 'user-1' }, { userId: 'member-1' }], teamId: null }
    : null;
  prisma.user.findUnique = async ({ where }) => ({ name: where.id === 'user-1' ? 'Verified Host' : 'Team Member' });
  try {
    initMeetingSockets(io); ioHandlers.connection(hostSocket); ioHandlers.connection(outsiderSocket); ioHandlers.connection(memberSocket);
    await hostHandlers['join-room']({ roomId: 'room-1', userId: 'user-1', name: 'Spoofed Name' });
    await outsiderHandlers['join-room']({ roomId: 'room-1', userId: 'outsider', name: 'Outsider' });
    await userHandlers['join-room']({ roomId: 'room-1', userId: 'member-1', name: 'Spoofed Member Name' });
    await userHandlers['remove-participant']({ roomId: 'room-1', targetUserId: 'user-1' });
    hostHandlers['transcript-entry']({ text: 'We will review the launch plan.' });
    hostHandlers['chat-message']({ roomId: 'private-room', message: 'Hello', sender: 'Spoofed Sender' });
    hostHandlers['shared-note']({ roomId: 'private-room', note: 'Decision: review the plan.', author: 'Spoofed Author', authorId: 'outsider' });
    hostHandlers['chat-message'](null); hostHandlers['transcript-entry'](null); hostHandlers['shared-note'](null);
    const transcriptEvent = roomEvents.find((event) => event.event === 'transcript-entry');
    assert.equal(transcriptEvent.roomId, 'room-1'); assert.equal(transcriptEvent.payload.text, 'We will review the launch plan.');
    assert.equal(transcriptEvent.payload.sender, 'Verified Host'); assert.equal(transcriptEvent.payload.senderId, 'user-1');
    const chatEvent = roomEvents.find((event) => event.event === 'chat-message');
    assert.equal(chatEvent.roomId, 'room-1'); assert.equal(chatEvent.payload.sender, 'Verified Host'); assert.equal(chatEvent.payload.senderId, 'user-1');
    const noteEvent = roomEvents.find((event) => event.event === 'shared-note');
    assert.equal(noteEvent.roomId, 'room-1'); assert.equal(noteEvent.payload.author, 'Verified Host'); assert.equal(noteEvent.payload.authorId, 'user-1');
    assert.equal(outsiderEvents.some((event) => event.event === 'room-error'), true);
    assert.equal(memberEvents.some((event) => event.event === 'room-error'), true);
    assert.equal(roomEvents.some((event) => event.event === 'user-left' && event.payload.userId === 'user-1'), false);
    hostHandlers.disconnect(); outsiderHandlers.disconnect(); userHandlers.disconnect();
  } finally { prisma.meeting.findUnique = originalMeetingFindUnique; prisma.user.findUnique = originalUserFindUnique; }
});

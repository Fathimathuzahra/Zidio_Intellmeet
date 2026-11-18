const assert = require('node:assert/strict');
const test = require('node:test');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { initMeetingSockets } = require('../sockets/meetingHandler');

test('meeting messages are restricted to authorized participants and use server-assigned identity', async () => {
  const originalFindOne = Meeting.findOne;
  const originalFindById = User.findById;
  const ioHandlers = {};
  const roomEvents = [];
  const io = {
    on(event, handler) {
      ioHandlers[event] = handler;
    },
    sockets: { sockets: new Map() },
    to(roomId) {
      return {
        emit(event, payload) {
          roomEvents.push({ roomId, event, payload });
        },
      };
    },
  };
  const hostHandlers = {};
  const outsiderEvents = [];
  const memberHandlers = {};
  const memberEvents = [];
  const hostSocket = {
    id: 'socket-1',
    data: { user: { id: 'user-1' } },
    on(event, handler) { hostHandlers[event] = handler; },
    join() {},
    emit() {},
    to() { return { emit() {} }; },
  };
  const outsiderHandlers = {};
  const outsiderSocket = {
    id: 'socket-2',
    data: { user: { id: 'outsider' } },
    on(event, handler) { outsiderHandlers[event] = handler; },
    join() { assert.fail('Unauthorized socket must not join the room'); },
    emit(event, payload) { outsiderEvents.push({ event, payload }); },
    to() { return { emit() {} }; },
  };
  const memberSocket = {
    id: 'socket-3',
    data: { user: { id: 'member-1' } },
    on(event, handler) { memberHandlers[event] = handler; },
    join() {},
    emit(event, payload) { memberEvents.push({ event, payload }); },
    to() { return { emit() {} }; },
  };
  io.sockets.sockets.set(hostSocket.id, hostSocket);
  io.sockets.sockets.set(outsiderSocket.id, outsiderSocket);
  io.sockets.sockets.set(memberSocket.id, memberSocket);
  Meeting.findOne = () => ({
    select: async () => ({
      host: 'user-1',
      participants: [{ userId: 'user-1' }, { userId: 'member-1' }],
      team: null,
    }),
  });
  User.findById = (id) => ({
    select: async () => ({ name: id === 'user-1' ? 'Verified Host' : 'Team Member' }),
  });

  try {
    initMeetingSockets(io);
    ioHandlers.connection(hostSocket);
    ioHandlers.connection(outsiderSocket);
    ioHandlers.connection(memberSocket);

    await hostHandlers['join-room']({
      roomId: 'room-1',
      userId: 'user-1',
      name: 'Spoofed Name',
    });
    await outsiderHandlers['join-room']({
      roomId: 'room-1',
      userId: 'outsider',
      name: 'Outsider',
    });
    await memberHandlers['join-room']({
      roomId: 'room-1',
      userId: 'member-1',
      name: 'Spoofed Member Name',
    });
    await memberHandlers['remove-participant']({
      roomId: 'room-1',
      targetUserId: 'user-1',
    });

    hostHandlers['transcript-entry']({ text: 'We will review the launch plan.' });
    hostHandlers['chat-message']({ roomId: 'private-room', message: 'Hello', sender: 'Spoofed Sender' });
    hostHandlers['shared-note']({
      roomId: 'private-room',
      note: 'Decision: review the plan.',
      author: 'Spoofed Author',
      authorId: 'outsider',
    });
    hostHandlers['chat-message'](null);
    hostHandlers['transcript-entry'](null);
    hostHandlers['shared-note'](null);

    const transcriptEvent = roomEvents.find((event) => event.event === 'transcript-entry');
    assert.equal(transcriptEvent.roomId, 'room-1');
    assert.equal(transcriptEvent.payload.text, 'We will review the launch plan.');
    assert.equal(transcriptEvent.payload.sender, 'Verified Host');
    assert.equal(transcriptEvent.payload.senderId, 'user-1');

    const chatEvent = roomEvents.find((event) => event.event === 'chat-message');
    assert.equal(chatEvent.roomId, 'room-1');
    assert.equal(chatEvent.payload.sender, 'Verified Host');
    assert.equal(chatEvent.payload.senderId, 'user-1');

    const noteEvent = roomEvents.find((event) => event.event === 'shared-note');
    assert.equal(noteEvent.roomId, 'room-1');
    assert.equal(noteEvent.payload.author, 'Verified Host');
    assert.equal(noteEvent.payload.authorId, 'user-1');
    assert.equal(outsiderEvents.some((event) => event.event === 'room-error'), true);
    assert.equal(memberEvents.some((event) => event.event === 'room-error'), true);
    assert.equal(roomEvents.some((event) => event.event === 'user-left' && event.payload.userId === 'user-1'), false);

    hostHandlers.disconnect();
    outsiderHandlers.disconnect();
    memberHandlers.disconnect();
  } finally {
    Meeting.findOne = originalFindOne;
    User.findById = originalFindById;
  }
});

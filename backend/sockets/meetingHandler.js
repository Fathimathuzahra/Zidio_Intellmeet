const crypto = require("node:crypto");
const prisma = require("../config/prisma");
const { canAccessMeeting } = require("../utils/meetingAccess");

const activeRooms = {};
const pendingGuests = {}; // { roomId: [{ socketId, name }] }

function emitRoomError(socket, code, message) {
  socket.emit("room-error", { code, message });
}

async function verifyRoomHost(socket, roomId) {
  const activeUser = findUserBySocket(activeRooms[roomId], socket.id);
  if (!socket.data.user || !activeUser || activeUser.userId !== socket.data.user.id || activeUser.isGuest) {
    return false;
  }

  try {
    const meeting = await prisma.meeting.findUnique({ where: { roomId }, select: { hostId: true } });
    return Boolean(meeting && String(meeting.hostId) === socket.data.user.id);
  } catch (error) {
    console.error("Could not verify meeting host:", error.message);
    return null;
  }
}

const initMeetingSockets = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-room", async (payload = {}) => {
      const { roomId, userId, name, isGuest } = payload || {};
      if (typeof roomId !== "string" || !roomId || typeof userId !== "string" || !userId) {
        emitRoomError(socket, "MEETING_ACCESS_DENIED", "Authentication is required to join this meeting.");
        return;
      }

      const acceptedGuest = isGuest === true
        ? activeRooms[roomId]?.find((participant) => participant.userId === userId && participant.isGuest)
        : null;
      let meeting;
      let account;
      let isAuthorized = Boolean(acceptedGuest);

      if (!isGuest && socket.data.user?.id === userId) {
        try {
          meeting = await prisma.meeting.findUnique({ where: { roomId }, include: { participants: true, team: { include: { members: true } } } });
          account = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
          isAuthorized = Boolean(meeting && account && await canAccessMeeting(meeting, userId));
        } catch (error) {
          console.error("Could not verify meeting access:", error.message);
          emitRoomError(socket, "MEETING_ACCESS_UNAVAILABLE", "Could not verify meeting access. Please retry.");
          return;
        }
      }

      if (!isAuthorized) {
        emitRoomError(socket, "MEETING_ACCESS_DENIED", "You are not authorized to join this meeting.");
        return;
      }

      const participantName = acceptedGuest?.name || account?.name || String(name || "").trim().slice(0, 80);
      socket.join(roomId);

      if (!activeRooms[roomId]) {
        activeRooms[roomId] = [];
      }

      const alreadyIn = activeRooms[roomId].some(
        (u) => u.socketId === socket.id || (acceptedGuest && u.userId === userId),
      );

      if (!alreadyIn) {
        activeRooms[roomId].push({ socketId: socket.id, userId, name: participantName, isGuest: false });
      } else if (acceptedGuest) {
        // update socketId for the guest (new socket from MeetingRoomPage)
        acceptedGuest.socketId = socket.id;
      }

      const participantList = activeRooms[roomId].map((u) => ({
        userId: u.userId,
        name: u.name,
      }));
      io.to(roomId).emit("participants-updated", participantList);

      if (pendingGuests[roomId]?.length) {
        io.to(roomId).emit("pending-guest-requests", pendingGuests[roomId].map((g) => ({ socketId: g.socketId, name: g.name })));
      }

      const otherParticipants = activeRooms[roomId].filter(
        (u) => u.socketId !== socket.id,
      );

      if (otherParticipants.length > 0) {
        socket.emit(
          "existing-participants",
          otherParticipants.map((p) => ({
            userId: p.userId,
            name: p.name,
          })),
        );

        // Don't re-announce a guest who was already announced via accept-guest
        if (!acceptedGuest) {
          otherParticipants.forEach((participant) => {
            socket.to(participant.socketId).emit("user-joined", {
              userId,
              name: participantName,
            });
          });
        }
      }
    });

    // Guest requests to join (no auth) â€” placed in lobby for host approval
    socket.on("request-join", (payload = {}) => {
      const { roomId, name } = payload || {};
      const guestName = typeof name === "string" ? name.trim().slice(0, 80) : "";
      if (typeof roomId !== "string" || !roomId || !guestName) return;
      if (!pendingGuests[roomId]) pendingGuests[roomId] = [];
      if (pendingGuests[roomId].length >= 50 || pendingGuests[roomId].some((guest) => guest.socketId === socket.id)) return;
      // store guest by socket id
      pendingGuests[roomId].push({ socketId: socket.id, name: guestName });
      // notify hosts/participants in room that a guest is requesting
      io.to(roomId).emit("guest-requested", { socketId: socket.id, name: guestName });
      // inform guest that request is sent
      socket.emit("request-sent", { roomId });
    });

    // Host accepts a guest â€” move from pending to active
    socket.on("accept-guest", async (payload = {}) => {
      const { roomId, guestSocketId } = payload || {};
      if (typeof roomId !== "string" || !roomId || typeof guestSocketId !== "string" || !guestSocketId) return;
      const hostCheck = await verifyRoomHost(socket, roomId);
      if (hostCheck !== true) {
        emitRoomError(
          socket,
          hostCheck === null ? "HOST_CHECK_UNAVAILABLE" : "HOST_REQUIRED",
          hostCheck === null ? "Could not verify meeting host. Please retry." : "Only the meeting host can accept guests."
        );
        return;
      }
      // find and remove from pending
      const list = pendingGuests[roomId] || [];
      const idx = list.findIndex((g) => g.socketId === guestSocketId);
      if (idx === -1) return;
      const guest = list.splice(idx, 1)[0];
      // create a guest userId
      const guestUserId = `guest-${crypto.randomUUID()}`;

      if (!activeRooms[roomId]) activeRooms[roomId] = [];
      // add to activeRooms
      activeRooms[roomId].push({ socketId: guest.socketId, userId: guestUserId, name: guest.name, isGuest: true });
      // make the guest socket join the room
      const guestSocket = io.sockets.sockets.get(guest.socketId);
      if (guestSocket) {
        guestSocket.join(roomId);
        // send acceptance to guest with assigned id and name
        guestSocket.emit("guest-accepted", { roomId, userId: guestUserId, name: guest.name });

        // notify existing participants about new participant
        const participantList = activeRooms[roomId].map((u) => ({ userId: u.userId, name: u.name }));
        io.to(roomId).emit("participants-updated", participantList);

        // Do NOT emit user-joined here â€” the guest's MeetingRoomPage socket will
        // join-room shortly and trigger existing-participants â†’ initiateCall on their side.
        // Emitting user-joined now would target the old JoinMeetingPage socket.
      }
    });

    // Host rejects a guest
    socket.on("reject-guest", async (payload = {}) => {
      const { roomId, guestSocketId } = payload || {};
      if (typeof roomId !== "string" || !roomId || typeof guestSocketId !== "string" || !guestSocketId) return;
      const hostCheck = await verifyRoomHost(socket, roomId);
      if (hostCheck !== true) {
        emitRoomError(
          socket,
          hostCheck === null ? "HOST_CHECK_UNAVAILABLE" : "HOST_REQUIRED",
          hostCheck === null ? "Could not verify meeting host. Please retry." : "Only the meeting host can reject guests."
        );
        return;
      }
      const list = pendingGuests[roomId] || [];
      const idx = list.findIndex((g) => g.socketId === guestSocketId);
      if (idx === -1) return;
      const [guest] = list.splice(idx, 1);
      const guestSocket = io.sockets.sockets.get(guest.socketId);
      if (guestSocket) {
        guestSocket.emit("guest-rejected", { roomId, name: guest.name });
      }
      // notify hosts that pending updated
      io.to(roomId).emit("guest-rejected-notify", { guestSocketId });
    });

    socket.on("remove-participant", async (payload = {}) => {
      const { roomId, targetUserId } = payload || {};
      if (typeof roomId !== "string" || !roomId || typeof targetUserId !== "string" || !targetUserId) return;
      const hostCheck = await verifyRoomHost(socket, roomId);
      if (hostCheck !== true) {
        emitRoomError(
          socket,
          hostCheck === null ? "HOST_CHECK_UNAVAILABLE" : "HOST_REQUIRED",
          hostCheck === null ? "Could not verify meeting host. Please retry." : "Only the meeting host can remove participants."
        );
        return;
      }
      const room = activeRooms[roomId] || [];
      const targetIndex = room.findIndex((u) => u.userId === targetUserId);
      if (targetIndex === -1) return;

      const target = room.splice(targetIndex, 1)[0];
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit("removed", { roomId, reason: "You were removed from the meeting by the host." });
        targetSocket.leave(roomId);
      }

      const participantList = room.map((u) => ({ userId: u.userId, name: u.name }));
      io.to(roomId).emit("participants-updated", participantList);
      io.to(roomId).emit("user-left", { userId: target.userId });
    });

    socket.on("chat-message", (payload = {}) => {
      const { message } = payload || {};
      const roomId = findRoomBySocket(activeRooms, socket.id);
      const sender = roomId && findUserBySocket(activeRooms[roomId], socket.id);
      const text = typeof message === "string" ? message.trim().slice(0, 2000) : "";
      if (!roomId || !sender || !text) return;

      const msg = {
        id: Date.now(),
        message: text,
        sender: sender.name,
        senderId: sender.userId,
        timestamp: new Date().toISOString(),
      };

      io.to(roomId).emit("chat-message", msg);
    });

    socket.on("transcript-entry", (payload = {}) => {
      const { text } = payload || {};
      const transcriptText = typeof text === "string" ? text.trim().slice(0, 2000) : "";
      const roomId = findRoomBySocket(activeRooms, socket.id);
      if (!roomId || !transcriptText) return;

      const speaker = findUserBySocket(activeRooms[roomId], socket.id);
      if (!speaker) return;

      io.to(roomId).emit("transcript-entry", {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: transcriptText,
        sender: speaker.name,
        senderId: speaker.userId,
        timestamp: new Date().toISOString(),
        isFinal: true,
      });
    });

    socket.on("shared-note", (payload = {}) => {
      const { note } = payload || {};
      const roomId = findRoomBySocket(activeRooms, socket.id);
      const author = roomId && findUserBySocket(activeRooms[roomId], socket.id);
      const content = typeof note === "string" ? note.trim().slice(0, 4000) : "";
      if (!roomId || !author || !content) return;

      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        content,
        author: author.name,
        authorId: author.userId,
        timestamp: new Date().toISOString(),
      };

      io.to(roomId).emit("shared-note", entry);
    });

    socket.on("webrtc-offer", (payload = {}) => {
      const { offer, targetUserId } = payload || {};
      const roomId = findRoomBySocket(activeRooms, socket.id);
      if (!roomId) return;

      const fromUser = findUserBySocket(activeRooms[roomId], socket.id);
      const target = findSocketByUserId(activeRooms[roomId], targetUserId);

      if (target && fromUser) {
        io.to(target.socketId).emit("webrtc-offer", {
          offer,
          from: fromUser.userId,
        });
      }
    });

    socket.on("webrtc-answer", (payload = {}) => {
      const { answer, targetUserId } = payload || {};
      const roomId = findRoomBySocket(activeRooms, socket.id);
      if (!roomId) return;

      const fromUser = findUserBySocket(activeRooms[roomId], socket.id);
      const target = findSocketByUserId(activeRooms[roomId], targetUserId);

      if (target && fromUser) {
        io.to(target.socketId).emit("webrtc-answer", {
          answer,
          from: fromUser.userId,
        });
      }
    });

    socket.on("webrtc-ice-candidate", (payload = {}) => {
      const { candidate, targetUserId } = payload || {};
      const roomId = findRoomBySocket(activeRooms, socket.id);
      if (!roomId) return;

      const fromUser = findUserBySocket(activeRooms[roomId], socket.id);
      const target = findSocketByUserId(activeRooms[roomId], targetUserId);

      if (target && fromUser) {
        io.to(target.socketId).emit("webrtc-ice-candidate", {
          candidate,
          from: fromUser.userId,
        });
      }
    });

    socket.on("disconnect", () => {
      for (const roomId in pendingGuests) {
        const index = pendingGuests[roomId].findIndex((guest) => guest.socketId === socket.id);
        if (index === -1) continue;

        pendingGuests[roomId].splice(index, 1);
        io.to(roomId).emit("guest-rejected-notify", { guestSocketId: socket.id });
        if (pendingGuests[roomId].length === 0) delete pendingGuests[roomId];
      }

      for (const roomId in activeRooms) {
        const idx = activeRooms[roomId].findIndex(
          (u) => u.socketId === socket.id,
        );

        if (idx === -1) continue;

        const leaving = activeRooms[roomId][idx];
        activeRooms[roomId].splice(idx, 1);

        io.to(roomId).emit("user-left", { userId: leaving.userId });

        const participantList = activeRooms[roomId].map((u) => ({
          userId: u.userId,
          name: u.name,
        }));
        io.to(roomId).emit("participants-updated", participantList);

        if (activeRooms[roomId].length === 0) {
          delete activeRooms[roomId];
        }

        break;
      }
    });
  });
};

function findSocketByUserId(room = [], userId) {
  return room.find((u) => u.userId === userId) ?? null;
}

function findUserBySocket(room = [], socketId) {
  return room.find((u) => u.socketId === socketId) ?? null;
}

function findRoomBySocket(rooms, socketId) {
  for (const roomId in rooms) {
    if (rooms[roomId].some((u) => u.socketId === socketId)) {
      return roomId;
    }
  }
  return null;
}

module.exports = { initMeetingSockets };



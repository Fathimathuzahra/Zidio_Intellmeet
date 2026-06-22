// roomId → [{ socketId, userId, name }]
const activeRooms = {};

const initMeetingSockets = (io) => {
  io.on("connection", (socket) => {
    console.log(`✅ Connecté : ${socket.id}`);

    socket.on("join-room", ({ roomId, userId, name }) => {
      if (!roomId || !userId) return;

      socket.join(roomId);

      if (!activeRooms[roomId]) {
        activeRooms[roomId] = [];
      }

      const alreadyIn = activeRooms[roomId].some(
        (u) => u.socketId === socket.id,
      );
      if (!alreadyIn) {
        activeRooms[roomId].push({ socketId: socket.id, userId, name });
      }

      console.log(
        `[Room ${roomId}] ${name} (${userId}) a rejoint. Total : ${activeRooms[roomId].length}`,
      );

      // Envoie la liste complète des participants à TOUT le monde
      const participantList = activeRooms[roomId].map((u) => ({
        userId: u.userId,
        name: u.name,
      }));
      io.to(roomId).emit("participants-updated", participantList);

      // Envoie la liste des participants existants au nouveau venu
      const otherParticipants = activeRooms[roomId].filter(
        (u) => u.socketId !== socket.id,
      );

      if (otherParticipants.length > 0) {
        // Envoie directement la liste des participants existants
        socket.emit(
          "existing-participants",
          otherParticipants.map((p) => ({
            userId: p.userId,
            name: p.name,
          })),
        );

        // Notifie les autres qu'un nouveau participant a rejoint
        otherParticipants.forEach((participant) => {
          socket.to(participant.socketId).emit("user-joined", {
            userId: userId,
            name: name,
          });
        });
      }
    });

    // ─── CHAT MESSAGE ─────────────────────────────────────────────────────────
    socket.on("chat-message", ({ roomId, message, sender }) => {
      if (!roomId || !message) return;

      const msg = {
        id: Date.now(),
        message,
        sender,
        timestamp: new Date().toISOString(),
      };

      io.to(roomId).emit("chat-message", msg);
    });

    // ─── WEBRTC SIGNALING ─────────────────────────────────────────

    // socket.on("webrtc-offer", ({ offer, targetUserId }) => {
    //   const roomId = findRoomBySocket(activeRooms, socket.id);
    //   if (!roomId) return;

    //   const target = findSocketByUserId(activeRooms[roomId], targetUserId);
    //   const fromUserId = getUserId(activeRooms[roomId], socket.id);

    //   if (target && fromUserId) {
    //     io.to(target.socketId).emit("webrtc-offer", {
    //       offer,
    //       from: fromUserId
    //     });
    //   }
    // });

    // Dans l'événement webrtc-offer
    socket.on("webrtc-offer", ({ offer, targetUserId }) => {
      const roomId = findRoomBySocket(activeRooms, socket.id);
      if (!roomId) return;

      const fromUser = findUserBySocket(activeRooms[roomId], socket.id);
      const target = findSocketByUserId(activeRooms[roomId], targetUserId);

      if (target && fromUser) {
        console.log(
          `Forwarding offer from ${fromUser.userId} to ${targetUserId}`,
        );
        io.to(target.socketId).emit("webrtc-offer", {
          offer,
          from: fromUser.userId, // Important: envoyer l'ID, pas le nom
        });
      }
    });

    // Fonction utilitaire
    function findUserBySocket(room = [], socketId) {
      return room.find((u) => u.socketId === socketId) ?? null;
    }

    // webrtc-answer - Ajoutez from
    socket.on("webrtc-answer", ({ answer, targetUserId }) => {
      const roomId = findRoomBySocket(activeRooms, socket.id);
      if (!roomId) return;

      const fromUser = findUserBySocket(activeRooms[roomId], socket.id);
      const target = findSocketByUserId(activeRooms[roomId], targetUserId);

      if (target && fromUser) {
        console.log(
          `Forwarding answer from ${fromUser.userId} to ${targetUserId}`,
        );
        io.to(target.socketId).emit("webrtc-answer", {
          answer,
          from: fromUser.userId,
        });
      }
    });

    // webrtc-ice-candidate - Ajoutez from
    socket.on("webrtc-ice-candidate", ({ candidate, targetUserId }) => {
      const roomId = findRoomBySocket(activeRooms, socket.id);
      if (!roomId) return;

      const fromUser = findUserBySocket(activeRooms[roomId], socket.id);
      const target = findSocketByUserId(activeRooms[roomId], targetUserId);

      if (target && fromUser) {
        console.log(
          `Forwarding ICE candidate from ${fromUser.userId} to ${targetUserId}`,
        );
        io.to(target.socketId).emit("webrtc-ice-candidate", {
          candidate,
          from: fromUser.userId,
        });
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`❌ Déconnecté : ${socket.id}`);

      for (const roomId in activeRooms) {
        const idx = activeRooms[roomId].findIndex(
          (u) => u.socketId === socket.id,
        );

        if (idx !== -1) {
          const leaving = activeRooms[roomId][idx];
          activeRooms[roomId].splice(idx, 1);

          console.log(
            `[Room ${roomId}] ${leaving.name} est parti. Restants : ${activeRooms[roomId].length}`,
          );

          io.to(roomId).emit("user-left", { userId: leaving.userId });

          const participantList = activeRooms[roomId].map((u) => ({
            userId: u.userId,
            name: u.name,
          }));
          io.to(roomId).emit("participants-updated", participantList);

          if (activeRooms[roomId].length === 0) {
            delete activeRooms[roomId];
            console.log(`[Room ${roomId}] Supprimée (vide).`);
          }

          break;
        }
      }
    });
  });
};

function findSocketByUserId(room = [], userId) {
  return room.find((u) => u.userId === userId) ?? null;
}

function getUserId(room = [], socketId) {
  return room.find((u) => u.socketId === socketId)?.userId ?? null;
}

function findRoomBySocket(activeRooms, socketId) {
  for (const roomId in activeRooms) {
    if (activeRooms[roomId].some((u) => u.socketId === socketId)) {
      return roomId;
    }
  }
  return null;
}

module.exports = { initMeetingSockets };

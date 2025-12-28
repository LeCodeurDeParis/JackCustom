import { Server, Socket } from "socket.io";
import { rooms } from "@/server/storage/rooms";
import { PlayerState } from "@/states/player-states";
import { randomUUID } from "crypto";

export const roomHandlers = (io: Server, socket: Socket) => {
  // JOIN ROOM
  socket.on("room:join", async ({ roomId }) => {
    const userId = socket.data.user.id;
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("room:error", { message: "Room not found" });
      return;
    }

    // Si joueur déjà présent
    const existing = room.players.find((p) => p.userId === userId);
    if (!existing) {
      room.players.push({
        userId,
        username: socket.data.user.name || userId.slice(0, 8),
        socketId: socket.id,
        isDealer: false,
        hand: [],
        state: PlayerState.WAITING,
        sessionPoints: 0,
        autoJoinNext: false,
        ready: false,
        purchases: [],
      });
    } else {
      existing.socketId = socket.id;
      existing.state = PlayerState.WAITING;
    }

    socket.join(roomId);

    // Notifier tout le monde dans la room
    io.to(roomId).emit("room:state", room);
  });

  // LEAVE ROOM
  socket.on("room:leave", ({ roomId }) => {
    const userId = socket.data.user.id;
    const room = rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter((p) => p.userId !== userId);
    socket.leave(roomId);

    // Si room vide => supprimer
    if (room.players.length === 0) {
      rooms.delete(roomId);
      return;
    }

    // Si host a quitté, transférer host
    if (room.hostId === userId) {
      room.hostId = room.players[0].userId;
    }

    io.to(roomId).emit("room:state", room);
  });

  // AUTO-JOIN NEXT GAME
  socket.on("room:auto-join", ({ roomId, autoJoin }) => {
    const player = rooms
      .get(roomId)
      ?.players.find((p) => p.userId === socket.data.user.id);
    if (!player) return;

    player.autoJoinNext = autoJoin;
    io.to(roomId).emit("room:state", rooms.get(roomId));
  });

  // CHAT - Envoyer un message
  socket.on("room:chat", ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === socket.data.user.id);
    if (!player) return;

    // Limiter la longueur du message
    const trimmedMessage = message.trim().slice(0, 200);
    if (!trimmedMessage) return;

    // Créer le log de chat
    const chatLog = {
      id: randomUUID(),
      type: "chat" as const,
      message: trimmedMessage,
      timestamp: Date.now(),
      playerId: player.userId,
      playerName: player.username,
    };

    // Initialiser logs si nécessaire
    if (!room.logs) {
      room.logs = [];
    }

    // Ajouter au logs (limiter à 100 messages)
    room.logs.push(chatLog);
    if (room.logs.length > 100) {
      room.logs = room.logs.slice(-100);
    }

    // Envoyer à tous les joueurs de la room
    io.to(roomId).emit("room:chat-message", chatLog);
    io.to(roomId).emit("room:state", room);
  });

  // SETTINGS - Modifier les paramètres (host uniquement)
  socket.on("room:update-settings", ({ roomId, settings }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Vérifier que c'est le host
    if (socket.data.user.id !== room.hostId) {
      socket.emit("room:error", {
        message: "Seul le host peut modifier les paramètres",
      });
      return;
    }

    // Mettre à jour les settings
    if (!room.settings) {
      room.settings = {
        winPoints: 50,
        bankWinPoints: 10,
        turnTimeLimit: 0,
        autoRevealCards: true,
      };
    }

    // Merger les nouveaux settings
    room.settings = {
      ...room.settings,
      ...settings,
    };

    // Ajouter un log système
    if (!room.logs) {
      room.logs = [];
    }

    room.logs.push({
      id: randomUUID(),
      type: "system" as const,
      message: "Les paramètres de la room ont été modifiés",
      timestamp: Date.now(),
    });

    // Notifier tout le monde
    io.to(roomId).emit("room:settings-updated", room.settings);
    io.to(roomId).emit("room:state", room);
  });
};

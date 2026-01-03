import { Server, Socket } from "socket.io";
import { rooms } from "@/server/storage/rooms";
import { PlayerState } from "@/states/player-states";
import { randomUUID } from "crypto";
import {
  disconnectTimeouts,
  getTimeoutKey,
} from "@/server/storage/disconnect-timeouts";

export const roomHandlers = (io: Server, socket: Socket) => {
  // JOIN ROOM
  socket.on("room:join", async ({ roomId }) => {
    const userId = socket.data.user.id;
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("room:error", { message: "Room not found" });
      return;
    }

    // Annuler le timeout d'éjection si le joueur se reconnecte
    const timeoutKey = getTimeoutKey(roomId, userId);
    const existingTimeout = disconnectTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      disconnectTimeouts.delete(timeoutKey);
      console.log(
        `Cancelled disconnect timeout for ${userId} in room ${roomId}`
      );
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
      // Mettre à jour le socketId (reconnexion)
      existing.socketId = socket.id;
      // Ne pas réinitialiser l'état si le joueur est en partie
      if (!room.currentGame) {
      existing.state = PlayerState.WAITING;
      }
    }

    socket.join(roomId);

    // Notifier tout le monde dans la room
    io.to(roomId).emit("room:state", room);

    // Si une partie est en cours, envoyer aussi l'état du jeu au joueur qui rejoint
    if (room.currentGame) {
      socket.emit("game:state", room.currentGame);
    }
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

  // DEV - Ajouter un joueur de test (host uniquement)
  socket.on("room:add-test-player", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Vérifier que c'est le host
    if (socket.data.user.id !== room.hostId) {
      socket.emit("room:error", {
        message: "Seul le host peut ajouter des joueurs de test",
      });
      return;
    }

    // Limiter à 8 joueurs max
    if (room.players.length >= 8) {
      socket.emit("room:error", { message: "La room est pleine" });
      return;
    }

    // Générer un joueur de test
    const testId = randomUUID();
    const testNames = [
      "Bot Alice",
      "Bot Bob",
      "Bot Charlie",
      "Bot Diana",
      "Bot Eve",
      "Bot Frank",
      "Bot Grace",
    ];
    const usedNames = room.players.map((p) => p.username);
    const availableName =
      testNames.find((n) => !usedNames.includes(n)) ||
      `Bot ${room.players.length}`;

    const testPlayer = {
      userId: `test-${testId}`,
      username: availableName,
      socketId: "", // Pas de socket pour les bots
      isDealer: false,
      hand: [],
      state: PlayerState.READY,
      sessionPoints: 0,
      autoJoinNext: true,
      ready: true,
      purchases: [],
    };

    room.players.push(testPlayer);

    // Ajouter un log
    if (!room.logs) room.logs = [];
    room.logs.push({
      id: randomUUID(),
      type: "system" as const,
      message: `${availableName} a rejoint la partie (test)`,
      timestamp: Date.now(),
    });

    io.to(roomId).emit("room:state", room);
  });

  // DEV - Retirer un joueur de test (host uniquement)
  socket.on("room:remove-test-player", ({ roomId, playerId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Vérifier que c'est le host
    if (socket.data.user.id !== room.hostId) {
      socket.emit("room:error", {
        message: "Seul le host peut retirer des joueurs de test",
      });
      return;
    }

    // Vérifier que c'est bien un joueur de test
    const player = room.players.find((p) => p.userId === playerId);
    if (!player || !playerId.startsWith("test-")) {
      socket.emit("room:error", {
        message: "Ce joueur n'est pas un joueur de test",
      });
      return;
    }

    room.players = room.players.filter((p) => p.userId !== playerId);

    // Ajouter un log
    if (!room.logs) room.logs = [];
    room.logs.push({
      id: randomUUID(),
      type: "system" as const,
      message: `${player.username} a quitté la partie`,
      timestamp: Date.now(),
    });

    io.to(roomId).emit("room:state", room);
  });
};

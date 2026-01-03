import { Server } from "socket.io";
import { rooms } from "@/server/storage/rooms";
import { PlayerState } from "@/states/player-states";
import {
  disconnectTimeouts,
  getTimeoutKey,
} from "@/server/storage/disconnect-timeouts";
import { randomUUID } from "crypto";

const DISCONNECT_TIMEOUT_MS = 60 * 1000; // 1 minute

export function handleDisconnect(io: Server, socketId: string) {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.socketId === socketId);

    if (!player) continue;

    // Marque le joueur comme déconnecté
    player.socketId = "";
    
    // Ne changer l'état en DISCONNECTED que si pas en partie
    // Pendant une partie, on garde l'état de jeu (PLAYING, STAND, etc.)
    if (!room.currentGame) {
      player.state = PlayerState.DISCONNECTED;
    }

    // Notifie tous les joueurs de la room que ce joueur est déconnecté
    io.to(room.id).emit("room:player-disconnected", {
      userId: player.userId,
      wasInGame: !!room.currentGame,
    });

    // Envoie l'état complet de la room après la déconnexion
    io.to(room.id).emit("room:state", room);

    // Créer un timeout pour éjecter le joueur après 1 minute
    const timeoutKey = getTimeoutKey(room.id, player.userId);

    // Annuler un éventuel timeout existant
    const existingTimeout = disconnectTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Créer le nouveau timeout
    const timeout = setTimeout(() => {
      ejectPlayer(io, room.id, player.userId);
      disconnectTimeouts.delete(timeoutKey);
    }, DISCONNECT_TIMEOUT_MS);

    disconnectTimeouts.set(timeoutKey, timeout);
  }
}

function ejectPlayer(io: Server, roomId: string, userId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.userId === userId);
  if (!player) return;

  // Si le joueur s'est reconnecté entre temps, ne pas l'éjecter
  if (player.state !== PlayerState.DISCONNECTED) return;

  console.log(
    `Ejecting player ${player.username} from room ${roomId} (timeout)`
  );

  // Retirer le joueur de la room
  room.players = room.players.filter((p) => p.userId !== userId);

  // Ajouter un log
  if (!room.logs) room.logs = [];
  room.logs.push({
    id: randomUUID(),
    type: "system",
    message: `${player.username} a été éjecté (déconnexion trop longue)`,
    timestamp: Date.now(),
  });

  // Si la room est vide, la supprimer
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return;
  }

  // Si c'était le host, transférer le rôle
  if (room.hostId === userId) {
    room.hostId = room.players[0].userId;
    io.to(roomId).emit("room:host-changed", { newHostId: room.hostId });
  }

  // Notifier les autres joueurs
  io.to(roomId).emit("room:player-ejected", { userId, reason: "timeout" });
  io.to(roomId).emit("room:state", room);
}

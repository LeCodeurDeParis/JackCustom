import { Server } from "socket.io";
import { rooms } from "@/server/storage/rooms";
import { PlayerState } from "@/states/player-states";

export function handleDisconnect(io: Server, socketId: string) {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.socketId === socketId);

    if (!player) continue;

    // Marque le joueur comme déconnecté
    player.socketId = "";
    player.state = PlayerState.DISCONNECTED;

    // Notifie tous les joueurs de la room que ce joueur est déconnecté
    io.to(room.id).emit("room:player-disconnected", {
      userId: player.userId,
    });

    // Envoie l'état complet de la room après la déconnexion
    io.to(room.id).emit("room:state", room);

    // Si c'était le host et qu'il reste des joueurs, change le host
    if (room.hostId === player.userId && room.players.length > 1) {
      const newHost = room.players.find(
        (p) => p.state !== PlayerState.DISCONNECTED
      );
      if (newHost) {
        room.hostId = newHost.userId;
        io.to(room.id).emit("room:host-changed", { newHostId: newHost.userId });
      }
    }
  }
}

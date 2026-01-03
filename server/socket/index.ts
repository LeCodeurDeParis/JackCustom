// import { Server, Socket } from "socket.io";
// import { Server as HttpServer } from "http";
// import { rooms } from "@/server/storage/rooms";
// import { verifyToken } from "@/server/auth/verify-token";
// import { PlayerState } from "@/states/player-states";

// function handleDisconnect(io: Server, socketId: string) {
//   for (const room of rooms.values()) {
//     const player = room.players.find((p) => p.socketId === socketId);

//     if (!player) continue;

//     player.socketId = "";
//     player.state = PlayerState.DISCONNECTED;

//     // Notify les autres joueurs dans la room
//     // (pour qu'ils sachent qu'un joueur a quitté la room)
//     io.to(room.id).emit("room:player-disconnected", {
//       userId: player.userId,
//     });
//     io.to(room.id).emit("room:state", room);
//   }
// }

// export function initSocket(server: HttpServer): Server {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//     },
//   });

//   io.use(async (socket: Socket, next) => {
//     const token = socket.handshake.auth?.token;
//     if (!token) {
//       return next(new Error("Unauthorized"));
//     }

//     try {
//       const sessionData = await verifyToken(token);
//       if (!sessionData?.session || !sessionData?.user) {
//         return next(new Error("Unauthorized: Invalid session"));
//       }
//       socket.data.user = sessionData.user;
//       socket.data.session = sessionData.session;
//       next();
//     } catch {
//       next(new Error("Unauthorized"));
//     }
//   });

//   io.on("connection", (socket: Socket) => {
//     console.log("Socket connected:", socket.id);

//     // Gérer la déconnexion
//     socket.on("disconnect", () => {
//       console.log("Socket disconnected:", socket.id);
//       handleDisconnect(io, socket.id);
//     });

//     // Event de "join room"
//     socket.on("room:join", (data) => {
//       const room = rooms.get(data.roomId);
//       if (!room) {
//         socket.emit("room:error", { message: "Room not found" });
//         return;
//       }

//       const player = room.players.find((p) => p.userId === socket.data.user.id);
//       if (!player) {
//         socket.emit("room:error", { message: "Player not found in room" });
//         return;
//       }

//       player.socketId = socket.id;
//       socket.join(data.roomId);

//       // Informer les autres joueurs dans la room
//       socket.to(data.roomId).emit("room:player-joined", {
//         userId: socket.data.user.id,
//       });

//       // Envoyer l'état de la room à l'utilisateur
//       socket.emit("room:state", room);
//     });

//     socket.on("room:leave", (data) => {
//       const room = rooms.get(data.roomId);
//       if (!room) {
//         socket.emit("room:error", { message: "Room not found" });
//         return;
//       }

//       const player = room.players.find((p) => p.socketId === socket.id);
//       if (!player) {
//         socket.emit("room:error", { message: "Player not found" });
//         return;
//       }

//       player.socketId = "";
//       socket.leave(data.roomId);

//       // Informer les autres joueurs dans la room
//       socket.to(data.roomId).emit("room:player-left", {
//         userId: player.userId,
//       });
//     });
//   });
//   return io;
// }

import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { roomHandlers } from "./handlers/room-handler";
import { gameHandlers } from "./handlers/game-handler";
import { shopHandlers } from "./handlers/shop-handler";
import { handleDisconnect } from "./handlers/disconnect-handler";
import { registerAuthMiddleware } from "./auth-socket";

export function initSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Accepte les IPs 192.168.x.x
        /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
      ],

      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  registerAuthMiddleware(io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    roomHandlers(io, socket);
    gameHandlers(io, socket);
    shopHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      handleDisconnect(io, socket.id);
    });
  });

  return io;
}

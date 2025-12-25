import * as roomServices from "./services/room-services";
import { base } from "./context";
import { authMiddleware } from "./middleware/auth-middleware";

export const router = base.use(authMiddleware).router({
  room: base.use(authMiddleware).router({
    getRoom: roomServices.getRoom,
    createRoom: roomServices.createRoom,
    joinRoom: roomServices.joinRoom,
    leaveRoom: roomServices.leaveRoom,
    startRoom: roomServices.startRoom,
    startGame: roomServices.startGame,
    endGame: roomServices.endGame,
  }),
});

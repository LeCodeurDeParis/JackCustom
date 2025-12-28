import { Server, Socket } from "socket.io";
import { auth } from "@/utils/auth";

export function registerAuthMiddleware(io: Server) {
  io.use(async (socket: Socket, next) => {
    try {
      // Récupérer les cookies depuis le handshake
      const cookieHeader = socket.handshake.headers.cookie;

      if (!cookieHeader) {
        return next(new Error("Unauthorized: No cookies"));
      }

      // Vérifier la session via better-auth en utilisant les cookies
      const sessionData = await auth.api.getSession({
        headers: {
          cookie: cookieHeader,
        },
      });

      if (!sessionData?.user || !sessionData?.session) {
        return next(new Error("Unauthorized: Invalid session"));
      }

      socket.data.user = sessionData.user;
      socket.data.session = sessionData.session;
      next();
    } catch (error) {
      console.error("Socket auth error:", error);
      next(new Error("Unauthorized"));
    }
  });
}

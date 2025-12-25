import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import { onError } from "@orpc/server";
import { initSocket } from "./server/socket";
import { router } from "./server/router";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Le router a déjà le middleware d'authentification appliqué
const orpcHandler = new RPCHandler(router as any, {
  plugins: [
    new CORSPlugin({
      origin: () => "*",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  ],
  interceptors: [
    onError((error: Error) => {
      console.error(error);
    }),
  ],
});

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    const { pathname } = parsedUrl;

    // Gérer les routes ORPC
    if (pathname?.startsWith("/api/orpc")) {
      // Extraire le chemin relatif après /api/orpc
      const relativePath = pathname.replace("/api/orpc", "") || "/";
      const originalUrl = req.url;

      console.log(`[ORPC] Original pathname: ${pathname}`);
      console.log(`[ORPC] Relative path: ${relativePath}`);
      console.log(
        `[ORPC] Modified URL: ${relativePath + (parsedUrl.search || "")}`
      );
      console.log(`[ORPC] Method: ${req.method}`);

      // Modifier temporairement l'URL pour que ORPC trouve la procédure
      req.url = relativePath + (parsedUrl.search || "");

      try {
        const result = await orpcHandler.handle(req, res, {
          context: { headers: req.headers },
        });

        console.log(`[ORPC] Handler result - matched: ${result.matched}`);

        if (!result.matched) {
          console.log(`[ORPC] No procedure matched for path: ${relativePath}`);
          res.statusCode = 404;
          res.end("No procedure matched");
        }
      } catch (error) {
        console.error(`[ORPC] Handler error:`, error);
        throw error;
      } finally {
        // Restaurer l'URL originale
        req.url = originalUrl;
      }
      return;
    }

    // Pour toutes les autres routes, laisser Next.js gérer
    handle(req, res, parsedUrl);
  });

  // Initialiser Socket.io sur le même serveur
  const io = initSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> ORPC API available at http://${hostname}:${port}/api/orpc`);
  });
});

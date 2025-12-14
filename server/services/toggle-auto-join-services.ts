import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { base } from "../context";
import { authMiddleware } from "../middleware/auth-middleware";
import { rooms } from "../storage/rooms";

export const toggleAutoJoin = base
  .use(authMiddleware)
  .input(
    z.object({
      roomId: z.string(),
      autoJoinNext: z.boolean(),
    })
  )
  .handler(async ({ context, input }) => {
    const room = rooms.get(input.roomId);
    if (!room) {
      throw new ORPCError("NOT_FOUND", {
        data: { message: "Room not found" },
      });
    }

    const player = room.players.find((p) => p.userId === context.user.id);

    if (!player) {
      throw new ORPCError("FORBIDDEN", {
        data: { message: "Player not found" },
      });
    }

    player.autoJoinNext = input.autoJoinNext;

    return room;
  });

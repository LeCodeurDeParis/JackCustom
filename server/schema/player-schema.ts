import * as z from "zod";
import { cardSchema } from "./card-schema";
import { PlayerState } from "@/states/player-states";

const playerPurchaseSchema = z.object({
  playerId: z.string(),
  itemId: z.string(),
});

export const playerSchema = z.object({
  userId: z.string(),
  socketId: z.string(),
  isDealer: z.boolean(),
  hand: z.array(cardSchema),
  state: z.nativeEnum(PlayerState),
  sessionPoints: z.number(),
  autoJoinNext: z.boolean(),
  purchases: z.array(playerPurchaseSchema),
});

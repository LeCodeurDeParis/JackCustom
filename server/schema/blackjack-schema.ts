import * as z from "zod";
import { playerSchema } from "./player-schema";
import { cardSchema } from "./card-schema";
import { GameState } from "@/states/game-states";

export const blackjackGameSchema = z.object({
  id: z.string(),
  state: z.nativeEnum(GameState),
  players: z.array(playerSchema),
  bank: playerSchema,
  deck: z.array(cardSchema),
  currentPlayerIndex: z.number(),
  sessionId: z.string(),
});

import * as z from "zod";
import { playerSchema } from "./player-schema";
import { blackjackGameSchema } from "./blackjack-schema";
import { SessionState } from "@/states/room-states";

export const createRoomSchema = z.object({
  hostId: z.string(),
  state: z.nativeEnum(SessionState).default(SessionState.WAITING),
  players: z.array(playerSchema).default([]),
  currentGame: blackjackGameSchema.optional(),
  createdAt: z.number().optional(),
  finishedAt: z.number().optional(),
});

export const joinRoomSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
});

export const leaveRoomSchema = z.object({
  roomId: z.string(),
  playerId: z.string(),
});

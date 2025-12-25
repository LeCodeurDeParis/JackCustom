import * as z from "zod";
import { playerSchema } from "./player-schema";
import { blackjackGameSchema } from "./blackjack-schema";
import { RoomState } from "@/states/room-states";

export const createRoomSchema = z.object({
  hostId: z.string(),
  state: z.nativeEnum(RoomState).default(RoomState.WAITING),
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

import { RoomState } from "@/states/room-states";
import { Room } from "@/interfaces/room";
import { randomUUID } from "crypto";
import { rooms } from "@/server/storage/rooms";
import { PlayerState } from "@/states/player-states";
import { authMiddleware } from "@/server/middleware/auth-middleware";
import { base } from "@/server/context";
import { ORPCError } from "@orpc/server";
import { joinRoomSchema, leaveRoomSchema } from "../schema/room-schema";
import { z } from "zod";
import { GameState } from "@/states/game-states";
import { BlackjackGame } from "@/interfaces/blackjack";
import { Player } from "@/interfaces/player";

export const createRoom = base
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const roomId = randomUUID();

    const room: Room = {
      id: roomId,
      hostId: context.user.id,
      state: RoomState.WAITING,
      players: [
        {
          userId: context.user.id,
          socketId: "",
          isDealer: false,
          hand: [],
          state: PlayerState.WAITING,
          sessionPoints: 0,
          autoJoinNext: false,
          purchases: [],
        },
      ],
      createdAt: Date.now(),
      finishedAt: undefined,
    };

    rooms.set(roomId, room);

    return room;
  });

export const joinRoom = base
  .use(authMiddleware)
  .input(joinRoomSchema)
  .handler(async ({ context, input }) => {
    const room = rooms.get(input.roomId);
    if (!room) {
      throw new ORPCError("NOT_FOUND", {
        data: { message: "Room not found" },
      });
    }

    if (room.state !== RoomState.WAITING) {
      throw new ORPCError("BAD_REQUEST", {
        data: { message: "Game already started" },
      });
    }

    const alreadyInRoom = room.players.some(
      (p) => p.userId === context.user.id
    );
    if (alreadyInRoom) return room;

    if (room.players.length >= 8) {
      throw new ORPCError("CONFLICT", {
        data: { message: "Room is full" },
      });
    }

    room.players.push({
      userId: context.user.id,
      socketId: "",
      isDealer: false,
      hand: [],
      state: PlayerState.WAITING,
      sessionPoints: 0,
      autoJoinNext: false,
      purchases: [],
    });

    return room;
  });

export const leaveRoom = base
  .use(authMiddleware)
  .input(leaveRoomSchema)
  .handler(async ({ context, input }) => {
    const room = rooms.get(input.roomId);
    if (!room) {
      throw new ORPCError("NOT_FOUND", {
        data: { message: "Room not found" },
      });
    }

    room.players = room.players.filter((p) => p.userId !== context.user.id);

    if (room.players.length === 0) {
      rooms.delete(input.roomId);
      return { deleted: true };
    }

    if (room.hostId === context.user.id) {
      room.hostId = room.players[0].userId;
    }

    return room;
  });

export const startRoom = base
  .use(authMiddleware)
  .input(z.object({ roomId: z.string() }))
  .handler(async ({ context, input }) => {
    const room = rooms.get(input.roomId);
    if (!room) {
      throw new ORPCError("NOT_FOUND", {
        data: { message: "Room not found" },
      });
    }

    if (room.hostId !== context.user.id) {
      throw new ORPCError("FORBIDDEN", {
        data: { message: "Only host can start the room" },
      });
    }

    if (room.state !== RoomState.WAITING) {
      throw new ORPCError("BAD_REQUEST", {
        data: { message: "Room already started" },
      });
    }

    room.players.forEach((player) => {
      player.sessionPoints = 0;
      player.purchases = [];
      player.state = PlayerState.WAITING;
      player.hand = [];
    });

    room.state = RoomState.PLAYING;

    return room;
  });

export const startGame = base
  .use(authMiddleware)
  .input(z.object({ roomId: z.string() }))
  .handler(async ({ context, input }) => {
    const room = rooms.get(input.roomId);
    if (!room) {
      throw new ORPCError("NOT_FOUND");
    }

    if (room.hostId !== context.user.id) {
      throw new ORPCError("FORBIDDEN");
    }

    if (room.state !== RoomState.PLAYING) {
      throw new ORPCError("BAD_REQUEST", {
        data: { message: "Game not active" },
      });
    }

    // Reset players for new game
    room.players.forEach((player) => {
      player.hand = [];
      player.state = PlayerState.PLAYING;
    });

    // TODO: init deck / dealer later
    const bank: Player = {
      userId: "bank",
      socketId: "",
      isDealer: true,
      hand: [],
      state: PlayerState.WAITING,
      sessionPoints: 0,
      autoJoinNext: false,
      purchases: [],
    };

    // Initialize game
    room.currentGame = {
      id: randomUUID(),
      state: GameState.DEALING,
      players: room.players,
      bank,
      deck: [],
      currentPlayerIndex: 0,
      sessionId: room.id,
    };

    return room;
  });

export const endGame = base
  .use(authMiddleware)
  .input(z.object({ roomId: z.string() }))
  .handler(async ({ input }) => {
    const room = rooms.get(input.roomId);
    if (!room) {
      throw new ORPCError("NOT_FOUND", {
        data: { message: "Room not found" },
      });
    }

    if (!room.currentGame) {
      throw new ORPCError("BAD_REQUEST", {
        data: { message: "Game not found" },
      });
    }

    room.currentGame = undefined;

    room.players.forEach((player) => {
      player.state = PlayerState.WAITING;
    });

    return room;
  });

import { RoomState } from "@/states/room-states";
import { Room } from "@/interfaces/room";
import { randomUUID } from "crypto";
import { rooms } from "@/server/storage/rooms";
import { PlayerState } from "@/states/player-states";
import { ORPCError } from "@orpc/server";
import { joinRoomSchema, leaveRoomSchema } from "../schema/room-schema";
import { z } from "zod";
import { GameState } from "@/states/game-states";
import { Player } from "@/interfaces/player";
import { base } from "../context";
import { IncomingHttpHeaders } from "node:http";
import { user } from "../db/schema/auth-schema";
import { inArray } from "drizzle-orm";
import db from "../db";
import { findRoomByCode } from "../utils/room-code";
import { DEFAULT_ROOM_SETTINGS } from "@/interfaces/room-settings";

type AuthenticatedContext = {
  headers: IncomingHttpHeaders;
  user: { id: string; name?: string };
  session: { id: string; userId: string };
};

export const getRoom = base
  .input(z.object({ roomId: z.string() }))
  .handler(async (opt) => {
    const input = opt.input;
    const room = rooms.get(input.roomId);
    if (!room) {
      throw new ORPCError("NOT_FOUND", {
        data: { message: "Room not found" },
      });
    }
    const userIds = room.players.map((p) => p.userId);
    if (userIds.length > 0) {
      const users = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, userIds));

      const userMap = new Map(users.map((u) => [u.id, u.name]));

      room.players = room.players.map((p) => {
        const dbName = userMap.get(p.userId);
        return {
          ...p,
          username: dbName || p.username || p.userId.slice(0, 8),
        };
      });
    }
    return room;
  });

export const createRoom = base.input(z.void()).handler(async (opt) => {
  const context = opt.context as AuthenticatedContext;
  const roomId = randomUUID();

  const hostName = context.user.name || context.user.id.slice(0, 8);

  const room: Room = {
    id: roomId,
    hostId: context.user.id,
    state: RoomState.WAITING,
    players: [
      {
        username: hostName,
        userId: context.user.id,
        socketId: "",
        isDealer: false,
        hand: [],
        state: PlayerState.WAITING,
        sessionPoints: 0,
        autoJoinNext: false,
        ready: false,
        purchases: [],
      },
    ],
    dealerIndex: 0,
    settings: { ...DEFAULT_ROOM_SETTINGS },
    logs: [
      {
        id: randomUUID(),
        type: "system",
        message: `Room créée par ${hostName}`,
        timestamp: Date.now(),
      },
    ],
    createdAt: Date.now(),
    finishedAt: undefined,
  };

  rooms.set(roomId, room);

  return room;
});

export const joinRoom = base.input(joinRoomSchema).handler(async (opt) => {
  const context = opt.context as AuthenticatedContext;
  const input = opt.input;
  const room = findRoomByCode(input.code);
  if (!room) {
    throw new ORPCError("NOT_FOUND", {
      data: { message: "Aucune room trouvée avec ce code" },
    });
  }

  if (room.state !== RoomState.WAITING) {
    throw new ORPCError("BAD_REQUEST", {
      data: { message: "Game already started" },
    });
  }

  const alreadyInRoom = room.players.some((p) => p.userId === context.user.id);
  if (alreadyInRoom) return room;

  if (room.players.length >= 8) {
    throw new ORPCError("CONFLICT", {
      data: { message: "Room is full" },
    });
  }

  room.players.push({
    userId: context.user.id,
    username: context.user.name || context.user.id.slice(0, 8),
    socketId: "",
    isDealer: false,
    hand: [],
    state: PlayerState.WAITING,
    sessionPoints: 0,
    autoJoinNext: false,
    ready: false,
    purchases: [],
  });

  return room;
});

export const setReady = base
  .input(z.object({ roomId: z.string(), ready: z.boolean() }))
  .handler(async (opt) => {
    const context = opt.context as AuthenticatedContext;
    const input = opt.input;
    const room = rooms.get(input.roomId);
    if (!room)
      throw new ORPCError("NOT_FOUND", { data: { message: "Room not found" } });

    const player = room.players.find((p) => p.userId === context.user.id);
    if (!player)
      throw new ORPCError("NOT_FOUND", {
        data: { message: "Player not found" },
      });

    player.ready = input.ready;
    player.state = input.ready ? PlayerState.READY : PlayerState.WAITING;

    return room;
  });

export const leaveRoom = base.input(leaveRoomSchema).handler(async (opt) => {
  const context = opt.context as AuthenticatedContext;
  const input = opt.input;
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
  .input(z.object({ roomId: z.string() }))
  .handler(async (opt) => {
    const context = opt.context as AuthenticatedContext;
    const input = opt.input;
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
  .input(z.object({ roomId: z.string() }))
  .handler(async (opt) => {
    const context = opt.context as AuthenticatedContext;
    const input = opt.input;
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
      username: "Bank",
      userId: "bank",
      socketId: "",
      isDealer: true,
      hand: [],
      state: PlayerState.WAITING,
      sessionPoints: 0,
      autoJoinNext: false,
      ready: false,
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
      bankHasDrawn: false,
    };

    return room;
  });

export const endGame = base
  .input(z.object({ roomId: z.string() }))
  .handler(async (opt) => {
    const input = opt.input;
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

export const prepareNextRound = base
  .input(z.object({ roomId: z.string() }))
  .handler(async ({ input }) => {
    const room = rooms.get(input.roomId);
    if (!room) {
      throw new ORPCError("NOT_FOUND", { data: { message: "Room not found" } });
    }

    // Parcourir les joueurs pour auto-ready
    room.players.forEach((player) => {
      if (player.autoJoinNext) {
        player.state = PlayerState.READY;
      } else {
        player.state = PlayerState.WAITING;
      }
      player.hand = [];
    });

    // Reset currentGame si besoin
    room.currentGame = undefined;

    return room;
  });

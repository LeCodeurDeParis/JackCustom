import { Room } from "@/interfaces/room";
import { RoomState } from "@/states/room-states";
import { Player } from "@/interfaces/player";
import { PlayerState } from "@/states/player-states";
import { ORPCError } from "@orpc/server";

export function assertRoomExists(room?: Room) {
  if (!room) {
    throw new ORPCError("ROOM_NOT_FOUND");
  }
}

export function assertRoomState(room: Room, allowed: RoomState[]) {
  if (!allowed.includes(room.state)) {
    throw new ORPCError("ROOM_INVALID_STATE", {
      data: {
        current: room.state,
        allowed,
      },
    });
  }
}

export function assertPlayerExists(player?: Player) {
  if (!player) {
    throw new ORPCError("PLAYER_NOT_FOUND");
  }
}

export function assertPlayerState(player: Player, allowed: PlayerState[]) {
  if (!allowed.includes(player.state)) {
    throw new ORPCError("PLAYER_INVALID_STATE", {
      data: {
        current: player.state,
        allowed,
      },
    });
  }
}

export function assertCanReady(room: Room, player: Player) {
  assertRoomState(room, [RoomState.WAITING]);
  assertPlayerState(player, [PlayerState.WAITING]);
}

export function assertCanUnready(room: Room, player: Player) {
  assertRoomState(room, [RoomState.WAITING]);
  assertPlayerState(player, [PlayerState.READY]);
}

export function assertCanJoinRoom(room: Room) {
  assertRoomState(room, [RoomState.WAITING]);
}

export function assertCanPlay(room: Room, player: Player) {
  assertRoomState(room, [RoomState.PLAYING]);
  assertPlayerState(player, [PlayerState.PLAYING]);
}

import { PlayerState } from "@/states/player-states";
import { Room } from "@/interfaces/room";
import { RoomState } from "@/states/room-states";
import { GameState } from "@/states/game-states";
import { randomUUID } from "crypto";

export function startNextGameIfPossible(room: Room) {
  const readyPlayers = room.players.filter((p) => p.autoJoinNext);

  if (readyPlayers.length === 0) {
    room.state = RoomState.WAITING;
    return;
  }

  room.players = readyPlayers.map((p) => ({
    ...p,
    hand: [],
    purchases: [],
    state: PlayerState.PLAYING,
  }));

  room.currentGame = {
    id: randomUUID(),
    state: GameState.DEALING,
    players: room.players,
    bank: room.players.find((p) => p.isDealer)!,
    deck: [],
    currentPlayerIndex: 0,
    sessionId: room.id,
  };
}

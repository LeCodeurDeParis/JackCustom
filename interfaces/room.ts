import { Player } from "./player";
import { RoomState } from "@/states/room-states";
import { BlackjackGame } from "./blackjack";

export interface Room {
  id: string;
  hostId: string;

  state: RoomState;

  players: Player[];

  currentGame?: BlackjackGame;

  createdAt: number;
  finishedAt?: number;
}

import { Player } from "./player";
import { SessionState } from "@/states/session-states";
import { BlackjackGame } from "./blackjack";

export interface Room {
  id: string;
  hostId: string;

  state: SessionState;

  players: Player[];

  currentGame?: BlackjackGame;

  createdAt: number;
  finishedAt?: number;
}

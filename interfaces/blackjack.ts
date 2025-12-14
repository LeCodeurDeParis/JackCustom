import { Player } from "./player";
import { Card } from "./card";
import { GameState } from "@/states/game-states";

export interface BlackjackGame {
  id: string;
  state: GameState;

  players: Player[];
  bank: Player;

  deck: Card[];

  currentPlayerIndex: number;

  sessionId: string;
}

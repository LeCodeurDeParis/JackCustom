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

  bankHasDrawn: boolean; // La banque doit tirer au moins 1 carte avant de pouvoir dénoncer
}

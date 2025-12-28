import { PlayerState } from "@/states/player-states";
import { Card } from "./card";
import { PlayerPurchase } from "./shop";

export interface Player {
  username: string;
  userId: string;
  socketId: string;

  isDealer: boolean;
  hand: Card[];
  state: PlayerState;

  sessionPoints: number;

  autoJoinNext: boolean;
  ready: boolean;

  purchases: PlayerPurchase[];
}

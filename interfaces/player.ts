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

  // Flags d'effets boutique
  forceVisibleDraw?: boolean; // A la tienne: prochain tirage visible + stand interdit
  forceHiddenDraw?: boolean; // Encore un: doit tirer face cachee
  immuneToForceDraw?: boolean; // Pause lucide: ignore prochain effet de pioche forcee
  frozenHand?: boolean; // Main figee: ne peut pas jouer
}

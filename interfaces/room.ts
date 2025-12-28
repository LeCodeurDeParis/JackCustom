import { Player } from "./player";
import { RoomState } from "@/states/room-states";
import { BlackjackGame } from "./blackjack";
import { RoomSettings, RoomLog } from "./room-settings";

export interface Room {
  id: string;
  hostId: string;

  state: RoomState;

  players: Player[];

  currentGame?: BlackjackGame;

  dealerIndex: number; // Index du joueur qui sera la banque (tourne à chaque manche)

  settings: RoomSettings; // Paramètres de la room modifiables par le host

  logs: RoomLog[]; // Historique des logs/events de la room

  createdAt: number;
  finishedAt?: number;
}

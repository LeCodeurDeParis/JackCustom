export interface RoomSettings {
  // Points gagnés par victoire
  winPoints: number;

  // Points gagnés par la banque par joueur battu
  bankWinPoints: number;

  // Temps maximum par tour (en secondes, 0 = illimité)
  turnTimeLimit: number;

  // Révéler automatiquement les cartes à la fin
  autoRevealCards: boolean;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  winPoints: 50,
  bankWinPoints: 10,
  turnTimeLimit: 0,
  autoRevealCards: true,
};

export interface RoomLog {
  id: string;
  type: "system" | "game" | "chat";
  message: string;
  timestamp: number;
  playerId?: string;
  playerName?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}


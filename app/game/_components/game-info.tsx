"use client";

import { GameState } from "@/states/game-states";
import { cn } from "@/lib/utils";

interface GameInfoProps {
  gameState: GameState;
  currentPlayerName?: string;
  bankName?: string;
}

const stateLabels: Record<GameState, string> = {
  [GameState.DEALING]: "Distribution des cartes",
  [GameState.PLAYER_TURNS]: "Tour des joueurs",
  [GameState.BANK_TURN]: "Tour de la banque",
  [GameState.RESOLUTION]: "Résolution",
  [GameState.FINISHED]: "Partie terminée",
};

const stateColors: Record<GameState, string> = {
  [GameState.DEALING]: "bg-blue-500",
  [GameState.PLAYER_TURNS]: "bg-green-500",
  [GameState.BANK_TURN]: "bg-amber-500",
  [GameState.RESOLUTION]: "bg-purple-500",
  [GameState.FINISHED]: "bg-gray-500",
};

export function GameInfo({
  gameState,
  currentPlayerName,
  bankName,
}: GameInfoProps) {
  return (
    <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Phase actuelle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Phase:</span>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-semibold text-white",
              stateColors[gameState]
            )}
          >
            {stateLabels[gameState]}
          </span>
        </div>

        {/* Joueur actuel (si tour des joueurs) */}
        {gameState === GameState.PLAYER_TURNS && currentPlayerName && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tour de:</span>
            <span className="font-semibold text-primary">
              {currentPlayerName}
            </span>
          </div>
        )}

        {/* Banque */}
        {bankName && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Banque:</span>
            <span className="font-semibold text-amber-500">{bankName}</span>
          </div>
        )}
      </div>
    </div>
  );
}


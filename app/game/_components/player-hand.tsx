"use client";

import { Player } from "@/interfaces/player";
import { PlayerState } from "@/states/player-states";
import { CardStack, DisplayCard } from "./card-display";
import { cn } from "@/lib/utils";
import { calculateVisibleTotal, calculateTotal } from "@/game-utils/game-utils";

interface PlayerHandProps {
  player: Player;
  isCurrentTurn: boolean;
  isCurrentUser: boolean;
}

const stateLabels: Record<PlayerState, string> = {
  [PlayerState.DISCONNECTED]: "Déconnecté",
  [PlayerState.READY]: "Prêt",
  [PlayerState.WAITING]: "En attente",
  [PlayerState.PLAYING]: "En jeu",
  [PlayerState.STAND]: "Reste",
  [PlayerState.BUST]: "Éliminé",
  [PlayerState.WIN]: "Gagnant",
};

const stateColors: Record<PlayerState, string> = {
  [PlayerState.DISCONNECTED]: "bg-gray-500",
  [PlayerState.READY]: "bg-blue-500",
  [PlayerState.WAITING]: "bg-yellow-500",
  [PlayerState.PLAYING]: "bg-green-500",
  [PlayerState.STAND]: "bg-purple-500",
  [PlayerState.BUST]: "bg-red-500",
  [PlayerState.WIN]: "bg-emerald-500",
};

export function PlayerHand({
  player,
  isCurrentTurn,
  isCurrentUser,
}: PlayerHandProps) {
  // Pour le joueur actuel, révéler ses propres cartes cachées dans l'affichage
  // mais les marquer comme "dimmed" pour les distinguer
  const displayCards: DisplayCard[] = isCurrentUser
    ? player.hand.map((card) => ({
        ...card,
        dimmed: card.hidden, // Marquer les cartes cachées comme assombries
        hidden: false, // Mais les révéler quand même
      }))
    : player.hand;

  const visibleTotal = calculateVisibleTotal(player.hand);
  const hasHiddenCards = player.hand.some((c) => c.hidden);
  // Pour le joueur actuel, calculer le total réel (avec cartes cachées révélées)
  const actualTotal = isCurrentUser
    ? calculateTotal(player.hand)
    : visibleTotal;

  return (
    <div
      className={cn(
        "p-4 rounded-xl transition-all duration-300",
        "bg-card/50 backdrop-blur-sm border",
        isCurrentTurn
          ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30"
          : "border-border/50",
        isCurrentUser && "bg-primary/5"
      )}
    >
      {/* Header avec nom et état */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='font-semibold text-foreground truncate'>
            {player.username}
            {isCurrentUser && (
              <span className='text-xs text-muted-foreground ml-1'>(Vous)</span>
            )}
          </span>
          {isCurrentTurn && (
            <span className='text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full animate-pulse shrink-0'>
              Tour
            </span>
          )}
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full text-white",
              stateColors[player.state]
            )}
          >
            {stateLabels[player.state]}
          </span>
          <span className='text-sm font-mono bg-muted px-2 py-0.5 rounded'>
            {player.sessionPoints} pts
          </span>
        </div>
      </div>

      {/* Cartes */}
      <div className='mb-2'>
        {player.hand.length > 0 ? (
          <CardStack cards={displayCards} size='md' />
        ) : (
          <p className='text-sm text-muted-foreground italic'>Pas de cartes</p>
        )}
      </div>

      {/* Total */}
      {player.hand.length > 0 && (
        <div className='text-sm text-muted-foreground'>
          {isCurrentUser ? (
            <>
              Total:{" "}
              <span className='font-mono font-semibold text-foreground'>
                {actualTotal}
              </span>
              {hasHiddenCards && (
                <span className='text-xs ml-1 text-green-500'>
                  (carte cachée)
                </span>
              )}
            </>
          ) : (
            <>
              Visible:{" "}
              <span className='font-mono font-semibold text-foreground'>
                {visibleTotal}
              </span>
              {hasHiddenCards && (
                <span className='text-xs ml-1'>(+ cachées)</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

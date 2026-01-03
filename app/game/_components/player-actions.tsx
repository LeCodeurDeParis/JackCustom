"use client";

import { Button } from "@/components/ui/button";
import { Player } from "@/interfaces/player";
import { hasHiddenCard } from "@/game-utils/game-utils";

interface PlayerActionsProps {
  player: Player;
  isMyTurn: boolean;
  onHit: (hidden: boolean) => void;
  onStand: () => void;
  onRevealHidden?: () => void;
}

export function PlayerActions({
  player,
  isMyTurn,
  onHit,
  onStand,
  onRevealHidden,
}: PlayerActionsProps) {
  const hasHidden = hasHiddenCard(player.hand);

  // Si ce n'est pas le tour du joueur mais qu'il a une carte cachée, afficher seulement le bouton de révélation
  if (!isMyTurn) {
    return null;
  }

  return (
    <div className='p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-primary/30'>
      <h3 className='text-sm font-semibold text-muted-foreground mb-3'>
        Vos actions
      </h3>
      <div className='flex flex-wrap gap-3'>
        <Button
          onClick={() => onHit(false)}
          variant='default'
          className='flex-1 min-w-[120px]'
        >
          🃏 Tirer (visible)
        </Button>
        <Button
          onClick={() => onHit(true)}
          variant='secondary'
          className='flex-1 min-w-[120px]'
          disabled={hasHidden}
          title={
            hasHidden
              ? "Vous devez d'abord révéler votre carte cachée"
              : "Tirer une carte face cachée"
          }
        >
          🂠 Tirer (cachée)
        </Button>
        <Button
          onClick={onStand}
          variant='outline'
          className='flex-1 min-w-[120px]'
        >
          ✋ Rester
        </Button>
      </div>
      {hasHidden && (
        <div className='mt-2 space-y-1'>
          {onRevealHidden && (
            <Button
              onClick={onRevealHidden}
              variant='secondary'
              size='sm'
              className='w-full'
            >
              👁️ Révéler ma carte cachée
            </Button>
          )}
          <p className='text-xs text-muted-foreground'>
            💡 Pour tirer une carte cachée, votre carte actuelle sera
            d&apos;abord révélée.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Player } from "@/interfaces/player";
import { PlayerState } from "@/states/player-states";
import { calculateVisibleTotal } from "@/game-utils/game-utils";
import { cn } from "@/lib/utils";

interface BankActionsProps {
  isBankTurn: boolean;
  isResolution: boolean;
  isFinished: boolean;
  players: Player[];
  bankHasDrawn: boolean;
  forceDenounceAtStart?: boolean;
  onDraw: () => void;
  onDenounce: (playerId: string) => void;
  onEndTurn: () => void;
  onResolve: () => void;
}

export function BankActions({
  isBankTurn,
  isResolution,
  isFinished,
  players,
  bankHasDrawn,
  forceDenounceAtStart = false,
  onDraw,
  onDenounce,
  onEndTurn,
  onResolve,
}: BankActionsProps) {
  if (isFinished) {
    return null;
  }

  if (isResolution) {
    return (
      <div className='p-4 rounded-xl bg-amber-950/30 border border-amber-700/50'>
        <h3 className='text-sm font-semibold text-amber-300 mb-3'>
          Phase de résolution
        </h3>
        <Button
          onClick={onResolve}
          className='w-full bg-amber-600 hover:bg-amber-500 text-amber-950'
        >
          📊 Résoudre la manche
        </Button>
      </div>
    );
  }

  if (!isBankTurn) {
    return null;
  }

  // Joueurs qui peuvent être dénoncés (pas encore BUST ou WIN)
  const denounceablePlayers = players.filter(
    (p) => p.state !== PlayerState.BUST && p.state !== PlayerState.WIN
  );

  // Vérifier si tous les joueurs ont été dénoncés
  const allPlayersDenounced = denounceablePlayers.length === 0;

  // Peut dénoncer si a tiré OU si forceDenounceAtStart est actif
  const canDenounce = bankHasDrawn || forceDenounceAtStart;

  return (
    <div className='p-4 rounded-xl bg-amber-950/30 border border-amber-700/50 space-y-4'>
      <h3 className='text-sm font-semibold text-amber-300'>
        Actions de la banque
      </h3>

      {/* Alerte "Dernier appel" */}
      {forceDenounceAtStart && (
        <div className='p-3 rounded-lg bg-red-900/40 border border-red-500/50 animate-pulse'>
          <p className='text-sm text-red-300 font-medium'>
            📢 Dernier appel ! Vous devez d&apos;abord dénoncer un joueur.
          </p>
        </div>
      )}

      {/* Message si tous les joueurs sont dénoncés */}
      {allPlayersDenounced && (
        <div className='p-3 rounded-lg bg-amber-900/30 border border-amber-700/50'>
          <p className='text-sm text-amber-300 font-medium'>
            ✅ Tous les joueurs ont été dénoncés !
          </p>
          <p className='text-xs text-amber-300/70 mt-1'>
            Le tour de la banque va se terminer automatiquement.
          </p>
        </div>
      )}

      {/* Tirer une carte - désactivé si tous dénoncés ou si forceDenounce actif */}
      {!allPlayersDenounced && !forceDenounceAtStart && (
        <div>
          <Button
            onClick={onDraw}
            className='w-full bg-amber-600 hover:bg-amber-500 text-amber-950'
          >
            🃏 Tirer une carte
          </Button>
        </div>
      )}

      {/* Dénoncer des joueurs - disponible si a tiré OU si forceDenounceAtStart */}
      {canDenounce && denounceablePlayers.length > 0 && (
        <div className='space-y-2'>
          <p className='text-xs text-amber-300/70'>Dénoncer un joueur:</p>
          <div className='grid gap-2'>
            {denounceablePlayers.map((player) => (
              <Button
                key={player.userId}
                onClick={() => onDenounce(player.userId)}
                variant='outline'
                size='sm'
                className={cn(
                  "justify-between border-amber-700/50 text-amber-100",
                  "hover:bg-amber-900/50 hover:border-amber-500",
                  forceDenounceAtStart && "ring-2 ring-red-500/50"
                )}
              >
                <span>{player.username}</span>
                <span className='text-xs opacity-70'>
                  (visible: {calculateVisibleTotal(player.hand)})
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {!canDenounce && !forceDenounceAtStart && (
        <p className='text-xs text-amber-300/50 italic'>
          Vous devez tirer au moins une carte avant de pouvoir dénoncer.
        </p>
      )}

      {/* Terminer le tour - caché si tous dénoncés ou si forceDenounce actif */}
      {bankHasDrawn && !allPlayersDenounced && !forceDenounceAtStart && (
        <Button
          onClick={onEndTurn}
          variant='outline'
          className='w-full border-amber-700/50 text-amber-100 hover:bg-amber-900/50'
        >
          ✋ Terminer mon tour
        </Button>
      )}
    </div>
  );
}

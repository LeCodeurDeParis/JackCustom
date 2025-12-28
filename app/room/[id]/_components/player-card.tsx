"use client";

import { Player } from "@/interfaces/player";
import { PlayerState } from "@/states/player-states";
import { Button } from "@/components/ui/button";

interface PlayerCardProps {
  player: Player;
  index: number;
  isHost: boolean;
  isCurrentUser: boolean;
  roomId: string;
  onSetReady?: (ready: boolean) => void;
  onToggleAutoJoin?: (autoJoin: boolean) => void;
}

export function PlayerCard({
  player,
  index,
  isHost,
  isCurrentUser,
  roomId,
  onSetReady,
  onToggleAutoJoin,
}: PlayerCardProps) {
  const isReady = player.state === PlayerState.READY || player.ready;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isCurrentUser
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          : "bg-gray-50 dark:bg-gray-900/20"
      }`}
    >
      <div className='flex items-center gap-3 flex-1'>
        <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold'>
          {index + 1}
        </div>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <span className='font-medium'>{player.username}</span>
            {isHost && (
              <span className='px-2 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'>
                Host
              </span>
            )}
            {isCurrentUser && (
              <span className='px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'>
                Vous
              </span>
            )}
            {isReady && (
              <span className='px-2 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'>
                Prêt
              </span>
            )}
          </div>
          <p className='text-sm text-muted-foreground'>
            Points: {player.sessionPoints} | État: {player.state}
          </p>
        </div>
      </div>

      {isCurrentUser && onSetReady && (
        <div className='flex items-center gap-2'>
          <Button
            variant={isReady ? "default" : "outline"}
            size='sm'
            onClick={() => onSetReady(!isReady)}
          >
            {isReady ? "Annuler" : "Prêt"}
          </Button>
          {onToggleAutoJoin && (
            <Button
              variant={player.autoJoinNext ? "default" : "outline"}
              size='sm'
              onClick={() => onToggleAutoJoin(!player.autoJoinNext)}
            >
              {player.autoJoinNext ? "Auto-join ✓" : "Auto-join"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

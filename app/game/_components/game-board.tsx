"use client";

import { BlackjackGame } from "@/interfaces/blackjack";
import { GameState } from "@/states/game-states";
import { BankHand } from "./bank-hand";
import { PlayerHand } from "./player-hand";
import { PlayerActions } from "./player-actions";
import { BankActions } from "./bank-actions";
import { GameInfo } from "./game-info";
import { Button } from "@/components/ui/button";

interface GameBoardProps {
  game: BlackjackGame;
  currentUserId: string | null;
  onHit: (hidden: boolean) => void;
  onStand: () => void;
  onRevealHidden: () => void;
  onBankDraw: () => void;
  onBankDenounce: (playerId: string) => void;
  onBankEndTurn: () => void;
  onResolve: () => void;
  onEndGame: () => void;
  onReplay: () => void;
  onBackToRoom: () => void;
  onLeaveGame: () => void;
  onOpenShop?: () => void;
  hasShopItems?: boolean;
  onDebugGivePoints?: (points: number) => void;
  autoReplayCountdown?: number | null; // Temps restant avant auto-replay (null = pas d'auto-replay)
}

export function GameBoard({
  game,
  currentUserId,
  onHit,
  onStand,
  onRevealHidden,
  onBankDraw,
  onBankDenounce,
  onBankEndTurn,
  onResolve,
  onEndGame,
  onReplay,
  onBackToRoom,
  onLeaveGame,
  onOpenShop,
  hasShopItems = false,
  onDebugGivePoints,
  autoReplayCountdown,
}: GameBoardProps) {
  const isCurrentUserBank = currentUserId === game.bank.userId;
  const isBankTurn = game.state === GameState.BANK_TURN;
  const isResolution = game.state === GameState.RESOLUTION;
  const isFinished = game.state === GameState.FINISHED;
  const isPlayerTurns = game.state === GameState.PLAYER_TURNS;

  // Trouver le joueur actuel
  const currentPlayer = game.players[game.currentPlayerIndex];
  const isMyTurn = isPlayerTurns && currentPlayer?.userId === currentUserId;

  // Trouver le joueur courant dans la liste
  const myPlayer = game.players.find((p) => p.userId === currentUserId);

  // Vérifier si la banque est un bot
  const isBankBot = game.bank.userId.startsWith("test-");

  return (
    <div className='space-y-6'>
      {/* Bouton retour à la room (toujours visible, en haut à gauche) */}
      <div className='flex items-center justify-between'>
        <Button
          onClick={onLeaveGame}
          variant='ghost'
          size='sm'
          className='text-muted-foreground hover:text-foreground'
        >
          ← Retour à la room
        </Button>
      </div>

      {/* Header avec info et bouton boutique */}
      <div className='flex items-start justify-between gap-4'>
        {/* Info sur la partie */}
        <GameInfo
          gameState={game.state}
          currentPlayerName={currentPlayer?.username}
          bankName={game.bank.username}
        />

        <div className='flex items-center gap-2'>
          {/* Bouton boutique */}
          {hasShopItems && onOpenShop && !isFinished && (
            <Button
              onClick={onOpenShop}
              variant='outline'
              size='sm'
              className='flex items-center gap-2 shrink-0'
            >
              🛒 Boutique
              {myPlayer && (
                <span className='text-xs text-muted-foreground'>
                  ({myPlayer.sessionPoints} pts)
                </span>
              )}
            </Button>
          )}

          {/* DEBUG: Bouton pour donner des points (à retirer en prod) */}
          {onDebugGivePoints && (
            <Button
              onClick={() => onDebugGivePoints(9999)}
              variant='destructive'
              size='sm'
              className='shrink-0'
            >
              🐛 +9999 pts
            </Button>
          )}
        </div>
      </div>

      {/* Zone de la banque */}
      <BankHand
        bank={game.bank}
        isBankTurn={isBankTurn}
        isCurrentUserBank={isCurrentUserBank}
      />

      {/* Actions de la banque (si c'est mon tour OU si la banque est un bot et qu'on est en résolution) */}
      {(isCurrentUserBank || (isBankBot && isResolution)) && (
        <BankActions
          isBankTurn={isBankTurn}
          isResolution={isResolution}
          isFinished={isFinished}
          players={game.players}
          bankHasDrawn={game.bankHasDrawn}
          forceDenounceAtStart={game.forceDenounceAtStart}
          onDraw={onBankDraw}
          onDenounce={onBankDenounce}
          onEndTurn={onBankEndTurn}
          onResolve={onResolve}
        />
      )}

      {/* Actions du joueur (si je ne suis pas la banque) */}
      {myPlayer && !isCurrentUserBank && (
        <PlayerActions
          player={myPlayer}
          isMyTurn={isMyTurn}
          onHit={onHit}
          onStand={onStand}
          onRevealHidden={onRevealHidden}
        />
      )}

      {/* Liste des joueurs */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-muted-foreground px-1'>
          Joueurs ({game.players.length})
        </h3>
        <div className='grid gap-3 grid-cols-1 lg:grid-cols-2'>
          {game.players.map((player, index) => (
            <PlayerHand
              key={player.userId}
              player={player}
              isCurrentTurn={isPlayerTurns && game.currentPlayerIndex === index}
              isCurrentUser={player.userId === currentUserId}
            />
          ))}
        </div>
      </div>

      {/* Partie terminée */}
      {isFinished && (
        <div className='p-6 rounded-xl bg-card/80 border border-border text-center space-y-4'>
          <h2 className='text-2xl font-bold'>Manche terminée!</h2>
          <p className='text-muted-foreground'>
            Les points ont été attribués aux gagnants.
          </p>

          {/* Auto-replay countdown ou boutons manuels */}
          {autoReplayCountdown !== null && autoReplayCountdown !== undefined ? (
            <div className='space-y-2'>
              <p className='text-lg font-semibold text-primary animate-pulse'>
                Prochaine manche dans {autoReplayCountdown}s...
              </p>
              <p className='text-sm text-muted-foreground'>
                Tous les joueurs ont l&apos;auto-join activé
              </p>
            </div>
          ) : (
            <div className='flex justify-center gap-4 flex-wrap'>
              <Button onClick={onBackToRoom} variant='outline'>
                Retour à la room
              </Button>
              {/* Afficher le bouton Rejouer si la banque est un bot OU si c'est la banque/host */}
              {(isBankBot || isCurrentUserBank) && (
                <Button onClick={onReplay} variant='default'>
                  Rejouer
                </Button>
              )}
              {isCurrentUserBank && (
                <Button onClick={onEndGame} variant='destructive'>
                  Terminer la session
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

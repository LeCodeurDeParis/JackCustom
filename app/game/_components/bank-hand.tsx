"use client";

import { Player } from "@/interfaces/player";
import { PlayerState } from "@/states/player-states";
import { CardStack } from "./card-display";
import { cn } from "@/lib/utils";
import { calculateTotal } from "@/game-utils/game-utils";

interface BankHandProps {
  bank: Player;
  isBankTurn: boolean;
  isCurrentUserBank: boolean;
}

export function BankHand({ bank, isBankTurn, isCurrentUserBank }: BankHandProps) {
  const total = calculateTotal(bank.hand);

  return (
    <div
      className={cn(
        "p-5 rounded-xl transition-all duration-300",
        "bg-gradient-to-br from-amber-950/50 to-amber-900/30",
        "backdrop-blur-sm border-2",
        isBankTurn
          ? "border-amber-400 shadow-lg shadow-amber-500/20"
          : "border-amber-800/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏦</span>
          <div>
            <h2 className="font-bold text-lg text-amber-100">
              Banque
              {isCurrentUserBank && (
                <span className="text-sm font-normal text-amber-300 ml-2">
                  (Vous)
                </span>
              )}
            </h2>
            <p className="text-sm text-amber-300/70">{bank.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isBankTurn && (
            <span className="text-xs bg-amber-500 text-amber-950 px-2 py-1 rounded-full font-semibold animate-pulse">
              Tour de la banque
            </span>
          )}
          {bank.state === PlayerState.BUST && (
            <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
              Bust!
            </span>
          )}
        </div>
      </div>

      {/* Cartes et Total */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          {bank.hand.length > 0 ? (
            <CardStack cards={bank.hand} size="md" />
          ) : (
            <p className="text-sm text-amber-300/50 italic">
              Pas de cartes
            </p>
          )}
        </div>

        {/* Total */}
        {bank.hand.length > 0 && (
          <div className="text-right shrink-0">
            <span className="text-sm text-amber-300/70 block">Total</span>
            <span
              className={cn(
                "font-mono text-2xl font-bold",
                total > 21 ? "text-red-400" : "text-amber-100"
              )}
            >
              {total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

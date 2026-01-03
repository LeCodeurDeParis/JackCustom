"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShopItem, TargetType } from "@/interfaces/shop";
import { Player } from "@/interfaces/player";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShopItem[];
  currentPlayer: Player | null;
  players: Player[];
  bankUserId: string;
  onBuy: (itemId: string, targetUserId?: string) => void;
}

export function ShopModal({
  isOpen,
  onClose,
  items,
  currentPlayer,
  players,
  bankUserId,
  onBuy,
}: ShopModalProps) {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  if (!isOpen) return null;

  const myPoints = currentPlayer?.sessionPoints ?? 0;

  const handleBuy = () => {
    if (!selectedItem) return;

    if (selectedItem.targetType === "PLAYER" && !selectedTarget) {
      return;
    }

    onBuy(
      selectedItem.id,
      selectedItem.targetType === "PLAYER"
        ? selectedTarget ?? undefined
        : selectedItem.targetType === "BANK"
          ? bankUserId
          : undefined
    );

    setSelectedItem(null);
    setSelectedTarget(null);
    onClose();
  };

  const getTargetOptions = (targetType: TargetType): Player[] => {
    if (targetType === "PLAYER") {
      // Exclure soi-même et la banque des cibles possibles
      return players.filter(
        (p) => p.userId !== currentPlayer?.userId && p.userId !== bankUserId
      );
    }
    return [];
  };

  const bonusItems = items.filter((item) => item.category === "BONUS");
  const malusItems = items.filter((item) => item.category === "MALUS");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <Card className="border-2 border-primary/20 bg-card/95 backdrop-blur">
          <CardHeader className="border-b border-border/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  🛒 Boutique
                </CardTitle>
                <CardDescription>
                  Dépense tes points pour des bonus ou des malus !
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Tes points</div>
                <div className="text-2xl font-bold text-primary">{myPoints}</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-6">
            {/* BONUS */}
            {bonusItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-500 flex items-center gap-2">
                  ✨ Bonus
                </h3>
                <div className="grid gap-3">
                  {bonusItems.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      canAfford={myPoints >= item.cost}
                      onSelect={() => {
                        setSelectedItem(item);
                        setSelectedTarget(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* MALUS */}
            {malusItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-red-500 flex items-center gap-2">
                  💀 Malus
                </h3>
                <div className="grid gap-3">
                  {malusItems.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      canAfford={myPoints >= item.cost}
                      onSelect={() => {
                        setSelectedItem(item);
                        setSelectedTarget(null);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sélection de cible */}
            {selectedItem?.targetType === "PLAYER" && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <h4 className="font-medium">Choisis une cible :</h4>
                <div className="flex flex-wrap gap-2">
                  {getTargetOptions("PLAYER").map((player) => (
                    <Button
                      key={player.userId}
                      variant={
                        selectedTarget === player.userId ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedTarget(player.userId)}
                    >
                      {player.username}
                    </Button>
                  ))}
                </div>
                {getTargetOptions("PLAYER").length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun joueur disponible à cibler
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={handleBuy}
                disabled={
                  !selectedItem ||
                  myPoints < (selectedItem?.cost ?? 0) ||
                  (selectedItem?.targetType === "PLAYER" && !selectedTarget)
                }
              >
                Acheter ({selectedItem?.cost ?? 0} pts)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ShopItemCardProps {
  item: ShopItem;
  isSelected: boolean;
  canAfford: boolean;
  onSelect: () => void;
}

function ShopItemCard({
  item,
  isSelected,
  canAfford,
  onSelect,
}: ShopItemCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={!canAfford}
      className={`
        w-full text-left p-4 rounded-lg border-2 transition-all
        ${isSelected ? "border-primary bg-primary/10" : "border-border/50 bg-card/50"}
        ${canAfford ? "hover:border-primary/50 cursor-pointer" : "opacity-50 cursor-not-allowed"}
      `}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {item.description}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Cible:{" "}
            {item.targetType === "SELF"
              ? "Toi-même"
              : item.targetType === "PLAYER"
                ? "Un joueur"
                : item.targetType === "BANK"
                  ? "La banque"
                  : "Aucune"}
          </div>
        </div>
        <div
          className={`
          text-lg font-bold px-3 py-1 rounded-full
          ${canAfford ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
        `}
        >
          {item.cost} pts
        </div>
      </div>
    </button>
  );
}




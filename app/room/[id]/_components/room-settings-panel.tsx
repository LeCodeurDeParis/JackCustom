"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RoomSettings, DEFAULT_ROOM_SETTINGS } from "@/interfaces/room-settings";
import { SHOP_ITEMS } from "@/data/shop-items";

interface RoomSettingsPanelProps {
  settings?: RoomSettings;
  isHost: boolean;
  onSettingsChange: (settings: Partial<RoomSettings>) => void;
  onAddTestPlayer?: () => void;
  playerCount?: number;
}

export function RoomSettingsPanel({
  settings = DEFAULT_ROOM_SETTINGS,
  isHost,
  onSettingsChange,
  onAddTestPlayer,
  playerCount = 0,
}: RoomSettingsPanelProps) {
  if (!isHost) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          Paramètres de la partie
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Bouton pour ajouter un joueur de test */}
        {onAddTestPlayer && (
          <div className="pb-3 border-b border-border/30">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddTestPlayer}
              disabled={playerCount >= 8}
              className="w-full"
            >
              🤖 Ajouter un joueur de test
            </Button>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {playerCount}/8 joueurs
            </p>
          </div>
        )}

        {/* Points par victoire */}
        <div className="space-y-2">
          <Label htmlFor="winPoints" className="text-sm font-medium">
            Points par victoire
          </Label>
          <Input
            id="winPoints"
            type="number"
            min={0}
            max={500}
            step={10}
            value={settings.winPoints}
            onChange={(e) =>
              onSettingsChange({
                winPoints: Math.max(0, parseInt(e.target.value) || 0),
              })
            }
            className="bg-background/50 border-border/50"
          />
        </div>

        {/* Points banque par joueur battu */}
        <div className="space-y-2">
          <Label htmlFor="bankWinPoints" className="text-sm font-medium">
            Points banque / joueur battu
          </Label>
          <Input
            id="bankWinPoints"
            type="number"
            min={0}
            max={200}
            step={5}
            value={settings.bankWinPoints}
            onChange={(e) =>
              onSettingsChange({
                bankWinPoints: Math.max(0, parseInt(e.target.value) || 0),
              })
            }
            className="bg-background/50 border-border/50"
          />
        </div>

        {/* Temps par tour */}
        <div className="space-y-2">
          <Label htmlFor="turnTimeLimit" className="text-sm font-medium">
            Temps par tour (secondes, 0 = illimité)
          </Label>
          <Input
            id="turnTimeLimit"
            type="number"
            min={0}
            max={300}
            step={10}
            value={settings.turnTimeLimit}
            onChange={(e) =>
              onSettingsChange({
                turnTimeLimit: Math.max(0, parseInt(e.target.value) || 0),
              })
            }
            className="bg-background/50 border-border/50"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t border-border/30">
          <div className="flex items-center gap-3">
            <Checkbox
              id="autoRevealCards"
              checked={settings.autoRevealCards}
              onCheckedChange={(checked) =>
                onSettingsChange({ autoRevealCards: checked === true })
              }
            />
            <Label
              htmlFor="autoRevealCards"
              className="text-sm font-medium cursor-pointer"
            >
              Révéler les cartes automatiquement à la fin
            </Label>
          </div>
        </div>

        {/* Items boutique */}
        <div className="space-y-3 pt-4 border-t border-border/30">
          <Label className="text-sm font-medium flex items-center gap-2">
            <span>🛒</span>
            Items boutique activés
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {SHOP_ITEMS.map((item) => {
              const isEnabled = settings.enabledShopItems?.includes(item.id) ?? true;
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    id={`shop-item-${item.id}`}
                    checked={isEnabled}
                    onCheckedChange={(checked) => {
                      const currentEnabled = settings.enabledShopItems ?? [];
                      const newEnabled = checked
                        ? [...currentEnabled, item.id]
                        : currentEnabled.filter((id) => id !== item.id);
                      onSettingsChange({ enabledShopItems: newEnabled });
                    }}
                  />
                  <Label
                    htmlFor={`shop-item-${item.id}`}
                    className="text-sm cursor-pointer leading-tight"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-1">
                      ({item.cost} pts)
                    </span>
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        item.category === "BONUS"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {item.category}
                    </span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


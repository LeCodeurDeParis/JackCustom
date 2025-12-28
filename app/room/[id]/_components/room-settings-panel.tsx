"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RoomSettings, DEFAULT_ROOM_SETTINGS } from "@/interfaces/room-settings";

interface RoomSettingsPanelProps {
  settings?: RoomSettings;
  isHost: boolean;
  onSettingsChange: (settings: Partial<RoomSettings>) => void;
}

export function RoomSettingsPanel({
  settings = DEFAULT_ROOM_SETTINGS,
  isHost,
  onSettingsChange,
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
      </CardContent>
    </Card>
  );
}


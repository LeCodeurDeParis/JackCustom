"use client";

import { Card } from "@/interfaces/card";
import { CardDisplay } from "./card-display";

interface DoseChoiceModalProps {
  isOpen: boolean;
  cards: Card[];
  onSelect: (cardIndex: number) => void;
}

export function DoseChoiceModal({
  isOpen,
  cards,
  onSelect,
}: DoseChoiceModalProps) {
  if (!isOpen || cards.length !== 2) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - pas de fermeture au clic car le choix est obligatoire */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 p-6 rounded-2xl bg-card border-2 border-primary/30 shadow-2xl max-w-md mx-4">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold">🎯 Dose au choix</h2>
            <p className="text-muted-foreground mt-2">
              Choisis la carte que tu veux garder !
            </p>
          </div>

          <div className="flex justify-center gap-6">
            {cards.map((card, index) => (
              <button
                key={index}
                onClick={() => onSelect(index)}
                className="transform transition-all hover:scale-110 hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-primary/50 rounded-lg"
              >
                <CardDisplay card={card} size="lg" />
              </button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Clique sur la carte de ton choix. L&apos;autre sera remise dans le
            deck.
          </p>
        </div>
      </div>
    </div>
  );
}




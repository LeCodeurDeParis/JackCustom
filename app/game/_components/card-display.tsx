"use client";

import { Card as CardType } from "@/interfaces/card";
import Image from "next/image";
import { cn } from "@/lib/utils";

type CardSize = "sm" | "md" | "lg";

const sizeClasses: Record<CardSize, string> = {
  sm: "w-10 h-14",
  md: "w-16 h-24",
  lg: "w-20 h-28",
};

interface CardDisplayProps {
  card: CardType;
  className?: string;
  dimmed?: boolean; // Pour les cartes cachées révélées au propriétaire
  size?: CardSize;
}

// Mapping des suits vers les préfixes des fichiers
const suitPrefixes: Record<CardType["suit"], string> = {
  hearts: "H",
  diamonds: "D",
  clubs: "C",
  spades: "S",
};

// Mapping des valeurs vers les suffixes des fichiers
function getValueSuffix(value: number): string {
  switch (value) {
    case 1:
      return "A";
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    default:
      return value.toString();
  }
}

export function CardDisplay({
  card,
  className,
  dimmed = false,
  size = "md",
}: CardDisplayProps) {
  const sizeClass = sizeClasses[size];

  if (card.hidden) {
    return (
      <div
        className={cn(
          "relative rounded-lg overflow-hidden shadow-md",
          "bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800",
          "border-2 border-indigo-400/30",
          sizeClass,
          className
        )}
      >
        {/* Motif du dos de carte */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-1 border border-indigo-300/50 rounded" />
          <div className="absolute inset-2 border border-indigo-300/30 rounded" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(size === "sm" ? "text-lg" : "text-2xl")}>🂠</span>
        </div>
      </div>
    );
  }

  const prefix = suitPrefixes[card.suit];
  const suffix = getValueSuffix(card.value);
  const imagePath = `/png/${prefix}${suffix}.png`;

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden shadow-md bg-white",
        "border border-gray-200",
        "transition-transform hover:scale-105",
        dimmed && "ring-2 ring-indigo-500/50",
        sizeClass,
        className
      )}
    >
      <Image
        src={imagePath}
        alt={`${card.value} of ${card.suit}`}
        fill
        className={cn("object-contain p-0.5", dimmed && "brightness-75")}
        sizes={size === "sm" ? "40px" : size === "lg" ? "80px" : "64px"}
      />
      {/* Overlay pour les cartes cachées révélées */}
      {dimmed && (
        <div className="absolute inset-0 bg-indigo-900/20 pointer-events-none" />
      )}
    </div>
  );
}

// Type étendu pour les cartes avec info de dimming
export interface DisplayCard extends CardType {
  dimmed?: boolean;
}

// Composant pour afficher une pile de cartes
interface CardStackProps {
  cards: DisplayCard[];
  className?: string;
  size?: CardSize;
}

export function CardStack({ cards, className, size = "md" }: CardStackProps) {
  return (
    <div className={cn("flex gap-1.5 flex-wrap", className)}>
      {cards.map((card, index) => (
        <div
          key={`${card.suit}-${card.value}-${index}`}
          className="animate-in fade-in slide-in-from-top-2 duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardDisplay card={card} dimmed={card.dimmed} size={size} />
        </div>
      ))}
    </div>
  );
}

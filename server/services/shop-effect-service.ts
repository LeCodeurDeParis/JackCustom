import { BlackjackGame } from "@/interfaces/blackjack";
import { Player } from "@/interfaces/player";
import { PlayerState } from "@/states/player-states";
import { drawCard, calculateTotal } from "@/game-utils/game-utils";

/**
 * Vision altérée - Calcule et retourne le nombre de joueurs bust (secrets inclus)
 * Compte les joueurs dont le total de cartes > 21, même s'ils n'ont pas encore été dénoncés
 */
export function applyVisionAlteree(game: BlackjackGame): string {
  const bustCount = game.players.filter((p) => {
    // Compter les joueurs qui ont bust (total > 21), pas seulement ceux avec l'état BUST
    const total = calculateTotal(p.hand);
    return total > 21;
  }).length;

  return `🔮 Vision altérée : ${bustCount} joueur(s) ont bust`;
}

/**
 * Pause lucide - Le joueur ignore le prochain effet qui le forcerait à piocher
 */
export function applyPauseLucide(player: Player): string {
  player.immuneToForceDraw = true;
  return `🛡️ ${player.username} est protégé contre le prochain effet de pioche forcée`;
}

/**
 * Dose au choix - Pioche 2 cartes, le joueur garde celle de son choix
 * Semi-automatique : on pioche les cartes et on attend le choix
 */
export function applyDoseAuChoix(game: BlackjackGame, player: Player): string {
  if (game.deck.length < 2) {
    return "❌ Pas assez de cartes dans le deck";
  }

  // Piocher 2 cartes sans les ajouter à la main
  const card1 = game.deck.pop()!;
  const card2 = game.deck.pop()!;

  // Rendre les cartes visibles pour le choix
  card1.hidden = false;
  card2.hidden = false;

  // Stocker les cartes en attente de choix
  game.pendingDoseChoice = {
    userId: player.userId,
    cards: [card1, card2],
  };

  return `🎯 ${player.username} doit choisir une carte parmi 2`;
}

/**
 * À la tienne - La cible doit piocher face ouverte au prochain tirage
 * Stand impossible (sauf si dernier joueur avant banque)
 */
export function applyALaTienne(target: Player): string {
  // Vérifier l'immunité
  if (target.immuneToForceDraw) {
    target.immuneToForceDraw = false; // Consommer l'immunité
    return `🛡️ ${target.username} était protégé et ignore l'effet "À la tienne"`;
  }

  target.forceVisibleDraw = true;
  return `🍻 ${target.username} devra piocher face ouverte à son prochain tirage (stand impossible)`;
}

/**
 * Encore un - Retourne une carte visible face cachée + oblige à tirer face cachée
 */
export function applyEncoreUn(target: Player): string {
  // Vérifier l'immunité
  if (target.immuneToForceDraw) {
    target.immuneToForceDraw = false;
    return `🛡️ ${target.username} était protégé et ignore l'effet "Encore un"`;
  }

  // Trouver une carte visible à retourner
  const visibleCardIndex = target.hand.findIndex((card) => !card.hidden);
  if (visibleCardIndex !== -1) {
    target.hand[visibleCardIndex].hidden = true;
  }

  target.forceHiddenDraw = true;
  return `🔄 Une carte de ${target.username} est retournée face cachée et doit tirer face cachée`;
}

/**
 * Double pioche - 2 cartes visibles tirées automatiquement
 * Si la cible est la banque, l'effet s'applique à son tour
 */
export function applyDoublePioche(game: BlackjackGame, target: Player): string {
  // Vérifier l'immunité
  if (target.immuneToForceDraw) {
    target.immuneToForceDraw = false;
    return `🛡️ ${target.username} était protégé et ignore l'effet "Double pioche"`;
  }

  // Piocher 2 cartes visibles
  const card1 = drawCard(game.deck, target, false);
  const card2 = drawCard(game.deck, target, false);

  if (!card1 || !card2) {
    return `❌ Pas assez de cartes dans le deck pour la double pioche`;
  }

  return `📥📥 ${target.username} a tiré 2 cartes visibles (Double pioche)`;
}

/**
 * Main figée - Bloque la main du joueur jusqu'à dénonciation
 */
export function applyMainFigee(target: Player): string {
  target.frozenHand = true;
  return `❄️ La main de ${target.username} est figée jusqu'à ce que la banque le dénonce`;
}

/**
 * Dernier appel - Force la banque à dénoncer au début de son tour
 */
export function applyDernierAppel(game: BlackjackGame): string {
  game.forceDenounceAtStart = true;
  return `📢 La banque devra dénoncer un joueur au début de son tour`;
}

/**
 * Réinitialise les flags d'effet après utilisation
 */
export function clearPlayerEffectFlags(player: Player): void {
  player.forceVisibleDraw = undefined;
  player.forceHiddenDraw = undefined;
  player.frozenHand = undefined;
  // Note: immuneToForceDraw est consommé individuellement
}

/**
 * Réinitialise les flags d'effet du jeu
 */
export function clearGameEffectFlags(game: BlackjackGame): void {
  game.forceDenounceAtStart = undefined;
  game.pendingDoseChoice = undefined;
}



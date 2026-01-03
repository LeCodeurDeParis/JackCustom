// Map pour stocker les timeouts de déconnexion
// Clé: `${roomId}:${userId}`, Valeur: NodeJS.Timeout
export const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

export function getTimeoutKey(roomId: string, userId: string): string {
  return `${roomId}:${userId}`;
}

/**
 * Fonction utilitaire pour obtenir le code de room (6 derniers caractères de l'UUID)
 */
export function getRoomCode(roomId: string): string {
  const cleanId = roomId.replace(/-/g, "");
  return cleanId.slice(-6).toUpperCase();
}

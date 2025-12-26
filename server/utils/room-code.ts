import { Room } from "@/interfaces/room";
import { rooms } from "@/server/storage/rooms";

/**
 * Extrait le code de room (6 derniers caractères de l'UUID) en majuscules
 * @param roomId - L'UUID complet de la room
 * @returns Le code à 6 caractères en majuscules
 */
export function getRoomCode(roomId: string): string {
  // Retirer les tirets de l'UUID et prendre les 6 derniers caractères
  const cleanId = roomId.replace(/-/g, "");
  return cleanId.slice(-6).toUpperCase();
}

/**
 * Trouve une room par son code (6 derniers caractères de l'UUID)
 * @param code - Le code à 6 caractères (insensible à la casse)
 * @returns La room trouvée ou undefined si aucune room ne correspond
 */
export function findRoomByCode(code: string): Room | undefined {
  const normalizedCode = code.toUpperCase().trim();

  // Validation basique : doit faire 6 caractères
  if (normalizedCode.length !== 6) {
    return undefined;
  }

  const matchingRooms: Room[] = [];

  for (const room of rooms.values()) {
    const roomCode = getRoomCode(room.id);
    if (roomCode === normalizedCode) {
      matchingRooms.push(room);
    }
  }

  if (matchingRooms.length > 1) {
    console.warn(
      `[Room Code] Collision détectée pour le code ${code}: ${matchingRooms.length} rooms trouvées`
    );
  }

  return matchingRooms[0]; // Retourner la première trouvée
}

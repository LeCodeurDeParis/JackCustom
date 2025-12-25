import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/client";

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log("🔄 Début de la création de room...");
      try {
        const room = await orpc.room.createRoom();
        console.log("✅ Room créée avec succès :", room);
        return room;
      } catch (error) {
        console.error("❌ Erreur lors de la création de room :", error);
        throw error;
      }
    },
    onSuccess: (room) => {
      console.log("🎉 onSuccess appelé - Room créée :", room);
      queryClient.setQueryData(["currentRoom"], room);
    },
    onError: (error) => {
      console.error("💥 onError appelé - Erreur :", error);
    },
  });
}

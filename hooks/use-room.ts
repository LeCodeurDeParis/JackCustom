import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/client";

export function useGetRoom(roomId: string) {
  return useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const room = await orpc.room.getRoom({ roomId });
      return room;
    },
    enabled: !!roomId,
    refetchInterval: 2000, // Polling toutes les 2 secondes
  });
}

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
      queryClient.setQueryData(["room", room.id], room);
    },
    onError: (error) => {
      console.error("💥 onError appelé - Erreur :", error);
    },
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const room = await orpc.room.joinRoom({ code });
      return room;
    },
    onSuccess: (room) => {
      queryClient.setQueryData(["room", room.id], room);
      queryClient.setQueryData(["currentRoom"], room);
      // Invalider pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ["room", room.id] });
    },
  });
}

export function useStartRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const room = await orpc.room.startRoom({ roomId });
      return room;
    },
    onSuccess: (room) => {
      queryClient.setQueryData(["room", room.id], room);
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/client";

export function useSetReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, ready }: { roomId: string; ready: boolean }) =>
      orpc.room.setReady({ roomId, ready }),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ["room", room.id] });
    },
  });
}

export function useToggleAutoJoin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      autoJoinNext,
    }: {
      roomId: string;
      autoJoinNext: boolean;
    }) => orpc.room.toggleAutoJoin({ roomId, autoJoinNext }),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ["room", room.id] });
    },
  });
}

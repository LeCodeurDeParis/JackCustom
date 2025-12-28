import { RoomState } from "@/states/room-states";

interface RoomStateBadgeProps {
  state: RoomState;
}

export function RoomStateBadge({ state }: RoomStateBadgeProps) {
  const getStateBadgeColor = (state: RoomState) => {
    switch (state) {
      case RoomState.WAITING:
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case RoomState.PLAYING:
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case RoomState.ENDED:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${getStateBadgeColor(
        state
      )}`}
    >
      {state}
    </span>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import { useGameSocket } from "@/hooks/use-game-socket";
import { BlackjackGame } from "@/interfaces/blackjack";
import { Room } from "@/interfaces/room";
import { authClient } from "@/utils/auth-client";
import { GameBoard } from "./_components/game-board";
import { ShopModal } from "./_components/shop-modal";
import { DoseChoiceModal } from "./_components/dose-choice-modal";
import { GameChat } from "./_components/game-chat";
import { getEnabledShopItems } from "@/data/shop-items";
import { RoomLog } from "@/interfaces/room-settings";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("roomId") || "";

  const [game, setGame] = useState<BlackjackGame | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [purchaseNotification, setPurchaseNotification] = useState<
    string | null
  >(null);
  const [chatLogs, setChatLogs] = useState<RoomLog[]>([]);

  // Récupérer l'utilisateur actuel
  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session?.data?.user?.id) {
        setCurrentUserId(session.data.user.id);
      }
    });
  }, []);

  // Callbacks pour les mises à jour
  const handleGameState = useCallback((gameState: BlackjackGame) => {
    setGame(gameState);
  }, []);

  const handleRoomState = useCallback((roomState: Room) => {
    setRoom(roomState);
    // Mettre à jour les logs depuis l'état de la room
    if (roomState.logs) {
      setChatLogs(roomState.logs);
    }
  }, []);

  const handleChatMessage = useCallback((log: RoomLog) => {
    setChatLogs((prev) => [...prev, log]);
  }, []);

  const handleGameEnded = useCallback(() => {
    router.push(`/room/${roomId}`);
  }, [router, roomId]);

  const handleError = useCallback((err: { message: string }) => {
    setError(err.message);
    setTimeout(() => setError(null), 3000);
  }, []);

  const handleShopPurchase = useCallback(
    (event: {
      buyerName: string;
      itemName: string;
      targetName?: string;
      effectMessage?: string;
    }) => {
      // Si l'item a un message d'effet spécifique (comme Vision altérée), l'afficher
      if (event.effectMessage) {
        setPurchaseNotification(event.effectMessage);
      } else {
        const message = event.targetName
          ? `${event.buyerName} a utilisé "${event.itemName}" sur ${event.targetName}`
          : `${event.buyerName} a utilisé "${event.itemName}"`;
        setPurchaseNotification(message);
      }
      setTimeout(() => setPurchaseNotification(null), 4000);
    },
    []
  );

  const handleShopError = useCallback((err: { message: string }) => {
    setError(err.message);
    setTimeout(() => setError(null), 3000);
  }, []);

  // Hook socket pour le jeu
  const {
    isConnected,
    hit,
    stand,
    revealHiddenCard,
    bankDraw,
    bankDenounce,
    bankEndTurn,
    resolveRound,
    endGame,
    replay,
    buyItem,
    selectDoseCard,
    sendMessage,
    debugGivePoints,
  } = useGameSocket({
    roomId,
    onGameState: handleGameState,
    onRoomState: handleRoomState,
    onGameEnded: handleGameEnded,
    onError: handleError,
    onShopPurchase: handleShopPurchase,
    onShopError: handleShopError,
    onChatMessage: handleChatMessage,
  });

  // Retour à la room
  const handleBackToRoom = useCallback(() => {
    endGame();
    router.push(`/room/${roomId}`);
  }, [router, roomId, endGame]);

  // Items de boutique activés
  const enabledItems = getEnabledShopItems(
    room?.settings?.enabledShopItems ?? []
  );

  // Joueur actuel dans le jeu
  const currentPlayer = game?.players.find((p) => p.userId === currentUserId);
  const isBank = currentUserId === game?.bank.userId;
  const myPlayerOrBank = isBank ? game?.bank : currentPlayer;

  // Vérifier s'il y a un choix de carte en attente
  const hasPendingDoseChoice =
    game?.pendingDoseChoice?.userId === currentUserId;

  // Loading state
  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Aucune room spécifiée</p>
          <button
            onClick={() => router.push("/lobby")}
            className="mt-4 text-primary underline"
          >
            Retour au lobby
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">🎴</div>
          <p className="text-muted-foreground">
            {!isConnected
              ? "Connexion en cours..."
              : "Chargement de la partie..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {/* Purchase notification */}
      {purchaseNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
          🛒 {purchaseNotification}
        </div>
      )}

      {/* Layout principal: Game + Chat côte à côte */}
      <div className="flex h-screen">
        {/* Zone de jeu principale */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <GameBoard
              game={game}
              currentUserId={currentUserId}
              onHit={hit}
              onStand={stand}
              onRevealHidden={revealHiddenCard}
              onBankDraw={bankDraw}
              onBankDenounce={bankDenounce}
              onBankEndTurn={bankEndTurn}
              onResolve={resolveRound}
              onEndGame={endGame}
              onReplay={replay}
              onBackToRoom={handleBackToRoom}
              onOpenShop={() => setShopOpen(true)}
              hasShopItems={enabledItems.length > 0}
              onDebugGivePoints={debugGivePoints}
            />
          </div>
        </div>

        {/* Panneau de chat à droite */}
        <GameChat
          logs={chatLogs}
          currentUserId={currentUserId}
          onSendMessage={sendMessage}
        />
      </div>

      {/* Shop Modal */}
      <ShopModal
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        items={enabledItems}
        currentPlayer={myPlayerOrBank ?? null}
        players={game.players}
        bankUserId={game.bank.userId}
        onBuy={buyItem}
      />

      {/* Dose Choice Modal */}
      <DoseChoiceModal
        isOpen={hasPendingDoseChoice}
        cards={game.pendingDoseChoice?.cards ?? []}
        onSelect={selectDoseCard}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin text-4xl">🎴</div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}

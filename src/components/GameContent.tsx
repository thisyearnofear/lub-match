"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import PhotoPairGame from "@/components/PhotoPairGame";
import ValentinesProposal from "@/components/ValentinesProposal";
import HeartNFTMinter from "@/components/HeartNFTMinter";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";

import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import { ShareHelpers } from "@/utils/shareHelpers";
import ActionButton from "@/components/shared/ActionButton";
import { useOnboarding } from "@/hooks/useOnboarding";

interface GameContentProps {
  pairUrls: string[];
  revealUrls: string[];
  message: string;
  justCreated: boolean;
  users?: any[]; // Optional: Farcaster user data for enhanced social features
  onGameComplete?: (stats: { completionTime: number; accuracy: number; totalAttempts: number; totalMatches: number }) => void;
}

interface FarcasterWindow extends Window {
  fc?: {
    requestNotificationPermission?: () => void;
    share?: (options: { text: string; url: string }) => void;
  };
}

export default function GameContent({
  pairUrls,
  revealUrls,
  message,
  justCreated,
  users,
  onGameComplete,
}: GameContentProps) {
  // --- NFT Minter Modal State ---
  const [showHeartMinter, setShowHeartMinter] = useState(false);
  // State to store game stats
  const [gameStats, setGameStats] = useState<{
    completionTime: number;
    accuracy: number;
    totalAttempts: number;
    totalMatches: number;
  } | null>(null);
  
  const handleGameComplete = (stats: { 
    completionTime: number; 
    accuracy: number; 
    totalAttempts: number; 
    totalMatches: number 
  }) => {
    setGameStats(stats);
    onGameComplete?.(stats);
  };
  const { goToSocialGames } = useAppNavigation();
  useMiniAppReady();
  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // User progression integration
  const { recordGameCompletion, recordGameShare } = useUnifiedStats();

  // Onboarding system
  const { showGameCompletionFlow } = useOnboarding();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (justCreated && isClient) {
      // Toast: link copied
      window.alert("Lub sent – link copied to clipboard!");
    }
  }, [justCreated, isClient]);

  // Called when the demo game is finished
  const handleDemoGameFinished = () => {
    setDemoGameFinished(true);

    // Show game completion flow
    showGameCompletionFlow();

    setShowHeartMinter(true);
  };

  const handleShowProposal = () => {
    // Check if running in Farcaster and send celebration event
    if (isClient && (window as FarcasterWindow)?.fc) {
      try {
        (window as FarcasterWindow).fc?.requestNotificationPermission?.();
        // Could add confetti or celebration effects here
      } catch (_error) {
        console.log("Farcaster notification not available");
      }
    }

    // A short delay for the final transition
    setTimeout(() => {
      setShowValentinesProposal(true);
    }, 500);
  };

  const share = async () => {
    const url = window.location.href;
    const shareText = `💝 Will you Lub me? Match all the hearts? ${url}`;

    // Record sharing event in user progression
    recordGameShare();

    // Copy to clipboard (with error handling)
    try {
      await navigator.clipboard.writeText(url);
    } catch (_error) {
      console.log("Could not copy to clipboard:", _error);
    }

    // Check if running in Farcaster
    if (isClient && (window as FarcasterWindow)?.fc) {
      // Use Farcaster SDK for native sharing if available
      try {
        (window as FarcasterWindow).fc?.share?.({
          text: shareText,
          url: url,
        });
      } catch (_error) {
        console.log("Farcaster share not available, falling back to Warpcast");
        window.open(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
        );
      }
    } else if (isClient) {
      // Open Warpcast compose
      window.open(
        `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Heart NFT Minter Modal (only after demo game) */}
      {showHeartMinter && (
        <HeartNFTMinter
          gameImages={pairUrls}
          gameLayout={[0, 1, 2, 3, 4, 5, 6, 7]} // Simple layout for now
          message={message}
          gameType="demo"
          creator={message.includes("lub") ? "0x0000000000000000000000000000000000000000" : "0x1234567890123456789012345678901234567890"}
          onClose={() => setShowHeartMinter(false)}
          onViewCollection={goToSocialGames}
          users={users}
          gameStats={gameStats ? {
            completionTime: gameStats.completionTime,
            accuracy: gameStats.accuracy,
            socialDiscoveries: Math.min(users?.length ? Math.floor(users.length / 2) : 0, 8),
          } : {
            completionTime: 90, // Default completion time for custom games
            accuracy: 85, // More realistic accuracy
            socialDiscoveries: Math.min(users?.length ? Math.floor(users.length / 2) : 0, 8),
          }}
        />
      )}

      {/* Main game/proposal content, hidden when NFT minter is open */}
      {!showHeartMinter && !showValentinesProposal ? (
        <>
          <PhotoPairGame
            images={pairUrls}
            users={users}
            handleShowProposalAction={handleDemoGameFinished}
            onGameComplete={handleGameComplete}
          />
          <div
            className="w-full flex justify-center mt-4"
            style={{ maxWidth: "min(85vh, 90vw)" }}
          >
            <ActionButton
              onClick={share}
              variant="gradient-purple"
              size="sm"
              icon={isClient && (window as FarcasterWindow)?.fc ? "💝" : "🚀"}
            >
              {isClient && (window as FarcasterWindow)?.fc
                ? "Share Game"
                : "Cast This"}
            </ActionButton>
          </div>
        </>
      ) : null}

      {!showHeartMinter && showValentinesProposal && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
          className="relative"
        >
          <ValentinesProposal
            revealImages={revealUrls}
            message={message}
            onShare={share}
          />
        </motion.div>
      )}
    </div>
  );
}

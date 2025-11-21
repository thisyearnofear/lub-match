"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import PhotoPairGame from "@/components/PhotoPairGame";
import ValentinesProposal from "@/components/ValentinesProposal";
import SimpleHeartNFTMinter from "@/components/SimpleHeartNFTMinter";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";

import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import ActionButton from "@/components/shared/ActionButton";
import SimpleOnboarding, { WELCOME_TIPS, GAME_COMPLETE_TIPS } from "@/components/onboarding/SimpleOnboarding";
// Removed enhanced rewards integration (AGGRESSIVE CONSOLIDATION)

interface GameContentProps {
  pairUrls: string[];
  revealUrls: string[];
  message: string;
  justCreated: boolean;
  users?: any[]; // Optional: Farcaster user data for enhanced social features
  onGameComplete?: (stats: {
    completionTime: number;
    accuracy: number;
    totalAttempts: number;
    totalMatches: number;
  }) => void;
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
  const [demoGameFinished, setDemoGameFinished] = useState(false);
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
    totalMatches: number;
  }) => {
    setGameStats(stats);
    onGameComplete?.(stats);

    // Enhanced rewards recording removed (AGGRESSIVE CONSOLIDATION)
    console.log("Game completed:", {
      completionTime: stats.completionTime,
      accuracy: stats.accuracy,
      isFirstToday: formattedStats.gamesCompleted === 0,
    });

    // Record leaderboard submission if user is eligible (engaged tier or higher)
    // This prevents abuse by new users
    if (formattedStats.tier !== "newcomer") {
      recordEvent({
        type: "photo_pair_leaderboard_submission",
        time: stats.completionTime,
        accuracy: stats.accuracy,
        attempts: stats.totalAttempts,
        matches: stats.totalMatches,
      });
    }
  };
  const { goToSocialGames } = useAppNavigation();
  const { isInFarcaster, composeCast } = useMiniAppReady();
  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // User progression integration
  const { recordGameShare, recordEvent, formattedStats } = useUnifiedStats();
  // Removed useSubtleRewards destructuring (AGGRESSIVE CONSOLIDATION)

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

    // Game completion flow now handled by SubtleOnboarding component

    // Show NFT minter first (skippable)
    setShowHeartMinter(true);
  };

  // Called when NFT minter is closed/skipped
  const handleNFTMinterClose = () => {
    setShowHeartMinter(false);
    // After NFT minter, show the proposal
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

    if (isClient && isInFarcaster && composeCast) {
      try {
        await composeCast(shareText, [url]);
        return;
      } catch (_error) {}
    }
    window.open(
      `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Heart NFT Minter Modal (only after demo game) */}
      {showHeartMinter && (
        <SimpleHeartNFTMinter
          gameImages={pairUrls}
          gameLayout={[0, 1, 2, 3, 4, 5, 6, 7]}
          message={message}
          gameType="demo"
          creator="0x0000000000000000000000000000000000000000"
          onClose={handleNFTMinterClose}
          onMinted={(tokenId) => console.log("NFT minted:", tokenId)}
          users={users}
          gameStats={gameStats ? {
            completionTime: gameStats.completionTime,
            accuracy: gameStats.accuracy,
            socialDiscoveries: Math.min(users?.length ? Math.floor(users.length / 2) : 0, 8),
          } : undefined}
        />
      )}

      {/* Main game content, hidden when NFT minter or proposal is open */}
      {!showHeartMinter && !showValentinesProposal && (
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
      )}

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

      {/* Welcome Tips */}
      {!demoGameFinished && (
        <SimpleOnboarding 
          tips={WELCOME_TIPS} 
          onComplete={() => {}} 
        />
      )}

      {/* Game Complete Tips */}
      {demoGameFinished && (
        <SimpleOnboarding 
          tips={GAME_COMPLETE_TIPS} 
          onComplete={() => setShowValentinesProposal(true)} 
        />
      )}
    </div>
  );
}

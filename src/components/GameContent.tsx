"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import PhotoPairGame from "@/components/PhotoPairGame";
import ValentinesProposal from "@/components/ValentinesProposal";
import HeartNFTMinter from "@/components/HeartNFTMinter";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";

import { useUserProgression } from "@/utils/userProgression";
import { ShareHelpers } from "@/utils/shareHelpers";
import ActionButton from "@/components/shared/ActionButton";
import { useOnboarding } from "@/hooks/useOnboarding";

interface GameContentProps {
  pairUrls: string[];
  revealUrls: string[];
  message: string;
  justCreated: boolean;
  users?: any[]; // Optional: Farcaster user data for enhanced social features
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
}: GameContentProps) {
  // --- NFT Minter Modal State ---
  const [showHeartMinter, setShowHeartMinter] = useState(false);
  const [demoGameFinished, setDemoGameFinished] = useState(false);
  const { goToSocialGames } = useAppNavigation();
  useMiniAppReady();
  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // User progression integration
  const { recordEvent } = useUserProgression();

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
    recordEvent({
      type: "game_shared",
      timestamp: new Date().toISOString(),
      data: {
        url,
        shareText,
        platform:
          isClient && (window as FarcasterWindow)?.fc
            ? "farcaster"
            : "warpcast",
      },
    });

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
          gameLayout={[]}
          message={message}
          gameType="demo"
          creator={"0x0000000000000000000000000000000000000000"}
          onClose={() => {
            setShowHeartMinter(false);
            goToSocialGames();
          }}
          users={users}
          gameStats={{
            completionTime: 90, // Default completion time for custom games
            accuracy: 100, // Perfect accuracy assumption
            socialDiscoveries: users?.length || 0, // Number of users discovered
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

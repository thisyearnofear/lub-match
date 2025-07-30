"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import PhotoPairGame from "@/components/PhotoPairGame";
import ValentinesProposal from "@/components/ValentinesProposal";
import HeartNFTMinter from "@/components/HeartNFTMinter";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";
import DismissibleBanner from "./onboarding/DismissibleBanner";
import { useUserProgression } from "@/utils/userProgression";
import { ShareHelpers } from "@/utils/shareHelpers";
import ActionButton from "@/components/shared/ActionButton";

interface GameContentProps {
  pairUrls: string[];
  revealUrls: string[];
  message: string;
  justCreated: boolean;
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
      {/* Farcaster/game info banner (minimal, contextual, only first visit) */}
      <DismissibleBanner
        message={
          <>
            You’re playing with trending Farcaster users’ photos.{' '}
            <a
              href="https://www.farcaster.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-purple-700"
            >
              What’s Farcaster?
            </a>
          </>
        }
        localStorageKey="onboarding_farcaster_info_seen"
        className="max-w-2xl mx-auto mt-4"
      />

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
        />
      )}

      {/* Main game/proposal content, hidden when NFT minter is open */}
      {!showHeartMinter && !showValentinesProposal ? (
        <>
          <PhotoPairGame
            images={pairUrls}
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
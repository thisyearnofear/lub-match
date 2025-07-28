"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import PhotoPairGame from "@/components/PhotoPairGame";
import ValentinesProposal from "@/components/ValentinesProposal";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";

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
  useMiniAppReady();
  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (justCreated && isClient) {
      // Toast: link copied
      window.alert("Lub sent – link copied to clipboard!");
    }
  }, [justCreated, isClient]);

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
      {!showValentinesProposal ? (
        <>
          <PhotoPairGame
            images={pairUrls}
            handleShowProposalAction={handleShowProposal}
          />
          <div
            className="w-full flex justify-center mt-4"
            style={{ maxWidth: "min(85vh, 90vw)" }}
          >
            <button
              onClick={share}
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {isClient && (window as FarcasterWindow)?.fc
                ? "💝 Share Game"
                : "🚀 Cast This"}
            </button>
          </div>
        </>
      ) : (
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

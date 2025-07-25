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

export default function GameContent({
  pairUrls,
  revealUrls,
  message,
  justCreated,
}: GameContentProps) {
  useMiniAppReady();
  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (justCreated && typeof window !== "undefined") {
      // Toast: link copied
      window.alert("Game created – link copied to clipboard!");
    }
  }, [justCreated]);

  const handleShowProposal = () => {
    setIsTransitioning(true);

    // Check if running in Farcaster and send celebration event
    if (typeof window !== "undefined" && (window as any)?.fc) {
      try {
        (window as any).fc.requestNotificationPermission?.();
        // Could add confetti or celebration effects here
      } catch (error) {
        console.log("Farcaster notification not available");
      }
    }

    setTimeout(() => {
      setShowValentinesProposal(true);
    }, 2000);
  };

  const share = () => {
    const url = window.location.href;
    const shareText = `💝 Play this romantic memory game with me! Can you match all the hearts? ${url}`;

    // Copy to clipboard
    navigator.clipboard.writeText(url);

    // Check if running in Farcaster
    if (typeof window !== "undefined" && (window as any)?.fc) {
      // Use Farcaster SDK for native sharing if available
      try {
        (window as any).fc.share?.({
          text: shareText,
          url: url,
        });
      } catch (error) {
        console.log("Farcaster share not available, falling back to Warpcast");
        window.open(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`,
        );
      }
    } else {
      // Open Warpcast compose
      window.open(
        `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`,
      );
    }
  };

  return (
    <>
      <div className="w-full flex justify-end mb-2">
        <button
          onClick={share}
          className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {typeof window !== "undefined" && (window as any)?.fc
            ? "💝 Share Game"
            : "🚀 Cast This"}
        </button>
      </div>
      {!showValentinesProposal ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isTransitioning ? 0 : 1 }}
          transition={{ duration: 2 }}
        >
          <PhotoPairGame
            images={pairUrls}
            handleShowProposal={handleShowProposal}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="relative"
        >
          <ValentinesProposal revealImages={revealUrls} message={message} />

          {/* Farcaster-optimized completion overlay */}
          {typeof window !== "undefined" && (window as any)?.fc && (
            <div className="absolute top-4 right-4">
              <button
                onClick={share}
                className="px-3 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors"
              >
                💝 Share Result
              </button>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}

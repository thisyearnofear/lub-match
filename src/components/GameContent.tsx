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
    setTimeout(() => {
      setShowValentinesProposal(true);
    }, 2000);
  };

  const share = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    window.open(
      `https://warpcast.com/~/compose?text=${encodeURIComponent(url)}`,
    );
  };

  return (
    <>
      <div className="w-full flex justify-end mb-2">
        <button
          onClick={share}
          className="px-3 py-1 text-xs rounded bg-pink-500 hover:bg-pink-600 text-white shadow transition"
          style={{
            display:
              typeof window !== "undefined" && (window as any)?.fc
                ? "none"
                : undefined,
          }}
        >
          Cast This
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
        >
          <ValentinesProposal revealImages={revealUrls} message={message} />
        </motion.div>
      )}
    </>
  );
}

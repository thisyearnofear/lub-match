"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import TextFooter from "@/components/TextFooter";
import PhotoPairGame from "../components/PhotoPairGame";
import ValentinesProposal from "@/components/ValentinesProposal";
import SocialGamesHub from "@/components/SocialGamesHub";
import HeartNFTMinter from "@/components/HeartNFTMinter";

import { useFarcasterUsers } from "@/hooks/useFarcasterUsers";
import { useSocialGames } from "@/hooks/useSocialGames";
import { defaultRevealImages, defaultMessage } from "@/data/defaultGame";

const ANIM_DURATION = 2;

import { useMiniAppReady } from "@/hooks/useMiniAppReady";

export default function Home() {
  const {
    context: farcasterContext,
    isReady: miniAppReady,
    isInFarcaster,
    addFrame,
    openUrl,
    closeApp,
  } = useMiniAppReady();

  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [showHeartNFTMinter, setShowHeartNFTMinter] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Dynamic Farcaster users for social experience - only on client
  const { users, loading, getRandomPairs, error } = useFarcasterUsers({
    count: 16,
    minFollowers: 50,
    enableAutoRefresh: false, // Disable auto-refresh to prevent hydration issues
  });

  // Social games functionality
  const {
    isGameActive,
    startSocialGames,
    closeSocialGames,
    canPlayGames,
    refreshPlayerData,
  } = useSocialGames();

  // Game images - only use Farcaster profile images, no fallbacks
  const [gameImages, setGameImages] = useState<string[]>([]);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update game images only on client side
  useEffect(() => {
    if (isClient && !loading && users.length >= 8) {
      const farcasterPairs = getRandomPairs();
      if (farcasterPairs.length === 8) {
        setGameImages(farcasterPairs);
      }
    }
  }, [isClient, users, loading, getRandomPairs]);

  // Refresh player data when component mounts
  useEffect(() => {
    if (isClient) {
      refreshPlayerData();
    }
  }, [isClient, refreshPlayerData]);

  const handleShowProposal = () => {
    // For the home page demo, show NFT minting option first
    if (isClient && gameImages.length === 8) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowHeartNFTMinter(true);
        setIsTransitioning(false);
      }, ANIM_DURATION * 1000);
    } else {
      // Fallback to proposal if game images aren't available
      setIsTransitioning(true);
      setTimeout(() => {
        setShowValentinesProposal(true);
        setIsTransitioning(false);
      }, ANIM_DURATION * 1000);
    }
  };

  const handleNFTMinterClose = () => {
    setShowHeartNFTMinter(false);
    // After closing NFT minter, proceed to social games if available
    if (isClient && canPlayGames(users)) {
      setIsTransitioning(true);
      setTimeout(() => {
        startSocialGames();
        setIsTransitioning(false);
      }, ANIM_DURATION * 1000);
    } else {
      // Fallback to proposal if social games aren't available
      setIsTransitioning(true);
      setTimeout(() => {
        setShowValentinesProposal(true);
        setIsTransitioning(false);
      }, ANIM_DURATION * 1000);
    }
  };

  const handleNFTMinted = (tokenId: string) => {
    console.log("NFT minted with token ID:", tokenId);
    // Continue to social games after successful minting
    handleNFTMinterClose();
  };

  const handleSocialGamesClose = () => {
    closeSocialGames();
    // Reset all states to allow playing again
    setIsTransitioning(false);
    setShowHeartNFTMinter(false);
    setShowValentinesProposal(false);
  };

  return (
    <div className="flex flex-col h-screen bg-black relative overflow-hidden">
      {/* Mobile-friendly header with safe area */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-4 bg-black bg-opacity-80 backdrop-blur-sm"
        style={{
          paddingTop: `max(1rem, var(--safe-area-inset-top))`,
          paddingLeft: `max(1rem, var(--safe-area-inset-left))`,
          paddingRight: `max(1rem, var(--safe-area-inset-right))`,
        }}
      >
        <div className="text-white text-lg font-bold">
          💝 Lub Match
          {isInFarcaster && farcasterContext?.user && (
            <div className="text-xs text-purple-300 font-normal">
              Hey{" "}
              {farcasterContext.user.displayName ||
                farcasterContext.user.username}
              ! 👋
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isClient && canPlayGames(users) && (
            <button
              onClick={startSocialGames}
              className="px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-semibold shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform active:scale-95 touch-manipulation"
            >
              🎮 Hab Fun
            </button>
          )}
          <Link
            href="/create"
            className="px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-semibold shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 transform active:scale-95 touch-manipulation"
          >
            Make Lub
          </Link>
        </div>
      </div>

      {/* Main game area */}
      <div
        className="flex-grow flex items-center justify-center px-4 pb-4"
        style={{
          paddingTop: `max(5rem, calc(var(--safe-area-inset-top) + 4rem))`,
          paddingBottom: `max(1rem, var(--safe-area-inset-bottom))`,
        }}
      >
        {!showValentinesProposal && !showHeartNFTMinter ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isTransitioning ? 0 : 1 }}
            transition={{ duration: ANIM_DURATION }}
            className="w-full max-w-lg"
          >
            {gameImages.length === 8 ? (
              <>
                <PhotoPairGame
                  images={gameImages}
                  handleShowProposalAction={handleShowProposal}
                />
                <TextFooter />
              </>
            ) : (
              <div className="text-center p-8">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Farcaster Features Unavailable
                </h2>
                <p className="text-purple-200 mb-4">
                  {error || "Unable to load Farcaster users for the demo game."}
                </p>
                <p className="text-sm text-gray-400">
                  Please check your Neynar API configuration or try again later.
                </p>
                <div className="mt-6">
                  <Link
                    href="/create"
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-105"
                  >
                    Create Custom Game Instead
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: ANIM_DURATION }}
            className="w-full max-w-lg"
          >
            <ValentinesProposal
              revealImages={defaultRevealImages}
              message={defaultMessage}
            />
          </motion.div>
        )}
      </div>

      {/* Mobile-friendly bottom info with safe area */}
      <div
        className="fixed bottom-0 left-0 right-0 text-center px-4 py-2 bg-black bg-opacity-60"
        style={{
          paddingBottom: `max(0.5rem, var(--safe-area-inset-bottom))`,
          paddingLeft: `max(1rem, var(--safe-area-inset-left))`,
          paddingRight: `max(1rem, var(--safe-area-inset-right))`,
        }}
      >
        {isClient && error && (
          <p className="text-orange-300 text-xs">
            ⚠️ Demo mode - add Neynar API key for social features
          </p>
        )}
      </div>

      {/* Social Games Modal */}
      {isGameActive && (
        <SocialGamesHub users={users} onClose={handleSocialGamesClose} />
      )}

      {/* Heart NFT Minter Modal */}
      {showHeartNFTMinter && gameImages.length === 8 && (
        <HeartNFTMinter
          gameImages={gameImages}
          gameLayout={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}
          message="Demo Lub Completed! 💝"
          gameType="demo"
          creator="0x0000000000000000000000000000000000000000"
          onClose={handleNFTMinterClose}
          onMinted={handleNFTMinted}
        />
      )}
    </div>
  );
}

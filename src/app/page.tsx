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
  const {
    users,
    loading,
    getRandomPairs,
    hasApiKey,
    apiCheckComplete,
    refreshUsers,
  } = useFarcasterUsers({
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

  // Update game images only on client side after API check is complete
  useEffect(() => {
    if (isClient && apiCheckComplete && !loading && users.length >= 8) {
      const farcasterPairs = getRandomPairs();
      if (farcasterPairs.length === 8) {
        setGameImages(farcasterPairs);
      }
    }
  }, [isClient, apiCheckComplete, users, loading, getRandomPairs]);

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
            {!apiCheckComplete || (apiCheckComplete && hasApiKey === true && loading) ? (
              // Beautiful loading state while checking API or loading users
              <div className="text-center p-8">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-6xl mb-6"
                >
                  💝
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Preparing Your Lub Experience
                </h2>
                <p className="text-purple-200 mb-6">
                  {!apiCheckComplete 
                    ? "Checking social features and setting up your personalized game..."
                    : "Loading Farcaster users for your social experience..."
                  }
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-xs mx-auto mb-4">
                  <div className="bg-purple-800 bg-opacity-50 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-400"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                    />
                  </div>
                </div>
                <div className="flex justify-center items-center space-x-1 mb-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="w-2 h-2 bg-pink-400 rounded-full"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {!apiCheckComplete 
                    ? "Setting up your social experience..."
                    : "Almost ready..."
                  }
                </p>
              </div>
            ) : gameImages.length === 8 ? (
              <>
                <PhotoPairGame
                  images={gameImages}
                  handleShowProposalAction={handleShowProposal}
                />
                <TextFooter />
              </>
            ) : (
              // Only show error state if API check is complete and we have a definitive failure
              <div className="text-center p-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl mb-4"
                >
                  🎮
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {hasApiKey === false ? "Demo Mode Active" : "Loading Social Features"}
                </h2>
                <p className="text-purple-200 mb-4">
                  {hasApiKey === false 
                    ? "Social features are currently unavailable, but you can still create and play custom games!"
                    : "Setting up your personalized social experience..."
                  }
                </p>
                {hasApiKey === false && (
                  <p className="text-sm text-gray-400 mb-6">
                    Add a Neynar API key to enable Farcaster integration and social games.
                  </p>
                )}
                <div className="mt-6 space-y-3">
                  {hasApiKey === false ? (
                    <>
                      <button
                        onClick={refreshUsers}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Checking..." : "🔄 Check Again"}
                      </button>
                      <div>
                        <Link
                          href="/create"
                          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-105"
                        >
                          ✨ Create Custom Game
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-center items-center space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-2 h-2 bg-pink-400 rounded-full"
                        />
                      ))}
                    </div>
                  )}
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
        {isClient && apiCheckComplete && hasApiKey === false && (
          <p className="text-purple-300 text-xs">
            💡 Add Neynar API key to unlock social features
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import TextFooter from "@/components/TextFooter";
import PhotoPairGame from "../components/PhotoPairGame";
import dynamic from "next/dynamic";

// Only lazy load the heaviest components that appear in modals
const ValentinesProposal = dynamic(
  () => import("@/components/ValentinesProposal"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">💖</div>
          <p className="text-white">Loading proposal...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

const SocialGamesHub = dynamic(() => import("@/components/SocialGamesHub"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-4xl mb-4">🎮</div>
        <p className="text-white">Loading social games...</p>
      </div>
    </div>
  ),
  ssr: false,
});

const HeartNFTMinter = dynamic(() => import("@/components/HeartNFTMinter"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-4xl mb-4">🎨</div>
        <p className="text-white">Loading NFT minter...</p>
      </div>
    </div>
  ),
  ssr: false,
});

const FloatingActionButton = dynamic(
  () => import("@/components/shared/FloatingActionButton"),
  {
    ssr: false,
  }
);

const WalletDrawer = dynamic(() => import("@/components/shared/WalletDrawer"), {
  ssr: false,
});

import ClientOnly from "@/components/ClientOnly";
import UnifiedOnboardingIntegration from "@/components/onboarding/UnifiedOnboardingIntegration";
import {
  AnimatedTile,
  AnimatedTileContainer,
  FloatingHearts,
} from "@/components/shared/AnimatedTile";
import OnboardingDebug from "@/components/debug/OnboardingDebug";

import { useFarcasterUsers } from "@/hooks/useFarcasterUsers";
import { useAccount } from "wagmi";
import { defaultRevealImages, defaultMessage } from "@/data/defaultGame";
import { useUserProgression } from "@/utils/userProgression";

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
  const [showWalletDrawer, setShowWalletDrawer] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Game stats state to capture actual performance data
  const [gameStats, setGameStats] = useState<{
    completionTime: number;
    accuracy: number;
    socialDiscoveries: number;
  } | null>(null);

  // Dynamic Farcaster users for social experience - only on client
  const {
    users,
    loading,
    getRandomPairs,
    hasApiKey,
    apiCheckComplete,
    refreshUsers,
  } = useFarcasterUsers({
    count: 20,
    minFollowers: 50,
    enableAutoRefresh: false, // Disable auto-refresh to prevent hydration issues
  });

  // Social games functionality - simplified state management
  const [isGameActive, setIsGameActive] = useState(false);

  const startSocialGames = () => setIsGameActive(true);
  const closeSocialGames = () => setIsGameActive(false);
  const canPlayGames = (users: any[]) => users.length >= 4;
  const refreshPlayerData = () => {}; // No longer needed with unified stats

  const { isConnected } = useAccount();

  // Generate personalized completion message
  const getPersonalizedMessage = () => {
    if (!users || users.length === 0) {
      return "Demo Lub Completed! 💝";
    }

    const uniqueUserCount = Math.min(users.length, 8);
    const userNames = users
      .slice(0, 3)
      .map((user) => user.displayName || user.username)
      .join(", ");
    const remainingCount = Math.max(0, uniqueUserCount - 3);

    if (uniqueUserCount <= 3) {
      return `💌 Lub completed with ${userNames}! 💝`;
    } else {
      return `💌 Lub completed with ${userNames} and ${remainingCount} others! 💝`;
    }
  };

  // Game images - only use Farcaster profile images, no fallbacks
  const [gameImages, setGameImages] = useState<string[]>([]);

  // Track the actual users whose images are used in the game
  const [gameUsers, setGameUsers] = useState<any[]>([]);

  // Get current Farcaster user from context
  const farcasterUser = farcasterContext?.user;

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update game images only on client side after API check is complete
  useEffect(() => {
    if (isClient && apiCheckComplete && !loading && users.length >= 10) {
      const farcasterPairs = getRandomPairs();
      if (farcasterPairs.length === 10) {
        setGameImages(farcasterPairs);

        // Set the corresponding users (first 10 users whose images are used)
        setGameUsers(users.slice(0, 10));

        // Legacy onboarding - will be replaced by enhanced system
        // showOnboardingMessage("FARCASTER_INTRO", { delay: 1000 });
      }
    }
    // Only depend on stable values, not functions that change on every render
  }, [isClient, apiCheckComplete, loading, users.length]);

  // No longer need to refresh player data - using unified stats

  const handleShowProposal = () => {
    // For the home page demo, show NFT minting option first
    if (isClient && gameImages.length === 10) {
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
    // ENHANCED: After closing NFT minter, proceed to social games with challenge integration
    if (isClient && canPlayGames(users)) {
      setIsTransitioning(true);
      setTimeout(() => {
        // Start social games which now includes challenge selection
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

  const { recordEvent } = useUserProgression();

  // Handle game completion and capture real stats
  const handleGameComplete = (stats: {
    completionTime: number;
    accuracy: number;
    totalAttempts: number;
    totalMatches: number;
  }) => {
    // Calculate social discoveries based on unique users actually used in the game
    const socialDiscoveries = Math.min(gameUsers.length, 10);

    setGameStats({
      completionTime: stats.completionTime,
      accuracy: stats.accuracy,
      socialDiscoveries,
    });

    // Record the game completion event with performance data
    recordEvent({
      type: "game_complete",
      timestamp: new Date().toISOString(),
      data: {
        completionTime: stats.completionTime,
        accuracy: stats.accuracy,
        totalAttempts: stats.totalAttempts,
        totalMatches: stats.totalMatches,
        socialDiscoveries,
      },
    });

    console.log("Game completed with stats:", {
      ...stats,
      socialDiscoveries,
      actualUsersInGame: gameUsers.length,
    });
  };

  const handleSocialGamesClose = () => {
    closeSocialGames();
    // Reset all states to allow playing again
    setIsTransitioning(false);
    setShowHeartNFTMinter(false);
    setShowValentinesProposal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black relative">
      {/* Enhanced floating hearts background */}
      <FloatingHearts count={6} className="opacity-20" />
      {/* Subtle dark header that blends with the aesthetic */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 via-black/60 to-transparent backdrop-blur-sm">
        <div
          className="flex items-center justify-between p-4"
          style={{
            paddingTop: "max(1rem, var(--safe-area-inset-top))",
            paddingLeft: "max(1rem, var(--safe-area-inset-left))",
            paddingRight: "max(1rem, var(--safe-area-inset-right))",
          }}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
              💝 Lub Match
            </h1>
            {farcasterUser && (
              <div className="text-sm text-gray-300">
                Welcome, {farcasterUser.displayName || farcasterUser.username}!
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canPlayGames(users) && (
              <button
                onClick={startSocialGames}
                className="px-3 py-1.5 bg-blue-500/80 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all backdrop-blur-sm border border-blue-400/20"
              >
                Hab Fun
              </button>
            )}

            {gameImages && gameImages.length >= 10 && (
              <Link
                href="/create"
                className="px-3 py-1.5 bg-gradient-to-r from-pink-500/80 to-purple-600/80 text-white rounded-lg text-sm font-medium hover:from-pink-500 hover:to-purple-600 transition-all backdrop-blur-sm border border-pink-400/20"
              >
                Make Lub
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main game area */}
      <div
        className="flex-grow flex items-center justify-center px-4 pb-4 overflow-y-auto"
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
            {!apiCheckComplete ||
            (apiCheckComplete && hasApiKey === true && loading) ? (
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
                    : "Loading Farcaster users for your social experience..."}
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
                    : "Almost ready..."}
                </p>
              </div>
            ) : gameImages.length === 10 ? (
              <ClientOnly
                fallback={
                  <div className="text-center p-8">
                    <div className="text-4xl mb-4">💝</div>
                    <p className="text-purple-200">Preparing game...</p>
                  </div>
                }
              >
                <PhotoPairGame
                  images={gameImages}
                  users={gameUsers}
                  handleShowProposalAction={handleShowProposal}
                  onGameComplete={(stats) => {
                    // Pass the stats to our handler
                    handleGameComplete(stats);
                  }}
                />
                <TextFooter />
              </ClientOnly>
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
                  {hasApiKey === false
                    ? "Demo Mode Active"
                    : "Loading Social Features"}
                </h2>
                <p className="text-purple-200 mb-4">
                  {hasApiKey === false
                    ? "Social features are currently unavailable, but you can still create and play custom games!"
                    : "Setting up your personalized social experience..."}
                </p>
                {hasApiKey === false && (
                  <p className="text-sm text-gray-400 mb-6">
                    Add a Neynar API key to enable Farcaster integration and
                    social games.
                  </p>
                )}
                <AnimatedTileContainer className="mt-6 space-y-3">
                  {hasApiKey === false ? (
                    <>
                      <AnimatedTile
                        index={0}
                        onClick={refreshUsers}
                        disabled={loading}
                        ariaLabel={
                          loading
                            ? "Checking API connection..."
                            : "Check API connection again"
                        }
                      >
                        <button
                          disabled={loading}
                          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Checking..." : "🔄 Check Again"}
                        </button>
                      </AnimatedTile>

                      <AnimatedTile
                        index={1}
                        isPrimary={true}
                        ariaLabel="Create a custom memory game"
                      >
                        <Link
                          href="/create"
                          className="block w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold shadow-lg text-center"
                        >
                          ✨ Create Custom Game
                        </Link>
                      </AnimatedTile>
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
                </AnimatedTileContainer>
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
        <SocialGamesHub
          users={users}
          onClose={handleSocialGamesClose}
          onSkipToProposal={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setShowValentinesProposal(true);
              setIsTransitioning(false);
            }, ANIM_DURATION * 1000);
          }}
        />
      )}

      {/* Heart NFT Minter Modal */}
      {showHeartNFTMinter && gameImages.length === 10 && (
        <HeartNFTMinter
          gameImages={gameImages}
          gameLayout={[
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
            19,
          ]}
          message={getPersonalizedMessage()}
          gameType="demo"
          creator="0x0000000000000000000000000000000000000000"
          onClose={handleNFTMinterClose}
          onMinted={handleNFTMinted}
          onViewCollection={() => {
            setShowHeartNFTMinter(false);
            setShowWalletDrawer(true);
          }}
          users={gameUsers}
          gameStats={
            gameStats || {
              completionTime: 120, // Fallback completion time
              accuracy: 100, // Fallback accuracy for demo
              socialDiscoveries: Math.min(gameUsers.length, 10), // Cap at 10 unique users
            }
          }
        />
      )}

      {/* Floating Action Button - always visible except during modals */}
      {!showValentinesProposal && !showHeartNFTMinter && (
        <FloatingActionButton onClick={() => setShowWalletDrawer(true)} />
      )}

      {/* Wallet Drawer */}
      <WalletDrawer
        isOpen={showWalletDrawer}
        onClose={() => setShowWalletDrawer(false)}
      />

      {/* Unified Onboarding System */}
      <UnifiedOnboardingIntegration
        sequence="welcome"
        onExploreGames={() => startSocialGames()}
      />

      {/* Onboarding Debug Panel */}
      <OnboardingDebug />
    </div>
  );
}

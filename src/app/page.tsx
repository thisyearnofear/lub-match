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

const SimpleHeartNFTMinter = dynamic(() => import("@/components/SimpleHeartNFTMinter"), {
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
import SimpleOnboarding, { WELCOME_TIPS } from "@/components/onboarding/SimpleOnboarding";
import {
  AnimatedTile,
  AnimatedTileContainer,
  FloatingHearts,
} from "@/components/shared/AnimatedTile";
import OnboardingDebug from "@/components/debug/OnboardingDebug";
import SurpriseCelebration from "@/components/delights/SurpriseCelebration";
import PersonalizedWelcome from "@/components/delights/PersonalizedWelcome";
import DailyCreativeChallenge from "@/components/engagement/DailyCreativeChallenge";
import ContextualHelp from "@/components/intuitive/ContextualHelp";
import SocialEngagement from "@/components/engagement/SocialEngagement";
import ProfessionalOnboardingModal from "@/components/ProfessionalOnboardingModal";

import { useFarcasterUsers } from "@/hooks/useFarcasterUsers";
import { useAccount } from "wagmi";
import { defaultRevealImages, defaultMessage } from "@/data/defaultGame";
import { useUserProgression } from "@/utils/userProgression";
import { LoadingState } from "@/components/ErrorBoundary";
import { useExperienceTier } from "@/hooks/useExperienceTier";
import { CollaborationService } from "@/services/collaborationService";
import { SocialUser } from "@/types/socialGames";

const ANIM_DURATION = 2;

import { useMiniAppReady } from "@/hooks/useMiniAppReady";

export default function Home() {
  const {
    context: farcasterContext,
    isReady: miniAppReady,
    isInFarcaster,
    openUrl,
    closeApp,
  } = useMiniAppReady();

  const [showWalletDrawer, setShowWalletDrawer] = useState(false);
  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [showHeartNFTMinter, setShowHeartNFTMinter] = useState(false);
  const [showProfessionalOnboarding, setShowProfessionalOnboarding] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'hearts' | 'stars' | 'sparkles' | 'rainbow' | 'fireworks'>('hearts');
  const [celebrationMessage, setCelebrationMessage] = useState<string>('');
  const [showSocialEngagement, setShowSocialEngagement] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // ENHANCEMENT FIRST: Sequential loading states using existing patterns
  const [loadingState, setLoadingState] = useState<'none' | 'celebrating' | 'preparing_nft' | 'loading_proposal'>('none');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Game stats state to capture actual performance data
  const [gameStats, setGameStats] = useState<{
    completionTime: number;
    accuracy: number;
    socialDiscoveries: number;
    collaborationInsights?: {
      skillsDiscovered: string[];
      compatibleUsers: SocialUser[];
      crossPlatformConnections: number;
      professionalOpportunities: number;
    };
  } | null>(null);

  // Dynamic Farcaster users for social experience - only on client
  const {
    users,
    loading,
    error,
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
  
  // ENHANCEMENT FIRST: Three-tier experience integration
  const currentUser: SocialUser | undefined = farcasterUser ? {
    fid: farcasterUser.fid,
    username: farcasterUser.username || 'anonymous',
    displayName: farcasterUser.displayName || farcasterUser.username || 'Anonymous',
    pfpUrl: farcasterUser.pfpUrl || '',
    followerCount: (farcasterUser as any).followerCount || 0,
    followingCount: (farcasterUser as any).followingCount || 0,
    network: 'farcaster' as const
  } : undefined;
  
  const {
    currentTier,
    tierConfig,
    canAccessFeature,
    getTierStyling,
    upgradeToTier,
    getNextTier,
    canUpgrade
  } = useExperienceTier({
    user: currentUser,
    gameHistory: [], // TODO: Get from user progression
    autoDetect: true
  });
  
  const tierStyling = getTierStyling();

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update game images only on client side after API check is complete
  useEffect(() => {
    console.log('🎮 Game images useEffect triggered:', {
      isClient,
      apiCheckComplete,
      loading,
      usersLength: users.length,
      currentGameImagesLength: gameImages.length
    });
    
    if (isClient && apiCheckComplete && !loading && users.length >= 10) {
      const farcasterPairs = getRandomPairs();
      console.log('🎮 Generated farcaster pairs:', farcasterPairs.length);
      
      if (farcasterPairs.length === 10) {
        console.log('✅ Setting game images with', farcasterPairs.length, 'images');
        setGameImages(farcasterPairs);

        // Set the corresponding users (first 5 users whose images are used for pairs)
        setGameUsers(users.slice(0, 5));

        // Legacy onboarding - will be replaced by enhanced system
        // showOnboardingMessage("FARCASTER_INTRO", { delay: 1000 });
      } else {
        console.log('❌ Not setting game images, got', farcasterPairs.length, 'instead of 10');
      }
    }
    // Only depend on stable values, not functions that change on every render
  }, [isClient, apiCheckComplete, loading, users.length]);

  // No longer need to refresh player data - using unified stats

  const handleShowProposal = () => {
    // ENHANCEMENT FIRST: Sequential loading using existing state management
    setLoadingState('celebrating');
    
    // Celebration phase (2s)
    setTimeout(() => {
      setLoadingState('preparing_nft');
      setLoadingProgress(0);
      
      // Progress animation for NFT preparation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setLoadingState('none');
            setShowHeartNFTMinter(true);
            return 100;
          }
          return prev + 10;
        });
      }, 150); // 1.5s total
    }, 2000);
  };

  const handleNFTMinterClose = () => {
    setShowHeartNFTMinter(false);
    // ENHANCEMENT FIRST: Continue sequential flow to proposal
    setLoadingState('loading_proposal');
    setLoadingProgress(0);
    
      // Progress animation for proposal loading
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setLoadingState('none');
            setShowValentinesProposal(true);
            return 100;
          }
          return prev + 20;
        });
      }, 100); // 1s total
  };

  const handleNFTMinted = (tokenId: string) => {
    console.log("NFT minted with token ID:", tokenId);
    // Continue sequential flow after successful minting
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
    // Show celebration based on performance
    if (stats.accuracy === 100) {
      setCelebrationType('fireworks');
      setCelebrationMessage('Perfect game! 🎆');
    } else if (stats.completionTime < 60) {
      setCelebrationType('stars');
      setCelebrationMessage('Speed demon! ⚡');
    } else {
      setCelebrationType('hearts');
      setCelebrationMessage('Beautiful game! 💝');
    }

    // Show social engagement prompt after a delay
    setTimeout(() => {
      setShowSocialEngagement(true);
    }, 3000);
    // Calculate social discoveries based on unique users actually used in the game
    const socialDiscoveries = Math.min(gameUsers.length, 10);
    
    // ENHANCEMENT FIRST: Generate collaboration insights for professional tier
    let collaborationInsights;
    if (canAccessFeature('collaboration') && currentUser && gameUsers.length > 0) {
      const socialUsers: SocialUser[] = gameUsers.map(user => ({
        ...user,
        network: 'farcaster' as const
      }));
      
      const skillsDiscovered = socialUsers.flatMap(user => 
        CollaborationService.analyzeSkills(user)
      );
      
      const compatibleUsers = socialUsers.filter(user => 
        CollaborationService.calculateCompatibility(currentUser, user) >= 60
      );
      
      collaborationInsights = {
        skillsDiscovered: [...new Set(skillsDiscovered)],
        compatibleUsers,
        crossPlatformConnections: 0, // Only Farcaster users in this game
        professionalOpportunities: compatibleUsers.length
      };
    }

    const enhancedStats = {
      completionTime: stats.completionTime,
      accuracy: stats.accuracy,
      socialDiscoveries,
      collaborationInsights,
    };

    setGameStats(enhancedStats);

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
    setLoadingState('none');
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
            <h1 className={`text-xl font-bold bg-gradient-to-r ${tierStyling.primaryColor} bg-clip-text text-transparent`}>
              {tierStyling.icon} Lub Match
            </h1>
            {farcasterUser && (
              <div className="text-sm text-gray-300">
                Welcome, {farcasterUser.displayName || farcasterUser.username}!
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* ENHANCED: Professional tier upgrade with clear value proposition */}
            {canUpgrade && (
              <button
                onClick={() => {
                  const nextTier = getNextTier();
                  if (nextTier === 'professional') {
                    // Show professional onboarding instead of direct upgrade
                    setShowProfessionalOnboarding(true);
                  } else if (nextTier) {
                    upgradeToTier(nextTier);
                  }
                }}
                className={`px-3 py-1.5 bg-gradient-to-r ${tierStyling.primaryColor} text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all backdrop-blur-sm border border-white/20 shadow-lg`}
              >
                {getNextTier() === 'professional' ? '🎨 Spark Creativity' : '✨ Upgrade'}
              </button>
            )}
            
            {canPlayGames(users) && canAccessFeature('socialGames') && (
              <button
                onClick={startSocialGames}
                className={`px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-all backdrop-blur-sm border ${
                  currentTier === 'professional'
                    ? 'bg-blue-500 hover:bg-blue-600 border-blue-400/30'
                    : 'bg-blue-500/80 hover:bg-blue-500 border-blue-400/20'
                }`}
              >
                {currentTier === 'professional' ? '🤝 Network' : 'Hab Fun'}
              </button>
            )}

            {gameImages && gameImages.length >= 10 && (
              <Link
                href="/create"
                className={`px-3 py-1.5 bg-gradient-to-r ${tierStyling.primaryColor}/80 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all backdrop-blur-sm border border-white/20`}
              >
                {currentTier === 'love' ? 'Make Lub' : currentTier === 'social' ? 'Create Game' : 'Build Together'}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Personalized Welcome */}
      {currentUser && (
        <PersonalizedWelcome
          user={currentUser}
          gameHistory={[]} // TODO: Get from user progression
          currentTier={currentTier}
        />
      )}

      {/* Daily Creative Challenge */}
      {currentUser && (
        <div className="fixed top-32 right-4 z-30">
          <DailyCreativeChallenge
            user={currentUser}
            currentTier={currentTier}
            onChallengeComplete={(challengeId, reward) => {
              // Handle challenge completion with celebration
              setCelebrationType('sparkles');
              setCelebrationMessage(`Challenge completed! ${reward.type === 'lub' ? `💰 +${reward.value} LUB` : '🏆 Achievement unlocked!'}`);
            }}
          />
        </div>
      )}

      {/* Main game area */}
      <div
        className="flex-grow flex items-center justify-center px-4 pb-4 overflow-y-auto"
        style={{
          paddingTop: `max(5rem, calc(var(--safe-area-inset-top) + 4rem))`,
          paddingBottom: `max(1rem, var(--safe-area-inset-bottom))`,
        }}
      >
        {loadingState === 'none' && !showValentinesProposal && !showHeartNFTMinter ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
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
                  Preparing Your {tierConfig.tier === 'love' ? 'Romantic' : tierConfig.tier === 'social' ? 'Social' : 'Professional'} Experience
                </h2>
                <p className="text-purple-200 mb-6">
                  {!apiCheckComplete
                    ? `Setting up your ${tierConfig.styling.description.toLowerCase()}...`
                    : `Loading ${tierConfig.tier === 'professional' ? 'creators and builders' : 'users'} for your experience...`}
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
                    ? `${tierConfig.tier === 'love' ? 'Love' : 'Demo'} Mode Active`
                    : `Loading ${tierConfig.tier === 'professional' ? 'Collaboration' : 'Social'} Features`}
                </h2>
                <p className="text-purple-200 mb-4">
                  {hasApiKey === false
                    ? `${tierConfig.tier === 'love' ? 'Romantic memory games' : 'Social features'} are ${tierConfig.tier === 'love' ? 'ready' : 'currently unavailable'}, ${tierConfig.tier === 'love' ? 'perfect for a cozy experience' : 'but you can still create and play custom games'}!`
                    : `Setting up your personalized ${tierConfig.tier === 'professional' ? 'collaboration platform' : 'social experience'}...`}
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
                          className={`block w-full px-6 py-3 bg-gradient-to-r ${tierStyling.primaryColor} text-white rounded-full font-semibold shadow-lg text-center`}
                        >
                          {tierStyling.icon} {currentTier === 'love' ? 'Create Love Game' : currentTier === 'social' ? 'Create Social Game' : 'Start Collaboration'}
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
        ) : loadingState !== 'none' ? (
          <div className="flex items-center justify-center min-h-screen">
            <LoadingState
              type={loadingState}
              platformTheme="farcaster"
              gameStats={gameStats || undefined}
              showProgress={loadingState !== 'celebrating'}
              progress={loadingProgress}
              size="lg"
            />
          </div>
        ) : showValentinesProposal ? (
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
        ) : null}
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
            {currentTier === 'love' 
              ? '💝 Perfect for romantic memory games' 
              : '💡 Add Neynar API key to unlock social features'
            }
          </p>
        )}
        {isClient && currentTier !== 'professional' && canUpgrade && (
        <p className="text-blue-300 text-xs mt-1">
        ✨ {currentTier === 'love' ? 'Play more to unlock social features' : 'Complete challenges to unlock collaboration features'}
        </p>
        )}
        {isClient && currentTier === 'professional' && (
        <p className="text-blue-300 text-xs mt-1">
        🎨 Creative universe active - Spark magical collaborations ✨
        </p>
        )}
      </div>

      {/* Professional Onboarding Modal */}
      {showProfessionalOnboarding && (
        <ProfessionalOnboardingModal
          currentUser={currentUser}
          gameHistory={[]} // TODO: Get from user progression
          onComplete={(upgraded) => {
            setShowProfessionalOnboarding(false);
            if (upgraded) {
              upgradeToTier('professional');
            }
          }}
          onClose={() => setShowProfessionalOnboarding(false)}
        />
      )}

      {/* Social Games Modal */}
      {isGameActive && (
        <SocialGamesHub
          users={users.map(user => ({ ...user, network: 'farcaster' as const }))}
          onClose={handleSocialGamesClose}
          onSkipToProposal={() => {
            setShowValentinesProposal(true);
          }}
          experienceTier={currentTier}
          currentUser={currentUser}
          showCollaborationFeatures={canAccessFeature('collaboration')}
        />
      )}

      {/* Heart NFT Minter Modal */}
      {showHeartNFTMinter && gameImages.length === 10 && (
        <SimpleHeartNFTMinter
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
      {loadingState === 'none' && !showValentinesProposal && !showHeartNFTMinter && (
        <FloatingActionButton onClick={() => setShowWalletDrawer(true)} />
      )}

      {/* Wallet Drawer */}
      <WalletDrawer
        isOpen={showWalletDrawer}
        onClose={() => setShowWalletDrawer(false)}
      />

      {/* Welcome Tips */}
      <SimpleOnboarding 
        tips={WELCOME_TIPS} 
        onComplete={() => {}} 
      />

      {/* Onboarding Debug Panel */}
      <OnboardingDebug
        loading={loading}
        apiCheckComplete={apiCheckComplete}
        hasApiKey={hasApiKey}
        usersLength={users.length}
        error={error}
        isInFarcaster={isInFarcaster}
        miniAppReady={miniAppReady}
      />

      {/* Contextual Help */}
      {currentUser && (
        <ContextualHelp
          user={currentUser}
          currentTier={currentTier}
          gameHistory={[]} // TODO: Get from user progression
          currentView="home"
          recentActions={[]} // TODO: Track recent user actions
          onDismiss={(helpId) => {
            console.log('Help dismissed:', helpId);
          }}
        />
      )}

      {/* Social Engagement Prompts */}
      {showSocialEngagement && currentUser && users.length > 0 && (
        <SocialEngagement
          users={users.map(user => ({ ...user, network: 'farcaster' as const }))}
          currentUser={currentUser}
          context="game_complete"
          onInteraction={(type, targetUser, data) => {
            console.log('Social interaction:', type, targetUser.username, data);
            // Handle social interactions (kudos, collaboration requests, etc.)
          }}
          onClose={() => setShowSocialEngagement(false)}
        />
      )}

      {/* Surprise Celebrations */}
      {celebrationMessage && (
        <SurpriseCelebration
          type={celebrationType}
          message={celebrationMessage}
          onComplete={() => {
            setCelebrationMessage('');
          }}
        />
      )}
    </div>
  );
}

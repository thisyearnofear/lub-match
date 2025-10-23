"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { SocialUser, GameResult } from "@/types/socialGames";
import { PlatformAdapter, UnifiedUtils } from "@/utils/platformAdapter";
import { socialGameFactory } from "@/utils/socialGameFactory";
import UsernameGuessingGameComponent from "./UsernameGuessingGame";
import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import { useLubToken } from "@/hooks/useLubToken";
import { WEB3_CONFIG } from "@/config";
import { useEarningNotifications } from "./EarningToast";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";
// NEW: Challenge system imports (ENHANCEMENT FIRST)
import {
  challengeEngine,
  Challenge,
  ChallengeDifficulty,
} from "@/services/challengeEngine";
import { ChallengeSocialProfile } from "./SocialProfile";
import { useReporting } from "./CommunityReporting";
import SimpleOnboarding, { GAME_COMPLETE_TIPS } from "./onboarding/SimpleOnboarding";
import { CollaborationService, CollaborationUtils } from "@/services/collaborationService";
import CollaborationCard from "./shared/CollaborationCard";

import SuccessScreen from "./shared/SuccessScreen";
import ActionButton from "./shared/ActionButton";
import { useSuccessActions } from "@/hooks/useSuccessActions";
import { ConnectionIncentive } from "./shared/ConnectionIncentive";
import { useUserIdentity } from "@/contexts/UserContext";
import { GlobalLeaderboard } from "./GlobalLeaderboard";

interface SocialGamesHubProps {
  users: SocialUser[];
  onClose: () => void;
  onSkipToProposal?: () => void;
  // NEW: Three-tier experience props
  experienceTier?: 'love' | 'social' | 'professional';
  currentUser?: SocialUser;
  showCollaborationFeatures?: boolean;
}

// ENHANCED: Game modes with challenge system and collaboration (ENHANCEMENT FIRST)
type GameMode =
  | "menu"
  | "username-guessing"
  | "pfp-matching"
  | "social-trivia"
  | "global-leaderboard"
  | "challenge-selection" // NEW: Challenge target selection
  | "challenge-creation" // NEW: AI challenge generation
  | "challenge-active" // NEW: Active challenge tracking
  | "whale-hunting" // NEW: Whale-specific challenges
  | "collaboration-discovery" // NEW: Professional tier collaboration
  | "collaboration-matching" // NEW: Active collaboration matching
  | "profile-setup" // ENHANCED: Collaboration profile setup
  | "results";

export default function SocialGamesHub({
  users,
  onClose,
  onSkipToProposal,
  experienceTier = 'social',
  currentUser,
  showCollaborationFeatures = false,
}: SocialGamesHubProps) {
  const [currentMode, setCurrentMode] = useState<GameMode>("menu");
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );

  // NEW: Challenge system state (ENHANCEMENT FIRST)
  const [selectedTarget, setSelectedTarget] = useState<SocialUser | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(
    null
  );
  const [challengeDifficulty, setChallengeDifficulty] =
    useState<ChallengeDifficulty>("medium");
  
  // NEW: Collaboration state (ENHANCEMENT FIRST)
  const [collaborationSuggestions, setCollaborationSuggestions] = useState<any[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<SocialUser | null>(null);

  // Wallet integration
  const { isConnected } = useAccount();

  // Farcaster integration
  const {
    isInFarcaster,
    addFrame,
    context: farcasterContext,
  } = useMiniAppReady();

  // Get user identity for personalized display
  const { farcasterUser, displayName } = useUserIdentity();

  // Debug logging for user identity
  useEffect(() => {
    console.log("SocialGamesHub - User Identity Debug:", {
      farcasterUser,
      displayName,
      farcasterContext,
      isInFarcaster,
    });
  }, [farcasterUser, displayName, farcasterContext, isInFarcaster]);

  // Filter users to only include those with valid profile pictures and usernames
  const validUsers = users.filter(
    (user) => user.pfpUrl && user.username && user.pfpUrl.trim() !== ""
  );

  // ENHANCED: Unified stats system with challenge tracking
  const {
    formattedStats,
    recordSocialGameResult,
    recordGameCompletion,
    recordChallengeCreated,
    recordChallengeCompleted,
    recordWhaleHarpooned,
    recordViralDetected,
    socialGameScore,
    socialGameAccuracy,
    socialGameLevel,
    gamesCompleted,
    socialGamesPlayed,
    tierDisplayName,
    tier,
    challengeStats,
    whaleHunterLevel,
    challengeSkillLevel,
    challengeSkillLabel,
    challengeSkillScore,
    difficultyRecommendation,
  } = useUnifiedStats();

  const { earnLub, balanceFormatted, enabled: lubTokenEnabled } = useLubToken();
  const { showEarning, ToastContainer } = useEarningNotifications();

  // Use shared success actions hook
  const { getSocialGameSuccessActions, getChallengeSuccessActions } =
    useSuccessActions();
  const { openReport, ReportingModal } = useReporting();

  // No need to load separate player data - using unified stats

  const startUsernameGuessingGame = () => {
    const game = socialGameFactory.createUsernameGuessingGame(
      validUsers,
      difficulty
    );
    setCurrentGame(game);
    setCurrentMode("username-guessing");
  };

  // NEW: Challenge system methods (ENHANCEMENT FIRST)
  const startChallengeSelection = () => {
    setCurrentMode("challenge-selection");
  };

  const startWhaleHunting = () => {
    setCurrentMode("whale-hunting");
  };
  
  // NEW: Collaboration methods (ENHANCEMENT FIRST)
  const startCollaborationDiscovery = () => {
    if (currentUser && showCollaborationFeatures) {
      const suggestions = CollaborationService.generateCollaborationSuggestions(
        currentUser,
        users
      );
      setCollaborationSuggestions(suggestions);
      setCurrentMode("collaboration-discovery");
    }
  };
  
  const handleCollaborationRequest = (user: SocialUser) => {
    setSelectedCollaborator(user);
    setCurrentMode("collaboration-matching");
    
    // Show earning notification for collaboration request
    if (lubTokenEnabled) {
      showEarning(BigInt(5), "Collaboration Spark Sent! ✨");
    }
  };

  const handleTargetSelection = async (target: SocialUser) => {
    setSelectedTarget(target);
    setCurrentMode("challenge-creation");

    try {
      // Generate AI challenge for selected target with anti-spam validation
      // ENHANCEMENT: Pass user's skill level for adaptive difficulty
      const challenge = await challengeEngine.generateChallenge(
        target,
        challengeDifficulty,
        farcasterUser?.username || "anonymous",
        farcasterUser?.fid, // Pass user ID for anti-spam validation
        challengeSkillLevel // Pass user's skill level for adaptive difficulty
      );

      setActiveChallenge(challenge);
      setCurrentMode("challenge-active");

      // CLEAN: Record challenge creation in stats
      const targetId = PlatformAdapter.getNumericId(target);
      recordChallengeCreated(
        targetId,
        challengeDifficulty,
        challenge.whaleMultiplier
      );

      // Show earning notification for challenge creation
      if (lubTokenEnabled) {
        showEarning(BigInt(10), "Challenge Created!");
      }
    } catch (error) {
      console.error("Failed to create challenge:", error);

      // Show user-friendly error message for anti-spam blocks
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Challenge blocked")) {
        // Show anti-spam notification
        if (lubTokenEnabled) {
          showEarning(
            BigInt(0),
            "Challenge blocked - please wait before creating another challenge"
          );
        }
      }

      setCurrentMode("challenge-selection");
    }
  };

  const handleChallengeComplete = async (
    success: boolean,
    evidence?: string,
    viralDetected: boolean = false
  ) => {
    if (!activeChallenge) return;

    try {
      // Complete challenge in engine
      const result = challengeEngine.completeChallenge(
        activeChallenge.id,
        success,
        evidence,
        viralDetected
      );

      // Record in unified stats
      recordChallengeCompleted(
        success,
        BigInt(result.actualReward),
        BigInt(result.bonuses.whale),
        viralDetected,
        BigInt(result.bonuses.viral)
      );

      // Record whale harpooning if applicable
      if (success && activeChallenge.whaleMultiplier > 2) {
        const whaleType =
          activeChallenge.targetUser.followerCount >= 50000
            ? "mega_whale"
            : activeChallenge.targetUser.followerCount >= 10000
            ? "whale"
            : activeChallenge.targetUser.followerCount >= 5000
            ? "shark"
            : "fish";
        recordWhaleHarpooned(
          whaleType,
          activeChallenge.whaleMultiplier,
          BigInt(result.actualReward)
        );
      }

      // Record viral detection if applicable
      if (viralDetected) {
        recordViralDetected(BigInt(result.bonuses.viral));
      }

      // Show earning notification
      if (lubTokenEnabled && success) {
        showEarning(
          BigInt(result.actualReward),
          `Challenge ${success ? "Completed" : "Failed"}!`
        );
      }

      // Update game result for display with enhanced challenge context
      setGameResult({
        gameId: "challenge-" + activeChallenge.id,
        score: result.actualReward,
        maxScore: result.actualReward * 2,
        accuracy: success ? 100 : 0,
        timeSpent: Math.floor(
          (result.completedAt.getTime() - activeChallenge.createdAt.getTime()) /
            1000
        ),
        completedAt: result.completedAt,
        gameData: {},
        challengeResult: {
          challenge: activeChallenge,
          success,
          viralDetected,
          totalReward: result.actualReward,
          bonuses: result.bonuses,
        },
      });

      setCurrentMode("results");
      setActiveChallenge(null);
    } catch (error) {
      console.error("Failed to complete challenge:", error);
    }
  };

  const handleGameComplete = (result: GameResult) => {
    setGameResult(result);
    setCurrentMode("results");

    // Record social game result in unified stats
    recordSocialGameResult(result.score, result.accuracy, result.timeSpent);
    recordGameCompletion("social");

    // Award LUB tokens for game completion (if wallet connected and features enabled)
    if (isConnected && WEB3_CONFIG.features.socialEarning) {
      earnLub("social_game_win");

      // Show earning notification
      const earningAmount = WEB3_CONFIG.earning.socialGameWin;
      showEarning(earningAmount, "Completed social game! 🎮");
    } else if (!isConnected && WEB3_CONFIG.features.socialEarning) {
      // Show notification about missing rewards due to no wallet connection
      showEarning(BigInt(0), "Connect wallet to earn LUB tokens! 💰");
    }
  };

  const backToMenu = () => {
    setCurrentMode("menu");
    setCurrentGame(null);
    setGameResult(null);
  };

  // Removed leaderboard - focusing on personal stats

  if (validUsers.length < 4) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-2xl shadow-2xl max-w-md mx-4">
          <h2 className="text-2xl font-bold text-white mb-4">
            Not Enough Valid Users
          </h2>
          <p className="text-purple-200 mb-6">
            We need at least 4 Farcaster users with valid profile pictures to
            start the social games. Found {validUsers.length} valid users out of{" "}
            {Math.min(users.length, 8)} total.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-700"
      >
        <AnimatePresence mode="wait">
          {currentMode === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-8"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {experienceTier === 'love' ? '💝' : experienceTier === 'social' ? '🎮' : '💼'}{" "}
                    {farcasterUser?.username
                      ? `@${farcasterUser.username}`
                      : displayName || "Lubbers Anonymous"}
                  </h1>
                  <p className="text-purple-200">
                    {experienceTier === 'love' ? 'LUB me, or LUB me not?' : 
                     experienceTier === 'social' ? 'Ready to play and connect?' : 
                     'Ready to collaborate and build?'}
                  </p>

                  {/* Wallet Status */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex items-center gap-2">
                      <ConnectButton.Custom>
                        {({
                          account,
                          chain,
                          openAccountModal,
                          openChainModal,
                          openConnectModal,
                          authenticationStatus,
                          mounted,
                        }) => {
                          const ready =
                            mounted && authenticationStatus !== "loading";
                          const connected =
                            ready &&
                            account &&
                            chain &&
                            (!authenticationStatus ||
                              authenticationStatus === "authenticated");

                          return (
                            <div className="flex items-center gap-2">
                              {(() => {
                                if (!connected) {
                                  return (
                                    <button
                                      onClick={openConnectModal}
                                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
                                    >
                                      Connect Wallet
                                    </button>
                                  );
                                }

                                return (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={openAccountModal}
                                      className="px-3 py-1.5 bg-purple-700 bg-opacity-50 text-white rounded-lg text-sm font-medium hover:bg-opacity-70 transition-all"
                                    >
                                      {account.displayName}
                                    </button>
                                    {chain.unsupported && (
                                      <button
                                        onClick={openChainModal}
                                        className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                                      >
                                        Wrong Network
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }}
                      </ConnectButton.Custom>
                    </div>

                    {/* LUB Balance Display */}
                    {isConnected && lubTokenEnabled && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 bg-opacity-20 rounded-lg">
                        <span className="text-yellow-400 text-sm font-medium">
                          💰 {balanceFormatted} LUB
                        </span>
                      </div>
                    )}

                    {/* Skip to Proposal Button */}
                    <button
                      onClick={() => {
                        onClose();
                        onSkipToProposal?.();
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all"
                    >
                      {experienceTier === 'love' ? '💝 Skip to Proposal' : 
                       experienceTier === 'social' ? '🎮 Continue Journey' : 
                       '💼 View Results'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="text-purple-200 hover:text-white text-2xl transition-colors ml-4"
                >
                  ✕
                </button>
              </div>

              {/* ENHANCED: Professional features prominently displayed */}
              {experienceTier === 'professional' && (
              <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-xl p-6 mb-6 border border-blue-400/30">
              <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🎨</span>
              <div>
              <h3 className="text-white font-semibold">Creative Universe Active</h3>
              <p className="text-blue-200 text-sm">Find kindred spirits and co-create magic</p>
              </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
              <ActionButton
              variant="collaboration-spark"
              size="sm"
              onClick={startCollaborationDiscovery}
              icon="✨"
              >
              Spark Matches
              </ActionButton>
              <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => setCurrentMode('profile-setup')}
              icon="🎭"
              >
              Creative Aura
              </ActionButton>
              </div>
              </div>
            )}

            {/* Player Stats */}
              <div className="bg-purple-800 bg-opacity-50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Your Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">
                      {socialGameScore}
                    </div>
                    <div className="text-sm text-purple-200">Total Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {gamesCompleted}
                    </div>
                    <div className="text-sm text-purple-200">Games Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {socialGameAccuracy}
                    </div>
                    <div className="text-sm text-purple-200">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">
                      {tierDisplayName}
                    </div>
                    <div className="text-sm text-purple-200">Level</div>
                  </div>
                </div>
              </div>

              {/* Difficulty Selector */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Select Difficulty
                </h3>
                <div className="flex gap-4">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`
                        px-6 py-3 rounded-xl font-semibold transition-all capitalize
                        ${
                          difficulty === level
                            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                            : "bg-purple-700 text-purple-200 hover:bg-purple-600"
                        }
                      `}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Options */}
              <div className={`grid ${showCollaborationFeatures ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-8`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startUsernameGuessingGame}
                  className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-xl text-left hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Username Challenge
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Match profile pictures to their usernames. Test your
                    Farcaster knowledge!
                  </p>
                  <div className="mt-4 text-xs text-blue-200">
                    {difficulty === "easy"
                      ? "4 users"
                      : difficulty === "medium"
                      ? "8 users"
                      : "12 users"}{" "}
                    • ~
                    {difficulty === "easy"
                      ? "1"
                      : difficulty === "medium"
                      ? "2"
                      : "4"}{" "}
                    min
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-br from-green-600 to-teal-600 p-6 rounded-xl text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="text-2xl mb-2">🧩</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    PFP Memory Match
                  </h3>
                  <p className="text-green-100 text-sm">
                    Classic memory game with Farcaster profile pictures.
                  </p>
                  <div className="mt-4 text-xs text-green-200">
                    Coming Soon!
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentMode("global-leaderboard")}
                  className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-xl text-left hover:from-purple-500 hover:to-pink-500 transition-all"
                >
                  <div className="text-2xl mb-2">🏆</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Global Leaderboard
                  </h3>
                  <p className="text-purple-100 text-sm">
                    Compete globally! Submit your best Photo Pair Game scores.
                  </p>
                </motion.button>

                {/* NEW: AI Challenge Mode */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startChallengeSelection}
                  className="bg-gradient-to-br from-pink-600 to-red-600 p-6 rounded-xl text-left hover:from-pink-700 hover:to-red-700 transition-all"
                >
                  <div className="text-2xl mb-2">🤖</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    AI Challenges
                  </h3>
                  <p className="text-pink-100 text-sm">
                    AI generates custom challenges to complete with Farcaster
                    users. Earn LUB rewards!
                  </p>
                  <div className="mt-2 text-xs text-pink-200">
                    {challengeStats.challengesCompleted} completed •{" "}
                    {challengeStats.successRate} success rate
                  </div>
                </motion.button>

                {/* NEW: Whale Hunting Mode */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startWhaleHunting}
                  className="bg-gradient-to-br from-cyan-600 to-blue-600 p-6 rounded-xl text-left hover:from-cyan-700 hover:to-blue-700 transition-all"
                >
                  <div className="text-2xl mb-2">🐋</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Whale Hunting
                  </h3>
                  <p className="text-cyan-100 text-sm">
                    Target high-follower users for massive LUB rewards. Risk vs
                    reward!
                  </p>
                  <div className="mt-2 text-xs text-cyan-200">
                    {challengeStats.whalesHarpooned} whales harpooned •{" "}
                    {whaleHunterLevel} level
                  </div>
                  <div className="mt-4 text-xs text-purple-200">
                    Earn LUB tokens & achievements!
                  </div>
                </motion.button>

                {/* NEW: Collaboration Discovery (Professional Tier) */}
                {showCollaborationFeatures && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startCollaborationDiscovery}
                    className="bg-gradient-to-br from-teal-600 to-cyan-600 p-6 rounded-xl text-left hover:from-teal-700 hover:to-cyan-700 transition-all"
                  >
                    <div className="text-2xl mb-2">🤝</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Collaboration Discovery
                    </h3>
                    <p className="text-teal-100 text-sm">
                      Find creators and builders for your next project. AI-powered skill matching.
                    </p>
                    <div className="mt-2 text-xs text-teal-200">
                      Professional networking • Cross-platform connections
                    </div>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-br from-orange-600 to-red-600 p-6 rounded-xl text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="text-2xl mb-2">🧠</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Social Trivia
                  </h3>
                  <p className="text-orange-100 text-sm">
                    Answer questions about follower counts, bios, and more.
                  </p>
                  <div className="mt-4 text-xs text-orange-200">
                    Coming Soon!
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentMode === "username-guessing" && currentGame && (
            <motion.div
              key="username-guessing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <UsernameGuessingGameComponent
                game={currentGame}
                onGameComplete={handleGameComplete}
                onExit={backToMenu}
              />
            </motion.div>
          )}

          {currentMode === "global-leaderboard" && (
            <motion.div
              key="global-leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  🏆 Global Leaderboard
                </h2>
                <ActionButton
                  onClick={backToMenu}
                  variant="secondary"
                  size="sm"
                  icon="←"
                >
                  Back to Games
                </ActionButton>
              </div>

              <GlobalLeaderboard
                onSubmitScore={(time, accuracy) => {
                  // Create viral sharing moment for social games context
                  const shareText = `🎮 Just submitted ${time}s with ${accuracy}% accuracy to the global leaderboard! Can you beat my score? 💝`;

                  // Try Farcaster sharing first
                  if (isInFarcaster && addFrame) {
                    try {
                      addFrame();
                    } catch (error) {
                      console.log("Farcaster sharing not available:", error);
                    }
                  }

                  // Show success message
                  console.log(
                    "Global leaderboard score submitted successfully!"
                  );
                }}
              />
            </motion.div>
          )}

          {/* NEW: Collaboration Discovery Mode */}
          {currentMode === "collaboration-discovery" && showCollaborationFeatures && (
            <motion.div
              key="collaboration-discovery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  🤝 Collaboration Discovery
                </h2>
                <ActionButton
                  onClick={backToMenu}
                  variant="secondary"
                  size="sm"
                >
                  Back
                </ActionButton>
              </div>

              <div className="mb-6">
                <p className="text-teal-200 mb-4">
                  AI-powered matching based on complementary skills and cross-platform connections.
                </p>
                
                {currentUser && (
                  <div className="bg-teal-900/30 rounded-lg p-4 mb-4">
                    <h3 className="text-teal-300 font-semibold mb-2">Your Profile</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {CollaborationService.analyzeSkills(currentUser).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-teal-600 text-teal-100 text-xs rounded-full"
                        >
                          {CollaborationUtils.formatSkills([skill])[0]}
                        </span>
                      ))}
                    </div>
                    <p className="text-teal-200 text-sm">
                      Looking for: {CollaborationService.analyzeSkills(currentUser).includes('design') ? 'Developers & Builders' : 'Designers & Creators'}
                    </p>
                  </div>
                )}
              </div>

              {/* Collaboration Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collaborationSuggestions.slice(0, 6).map((suggestion, index) => {
                  const user = suggestion.participants.find((p: SocialUser) => p.username !== currentUser?.username);
                  if (!user) return null;
                  
                  return (
                    <CollaborationCard
                      key={user.username}
                      user={user}
                      currentUser={currentUser}
                      variant="suggestion"
                      showCompatibilityScore={true}
                      compatibilityScore={suggestion.matchScore}
                      matchedSkills={suggestion.collaborationData.skillsMatched}
                      onCollaborationRequest={handleCollaborationRequest}
                      experienceTier={experienceTier}
                      collaborationHint={suggestion.collaborationType === 'cross_platform' ? 'cross-platform' : 'skill-match'}
                      index={index}
                    />
                  );
                })}
              </div>
              
              {collaborationSuggestions.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                  <p className="text-teal-200">
                    Try connecting with more users or updating your collaboration profile.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* NEW: Collaboration Matching Mode */}
          {currentMode === "collaboration-matching" && selectedCollaborator && (
            <motion.div
              key="collaboration-matching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  ✨ Collaboration Spark Sent!
                </h2>
                <ActionButton
                  onClick={backToMenu}
                  variant="secondary"
                  size="sm"
                >
                  Back
                </ActionButton>
              </div>

              <div className="bg-gradient-to-r from-teal-900/50 to-cyan-900/50 rounded-xl p-6 mb-6">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Collaboration Request Sent!
                  </h3>
                  <p className="text-teal-200">
                    Your collaboration spark has been sent to @{selectedCollaborator.username}
                  </p>
                </div>
                
                <CollaborationCard
                  user={selectedCollaborator}
                  currentUser={currentUser}
                  variant="full"
                  showCompatibilityScore={true}
                  experienceTier={experienceTier}
                  className="mb-6"
                />
                
                <div className="bg-cyan-900/30 rounded-lg p-4">
                  <h4 className="text-cyan-300 font-semibold mb-2">Next Steps</h4>
                  <ul className="text-cyan-200 text-sm space-y-1">
                    <li>• Your collaboration request is now visible to the recipient</li>
                    <li>• They can accept, decline, or suggest modifications</li>
                    <li>• Check back later for responses and new opportunities</li>
                    <li>• Continue exploring other potential collaborators</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-3">
                <ActionButton
                  onClick={startCollaborationDiscovery}
                  variant="collaboration-spark"
                  icon="🔍"
                  fullWidth
                >
                  Find More Collaborators
                </ActionButton>
                <ActionButton
                  onClick={backToMenu}
                  variant="secondary"
                  fullWidth
                >
                  Back to Games
                </ActionButton>
              </div>
            </motion.div>
          )}

          {/* NEW: Challenge Selection Mode */}
          {currentMode === "challenge-selection" && (
            <motion.div
              key="challenge-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  🤖 AI Challenge Selection
                </h2>
                <ActionButton
                  onClick={backToMenu}
                  variant="secondary"
                  size="sm"
                >
                  Back
                </ActionButton>
              </div>

              <div className="mb-6">
                <p className="text-purple-200 mb-4">
                  Select a Farcaster user to challenge. AI will generate a
                  custom challenge based on their profile.
                </p>

                {/* Difficulty Selection with Skill Guidance */}
                <div className="bg-purple-800/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">
                      {challengeSkillLabel} (Skill: {challengeSkillScore}/100)
                    </h3>
                    <span className="text-xs bg-purple-600 text-purple-200 px-2 py-1 rounded">
                      {difficultyRecommendation.difficulty.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-purple-200 text-sm mb-3">
                    {difficultyRecommendation.explanation}
                  </p>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as ChallengeDifficulty[]).map(
                      (diff) => (
                        <button
                          key={diff}
                          onClick={() => setChallengeDifficulty(diff)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${
                            challengeDifficulty === diff
                              ? "bg-pink-600 text-white"
                              : "bg-purple-700/50 text-purple-200 hover:bg-purple-600/50"
                          }`}
                          disabled={
                            diff === "hard" &&
                            challengeSkillLevel === "beginner"
                          }
                        >
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          {diff === difficultyRecommendation.difficulty && (
                            <span className="ml-1">⭐</span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* User Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {validUsers.map((user) => (
                  <ChallengeSocialProfile
                    key={UnifiedUtils.getUniqueKey(user)}
                    user={user}
                    onChallengeTarget={handleTargetSelection}
                    onReport={(user) => openReport(user, "user")}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* NEW: Whale Hunting Mode */}
          {currentMode === "whale-hunting" && (
            <motion.div
              key="whale-hunting"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  🐋 Whale Hunting
                </h2>
                <ActionButton
                  onClick={backToMenu}
                  variant="secondary"
                  size="sm"
                >
                  Back
                </ActionButton>
              </div>

              <div className="mb-6">
                <p className="text-cyan-200 mb-4">
                  Target high-follower users for massive rewards. The bigger the
                  whale, the bigger the reward!
                </p>

                {/* Whale Hunting Guidance */}
                <div className="bg-cyan-900/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-cyan-300 font-semibold">
                      {challengeSkillLabel} Whale Hunter
                    </h3>
                    <span className="text-xs bg-cyan-700 text-cyan-200 px-2 py-1 rounded">
                      {whaleHunterLevel}
                    </span>
                  </div>
                  <p className="text-cyan-200 text-sm mb-3">
                    {challengeSkillLevel === "beginner"
                      ? "Start with smaller fish to build your skills before hunting whales."
                      : challengeSkillLevel === "intermediate"
                      ? "You're ready for shark hunting! Aim for 5k+ followers for bigger rewards."
                      : "You're an expert whale hunter! Target the biggest whales for maximum rewards."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>🐟 Fish: 1k+ followers (2x reward)</div>
                    <div>🦈 Shark: 5k+ followers (5x reward)</div>
                    <div>🐋 Whale: 10k+ followers (10x reward)</div>
                    <div>🌊 Mega Whale: 50k+ followers (25x reward)</div>
                  </div>
                </div>
              </div>

              {/* Whale User Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {validUsers
                  .filter((user) => user.followerCount >= 1000)
                  .sort((a, b) => b.followerCount - a.followerCount)
                  .map((user) => (
                    <ChallengeSocialProfile
                      key={UnifiedUtils.getUniqueKey(user)}
                      user={user}
                      onChallengeTarget={handleTargetSelection}
                      onReport={(user) => openReport(user, "user")}
                    />
                  ))}
              </div>
            </motion.div>
          )}

          {/* NEW: Active Challenge Mode */}
          {currentMode === "challenge-active" && activeChallenge && (
            <motion.div
              key="challenge-active"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  🎯 Active Challenge
                </h2>
                <ActionButton
                  onClick={backToMenu}
                  variant="secondary"
                  size="sm"
                >
                  Abandon
                </ActionButton>
              </div>

              <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={activeChallenge.targetUser.pfpUrl}
                    alt={activeChallenge.targetUser.displayName}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      @{activeChallenge.targetUser.username}
                    </h3>
                    <p className="text-purple-200">
                      {activeChallenge.targetUser.followerCount.toLocaleString()}{" "}
                      followers
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-bold text-pink-400">
                      {activeChallenge.totalReward} LUB
                    </div>
                    <div className="text-sm text-purple-300">
                      {activeChallenge.whaleMultiplier}x whale bonus
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-4 mb-4">
                  <pre className="text-sm text-white whitespace-pre-wrap">
                    {activeChallenge.prompt}
                  </pre>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-purple-300">
                    Deadline: {activeChallenge.deadline.toLocaleTimeString()}
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                      onClick={() => handleChallengeComplete(false)}
                      variant="secondary"
                      size="sm"
                    >
                      Give Up
                    </ActionButton>
                    <ActionButton
                      onClick={() =>
                        handleChallengeComplete(true, undefined, false)
                      }
                      variant="primary"
                      size="sm"
                    >
                      Completed!
                    </ActionButton>
                    <ActionButton
                      onClick={() =>
                        handleChallengeComplete(true, undefined, true)
                      }
                      variant="gradient-purple"
                      size="sm"
                    >
                      Viral Success! 🚀
                    </ActionButton>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentMode === "results" && gameResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8"
            >
              {/* ENHANCED: Challenge-aware success screen */}
              {gameResult.challengeResult ? (
                <SuccessScreen
                  title="Challenge Result"
                  message="Your challenge adventure is complete!"
                  challengeResult={gameResult.challengeResult}
                  actions={getChallengeSuccessActions(
                    gameResult.challengeResult.challenge,
                    gameResult.challengeResult.success,
                    gameResult.challengeResult.totalReward,
                    gameResult.challengeResult.viralDetected || false,
                    startChallengeSelection,
                    backToMenu
                  )}
                  layout="two-column"
                  showConfetti={gameResult.challengeResult.success}
                  className="bg-transparent text-white"
                />
              ) : (
                // Original social game results
                <>
                  <div className="mb-8 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Game Complete!
                    </h2>
                    <p className="text-purple-200">Here's how you did:</p>
                  </div>

                  <div className="bg-purple-800 bg-opacity-50 rounded-xl p-8 mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <div className="text-3xl font-bold text-pink-400">
                          {gameResult.score}
                        </div>
                        <div className="text-purple-200">Final Score</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-green-400">
                          {gameResult.accuracy.toFixed(1)}%
                        </div>
                        <div className="text-purple-200">Accuracy</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-blue-400">
                          {gameResult.timeSpent.toFixed(1)}s
                        </div>
                        <div className="text-purple-200">Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {socialGameLevel}
                        </div>
                        <div className="text-purple-200">Level</div>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Connection Prompt for Rewards */}
                  {!isConnected && WEB3_CONFIG.features.socialEarning && (
                    <div className="mb-6">
                      <ConnectionIncentive
                        tier={tier}
                        context="game-complete"
                        compact={false}
                      />
                    </div>
                  )}

                  {/* LUB Balance Display for Connected Users */}
                  {isConnected && lubTokenEnabled && (
                    <div className="bg-green-500 bg-opacity-20 border border-green-400 rounded-xl p-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎉</div>
                        <p className="text-green-400 font-medium">
                          Current Balance: {balanceFormatted} LUB
                        </p>
                        <p className="text-green-200 text-sm">
                          Keep playing to earn more tokens!
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <SuccessScreen
                      title="Game Complete!"
                      message="Here's how you did:"
                      celebrationIcon="🎉"
                      actions={getSocialGameSuccessActions(
                        backToMenu,
                        backToMenu // Removed leaderboard, just go back to menu
                      )}
                      layout="two-column"
                      className="bg-transparent"
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ENHANCED: Profile Setup Mode */}
          {currentMode === "profile-setup" && currentUser && (
            <motion.div
              key="profile-setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
              🎨 Tune Your Creative Aura
              </h2>
              <ActionButton
              onClick={backToMenu}
              variant="secondary"
              size="sm"
              >
              Back
              </ActionButton>
              </div>

              <div className="bg-blue-900/30 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={currentUser.pfpUrl}
                    alt={currentUser.displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-white">{currentUser.displayName}</h3>
                    <p className="text-blue-200">@{currentUser.username}</p>
                  </div>
                </div>

                {/* AI-Detected Creative Powers */}
                <div className="mb-6">
                <h4 className="text-blue-300 font-semibold mb-3">✨ Your Creative Powers</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                {CollaborationService.analyzeSkills(currentUser).map((skill) => (
                <span
                key={skill}
                className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm rounded-full shadow-lg"
                >
                {CollaborationUtils.formatSkills([skill])[0]}
                </span>
                ))}
                </div>
                <p className="text-blue-200 text-sm">
                ✨ Magically detected from your creative journey! We'll use these superpowers to find your perfect creative matches.
                </p>
                </div>

                {/* Creative Collaboration Vibes */}
                <div className="mb-6">
                <h4 className="text-blue-300 font-semibold mb-3">🎭 Your Creative Vibe</h4>
                <div className="space-y-3">
                <div>
                <label className="block text-blue-200 text-sm mb-2">Creative Availability</label>
                <select className="w-full bg-blue-800/50 border border-blue-600 rounded-lg px-3 py-2 text-white">
                <option value="available">Ready for creative adventures ✨</option>
                <option value="busy">Deep in creative flow 🎨</option>
                <option value="unavailable">Taking a creative break 🌙</option>
                </select>
                </div>
                <div>
                <label className="block text-blue-200 text-sm mb-2">Open to creative sparks?</label>
                <div className="flex gap-3">
                <label className="flex items-center gap-2">
                <input type="radio" name="looking" value="yes" defaultChecked className="text-blue-400" />
                <span className="text-white">Yes! Let's create magic 💫</span>
                </label>
                <label className="flex items-center gap-2">
                <input type="radio" name="looking" value="no" className="text-blue-400" />
                <span className="text-white">Flying solo for now ✈️</span>
                </label>
                </div>
                </div>
                </div>
                </div>

                <div className="bg-blue-800/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                💡 <strong>Creative tip:</strong> The more you share your artistic vibes, the more magical collaborations we'll discover for you!
                </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <ActionButton
                  onClick={backToMenu}
                  variant="secondary"
                  fullWidth
                >
                  Save & Continue
                </ActionButton>
              </div>
            </motion.div>
          )}

          {/* Leaderboard mode removed - focusing on personal stats */}
        </AnimatePresence>
      </motion.div>

      {/* Earning notifications */}
      <ToastContainer />

      {/* Community Reporting Modal */}
      {ReportingModal}

      {/* Advanced Features Tips */}
      <SimpleOnboarding 
        tips={[{
          id: "advanced",
          icon: experienceTier === 'professional' ? "🤝" : "🌟",
          title: experienceTier === 'professional' ? "Professional Features" : "Advanced Features",
          message: experienceTier === 'professional' 
            ? "Discover collaboration opportunities and build amazing projects together!"
            : "Try creating custom challenges and connecting with the community!",
          action: { 
            text: experienceTier === 'professional' ? "Find Collaborators" : "Try Challenges", 
            onClick: experienceTier === 'professional' ? startCollaborationDiscovery : startChallengeSelection 
          }
        }]} 
        onComplete={() => {}} 
      />

      {/* Challenge Success Tips */}
      {gameResult?.challengeResult && (
        <SimpleOnboarding 
          tips={GAME_COMPLETE_TIPS} 
          onComplete={() => {}} 
        />
      )}
      
      {/* Collaboration Success Tips */}
      {currentMode === "collaboration-matching" && (
        <SimpleOnboarding 
          tips={[{
            id: "collaboration",
            icon: "🤝",
            title: "Collaboration Sent!",
            message: "Your collaboration spark is on its way. Great connections start with a simple spark!",
            action: { text: "Find More", onClick: startCollaborationDiscovery }
          }]} 
          onComplete={() => {}} 
        />
      )}
    </div>
  );
}

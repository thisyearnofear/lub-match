"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { FarcasterUser, GameResult } from "@/types/socialGames";
import { socialGameFactory } from "@/utils/socialGameFactory";
import UsernameGuessingGameComponent from "./UsernameGuessingGame";
import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import { useLubToken } from "@/hooks/useLubToken";
import { WEB3_CONFIG } from "@/config";
import { useEarningNotifications } from "./EarningToast";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";

import SuccessScreen from "./shared/SuccessScreen";
import ActionButton from "./shared/ActionButton";
import { useSuccessActions } from "@/hooks/useSuccessActions";
import { ConnectionIncentive } from "./shared/ConnectionIncentive";
import { useUserIdentity } from "@/contexts/UserContext";
import { GlobalLeaderboard } from "./GlobalLeaderboard";

interface SocialGamesHubProps {
  users: FarcasterUser[];
  onClose: () => void;
  onSkipToProposal?: () => void;
}

type GameMode =
  | "menu"
  | "username-guessing"
  | "pfp-matching"
  | "social-trivia"
  | "global-leaderboard"
  | "results";

export default function SocialGamesHub({
  users,
  onClose,
  onSkipToProposal,
}: SocialGamesHubProps) {
  const [currentMode, setCurrentMode] = useState<GameMode>("menu");
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );

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
    (user) => user.pfp_url && user.username && user.pfp_url.trim() !== ""
  );

  // Unified stats system
  const {
    formattedStats,
    recordSocialGameResult,
    recordGameCompletion,
    socialGameScore,
    socialGameAccuracy,
    socialGameLevel,
    gamesCompleted,
    socialGamesPlayed,
    tierDisplayName,
    tier,
  } = useUnifiedStats();

  const { earnLub, balanceFormatted, enabled: lubTokenEnabled } = useLubToken();
  const { showEarning, ToastContainer } = useEarningNotifications();

  // Use shared success actions hook
  const { getSocialGameSuccessActions } = useSuccessActions();

  // No need to load separate player data - using unified stats

  const startUsernameGuessingGame = () => {
    const game = socialGameFactory.createUsernameGuessingGame(
      validUsers,
      difficulty
    );
    setCurrentGame(game);
    setCurrentMode("username-guessing");
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
                    🎮{" "}
                    {farcasterUser?.username
                      ? `@${farcasterUser.username}`
                      : displayName || "Lubbers Anonymous"}
                  </h1>
                  <p className="text-purple-200">LUB me, or LUB me not?</p>

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
                      💝 Skip to Proposal
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
              <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                  <div className="mt-4 text-xs text-purple-200">
                    Earn LUB tokens & achievements!
                  </div>
                </motion.button>

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

          {currentMode === "results" && gameResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 text-center"
            >
              <div className="mb-8">
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
            </motion.div>
          )}

          {/* Leaderboard mode removed - focusing on personal stats */}
        </AnimatePresence>
      </motion.div>

      {/* Earning notifications */}
      <ToastContainer />
    </div>
  );
}

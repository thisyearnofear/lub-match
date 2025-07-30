"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  FarcasterUser,
  GameResult,
  LeaderboardEntry,
} from "@/types/socialGames";
import { socialGameFactory } from "@/utils/socialGameFactory";
import { gameStorage } from "@/utils/gameStorage";
import { scoreCalculator } from "@/utils/scoreCalculator";
import UsernameGuessingGameComponent from "./UsernameGuessingGame";
import { useUserProgression } from "@/utils/userProgression";
import { useLubToken } from "@/hooks/useLubToken";
import { WEB3_CONFIG } from "@/config";
import { useEarningNotifications } from "./EarningToast";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";
import { useHeartNFT } from "@/hooks/useHeartNFT";
import SuccessScreen from "./shared/SuccessScreen";
import ActionButton from "./shared/ActionButton";
import { useSuccessActions } from "@/hooks/useSuccessActions";

interface SocialGamesHubProps {
  users: FarcasterUser[];
  onClose: () => void;
}

type GameMode =
  | "menu"
  | "username-guessing"
  | "pfp-matching"
  | "social-trivia"
  | "leaderboard"
  | "results";

export default function SocialGamesHub({
  users,
  onClose,
}: SocialGamesHubProps) {
  const [currentMode, setCurrentMode] = useState<GameMode>("menu");
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<LeaderboardEntry | null>(null);
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

  // Filter users to only include those with valid profile pictures and usernames
  const validUsers = users.filter(
    (user) => user.pfp_url && user.username && user.pfp_url.trim() !== ""
  );

  // User progression integration
  const { features, recordEvent } = useUserProgression();
  const { earnLub, balanceFormatted, enabled: lubTokenEnabled } = useLubToken();
  const { showEarning, ToastContainer } = useEarningNotifications();

  // NFT minting integration
  const {
    mintCompletedHeartWithMetadata,
    isPending: isMintingNFT,
    enabled: nftEnabled,
    mintPrices,
  } = useHeartNFT();
  
  // Use shared success actions hook
  const { getSocialGameSuccessActions } = useSuccessActions();

  // Load player stats and leaderboard on mount
  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    const playerId = await gameStorage.generatePlayerId();
    const stats = await gameStorage.getPlayerStats(playerId);
    const board = await gameStorage.getLeaderboard(undefined, 10);

    setPlayerStats(stats);
    setLeaderboard(board);
  };

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
    loadPlayerData(); // Refresh stats

    // Record social game completion in user progression
    recordEvent({
      type: "social_game",
      timestamp: new Date().toISOString(),
      data: {
        gameId: result.gameId,
        score: result.score,
        maxScore: result.maxScore,
        accuracy: result.accuracy,
        timeSpent: result.timeSpent,
        difficulty,
        walletConnected: isConnected,
      },
    });

    // Award LUB tokens for game completion (if wallet connected and features enabled)
    if (
      isConnected &&
      features.tokenEarning &&
      WEB3_CONFIG.features.socialEarning
    ) {
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

  const showLeaderboard = () => {
    setCurrentMode("leaderboard");
  };

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
            {users.length} total.
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
                    🎮 Lubbers Anonymous
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

                    {/* Add to Favorites Button */}
                    {isInFarcaster && !farcasterContext?.client?.added && (
                      <button
                        onClick={async () => {
                          try {
                            const result = await addFrame();
                            if (result) {
                              showEarning(BigInt(0), "Added to favorites! 🌟");
                            }
                          } catch (error) {
                            console.error("Failed to add frame:", error);
                          }
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
                      >
                        ⭐ Add to Favorites
                      </button>
                    )}
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
              {playerStats && (
                <div className="bg-purple-800 bg-opacity-50 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Your Stats
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-400">
                        {playerStats.totalScore}
                      </div>
                      <div className="text-sm text-purple-200">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {playerStats.gamesPlayed}
                      </div>
                      <div className="text-sm text-purple-200">
                        Games Played
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {playerStats.averageAccuracy.toFixed(1)}%
                      </div>
                      <div className="text-sm text-purple-200">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-400">
                        {playerStats.farcasterKnowledgeLevel}
                      </div>
                      <div className="text-sm text-purple-200">Level</div>
                    </div>
                  </div>
                </div>
              )}

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

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={showLeaderboard}
                  className="bg-gradient-to-br from-yellow-600 to-orange-600 p-6 rounded-xl text-left hover:from-yellow-700 hover:to-orange-700 transition-all"
                >
                  <div className="text-2xl mb-2">🏆</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Leaderboard
                  </h3>
                  <p className="text-yellow-100 text-sm">
                    See how you rank against other players.
                  </p>
                  <div className="mt-4 text-xs text-yellow-200">
                    {leaderboard.length} players ranked
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
                      {playerStats?.farcasterKnowledgeLevel || "Newcomer"}
                    </div>
                    <div className="text-purple-200">Level</div>
                  </div>
                </div>
              </div>

              {/* Wallet Connection Prompt for Rewards */}
              {!isConnected && WEB3_CONFIG.features.socialEarning && (
                <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">💰</div>
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Missed LUB Rewards!
                    </h3>
                    <p className="text-yellow-200 text-sm mb-4">
                      Connect your wallet to earn{" "}
                      {WEB3_CONFIG.earning.socialGameWin.toString()} LUB tokens
                      for completing games
                    </p>
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button
                          onClick={openConnectModal}
                          className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all"
                        >
                          Connect Wallet for Rewards
                        </button>
                      )}
                    </ConnectButton.Custom>
                  </div>
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

              {/* NFT Minting Option */}
              {isConnected && nftEnabled && gameResult && (
                <div className="bg-blue-500 bg-opacity-20 border border-blue-400 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎨</div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">
                      Mint Your Achievement NFT!
                    </h3>
                    <p className="text-blue-200 text-sm mb-4">
                      Immortalize your game score as an NFT on the blockchain
                    </p>
                    {mintPrices && (
                      <p className="text-blue-300 text-xs mb-4">
                        Mint Price: {mintPrices.eth.toString()} ETH
                      </p>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          // Create heart data from game result
                          const heartData = {
                            imageHashes: [], // Would need actual image hashes
                            layout: Array(8)
                              .fill(0)
                              .map((_, i) => i), // Simple layout
                            message: `Social Game Score: ${gameResult.score}`,
                            completedAt: BigInt(Math.floor(Date.now() / 1000)),
                            creator:
                              "0x0000000000000000000000000000000000000000" as `0x${string}`,
                            completer:
                              "0x0000000000000000000000000000000000000000" as `0x${string}`,
                            gameType: "demo" as const,
                          };

                          await mintCompletedHeartWithMetadata(
                            heartData,
                            false
                          );
                          showEarning(BigInt(0), "NFT minted successfully! 🎨");
                        } catch (error) {
                          console.error("NFT minting failed:", error);
                          showEarning(
                            BigInt(0),
                            "NFT minting failed. Try again! ❌"
                          );
                        }
                      }}
                      disabled={isMintingNFT}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMintingNFT ? "Minting..." : "Mint NFT"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <SuccessScreen
                  title="Game Complete!"
                  message="Here's how you did:"
                  celebrationIcon="🎉"
                  actions={getSocialGameSuccessActions(backToMenu, showLeaderboard)}
                  layout="two-column"
                  className="bg-transparent"
                />
              </div>
            </motion.div>
          )}

          {currentMode === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">
                  🏆 Leaderboard
                </h2>
                <button
                  onClick={backToMenu}
                  className="text-purple-200 hover:text-white transition-colors"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.playerId || index}
                    className={`
                      bg-purple-800 bg-opacity-50 rounded-xl p-6 flex items-center justify-between
                      ${index < 3 ? "border-2 border-yellow-400" : ""}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                        text-2xl font-bold w-8 text-center
                        ${
                          index === 0
                            ? "text-yellow-400"
                            : index === 1
                            ? "text-gray-300"
                            : index === 2
                            ? "text-orange-400"
                            : "text-purple-200"
                        }
                      `}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {entry.playerName || "Anonymous Player"}
                        </div>
                        <div className="text-purple-200 text-sm">
                          {entry.farcasterKnowledgeLevel} • {entry.gamesPlayed}{" "}
                          games
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-400">
                        {entry.totalScore}
                      </div>
                      <div className="text-purple-200 text-sm">
                        {entry.averageAccuracy.toFixed(1)}% avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.length === 0 && (
                <div className="text-center text-purple-200 py-12">
                  <div className="text-4xl mb-4">🎮</div>
                  <p>No games played yet. Be the first to set a score!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Earning notifications */}
      <ToastContainer />
    </div>
  );
}

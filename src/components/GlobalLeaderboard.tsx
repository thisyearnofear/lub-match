"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalLeaderboard } from "@/hooks/useGlobalLeaderboard";
import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import { useAccount } from "wagmi";
import ActionButton from "@/components/shared/ActionButton";
import { WEB3_CONFIG } from "@/config";
import { TournamentManager } from "@/utils/tournamentManager";

interface GlobalLeaderboardProps {
  className?: string;
  onSubmitScore?: (time: number, accuracy: number) => void;
}

export function GlobalLeaderboard({
  className = "",
  onSubmitScore,
}: GlobalLeaderboardProps) {
  const { isConnected } = useAccount();
  const { formattedStats } = useUnifiedStats();
  const {
    topPlayers,
    userRank,
    globalStats,
    activeTournament,
    tournamentLeaderboard,
    userTournamentRank,
    canSubmitScore,
    canJoinTournament,
    isSubmitting,
    isJoiningTournament,
    isLoading,
    isInitialized,
    submitScore,
    joinTournament,
    nextSubmissionTime,
    submissionFee,
  } = useGlobalLeaderboard();

  const [activeTab, setActiveTab] = useState<"global" | "tournament">("global");
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    time: 0,
    accuracy: 0,
    farcasterUsername: "",
  });

  // Don't show if global leaderboard is not enabled
  if (!WEB3_CONFIG.features.globalLeaderboard) {
    return null;
  }

  const handleSubmitScore = async () => {
    if (
      !submissionData.time ||
      !submissionData.accuracy ||
      !submissionData.farcasterUsername
    ) {
      return;
    }

    const success = await submitScore(
      submissionData.time,
      submissionData.accuracy,
      submissionData.farcasterUsername
    );

    if (success) {
      setShowSubmissionForm(false);
      setSubmissionData({ time: 0, accuracy: 0, farcasterUsername: "" });
      onSubmitScore?.(submissionData.time, submissionData.accuracy);
    }
  };

  const formatTime = (seconds: number) => {
    return seconds > 0 ? `${seconds}s` : "N/A";
  };

  const formatAccuracy = (accuracy: number) => {
    return accuracy > 0 ? `${accuracy}%` : "N/A";
  };

  const getTournamentStatus = () => {
    if (!activeTournament) return null;

    const status = TournamentManager.getTournamentStatus(activeTournament);
    const timeRemaining = status.timeRemaining
      ? TournamentManager.formatDuration(status.timeRemaining)
      : null;
    const timeUntilStart = status.timeUntilStart
      ? TournamentManager.formatDuration(status.timeUntilStart)
      : null;

    return { ...status, timeRemaining, timeUntilStart };
  };

  const tournamentStatus = getTournamentStatus();

  if (!isConnected) {
    return (
      <div
        className={`bg-white rounded-xl shadow-lg p-6 border border-gray-200 ${className}`}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🌍 Global Leaderboard
          </h2>
          <p className="text-gray-600 mb-4">
            Connect your wallet to compete globally and earn LUB tokens!
          </p>
          <div className="text-sm text-gray-500">
            • Submit scores to global leaderboard (10 LUB fee)
            <br />
            • Earn achievements and LUB rewards
            <br />• Join tournaments with prize pools
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div
        className={`bg-white rounded-xl shadow-lg p-6 border border-gray-200 ${className}`}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🌍 Global Leaderboard
          </h2>
          <div className="animate-pulse">
            <div className="text-gray-600">
              Initializing global leaderboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 border border-gray-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🌍 Global Leaderboard
        </h2>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("global")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "global"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab("tournament")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "tournament"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Tournament
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {globalStats.totalPlayers}
          </div>
          <div className="text-xs text-gray-600">Total Players</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {globalStats.totalSubmissions}
          </div>
          <div className="text-xs text-gray-600">Submissions</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {Math.round(globalStats.totalLubDistributed)}
          </div>
          <div className="text-xs text-gray-600">LUB Distributed</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {userRank > 0 ? `#${userRank}` : "Unranked"}
          </div>
          <div className="text-xs text-gray-600">Your Rank</div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "global" && (
          <motion.div
            key="global"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Submission Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-blue-800">
                  Submit Your Score
                </h3>
                <div className="text-sm text-blue-600">
                  Fee: {submissionFee}
                </div>
              </div>

              {canSubmitScore ? (
                <div className="space-y-3">
                  <div className="text-sm text-green-600 font-medium">
                    ✅ Ready to submit! Use your best local score.
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Best Time:</span>{" "}
                      {formattedStats.photoPairBestTime}
                    </div>
                    <div>
                      <span className="font-medium">Best Accuracy:</span>{" "}
                      {formattedStats.photoPairBestAccuracy}
                    </div>
                  </div>
                  <ActionButton
                    onClick={() => setShowSubmissionForm(true)}
                    variant="gradient-purple"
                    size="sm"
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : "Submit to Global Leaderboard"}
                  </ActionButton>
                </div>
              ) : (
                <div className="text-sm text-orange-600">
                  ⏳ {nextSubmissionTime}
                </div>
              )}
            </div>

            {/* Top Players */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">
                🏆 Top Players
              </h3>

              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-100 h-12 rounded-lg"
                    />
                  ))}
                </div>
              ) : topPlayers.addresses.length > 0 ? (
                <div className="space-y-2">
                  {topPlayers.addresses.map((address, index) => (
                    <div
                      key={address}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0
                          ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                          : index === 1
                          ? "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                          : index === 2
                          ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            @{topPlayers.usernames[index] || "Anonymous"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">
                          {formatTime(topPlayers.times[index])}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatAccuracy(topPlayers.accuracies[index])}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No global submissions yet. Be the first!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "tournament" && (
          <motion.div
            key="tournament"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTournament ? (
              <div className="space-y-4">
                {/* Tournament Info */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-green-800">
                      🏆 {activeTournament.name}
                    </h3>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tournamentStatus?.status === "active"
                          ? "bg-green-100 text-green-800"
                          : tournamentStatus?.status === "upcoming"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tournamentStatus?.status === "active" &&
                        `Active • ${tournamentStatus.timeRemaining} left`}
                      {tournamentStatus?.status === "upcoming" &&
                        `Starts in ${tournamentStatus.timeUntilStart}`}
                      {tournamentStatus?.status === "ended" && "Ended"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Entry Fee:</span>{" "}
                      {activeTournament.entryFee} LUB
                    </div>
                    <div>
                      <span className="font-medium">Prize Pool:</span>{" "}
                      {activeTournament.prizePool} LUB
                    </div>
                    <div>
                      <span className="font-medium">Participants:</span>{" "}
                      {activeTournament.participants.length}/
                      {activeTournament.maxParticipants}
                    </div>
                    <div>
                      <span className="font-medium">Your Rank:</span>{" "}
                      {userTournamentRank > 0
                        ? `#${userTournamentRank}`
                        : "Not joined"}
                    </div>
                  </div>

                  {canJoinTournament &&
                    tournamentStatus?.status === "active" && (
                      <div className="mt-3">
                        <ActionButton
                          onClick={joinTournament}
                          variant="gradient-green"
                          size="sm"
                          disabled={isJoiningTournament}
                          fullWidth
                        >
                          {isJoiningTournament
                            ? "Joining..."
                            : `Join Tournament (${activeTournament.entryFee} LUB)`}
                        </ActionButton>
                      </div>
                    )}
                </div>

                {/* Tournament Leaderboard */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    🏅 Tournament Leaderboard
                  </h3>

                  {tournamentLeaderboard.players.length > 0 ? (
                    <div className="space-y-2">
                      {tournamentLeaderboard.players.map((player, index) => (
                        <div
                          key={player}
                          className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-lg font-bold">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {player.slice(0, 6)}...{player.slice(-4)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {formatTime(tournamentLeaderboard.times[index])}
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatAccuracy(
                                tournamentLeaderboard.accuracies[index]
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No tournament submissions yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-lg font-medium mb-2">
                  No Active Tournament
                </div>
                <div className="text-sm">
                  Check back later for upcoming tournaments!
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission Form Modal */}
      <AnimatePresence>
        {showSubmissionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowSubmissionForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Submit to Global Leaderboard
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Completion Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={submissionData.time || ""}
                    onChange={(e) =>
                      setSubmissionData((prev) => ({
                        ...prev,
                        time: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 45"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accuracy (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={submissionData.accuracy || ""}
                    onChange={(e) =>
                      setSubmissionData((prev) => ({
                        ...prev,
                        accuracy: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farcaster Username
                  </label>
                  <input
                    type="text"
                    value={submissionData.farcasterUsername}
                    onChange={(e) =>
                      setSubmissionData((prev) => ({
                        ...prev,
                        farcasterUsername: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., yourname"
                  />
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  <div className="font-medium mb-1">
                    Submission Fee: {submissionFee}
                  </div>
                  <div>This will be deducted from your LUB balance.</div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <ActionButton
                  onClick={() => setShowSubmissionForm(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  onClick={handleSubmitScore}
                  variant="gradient-purple"
                  size="sm"
                  disabled={
                    !submissionData.time ||
                    !submissionData.accuracy ||
                    !submissionData.farcasterUsername ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </ActionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

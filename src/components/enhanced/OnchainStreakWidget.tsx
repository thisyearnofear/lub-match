/**
 * Enhanced LUB Balance Widget with Onchain Streak Integration
 * 
 * Seamlessly integrates onchain-based login streak tracking with existing
 * LubBalanceWidget design patterns for persistent, cross-device streak display
 */

"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnchainLoginStreak, useStreakRewards } from '@/utils/onchainLoginStreak';
import { useLubToken } from '@/hooks/useLubToken';
import { useEarningNotifications } from '@/components/EarningToast';
import { formatEther } from 'viem';
import { Coins, Flame, Trophy, Calendar, Activity, Clock } from 'lucide-react';

interface OnchainStreakWidgetProps {
  className?: string;
  showFullDetails?: boolean;
  position?: 'inline' | 'floating';
}

export function OnchainStreakWidget({ 
  className = '', 
  showFullDetails = false,
  position = 'inline' 
}: OnchainStreakWidgetProps) {
  const { balanceFormatted } = useLubToken();
  const streakRewards = useStreakRewards();
  const { showEarning } = useEarningNotifications();
  const [showDetails, setShowDetails] = useState(false);

  const {
    currentStreak,
    longestStreak,
    totalActiveDays,
    recentActivities,
    isLoading,
    error,
    getStreakMultiplier,
    calculateStreakReward,
    getStreakMilestone
  } = streakRewards;

  const streakMilestone = getStreakMilestone();
  const currentMultiplier = getStreakMultiplier();
  const dailyReward = calculateStreakReward();

  // Handle claiming streak rewards (if applicable)
  const handleClaimStreakReward = useCallback(() => {
    if (currentStreak > 0) {
      const rewardAmount = calculateStreakReward();
      showEarning(rewardAmount, `Streak Bonus (${currentMultiplier.toFixed(1)}x)`);
    }
  }, [currentStreak, calculateStreakReward, showEarning, currentMultiplier]);

  const containerClass = position === 'floating' 
    ? 'fixed top-4 right-4 z-50' 
    : 'relative';

  if (error) {
    return (
      <div className={`${containerClass} ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          Failed to load streak data
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClass} ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm border border-pink-100 rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Main Balance & Streak Display */}
        <div 
          className="p-4 cursor-pointer hover:bg-pink-50/50 transition-colors"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center justify-between">
            {/* LUB Balance */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">
                  {balanceFormatted || '0'} LUB
                </div>
                <div className="text-xs text-gray-500">
                  {isLoading ? 'Loading...' : `${totalActiveDays} active days`}
                </div>
              </div>
            </div>

            {/* Streak Display */}
            <div className="flex items-center gap-2">
              {currentStreak > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full"
                >
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">
                    {currentStreak}
                  </span>
                </motion.div>
              )}
              
              {streakMilestone.milestone && (
                <div className="text-lg" title={streakMilestone.milestone}>
                  {streakMilestone.emoji}
                </div>
              )}
            </div>
          </div>

          {/* Streak Multiplier Badge */}
          {currentStreak > 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-2 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-2"
            >
              <span className="text-xs font-medium text-orange-700">
                Streak Multiplier: {currentMultiplier.toFixed(1)}x
              </span>
              <span className="text-xs text-green-600 font-medium">
                +{formatEther(dailyReward)} LUB daily
              </span>
            </motion.div>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {(showDetails || showFullDetails) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-pink-100 bg-pink-50/30"
            >
              <div className="p-4 space-y-3">
                {/* Streak Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-gray-600">Current</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {currentStreak}
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">Best</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {longestStreak}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {recentActivities.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                      <Activity className="w-3 h-3" />
                      Recent Activity
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {recentActivities.slice(0, 3).map((activity, index) => (
                        <motion.div
                          key={`${activity.transactionHash}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between text-xs bg-white/40 rounded p-2"
                        >
                          <div className="flex items-center gap-2">
                            {activity.type === 'score_submitted' && (
                              <div className="p-1 bg-blue-100 rounded">
                                <Activity className="w-2 h-2 text-blue-600" />
                              </div>
                            )}
                            {activity.type === 'achievement_unlocked' && (
                              <div className="p-1 bg-yellow-100 rounded">
                                <Trophy className="w-2 h-2 text-yellow-600" />
                              </div>
                            )}
                            {activity.type === 'tournament_joined' && (
                              <div className="p-1 bg-purple-100 rounded">
                                <Calendar className="w-2 h-2 text-purple-600" />
                              </div>
                            )}
                            <span className="text-gray-700">
                              {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-2 h-2" />
                            <span>{activity.date}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestone Progress */}
                {currentStreak < 30 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Next Milestone</span>
                      <span>{getNextMilestoneText(currentStreak)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getNextMilestoneProgress(currentStreak)}%` }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border border-gray-300 border-t-orange-500 rounded-full"
                    />
                    Syncing with blockchain...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Helper functions
function getNextMilestoneText(currentStreak: number): string {
  if (currentStreak < 3) return "3 days (Consistent)";
  if (currentStreak < 7) return "7 days (Week Champion)";
  if (currentStreak < 14) return "14 days (Two Week Warrior)";
  if (currentStreak < 30) return "30 days (Month Master)";
  return "Max reached!";
}

function getNextMilestoneProgress(currentStreak: number): number {
  if (currentStreak < 3) return (currentStreak / 3) * 100;
  if (currentStreak < 7) return ((currentStreak - 3) / 4) * 100;
  if (currentStreak < 14) return ((currentStreak - 7) / 7) * 100;
  if (currentStreak < 30) return ((currentStreak - 14) / 16) * 100;
  return 100;
}

/**
 * Simplified version for integration into existing LubBalanceWidget
 */
export function StreakBadge() {
  const { currentStreak, isLoading } = useOnchainLoginStreak();

  if (isLoading || currentStreak === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full ml-2"
    >
      <Flame className="w-3 h-3 text-orange-500" />
      <span className="text-sm font-medium text-orange-700">
        {currentStreak}
      </span>
    </motion.div>
  );
}

/**
 * Floating streak indicator for minimal UI presence
 */
export function FloatingStreakIndicator() {
  const { currentStreak, getStreakMilestone } = useStreakRewards();

  if (currentStreak === 0) return null;

  const milestone = getStreakMilestone();

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed top-4 left-4 z-40 bg-white/90 backdrop-blur-sm border border-orange-200 rounded-full p-2 shadow-lg"
    >
      <div className="flex items-center gap-1">
        <span className="text-lg">{milestone.emoji}</span>
        <span className="text-sm font-bold text-orange-700">{currentStreak}</span>
      </div>
    </motion.div>
  );
}

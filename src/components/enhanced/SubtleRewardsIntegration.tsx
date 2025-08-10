/**
 * Subtle Rewards Integration
 * 
 * Enhances existing game completion flow with optional earning notifications
 * without cluttering the UI or changing the core aesthetic.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { formatRewardAmount } from "@/utils/enhancedRewards";
import { useEnhancedProgression } from "@/utils/enhancedProgression";
import { WEB3_CONFIG } from "@/config";

interface SubtleRewardNotificationProps {
  show: boolean;
  rewards: Array<{ amount: bigint; description: string; type: string }>;
  onComplete: () => void;
}

// Subtle notification that appears briefly after game completion
export function SubtleRewardNotification({ 
  show, 
  rewards, 
  onComplete 
}: SubtleRewardNotificationProps) {
  const totalAmount = rewards.reduce((sum, reward) => sum + reward.amount, BigInt(0));

  useEffect(() => {
    if (show && rewards.length > 0) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000); // Brief appearance
      return () => clearTimeout(timer);
    }
  }, [show, rewards.length, onComplete]);

  if (!show || rewards.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
      >
        <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm text-white rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">✨</span>
            <span className="font-medium">+{formatRewardAmount(totalAmount)}</span>
            <span className="opacity-80">{rewards[0]?.description || "earned!"}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for subtle rewards integration with existing game flow
export function useSubtleRewards() {
  const { recordEnhancedEvent, recentRewards, clearRecentRewards } = useEnhancedProgression();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationRewards, setNotificationRewards] = useState<typeof recentRewards>([]);

  // Enhanced game completion that works with existing flow
  const recordGameCompletionWithRewards = (
    gameData: {
      completionTime: number;
      accuracy: number;
      isFirstToday?: boolean;
    }
  ) => {
    // Record in enhanced system and get rewards
    const result = recordEnhancedEvent(
      { type: 'game_complete', timestamp: new Date().toISOString() },
      gameData
    );

    // Only show notification if there are meaningful rewards and user is engaged+
    if (result.rewards.length > 0 && result.progress.tier !== 'newcomer') {
      setNotificationRewards(result.rewards.map(r => ({
        amount: r.amount,
        description: r.description,
        type: r.type,
        emoji: '✨'
      })));
      setShowNotification(true);
    }

    return result;
  };

  const handleNotificationComplete = () => {
    setShowNotification(false);
    setNotificationRewards([]);
    clearRecentRewards();
  };

  return {
    recordGameCompletionWithRewards,
    showNotification,
    notificationRewards,
    handleNotificationComplete,
  };
}

// Enhanced LUB Balance Widget with streak indicator
export function EnhancedLubBalanceWidget() {
  const { enhancedData, dailyEarningInfo, progress } = useEnhancedProgression();
  
  // Only show streak indicator for engaged+ users
  if (progress.tier === 'newcomer' || enhancedData.currentLoginStreak < 2) {
    return null; // Don't clutter for new users
  }

  return (
    <motion.div
      className="fixed top-16 right-4 z-40"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-orange-200">
        <div className="flex items-center gap-1 text-xs">
          <span>🔥</span>
          <span className="font-medium text-orange-600">
            {enhancedData.currentLoginStreak}
          </span>
          <span className="text-orange-500/80">day streak</span>
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced Success Screen additional content (optional)
export function RewardsSummaryContent({ rewards }: { rewards: Array<{ amount: bigint; description: string; type: string }> }) {
  if (rewards.length === 0) return null;

  const totalEarned = rewards.reduce((sum, reward) => sum + reward.amount, BigInt(0));

  return (
    <motion.div
      className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-1">Session Earnings</div>
        <div className="font-bold text-purple-600 text-lg">
          +{formatRewardAmount(totalEarned)} LUB
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {rewards.length} bonus{rewards.length !== 1 ? 'es' : ''} earned
        </div>
      </div>
    </motion.div>
  );
}

// Daily earning progress indicator (subtle)
export function DailyEarningProgress() {
  const { dailyEarningInfo, progress } = useEnhancedProgression();
  
  // Only show for power users who are actively earning
  if (progress.tier !== 'power-user' || dailyEarningInfo.earned === BigInt(0)) {
    return null;
  }

  const progressPercent = (Number(dailyEarningInfo.earned) / Number(dailyEarningInfo.cap)) * 100;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-30"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2 }}
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm border border-purple-200">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-12 h-2 bg-purple-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <span className="text-purple-600 font-medium">
            {formatRewardAmount(dailyEarningInfo.earned)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

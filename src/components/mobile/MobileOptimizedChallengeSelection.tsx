/**
 * Mobile-Optimized Challenge Selection
 * PERFORMANT: Touch-friendly interactions with haptic feedback
 * CLEAN: Simplified UI for small screens
 * MODULAR: Reusable mobile-first challenge components
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FarcasterUser } from "@/utils/mockData";
import { ChallengeDifficulty } from "@/services/challengeEngine";
import { classifyUserByFollowers, getWhaleEmoji } from "@/hooks/useFarcasterUsers";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";
import ActionButton from "../shared/ActionButton";

interface MobileOptimizedChallengeSelectionProps {
  users: FarcasterUser[];
  difficulty: ChallengeDifficulty;
  onTargetSelect: (user: FarcasterUser) => void;
  onDifficultyChange: (difficulty: ChallengeDifficulty) => void;
  onBack: () => void;
  className?: string;
}

export default function MobileOptimizedChallengeSelection({
  users,
  difficulty,
  onTargetSelect,
  onDifficultyChange,
  onBack,
  className = ""
}: MobileOptimizedChallengeSelectionProps) {
  const { isInFarcaster, context } = useMiniAppReady();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'whales' | 'rising'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Haptic feedback for Farcaster mini-app
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (isInFarcaster && context?.features?.haptics) {
      try {
        // Farcaster SDK haptic feedback (if available)
        (window as any).fc?.haptic?.(type);
      } catch (error) {
        console.log('Haptic feedback not available:', error);
      }
    }
  };

  // Filter users based on category and difficulty
  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by category
    if (selectedCategory === 'whales') {
      filtered = filtered.filter(user => user.follower_count >= 10000);
    } else if (selectedCategory === 'rising') {
      filtered = filtered.filter(user => 
        user.follower_count >= 1000 && user.follower_count < 10000
      );
    }

    // Sort by follower count for better mobile display
    filtered.sort((a, b) => b.follower_count - a.follower_count);

    // Limit results for mobile performance
    return filtered.slice(0, 20);
  };

  const filteredUsers = getFilteredUsers();

  const handleTargetSelect = async (user: FarcasterUser) => {
    triggerHaptic('medium');
    setIsLoading(true);
    
    // Small delay for better UX feedback
    setTimeout(() => {
      onTargetSelect(user);
      setIsLoading(false);
    }, 300);
  };

  const handleDifficultyChange = (newDifficulty: ChallengeDifficulty) => {
    triggerHaptic('light');
    onDifficultyChange(newDifficulty);
  };

  const handleCategoryChange = (category: 'all' | 'whales' | 'rising') => {
    triggerHaptic('light');
    setSelectedCategory(category);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 ${className}`}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <h1 className="text-lg font-bold text-white">Choose Target</h1>
          
          <div className="w-16" /> {/* Spacer for center alignment */}
        </div>

        {/* Mobile Difficulty Selector */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as ChallengeDifficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => handleDifficultyChange(diff)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  difficulty === diff
                    ? 'bg-white text-purple-900 shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Category Tabs */}
        <div className="px-4 pb-4">
          <div className="flex gap-1 bg-black/20 rounded-lg p-1">
            {[
              { key: 'all', label: 'All', icon: '👥' },
              { key: 'rising', label: 'Rising', icon: '📈' },
              { key: 'whales', label: 'Whales', icon: '🐋' }
            ].map((category) => (
              <button
                key={category.key}
                onClick={() => handleCategoryChange(category.key as any)}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                  selectedCategory === category.key
                    ? 'bg-white text-purple-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm">{category.icon}</span>
                  <span>{category.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile User Grid */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-3"
          >
            {filteredUsers.map((user, index) => {
              const whaleType = classifyUserByFollowers(user.follower_count);
              const whaleEmoji = getWhaleEmoji(whaleType);
              const rewardMultiplier = whaleType === 'mega_whale' ? '25x' :
                                     whaleType === 'whale' ? '10x' :
                                     whaleType === 'shark' ? '5x' :
                                     whaleType === 'fish' ? '2x' : '1x';

              return (
                <motion.button
                  key={user.fid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleTargetSelect(user)}
                  disabled={isLoading}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Profile Image */}
                    <div className="relative">
                      <img
                        src={user.pfp_url}
                        alt={user.display_name}
                        className="w-12 h-12 rounded-full border-2 border-white/30"
                      />
                      {whaleType !== 'minnow' && (
                        <div className="absolute -top-1 -right-1 text-lg">
                          {whaleEmoji}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-semibold text-sm truncate">
                        {user.display_name}
                      </h3>
                      <p className="text-white/70 text-xs truncate">
                        @{user.username}
                      </p>
                      <p className="text-white/50 text-xs">
                        {user.follower_count.toLocaleString()} followers
                      </p>
                    </div>

                    {/* Reward Multiplier */}
                    <div className="text-right">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                        {rewardMultiplier}
                      </div>
                      <p className="text-white/50 text-xs mt-1">
                        {difficulty === 'easy' ? '50-100' :
                         difficulty === 'medium' ? '200-500' :
                         '500-2500'} LUB
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-white text-lg font-semibold mb-2">
              No users found
            </h3>
            <p className="text-white/70 text-sm">
              Try adjusting your filters or difficulty level
            </p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/20 backdrop-blur-md border-t border-white/10">
        <div className="flex gap-3">
          <ActionButton
            onClick={onBack}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </ActionButton>
          
          <div className="flex-2 text-center">
            <p className="text-white/70 text-xs">
              {filteredUsers.length} targets available
            </p>
            <p className="text-white text-sm font-medium">
              Tap to challenge
            </p>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-white font-medium">Creating challenge...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

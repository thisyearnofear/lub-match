/** Contextual Help Component - Provides helpful hints at the right time
 * DELIGHT: Gentle guidance feels supportive, not intrusive
 * ENGAGEMENT: Helps users discover features they might miss
 * INTUITIVE: Context-aware suggestions improve discoverability
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialUser } from "@/types/socialGames";
import { useOptimizedAnimation } from "@/utils/animations";

interface ContextualHelpProps {
  user: SocialUser;
  currentTier: string;
  gameHistory: any[];
  currentView: string; // 'home', 'game', 'social', 'create', etc.
  recentActions: string[]; // Recent user actions for context
  onDismiss?: (helpId: string) => void;
}

interface HelpTip {
  id: string;
  condition: (props: ContextualHelpProps) => boolean;
  priority: number; // Higher = more important
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  autoDismiss?: number; // Auto dismiss after X seconds
}

const HELP_TIPS: HelpTip[] = [
  // First-time user guidance
  {
    id: 'welcome-first-game',
    condition: ({ gameHistory }) => gameHistory.length === 0,
    priority: 10,
    icon: '🎮',
    title: 'Ready to play?',
    message: 'Click the heart to start your first magical memory game!',
    position: 'center',
    autoDismiss: 10000
  },

  // Social features discovery
  {
    id: 'discover-social',
    condition: ({ gameHistory, currentTier }) => gameHistory.length >= 2 && currentTier === 'love',
    priority: 8,
    icon: '🎭',
    title: 'Unlock more magic!',
    message: 'Play a few more games to unlock social features and meet fellow creators!',
    position: 'bottom-right'
  },

  // Professional tier hint
  {
    id: 'professional-unlock',
    condition: ({ currentTier }) => currentTier === 'social',
    priority: 7,
    icon: '🎨',
    title: 'Creative collaboration awaits!',
    message: 'Complete a few more challenges to unlock magical creative matching!',
    position: 'top-right'
  },

  // Profile enhancement
  {
    id: 'enhance-profile',
    condition: ({ user, currentTier }) =>
      currentTier === 'professional' && (!user.collaborationProfile || !user.bio),
    priority: 6,
    icon: '✨',
    title: 'Boost your creative aura!',
    message: 'Add more details to your profile to attract better creative matches.',
    action: {
      label: 'Enhance Profile',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('openProfileSetup'));
      }
    },
    position: 'bottom-left'
  },

  // Game-specific hints
  {
    id: 'game-hint-streak',
    condition: ({ recentActions }) => recentActions.includes('game_win'),
    priority: 9,
    icon: '🔥',
    title: 'On fire!',
    message: 'Keep the momentum going! Try another game to build your creative streak.',
    position: 'top-left',
    autoDismiss: 8000
  },

  // Collaboration discovery
  {
    id: 'collaboration-ready',
    condition: ({ currentTier, recentActions }) =>
      currentTier === 'professional' && recentActions.includes('profile_updated'),
    priority: 8,
    icon: '🤝',
    title: 'Find your creative match!',
    message: 'Your profile is ready! Discover creators who complement your magic.',
    action: {
      label: 'Find Matches',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('navigateToCollaboration'));
      }
    },
    position: 'center'
  },

  // Social sharing encouragement
  {
    id: 'share-encouragement',
    condition: ({ gameHistory }) => gameHistory.length >= 3 && !gameHistory.some(g => g.shared),
    priority: 5,
    icon: '💫',
    title: 'Share the magic!',
    message: 'Share your creations with friends to spread the creative love!',
    position: 'bottom-right'
  },

  // NFT minting hint
  {
    id: 'nft-discovery',
    condition: ({ gameHistory, currentTier }) =>
      gameHistory.length >= 5 && currentTier !== 'love' && !gameHistory.some(g => g.nftMinted),
    priority: 6,
    icon: '💎',
    title: 'Preserve your magic!',
    message: 'Turn your completed games into permanent digital keepsakes!',
    position: 'top-right'
  }
];

export default function ContextualHelp({
  user,
  currentTier,
  gameHistory,
  currentView,
  recentActions,
  onDismiss
}: ContextualHelpProps) {
  const [activeTip, setActiveTip] = useState<HelpTip | null>(null);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  const helpAnimation = useOptimizedAnimation("avatarPop");

  // Filter and prioritize tips
  useEffect(() => {
    const availableTips = HELP_TIPS
      .filter(tip =>
        !dismissedTips.has(tip.id) &&
        tip.condition({ user, currentTier, gameHistory, currentView, recentActions })
      )
      .sort((a, b) => b.priority - a.priority);

    if (availableTips.length > 0) {
      setActiveTip(availableTips[0]);

      // Auto-dismiss if configured
      if (availableTips[0].autoDismiss) {
        setTimeout(() => {
          handleDismiss(availableTips[0].id);
        }, availableTips[0].autoDismiss);
      }
    } else {
      setActiveTip(null);
    }
  }, [user, currentTier, gameHistory, currentView, recentActions, dismissedTips]);

  const handleDismiss = (tipId: string) => {
    setDismissedTips(prev => new Set([...prev, tipId]));
    setActiveTip(null);
    onDismiss?.(tipId);
  };

  if (!activeTip) return null;

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default: return 'top-4 right-4';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        {...helpAnimation}
        className={`fixed ${getPositionClasses(activeTip.position)} z-30 max-w-xs`}
      >
        <motion.div
          className="bg-gradient-to-r from-indigo-900/95 to-purple-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/20"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-2xl"
            >
              {activeTip.icon}
            </motion.div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm mb-1">
                {activeTip.title}
              </h4>
              <p className="text-indigo-200 text-xs leading-relaxed">
                {activeTip.message}
              </p>

              {activeTip.action && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    activeTip.action?.onClick();
                    handleDismiss(activeTip.id);
                  }}
                  className="mt-3 bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors w-full"
                >
                  {activeTip.action.label}
                </motion.button>
              )}
            </div>

            <button
              onClick={() => handleDismiss(activeTip.id)}
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </motion.div>

        {/* Subtle pointer for non-center positions */}
        {activeTip.position !== 'center' && (
          <div className={`absolute w-3 h-3 bg-gradient-to-r from-indigo-900 to-purple-900 transform rotate-45 ${
            activeTip.position.includes('top') ? 'top-full -mt-1.5' : 'bottom-full -mb-1.5'
          } ${
            activeTip.position.includes('left') ? 'left-6' : 'right-6'
          }`} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

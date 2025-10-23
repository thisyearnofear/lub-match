/** Social Engagement Component - Makes social interactions more delightful
 * DELIGHT: Playful social interactions feel magical
 * ENGAGEMENT: Encourages meaningful connections
 * INTUITIVE: Clear social cues and easy interactions
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialUser } from "@/types/socialGames";
import { useOptimizedAnimation } from "@/utils/animations";
import ActionButton from "../shared/ActionButton";

interface SocialEngagementProps {
  users: SocialUser[];
  currentUser: SocialUser;
  context: 'game_complete' | 'collaboration_match' | 'social_game' | 'profile_view';
  onInteraction: (type: string, targetUser: SocialUser, data?: any) => void;
  onClose?: () => void;
}

interface SocialPrompt {
  id: string;
  emoji: string;
  title: string;
  message: string;
  actions: Array<{
    label: string;
    emoji: string;
    type: 'compliment' | 'collaborate' | 'follow' | 'share' | 'play_again';
    delight: string; // Fun message shown after action
  }>;
}

const SOCIAL_PROMPTS: Record<string, SocialPrompt> = {
  game_complete: {
    id: 'game_complete',
    emoji: '🎉',
    title: 'Amazing game!',
    message: 'You just created something magical. Share the love!',
    actions: [
      {
        label: 'Send Kudos',
        emoji: '🙌',
        type: 'compliment',
        delight: '✨ Kudos sent! They\'ll feel the magic!'
      },
      {
        label: 'Play Together',
        emoji: '🎮',
        type: 'play_again',
        delight: '🎭 Game invite sent! Double the fun!'
      },
      {
        label: 'Share Their Art',
        emoji: '💫',
        type: 'share',
        delight: '🌟 Shared! Spreading the creative joy!'
      }
    ]
  },
  collaboration_match: {
    id: 'collaboration_match',
    emoji: '🎨',
    title: 'Creative sparks flying!',
    message: 'You two would make amazing magic together!',
    actions: [
      {
        label: 'Send Spark',
        emoji: '✨',
        type: 'collaborate',
        delight: '💫 Collaboration spark sent! Magic incoming!'
      },
      {
        label: 'Creative Compliment',
        emoji: '🌟',
        type: 'compliment',
        delight: '✨ Compliment delivered! Creative vibes amplified!'
      },
      {
        label: 'Follow Their Journey',
        emoji: '👀',
        type: 'follow',
        delight: '👁️ Following! Staying updated on their magic!'
      }
    ]
  },
  social_game: {
    id: 'social_game',
    emoji: '🎭',
    title: 'Social magic!',
    message: 'You connected with creative souls today!',
    actions: [
      {
        label: 'High Five',
        emoji: '🙏',
        type: 'compliment',
        delight: '🙏 High five delivered! Connection strengthened!'
      },
      {
        label: 'Keep Playing',
        emoji: '🎪',
        type: 'play_again',
        delight: '🎪 More games incoming! The fun continues!'
      },
      {
        label: 'Share the Joy',
        emoji: '💫',
        type: 'share',
        delight: '💫 Joy shared! Spreading the social magic!'
      }
    ]
  },
  profile_view: {
    id: 'profile_view',
    emoji: '👀',
    title: 'Creative profile discovered!',
    message: 'Their creative aura is calling to you!',
    actions: [
      {
        label: 'Show Appreciation',
        emoji: '💖',
        type: 'compliment',
        delight: '💖 Appreciation sent! Creative vibes amplified!'
      },
      {
        label: 'Creative Connection',
        emoji: '🤝',
        type: 'collaborate',
        delight: '🤝 Connection sparked! Creative partnership brewing!'
      },
      {
        label: 'Follow Their Art',
        emoji: '🎨',
        type: 'follow',
        delight: '🎨 Following their creative journey!'
      }
    ]
  }
};

export default function SocialEngagement({
  users,
  currentUser,
  context,
  onInteraction,
  onClose
}: SocialEngagementProps) {
  const [selectedUsers, setSelectedUsers] = useState<SocialUser[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<SocialPrompt | null>(null);
  const [delightMessage, setDelightMessage] = useState<string>('');

  const engagementAnimation = useOptimizedAnimation("avatarPop");

  // Initialize based on context
  useEffect(() => {
    const prompt = SOCIAL_PROMPTS[context];
    if (prompt) {
      setCurrentPrompt(prompt);

      // Select 1-3 relevant users based on context
      const relevantUsers = getRelevantUsers(users, currentUser, context);
      setSelectedUsers(relevantUsers.slice(0, 3));
    }
  }, [context, users, currentUser]);

  const getRelevantUsers = (allUsers: SocialUser[], current: SocialUser, ctx: string): SocialUser[] => {
    // Filter out current user and sort by relevance
    return allUsers
      .filter(user => user.username !== current.username)
      .sort((a, b) => {
        // Prioritize recently active users, high engagement, etc.
        const aScore = Math.random(); // Simplified - could be based on recent interactions
        const bScore = Math.random();
        return bScore - aScore;
      });
  };

  const handleAction = (action: SocialPrompt['actions'][0], targetUser: SocialUser) => {
    // Show delight message
    setDelightMessage(action.delight);

    // Trigger interaction
    onInteraction(action.type, targetUser, {
      context,
      prompt: currentPrompt?.id,
      action: action.type
    });

    // Hide delight after 3 seconds
    setTimeout(() => setDelightMessage(''), 3000);
  };

  if (!currentPrompt || selectedUsers.length === 0) return null;

  return (
    <motion.div
      {...engagementAnimation}
      className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto"
    >
      <motion.div
        className="bg-gradient-to-r from-rose-900/95 to-pink-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-rose-400/30"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentPrompt.emoji}</span>
            <h3 className="text-white font-semibold text-sm">{currentPrompt.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Message */}
        <p className="text-rose-200 text-xs mb-4">{currentPrompt.message}</p>

        {/* User Selection */}
        <div className="space-y-3 mb-4">
          {selectedUsers.map((user, index) => (
            <motion.div
              key={user.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 bg-white/10 rounded-lg p-3"
            >
              <img
                src={user.pfpUrl}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border border-white/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-xs truncate">{user.displayName}</p>
                <p className="text-rose-300 text-xs">@{user.username}</p>
              </div>
              <div className="flex gap-1">
                {currentPrompt.actions.slice(0, 2).map((action) => (
                  <motion.button
                    key={action.type}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAction(action, user)}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded-full transition-colors flex items-center gap-1"
                    title={action.label}
                  >
                    <span>{action.emoji}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Delight Message */}
        <AnimatePresence>
          {delightMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-green-600/90 text-white text-xs font-medium py-2 px-3 rounded-lg text-center"
            >
              {delightMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer hint */}
        <p className="text-rose-300 text-xs text-center mt-3">
          💝 Building connections, one spark at a time
        </p>
      </motion.div>
    </motion.div>
  );
}

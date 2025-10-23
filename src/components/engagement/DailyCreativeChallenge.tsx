/** Daily Creative Challenge Component - Fresh engagement every day
 * DELIGHT: Daily surprises keep users coming back
 * ENGAGEMENT: Short, achievable challenges build habits
 * INTUITIVE: Clear goals with helpful guidance
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SocialUser } from "@/types/socialGames";
import { useOptimizedAnimation } from "@/utils/animations";
import ActionButton from "../shared/ActionButton";

interface DailyCreativeChallengeProps {
  user: SocialUser;
  currentTier: string;
  onChallengeComplete: (challengeId: string, reward: any) => void;
  onDismiss?: () => void;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
  reward: {
    type: 'lub' | 'streak' | 'achievement';
    value: number | string;
  };
  action: {
    label: string;
    onClick: () => void;
  };
  condition?: (user: SocialUser, tier: string) => boolean;
}

// Pool of daily challenges
const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete a memory game in under 45 seconds!',
    emoji: '⚡',
    difficulty: 'medium',
    timeEstimate: '2-3 min',
    reward: { type: 'lub', value: 5 },
    action: {
      label: 'Start Game',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('startMemoryGame', {
          detail: { challenge: 'speed-demon' }
        }));
      }
    }
  },
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Connect with 3 new creators in social games!',
    emoji: '🦋',
    difficulty: 'easy',
    timeEstimate: '5-10 min',
    reward: { type: 'achievement', value: 'social_butterfly' },
    action: {
      label: 'Hab Fun',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('navigateToSocial'));
      }
    },
    condition: (user, tier) => tier !== 'love'
  },
  {
    id: 'creative-matchmaker',
    title: 'Creative Matchmaker',
    description: 'Find and spark a conversation with a creative match!',
    emoji: '🎨',
    difficulty: 'medium',
    timeEstimate: '10-15 min',
    reward: { type: 'lub', value: 10 },
    action: {
      label: 'Find Matches',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('navigateToCollaboration'));
      }
    },
    condition: (user, tier) => tier === 'professional'
  },
  {
    id: 'heart-collector',
    title: 'Heart Collector',
    description: 'Match all hearts in a memory game perfectly!',
    emoji: '💝',
    difficulty: 'hard',
    timeEstimate: '3-5 min',
    reward: { type: 'achievement', value: 'perfect_memory' },
    action: {
      label: 'Perfect Game',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('startMemoryGame', {
          detail: { challenge: 'perfect-game' }
        }));
      }
    }
  },
  {
    id: 'creative-sharer',
    title: 'Creative Sharer',
    description: 'Share one of your games with the community!',
    emoji: '💫',
    difficulty: 'easy',
    timeEstimate: '1-2 min',
    reward: { type: 'streak', value: 'sharing_streak' },
    action: {
      label: 'Share Game',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('openShareModal'));
      }
    }
  },
  {
    id: 'mystery-collaborator',
    title: 'Mystery Collaborator',
    description: 'Create a game with a surprise theme!',
    emoji: '🎭',
    difficulty: 'medium',
    timeEstimate: '5-10 min',
    reward: { type: 'lub', value: 8 },
    action: {
      label: 'Create Mystery',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('navigateToCreate', {
          detail: { theme: 'mystery' }
        }));
      }
    },
    condition: (user, tier) => tier !== 'love'
  }
];

export default function DailyCreativeChallenge({
  user,
  currentTier,
  onChallengeComplete,
  onDismiss
}: DailyCreativeChallengeProps) {
  const [currentChallenge, setCurrentChallenge] = useState<DailyChallenge | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const challengeAnimation = useOptimizedAnimation("avatarPop");

  // Select today's challenge
  useEffect(() => {
    const today = new Date().toDateString();
    const storedChallenge = localStorage.getItem(`daily-challenge-${today}`);
    const completedChallenges = JSON.parse(localStorage.getItem('completed-challenges') || '[]');

    if (storedChallenge) {
      const challenge = DAILY_CHALLENGES.find(c => c.id === storedChallenge);
      if (challenge) {
        setCurrentChallenge(challenge);
        setIsCompleted(completedChallenges.includes(challenge.id));
        return;
      }
    }

    // Select new challenge for today
    const availableChallenges = DAILY_CHALLENGES.filter(
      challenge => !challenge.condition || challenge.condition(user, currentTier)
    );

    if (availableChallenges.length > 0) {
      const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
      setCurrentChallenge(randomChallenge);
      localStorage.setItem(`daily-challenge-${today}`, randomChallenge.id);
    }
  }, [user, currentTier]);

  const handleChallengeAction = () => {
    if (currentChallenge) {
      currentChallenge.action.onClick();
    }
  };

  const handleComplete = () => {
    if (currentChallenge) {
      setIsCompleted(true);

      // Store completion
      const completedChallenges = JSON.parse(localStorage.getItem('completed-challenges') || '[]');
      completedChallenges.push(currentChallenge.id);
      localStorage.setItem('completed-challenges', JSON.stringify(completedChallenges));

      // Award reward
      onChallengeComplete(currentChallenge.id, currentChallenge.reward);
    }
  };

  if (!currentChallenge) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-900/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30';
      case 'hard': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  return (
    <motion.div
      {...challengeAnimation}
      className="bg-gradient-to-r from-amber-900/95 to-orange-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-amber-400/30 max-w-sm"
    >
      <div className="flex items-start gap-3">
        {/* Challenge Icon */}
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
          className="text-3xl"
        >
          {currentChallenge.emoji}
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-sm">Daily Challenge</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(currentChallenge.difficulty)}`}>
              {currentChallenge.difficulty}
            </span>
          </div>

          {/* Title & Description */}
          <h4 className="text-white font-semibold text-sm mb-1">
            {currentChallenge.title}
          </h4>
          <p className="text-amber-200 text-xs mb-3">
            {currentChallenge.description}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-amber-300 mb-3">
            <span>⏱️ {currentChallenge.timeEstimate}</span>
            <span>
              {currentChallenge.reward.type === 'lub' && `💰 ${currentChallenge.reward.value} LUB`}
              {currentChallenge.reward.type === 'achievement' && `🏆 Achievement`}
              {currentChallenge.reward.type === 'streak' && `🔥 Streak Bonus`}
            </span>
          </div>

          {/* Action Button */}
          {!isCompleted ? (
            <ActionButton
              variant="gradient-blue"
              size="sm"
              onClick={handleChallengeAction}
              className="w-full"
              icon={currentChallenge.emoji}
            >
              {currentChallenge.action.label}
            </ActionButton>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full bg-green-600 text-white text-xs font-medium py-2 px-3 rounded-lg text-center"
            >
              ✅ Completed!
            </motion.div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* Progress hint for ongoing challenges */}
      {!isCompleted && (
        <div className="mt-3 pt-3 border-t border-amber-400/20">
          <p className="text-amber-300 text-xs text-center">
            💡 Complete this challenge to unlock your daily reward!
          </p>
        </div>
      )}
    </motion.div>
  );
}

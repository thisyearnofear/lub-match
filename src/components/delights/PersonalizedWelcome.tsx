/** Personalized Welcome Component - Makes users feel special
 * DELIGHT: Tailored greetings and insights
 * ENGAGEMENT: Personal connection builds loyalty
 * INTUITIVE: Contextual information at the right time
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SocialUser } from "@/types/socialGames";
import { CollaborationService } from "@/services/collaborationService";
import { useOptimizedAnimation } from "@/utils/animations";

interface PersonalizedWelcomeProps {
  user: SocialUser;
  gameHistory: any[];
  currentTier: string;
  onDismiss?: () => void;
}

export default function PersonalizedWelcome({
  user,
  gameHistory,
  currentTier,
  onDismiss
}: PersonalizedWelcomeProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const welcomeAnimation = useOptimizedAnimation("avatarPop");

  // Generate personalized messages based on user profile
  const personalizedMessages = generatePersonalizedMessages(user, gameHistory, currentTier);

  useEffect(() => {
    if (personalizedMessages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % personalizedMessages.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [personalizedMessages.length]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (!isVisible || personalizedMessages.length === 0) return null;

  const message = personalizedMessages[currentMessage];

  return (
    <motion.div
      {...welcomeAnimation}
      className="fixed top-20 left-4 right-4 z-40 max-w-sm mx-auto"
    >
      <motion.div
        className="bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/20"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-start gap-3">
          {/* User Avatar */}
          <motion.img
            src={user.pfpUrl}
            alt={user.displayName}
            className="w-12 h-12 rounded-full border-2 border-white/30"
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <div className="flex-1 min-w-0">
            {/* Personalized Message */}
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-white"
            >
              <p className="font-semibold text-sm">{message.title}</p>
              <p className="text-purple-200 text-xs mt-1">{message.content}</p>
            </motion.div>

            {/* Progress Indicators */}
            {personalizedMessages.length > 1 && (
              <div className="flex gap-1 mt-2">
                {personalizedMessages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentMessage ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Action Button if applicable */}
        {message.action && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={message.action.onClick}
            className="mt-3 bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors w-full"
          >
            {message.action.label}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

function generatePersonalizedMessages(user: SocialUser, gameHistory: any[], currentTier: string) {
  const messages = [];
  const userSkills = CollaborationService.analyzeSkills(user);
  const gamesPlayed = gameHistory.length;

  // Welcome based on time of day
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" :
                      hour < 17 ? "Good afternoon" :
                      "Good evening";

  // Base welcome
  messages.push({
    title: `${timeGreeting}, ${user.displayName}! ✨`,
    content: `Welcome back to your creative universe! Ready to make some magic today?`
  });

  // Skill-based insights
  if (userSkills.length > 0) {
    const topSkill = userSkills[0];
    messages.push({
      title: `Your ${topSkill} magic is glowing! 🌟`,
      content: `We detected your creative superpowers. Let's find kindred spirits to collaborate with!`,
      action: {
        label: "Find Creative Matches 🎨",
        onClick: () => {
          window.dispatchEvent(new CustomEvent('navigateToCollaboration'));
        }
      }
    });
  }

  // Game history insights
  if (gamesPlayed > 0) {
    const lastGame = gameHistory[gameHistory.length - 1];
    if (lastGame?.completionTime < 60) {
      messages.push({
        title: `Speed demon! ⚡`,
        content: `You completed that game in ${lastGame.completionTime}s! Your creative energy is unstoppable!`
      });
    } else if (gamesPlayed >= 5) {
      messages.push({
        title: `Creative champion! 🏆`,
        content: `${gamesPlayed} games played! You're building quite the creative portfolio.`
      });
    }
  }

  // Social insights
  if (user.followerCount > 100) {
    messages.push({
      title: `Community builder! 🌟`,
      content: `Your ${user.followerCount.toLocaleString()} followers are lucky to have such a creative soul leading them!`
    });
  }

  // Tier-specific messages
  if (currentTier === 'professional') {
    messages.push({
      title: `Creative Universe unlocked! 🎨`,
      content: `Welcome to the magical world of collaboration. Let's find your perfect creative matches!`,
      action: {
        label: "Explore Creative Matches ✨",
        onClick: () => {
          window.dispatchEvent(new CustomEvent('navigateToCollaboration'));
        }
      }
    });
  } else if (currentTier === 'social') {
    messages.push({
      title: `Social butterfly! 🦋`,
      content: `You're connecting with amazing people. Ready to level up to creative collaboration?`
    });
  }

  // Random delightful surprises
  const delightfulMessages = [
    {
      title: `Did you know? 🌈`,
      content: `Every heart you match brings a little more love into the world. You're making magic! 💕`
    },
    {
      title: `Creative spark! ⚡`,
      content: `Your unique perspective is exactly what the world needs. Keep creating!`
    },
    {
      title: `You are unique! 🎭`,
      content: `No one else plays quite like you. That's your creative superpower! ✨`
    }
  ];

  // Add 1-2 random delightful messages
  const shuffledDelightful = delightfulMessages.sort(() => 0.5 - Math.random());
  messages.push(...shuffledDelightful.slice(0, 2));

  return messages.slice(0, 5); // Limit to 5 messages max
}

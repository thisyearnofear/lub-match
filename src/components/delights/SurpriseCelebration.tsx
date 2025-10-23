/** Surprise Celebration Component - Sparks delight with unexpected magic
 * DELIGHT: Unexpected celebrations for user actions
 * ENGAGEMENT: Rewards user with visual magic
 * INTUITIVE: Clear positive feedback for achievements
 */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOptimizedAnimation } from "@/utils/animations";

interface SurpriseCelebrationProps {
  type: 'hearts' | 'stars' | 'sparkles' | 'rainbow' | 'fireworks';
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

const CELEBRATION_CONFIGS = {
  hearts: {
    emoji: '💝',
    colors: ['text-pink-400', 'text-rose-400', 'text-red-400'],
    count: 8,
    size: 'text-4xl',
    message: 'Love in the air! 💕'
  },
  stars: {
    emoji: '⭐',
    colors: ['text-yellow-400', 'text-orange-400', 'text-amber-400'],
    count: 6,
    size: 'text-3xl',
    message: 'You\'re a star! ✨'
  },
  sparkles: {
    emoji: '✨',
    colors: ['text-purple-400', 'text-blue-400', 'text-cyan-400'],
    count: 10,
    size: 'text-2xl',
    message: 'Pure magic! 🎭'
  },
  rainbow: {
    emoji: '🌈',
    colors: ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-blue-400', 'text-purple-400'],
    count: 12,
    size: 'text-3xl',
    message: 'Rainbow magic! 🌈'
  },
  fireworks: {
    emoji: '🎆',
    colors: ['text-red-500', 'text-blue-500', 'text-yellow-500', 'text-green-500', 'text-purple-500'],
    count: 15,
    size: 'text-4xl',
    message: 'Spectacular! 🎆'
  }
};

export default function SurpriseCelebration({
  type,
  message,
  duration = 3000,
  onComplete
}: SurpriseCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = CELEBRATION_CONFIGS[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: config.count }).map((_, i) => (
              <motion.div
                key={i}
                className={`${config.size} ${config.colors[i % config.colors.length]}`}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 100,
                  rotate: 0,
                  scale: 0
                }}
                animate={{
                  y: -100,
                  rotate: 360,
                  scale: [0, 1, 0.8, 1]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              >
                {config.emoji}
              </motion.div>
            ))}
          </div>

          {/* Center Message */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 text-center max-w-xs"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 0.8,
                repeat: 2,
                ease: "easeInOut"
              }}
              className="text-4xl mb-2"
            >
              {config.emoji}
            </motion.div>
            <p className="text-white font-semibold text-lg">
              {message || config.message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

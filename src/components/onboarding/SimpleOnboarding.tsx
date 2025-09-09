"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

interface Tip {
  id: string;
  icon: string;
  title: string;
  message: string;
  action?: { text: string; onClick: () => void };
}

interface SimpleOnboardingProps {
  tips: Tip[];
  onComplete?: () => void;
  delay?: number;
}

export default function SimpleOnboarding({ tips, onComplete, delay = 1000 }: SimpleOnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (tips.length === 0) return;
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [tips.length, delay]);

  const currentTip = tips[currentIndex];
  const isLast = currentIndex === tips.length - 1;

  const handleNext = () => {
    if (isLast) {
      setIsVisible(false);
      if (onComplete) setTimeout(onComplete, 300);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onComplete) setTimeout(onComplete, 300);
  };

  if (!currentTip || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -50 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-2xl p-1">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-2xl"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                >
                  {currentTip.icon}
                </motion.span>
                <h3 className="font-bold text-gray-800 text-sm">{currentTip.title}</h3>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <p className="text-gray-600 mb-3 text-sm leading-relaxed">{currentTip.message}</p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {tips.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-purple-500" : 
                      index < currentIndex ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {currentTip.action && (
                <button
                  onClick={() => {
                    currentTip.action!.onClick();
                    handleNext();
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                >
                  {currentTip.action.text}
                </button>
              )}
              <button
                onClick={handleNext}
                className={`${
                  currentTip.action 
                    ? "px-3 py-2 text-gray-500 hover:text-gray-700" 
                    : "flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                } text-sm flex items-center justify-center gap-1`}
              >
                {isLast ? "Complete" : "Next"} <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Predefined tip sequences
export const WELCOME_TIPS: Tip[] = [
  {
    id: "welcome",
    icon: "💝",
    title: "Welcome to Lub Match!",
    message: "Match pairs of hearts to complete beautiful puzzles and connect with people!"
  },
  {
    id: "play",
    icon: "🎮",
    title: "How to Play",
    message: "Click cards to flip them, find matching pairs, and complete the heart shape!"
  },
  {
    id: "share",
    icon: "✨",
    title: "Share & Enjoy",
    message: "Share your completed hearts and discover new connections. Have fun!"
  }
];

export const GAME_COMPLETE_TIPS: Tip[] = [
  {
    id: "congrats",
    icon: "🎉",
    title: "Amazing!",
    message: "You completed the heart! Beautiful work matching all those pairs."
  },
  {
    id: "next",
    icon: "🚀",
    title: "What's Next?",
    message: "Share your creation, play again, or explore bonus features!",
    action: { text: "Play Again", onClick: () => window.location.reload() }
  }
];

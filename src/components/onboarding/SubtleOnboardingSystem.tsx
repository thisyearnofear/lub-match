"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Sparkles, Users, Coins, Palette } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  message: string;
  icon: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  duration?: number;
}

interface SubtleOnboardingProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  autoStart?: boolean;
  delay?: number;
}

export function SubtleOnboardingSystem({
  steps,
  onComplete,
  autoStart = true,
  delay = 1000,
}: SubtleOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const showNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setIsVisible(true);
    } else {
      // All steps completed
      setIsVisible(false);
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const hideCurrentStep = useCallback(() => {
    setIsVisible(false);
    // Show next step after a brief pause
    setTimeout(() => {
      showNextStep();
    }, 800);
  }, [showNextStep]);

  const skipAll = useCallback(() => {
    setIsVisible(false);
    setCurrentStep(steps.length);
    onComplete?.();
  }, [steps.length, onComplete]);

  // Auto-start the sequence
  useEffect(() => {
    if (autoStart && !hasStarted && steps.length > 0) {
      setHasStarted(true);
      setTimeout(() => {
        showNextStep();
      }, delay);
    }
  }, [autoStart, hasStarted, steps.length, delay, showNextStep]);

  // Auto-hide current step after duration
  useEffect(() => {
    if (isVisible && currentStep >= 0) {
      const step = steps[currentStep];
      const duration = step.duration || 6000;
      
      const timer = setTimeout(() => {
        hideCurrentStep();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, currentStep, steps, hideCurrentStep]);

  if (currentStep < 0 || currentStep >= steps.length) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl shadow-xl p-4 border border-purple-300">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{currentStepData.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                  {currentStepData.title}
                  {currentStep < steps.length - 1 && (
                    <span className="text-xs opacity-70">
                      {currentStep + 1}/{steps.length}
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-90 leading-relaxed">
                  {currentStepData.message}
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  {currentStepData.actionButton && (
                    <button
                      onClick={currentStepData.actionButton.onClick}
                      className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-xs font-semibold transition-all duration-200"
                    >
                      {currentStepData.actionButton.text}
                    </button>
                  )}
                  
                  {!isLastStep && (
                    <button
                      onClick={hideCurrentStep}
                      className="flex items-center gap-1 px-2 py-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
                    >
                      Next <ChevronRight size={12} />
                    </button>
                  )}
                  
                  <button
                    onClick={skipAll}
                    className="px-2 py-1 text-xs opacity-50 hover:opacity-70 transition-opacity ml-auto"
                  >
                    Skip
                  </button>
                </div>
              </div>
              
              <button
                onClick={skipAll}
                className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Predefined step sequences
export const createSubtleOnboardingSteps = (options: {
  onLearnMore?: () => void;
  onConnectWallet?: () => void;
  onExploreGames?: () => void;
}): OnboardingStep[] => [
  {
    id: "welcome",
    title: "Welcome to Lub! 💝",
    message: "Match trending Farcaster users in this heart-shaped puzzle game!",
    icon: "👋",
    duration: 5000,
  },
  {
    id: "farcaster",
    title: "Trending Users",
    message: "These photos belong to popular users on Farcaster, a decentralized social network.",
    icon: "👥",
    actionButton: {
      text: "Learn More",
      onClick: () => options.onLearnMore?.(),
    },
    duration: 7000,
  },
  {
    id: "rewards",
    title: "Earn LUB Tokens",
    message: "Complete games to earn tokens, mint NFTs, and unlock premium features!",
    icon: "✨",
    duration: 6000,
  },
  {
    id: "connect",
    title: "Connect Wallet",
    message: "Optional: Connect a wallet to access the full Web3 experience.",
    icon: "🔗",
    actionButton: {
      text: "Connect",
      onClick: () => options.onConnectWallet?.(),
    },
    duration: 6000,
  },
];

export const createQuickIntro = (): OnboardingStep[] => [
  {
    id: "quick-intro",
    title: "Match & Earn! 🎮",
    message: "Find matching pairs of Farcaster users to complete the heart puzzle and earn LUB tokens!",
    icon: "💝",
    duration: 6000,
  },
];

export const createGameCompleteSteps = (options: {
  onMintNFT?: () => void;
  onPlayMore?: () => void;
}): OnboardingStep[] => [
  {
    id: "congratulations",
    title: "Congratulations! 🎉",
    message: "You've completed the game! You earned LUB tokens and can now mint an NFT.",
    icon: "🏆",
    actionButton: {
      text: "Mint NFT",
      onClick: () => options.onMintNFT?.(),
    },
    duration: 8000,
  },
  {
    id: "next-steps",
    title: "What's Next?",
    message: "Explore social games, create custom puzzles, or challenge friends!",
    icon: "🚀",
    actionButton: {
      text: "Explore",
      onClick: () => options.onPlayMore?.(),
    },
    duration: 7000,
  },
];
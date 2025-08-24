/**
 * Unified Onboarding System
 * CLEAN: Single source of truth for all onboarding experiences
 * MODULAR: Composable sequences with progressive disclosure
 * USER-CONTROLLED: Easy to pause, restart, skip
 * GAME-FOCUSED: Uses our new messaging that emphasizes fun first
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Pause, Play, SkipForward } from "lucide-react";

export interface OnboardingStep {
  id: string;
  title: string;
  message: string;
  icon: string;
  category: "intro" | "game" | "social" | "rewards" | "advanced";
  complexity: "basic" | "intermediate" | "advanced";
  duration?: number;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  prerequisites?: string[]; // Step IDs that must be completed first
  visual?: {
    gradient?: string;
    animation?: "bounce" | "pulse" | "shake" | "glow";
  };
}

interface UnifiedOnboardingProps {
  steps: OnboardingStep[];
  userLevel?: "newcomer" | "player" | "challenger" | "whale_hunter";
  completedSteps?: string[];
  onStepComplete?: (stepId: string) => void;
  onSequenceComplete?: () => void;
  autoStart?: boolean;
  delay?: number;
  allowRestart?: boolean;
  onRestart?: () => void;
  sequenceKey?: string; // Unique identifier to prevent conflicts
}

interface OnboardingState {
  currentStepIndex: number;
  isVisible: boolean;
  isPaused: boolean;
  availableSteps: OnboardingStep[];
  completedSteps: string[];
}

export default function UnifiedOnboardingSystem({
  steps,
  userLevel = "newcomer",
  completedSteps = [],
  onStepComplete,
  onSequenceComplete,
  autoStart = true,
  delay = 1000,
  allowRestart = true,
  onRestart,
}: UnifiedOnboardingProps) {
  const [state, setState] = useState<OnboardingState>({
    currentStepIndex: 0,
    isVisible: false,
    isPaused: false,
    availableSteps: [],
    completedSteps: [...completedSteps],
  });

  // Filter steps based on user level and prerequisites
  const filterAvailableSteps = useCallback(
    (completedSteps: string[]) => {
      // Determine max complexity based on user level
      const complexityMap = {
        newcomer: "basic" as const,
        player: "intermediate" as const,
        challenger: "advanced" as const,
        whale_hunter: "advanced" as const,
      };

      const maxComplexity = complexityMap[userLevel];

      // Filter by complexity first
      let availableSteps = steps.filter((step) => {
        const complexityLevels = ["basic", "intermediate", "advanced"];
        const stepLevel = complexityLevels.indexOf(step.complexity);
        const maxLevel = complexityLevels.indexOf(maxComplexity);
        return stepLevel <= maxLevel;
      });

      // Filter by prerequisites
      availableSteps = availableSteps.filter((step) => {
        if (!step.prerequisites) return true;
        return step.prerequisites.every((prereq) =>
          completedSteps.includes(prereq)
        );
      });

      // Remove already completed steps
      availableSteps = availableSteps.filter(
        (step) => !completedSteps.includes(step.id)
      );

      return availableSteps;
    },
    [steps, userLevel]
  );

  // Initialize available steps
  useEffect(() => {
    const availableSteps = filterAvailableSteps(completedSteps);

    setState((prev) => {
      // Only update if steps actually changed to prevent infinite loops
      if (JSON.stringify(prev.availableSteps) !== JSON.stringify(availableSteps)) {
        return {
          ...prev,
          availableSteps,
          currentStepIndex: 0,
        };
      }
      return prev;
    });
  }, [steps, userLevel, completedSteps, filterAvailableSteps]);

  // Auto-start onboarding
  useEffect(() => {
    if (autoStart && state.availableSteps.length > 0 && !state.isVisible) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, isVisible: true }));
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [autoStart, delay, state.availableSteps.length, state.isVisible]);

  // Current step
  const currentStep = state.availableSteps[state.currentStepIndex];

  // Handle step completion
  const handleStepComplete = useCallback(() => {
    setState((prev) => {
      const currentStep = prev.availableSteps[prev.currentStepIndex];
      if (!currentStep) return prev;

      const newCompletedSteps = [...prev.completedSteps, currentStep.id];
      onStepComplete?.(currentStep.id);

      // Move to next step or complete sequence
      if (prev.currentStepIndex < prev.availableSteps.length - 1) {
        // Move to next step
        return {
          ...prev,
          completedSteps: newCompletedSteps,
          currentStepIndex: prev.currentStepIndex + 1,
        };
      } else {
        // Sequence complete - hide onboarding
        setTimeout(() => {
          onSequenceComplete?.();
        }, 300);
        return {
          ...prev,
          completedSteps: newCompletedSteps,
          isVisible: false
        };
      }
    });
  }, [onStepComplete, onSequenceComplete]);

  // Auto-advance timer
  useEffect(() => {
    if (!currentStep || !state.isVisible || state.isPaused) return;

    const timer = setTimeout(() => {
      handleStepComplete();
    }, currentStep.duration || 6000);

    return () => clearTimeout(timer);
  }, [currentStep, state.isVisible, state.isPaused, handleStepComplete]);

  // Handle manual actions
  const handleAction = useCallback(
    (action: () => void) => {
      setState((prev) => ({ ...prev, isPaused: true }));
      action();
      // Resume after action
      setTimeout(() => {
        setState((prev) => ({ ...prev, isPaused: false }));
        handleStepComplete();
      }, 1000);
    },
    [handleStepComplete]
  );

  const handleSkip = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: false }));
    onSequenceComplete?.();
  }, [onSequenceComplete]);

  const handlePause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const handleRestart = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: 0,
      isVisible: true,
      isPaused: false,
      completedSteps: [],
    }));
    onRestart?.();
  }, [onRestart]);

  // Don't render if no steps available
  if (!currentStep || !state.isVisible) {
    return null;
  }

  // Get visual styling based on step category
  const getStepStyling = (step: OnboardingStep) => {
    const categoryStyles = {
      intro: "from-pink-500 to-purple-600",
      game: "from-blue-500 to-indigo-600",
      social: "from-green-500 to-emerald-600",
      rewards: "from-yellow-400 to-orange-500",
      advanced: "from-purple-500 to-pink-500",
    };

    return {
      gradient: step.visual?.gradient || categoryStyles[step.category],
      animation: step.visual?.animation || "bounce",
    };
  };

  const styling = getStepStyling(currentStep);

  // Mobile-responsive positioning
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const positionClasses = isMobile
    ? "fixed bottom-4 left-4 right-4 z-50"
    : "fixed bottom-4 right-4 z-50 max-w-sm";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -50 }}
        className={positionClasses}
      >
        <motion.div
          className={`bg-gradient-to-r ${styling.gradient} rounded-xl shadow-2xl p-1`}
          animate={
            styling.animation === "glow"
              ? {
                  boxShadow: [
                    "0 0 20px rgba(255, 255, 255, 0.3)",
                    "0 0 40px rgba(255, 255, 255, 0.5)",
                    "0 0 20px rgba(255, 255, 255, 0.3)",
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="bg-white rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-2xl"
                  animate={
                    styling.animation === "bounce"
                      ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0],
                        }
                      : styling.animation === "pulse"
                      ? {
                          scale: [1, 1.1, 1],
                        }
                      : styling.animation === "shake"
                      ? {
                          x: [0, -5, 5, -5, 5, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  {currentStep.icon}
                </motion.span>
                <h3 className="font-bold text-gray-800 text-sm">
                  {currentStep.title}
                </h3>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                {allowRestart && (
                  <button
                    onClick={handleRestart}
                    className="text-gray-400 hover:text-gray-600 text-xs p-1"
                    title="Restart onboarding"
                  >
                    🔄
                  </button>
                )}
                <button
                  onClick={handlePause}
                  className="text-gray-400 hover:text-gray-600 text-xs p-1"
                  title={state.isPaused ? "Resume" : "Pause"}
                >
                  {state.isPaused ? <Play size={12} /> : <Pause size={12} />}
                </button>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 text-xs p-1"
                  title="Skip all"
                >
                  <SkipForward size={12} />
                </button>
                <button
                  onClick={() =>
                    setState((prev) => ({ ...prev, isVisible: false }))
                  }
                  className="text-gray-400 hover:text-gray-600 text-xs p-1"
                  title="Close"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Content - Mobile optimized text */}
            <p
              className={`text-gray-600 mb-3 leading-relaxed ${
                isMobile ? "text-xs" : "text-sm"
              }`}
            >
              {currentStep.message}
            </p>

            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {state.availableSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === state.currentStepIndex
                        ? "bg-purple-500"
                        : index < state.currentStepIndex
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Complexity indicator */}
              <div className="flex items-center gap-1">
                {currentStep.complexity === "advanced" && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    Advanced
                  </span>
                )}
                {currentStep.complexity === "intermediate" && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Intermediate
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {currentStep.actionButton && (
                <button
                  onClick={() =>
                    handleAction(currentStep.actionButton!.onClick)
                  }
                  className={`flex-1 bg-gradient-to-r ${styling.gradient} text-white text-sm font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity`}
                >
                  {currentStep.actionButton.text}
                </button>
              )}
              <button
                onClick={handleStepComplete}
                className={`${currentStep.actionButton ? 'px-3 py-2 text-gray-500 hover:text-gray-700' : 'flex-1 bg-gradient-to-r ' + styling.gradient + ' text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity'} text-sm flex items-center justify-center gap-1`}
              >
                Next <ChevronRight size={12} />
              </button>
            </div>

            {/* Auto-advance timer (visual) */}
            {!state.isPaused && !currentStep.actionButton && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <motion.div
                    className={`bg-gradient-to-r ${styling.gradient} h-1 rounded-full`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: (currentStep.duration || 6000) / 1000,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Predefined step sequences with our new game-focused messaging
export const createWelcomeSequence = (options: {
  onLearnMore?: () => void;
  onConnectWallet?: () => void;
  onExploreGames?: () => void;
}): OnboardingStep[] => [
  {
    id: "welcome",
    title: "Welcome to Lub Match! 💝",
    message:
      "A fun memory game where you match pairs of real people to complete a heart puzzle!",
    icon: "🧩",
    category: "intro",
    complexity: "basic",
    duration: 6000,
  },
  {
    id: "how-to-play",
    title: "How to Play",
    message:
      "🔍 Find matching pairs • 💝 Complete the heart shape • 🎉 Share your creation with friends!",
    icon: "🎮",
    category: "game",
    complexity: "basic",
    duration: 8000,
  },
  {
    id: "real-people",
    title: "Real People, Real Fun",
    message:
      "Match actual people from the community - discover interesting profiles and make connections!",
    icon: "👥",
    category: "social",
    complexity: "basic",
    duration: 7000,
  },
  {
    id: "social-connection",
    title: "Connect & Share",
    message:
      "Discover interesting people and share your completed hearts with the community!",
    icon: "🌟",
    category: "social",
    complexity: "basic",
    duration: 7000,
  },
  {
    id: "optional-rewards",
    title: "Bonus: Earn LUB",
    message:
      "Playing earns you LUB tokens - use them for special features or just have fun without them!",
    icon: "🎁",
    category: "rewards",
    complexity: "intermediate",
    duration: 8000,
  },
  {
    id: "ready-to-play",
    title: "Ready to Play?",
    message:
      "That's it! Start matching and have fun. Advanced features are available if you want them later.",
    icon: "🚀",
    category: "intro",
    complexity: "basic",
    actionButton: {
      text: "Start Playing",
      onClick: () => options.onExploreGames?.(),
    },
    duration: 6000,
  },
];

export const createGameCompleteSequence = (options: {
  onMintNFT?: () => void;
  onPlayMore?: () => void;
  onTryChallenges?: () => void;
}): OnboardingStep[] => [
  {
    id: "congratulations",
    title: "Amazing! 🎉",
    message:
      "You completed the heart! Great memory skills - you matched all the pairs perfectly.",
    icon: "🏆",
    category: "game",
    complexity: "basic",
    duration: 6000,
  },
  {
    id: "share-success",
    title: "Share Your Creation",
    message:
      "Your heart looks beautiful! Share it with friends or create another one.",
    icon: "💝",
    category: "social",
    complexity: "basic",
    actionButton: {
      text: "Play Again",
      onClick: () => options.onPlayMore?.(),
    },
    duration: 7000,
  },
  {
    id: "bonus-features",
    title: "Bonus Features Available",
    message:
      "Want more? Try challenges, save as NFT, or explore advanced features - all optional!",
    icon: "✨",
    category: "advanced",
    complexity: "intermediate",
    actionButton: {
      text: "Explore Bonus",
      onClick: () => options.onTryChallenges?.(),
    },
    duration: 7000,
  },
];

export const createAdvancedFeaturesSequence = (options: {
  onTryChallenges?: () => void;
  onConnectWallet?: () => void;
}): OnboardingStep[] => [
  {
    id: "advanced-challenges",
    title: "🎯 Advanced Features",
    message:
      "Ready for more? Try creating custom challenges and connecting with the community!",
    icon: "🌟",
    category: "advanced",
    complexity: "intermediate",
    duration: 6000,
  },
  {
    id: "community-challenges",
    title: "🌟 Community Challenges",
    message:
      "Connect with popular community members and earn bonus rewards for successful interactions!",
    icon: "🌟",
    category: "advanced",
    complexity: "intermediate",
    duration: 7000,
  },
  {
    id: "save-memories",
    title: "💝 Save Your Creations",
    message:
      "Turn your beautiful heart puzzles into keepsakes you can share and treasure!",
    icon: "💝",
    category: "advanced",
    complexity: "intermediate",
    actionButton: {
      text: "Save as NFT",
      onClick: () => options.onConnectWallet?.(),
    },
    duration: 6000,
  },
];

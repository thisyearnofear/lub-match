/**
 * Unified Onboarding System
 * CLEAN: Single source of truth for all onboarding experiences
 * MODULAR: Self-contained with no external dependencies
 * USER-CONTROLLED: Easy to pause, restart, skip
 * GAME-FOCUSED: Uses messaging that emphasizes fun first
 * ENHANCEMENT FIRST: Enhanced existing component, removed bloat
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, SkipForward } from "lucide-react";
import { useSubtleOnboarding, UserLevel } from "@/hooks/useSubtleOnboarding";

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
  sequence?: "welcome" | "game-complete" | "advanced-features" | "custom";
  customSteps?: OnboardingStep[];
  onStepComplete?: (stepId: string) => void;
  onSequenceComplete?: () => void;
  autoStart?: boolean;
  delay?: number;
  allowRestart?: boolean;
  onRestart?: () => void;
  // Action handlers
  onLearnMore?: () => void;
  onConnectWallet?: () => void;
  onExploreGames?: () => void;
  onMintNFT?: () => void;
  onPlayMore?: () => void;
  onTryChallenges?: () => void;
}

interface OnboardingState {
  currentStepIndex: number;
  isVisible: boolean;
  availableSteps: OnboardingStep[];
  completedSteps: string[];
}

export default function UnifiedOnboardingSystem({
  sequence = "welcome",
  customSteps,
  onStepComplete,
  onSequenceComplete,
  autoStart = true,
  delay = 1000,
  allowRestart = true,
  onRestart,
  // Action handlers
  onLearnMore,
  onConnectWallet,
  onExploreGames,
  onMintNFT,
  onPlayMore,
  onTryChallenges,
}: UnifiedOnboardingProps) {
  // Use the centralized onboarding hook
  const {
    hasSeenOnboarding,
    markOnboardingCompleted,
    getUserLevel,
    getEngagementLevel,
    getRecommendedSequence,
  } = useSubtleOnboarding();
  
  // Unique instance ID for debugging
  const instanceId = useRef(
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  ).current;
  
  // Get current user level
  const userLevel = getUserLevel();
  
  // Check if this sequence should be shown
  const shouldShow = !hasSeenOnboarding(
    sequence === "welcome" ? "MAIN_INTRO" :
    sequence === "game-complete" ? "GAME_COMPLETE" :
    sequence === "advanced-features" ? "ADVANCED_FEATURES" :
    "MAIN_INTRO"
  );
  
  console.log(
    `[OnboardingSystem ${instanceId}] Mounted for sequence: ${sequence}, shouldShow: ${shouldShow}`
  );

  const [state, setState] = useState<OnboardingState>({
    currentStepIndex: 0,
    isVisible: false,
    availableSteps: [],
    completedSteps: [],
  });

  // Generate steps based on sequence type and user level
  useEffect(() => {
    if (!shouldShow) return;
    
    let steps: OnboardingStep[] = [];
    
    if (customSteps) {
      steps = customSteps;
    } else {
      const options = {
        onLearnMore,
        onConnectWallet,
        onExploreGames,
        onMintNFT,
        onPlayMore,
        onTryChallenges,
      };
      
      switch (sequence) {
        case "welcome":
          steps = createWelcomeSequence(userLevel, options);
          break;
        case "game-complete":
          steps = createGameCompleteSequence(options);
          break;
        case "advanced-features":
          steps = createAdvancedFeaturesSequence(options);
          break;
        default:
          steps = [];
      }
    }
    
    setState((prev) => ({
      ...prev,
      availableSteps: steps,
      currentStepIndex: 0,
    }));
  }, [sequence, customSteps, userLevel, shouldShow, onLearnMore, onConnectWallet, onExploreGames, onMintNFT, onPlayMore, onTryChallenges]);

  // Auto-start onboarding (with completion guard)
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  useEffect(() => {
    if (autoStart && shouldShow && state.availableSteps.length > 0 && !state.isVisible && !hasAutoStarted) {
      console.log(
        `[OnboardingSystem ${instanceId}] Auto-starting for sequence: ${sequence}`
      );
      setHasAutoStarted(true);
      const timer = setTimeout(() => {
        setState((prev) => {
          console.log(
            `[OnboardingSystem ${instanceId}] Setting isVisible to true for sequence: ${sequence}`
          );
          return { ...prev, isVisible: true };
        });
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [
    autoStart,
    shouldShow,
    delay,
    state.availableSteps.length,
    state.isVisible,
    hasAutoStarted,
    instanceId,
    sequence,
  ]);

  // Current step
  const currentStep = useMemo(
    () => state.availableSteps[state.currentStepIndex],
    [state.availableSteps, state.currentStepIndex]
  );

  // Handle step completion
  const handleStepComplete = useCallback(() => {
    console.log(
      `[OnboardingSystem ${instanceId}] handleStepComplete called for sequence: ${sequence}, currentIndex: ${state.currentStepIndex}`
    );
    setState((prev) => {
      const currentStep = prev.availableSteps[prev.currentStepIndex];
      if (!currentStep) {
        console.log(
          `[OnboardingSystem ${instanceId}] No current step for sequence: ${sequence}, returning`
        );
        return prev;
      }

      const newCompletedSteps = [...prev.completedSteps, currentStep.id];
      console.log(
        `[OnboardingSystem ${instanceId}] Completing step: ${currentStep.id} for sequence: ${sequence}`
      );
      onStepComplete?.(currentStep.id);

      // Move to next step or complete sequence
      if (prev.currentStepIndex < prev.availableSteps.length - 1) {
        // Move to next step
        console.log(
          `[OnboardingSystem ${instanceId}] Moving to next step for sequence: ${sequence}`
        );
        return {
          ...prev,
          completedSteps: newCompletedSteps,
          currentStepIndex: prev.currentStepIndex + 1,
        };
      } else {
        // Sequence complete - mark as completed and hide
        const onboardingType = 
          sequence === "welcome" ? "MAIN_INTRO" :
          sequence === "game-complete" ? "GAME_COMPLETE" :
          sequence === "advanced-features" ? "ADVANCED_FEATURES" :
          "MAIN_INTRO";
          
        markOnboardingCompleted(onboardingType as any);
        
        console.log(
          `[OnboardingSystem ${instanceId}] Sequence complete for sequence: ${sequence}, calling onSequenceComplete`
        );
        setTimeout(() => {
          onSequenceComplete?.();
        }, 300);
        return {
          ...prev,
          completedSteps: newCompletedSteps,
          isVisible: false,
        };
      }
    });
  }, [
    onStepComplete,
    onSequenceComplete,
    markOnboardingCompleted,
    sequence,
    state.currentStepIndex,
    instanceId,
  ]);

  // Auto-advance timer removed - using manual progression only

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
    console.log(
      `[OnboardingSystem ${instanceId}] handleSkip called for sequence: ${sequence}`
    );
    setState((prev) => ({ ...prev, isVisible: false }));
    onSequenceComplete?.();
  }, [onSequenceComplete, sequence, instanceId]);

  // No pause functionality needed for manual progression

  const handleRestart = useCallback(() => {
    console.log(
      `[OnboardingSystem ${instanceId}] handleRestart called for sequence: ${sequence}`
    );
    setState((prev) => ({
      ...prev,
      currentStepIndex: 0,
      isVisible: true,
      completedSteps: [],
    }));
    onRestart?.();
  }, [onRestart, sequence, instanceId]);

  // Don't render if sequence shouldn't be shown or no steps available
  if (!shouldShow || !currentStep || !state.isVisible) {
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
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 text-xs p-1"
                  title="Skip all"
                >
                  <SkipForward size={12} />
                </button>
                <button
                  onClick={() => {
                    setState((prev) => ({ ...prev, isVisible: false }));
                    onSequenceComplete?.();
                  }}
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
                className={`${
                  currentStep.actionButton
                    ? "px-3 py-2 text-gray-500 hover:text-gray-700"
                    : "flex-1 bg-gradient-to-r " +
                      styling.gradient +
                      " text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                } text-sm flex items-center justify-center gap-1`}
              >
                {state.currentStepIndex === state.availableSteps.length - 1
                  ? "Complete"
                  : "Next"}{" "}
                <ChevronRight size={12} />
              </button>
            </div>

            {/* Manual progression - no timer */}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Smart sequence generation based on user level
function createWelcomeSequence(
  userLevel: UserLevel,
  options: {
    onLearnMore?: () => void;
    onConnectWallet?: () => void;
    onExploreGames?: () => void;
  }
): OnboardingStep[] {
  // Base sequence for all users
  const baseSequence: OnboardingStep[] = [
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
  ];

  // Add social features for players and above
  if (userLevel !== "newcomer") {
    baseSequence.push({
      id: "social-features",
      title: "Connect & Share",
      message:
        "Discover interesting people and share your completed hearts with the community!",
      icon: "👥",
      category: "social",
      complexity: "basic",
      duration: 7000,
    });
  }

  // Add rewards for challengers and whale hunters
  if (userLevel === "challenger" || userLevel === "whale_hunter") {
    baseSequence.push({
      id: "rewards-intro",
      title: "Bonus: Earn LUB",
      message:
        "Playing earns you LUB tokens - use them for special features or just have fun without them!",
      icon: "🎁",
      category: "rewards",
      complexity: "intermediate",
      duration: 8000,
    });
  }

  // Add advanced features for whale hunters
  if (userLevel === "whale_hunter") {
    baseSequence.push({
      id: "advanced-features",
      title: "🚀 Advanced Features",
      message:
        "Ready for more? Try creating custom challenges and connecting with the community!",
      icon: "🌟",
      category: "advanced",
      complexity: "intermediate",
      duration: 6000,
    });
  }

  // Add final step
  baseSequence.push({
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
  });

  return baseSequence;
}

function createGameCompleteSequence(options: {
  onMintNFT?: () => void;
  onPlayMore?: () => void;
  onTryChallenges?: () => void;
}): OnboardingStep[] {
  return [
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
}

function createAdvancedFeaturesSequence(options: {
  onTryChallenges?: () => void;
  onConnectWallet?: () => void;
}): OnboardingStep[] {
  return [
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
}

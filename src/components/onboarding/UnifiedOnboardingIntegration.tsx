/**
 * Unified Onboarding Integration
 * CLEAN: Simple wrapper for the unified onboarding system
 * MODULAR: Easy to use throughout the app
 * FLEXIBLE: Supports different sequences and user levels
 */

"use client";

import { useState, useEffect, useRef } from "react";
import UnifiedOnboardingSystem, {
  OnboardingStep,
  createWelcomeSequence,
  createGameCompleteSequence,
  createAdvancedFeaturesSequence,
} from "./UnifiedOnboardingSystem";
import ProgressiveDisclosureManager, {
  useProgressiveDisclosure,
  UserLevel,
  EngagementLevel,
} from "./ProgressiveDisclosureManager";
import { useSubtleOnboarding } from "@/hooks/useSubtleOnboarding";

interface UnifiedOnboardingIntegrationProps {
  sequence: "welcome" | "game-complete" | "advanced-features" | "custom";
  customSteps?: OnboardingStep[];
  userLevel?: "newcomer" | "player" | "challenger" | "whale_hunter";
  completedSteps?: string[];
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

export default function UnifiedOnboardingIntegration({
  sequence,
  customSteps,
  userLevel: providedUserLevel,
  completedSteps = [],
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
}: UnifiedOnboardingIntegrationProps) {
  // Add localStorage-based completion tracking
  const { hasSeenOnboarding, markOnboardingCompleted } = useSubtleOnboarding();

  // Unique instance ID for debugging multiple mounts
  const instanceId = useRef(
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  ).current;

  // Map sequence to onboarding type for localStorage tracking
  const getOnboardingType = (seq: string) => {
    switch (seq) {
      case "welcome":
        return "MAIN_INTRO";
      case "game-complete":
        return "GAME_COMPLETE";
      case "advanced-features":
        return "ADVANCED_FEATURES";
      default:
        return "MAIN_INTRO";
    }
  };

  // Check if this sequence has already been completed
  const onboardingType = getOnboardingType(sequence);
  const localStorageKey = `onboarding_${onboardingType.toLowerCase()}`;
  const storedValue =
    typeof window !== "undefined"
      ? localStorage.getItem(localStorageKey)
      : null;
  console.log(
    `[OnboardingIntegration ${instanceId}] localStorage check for ${localStorageKey}:`,
    storedValue
  );
  const hasCompletedSequence =
    storedValue === "true" || hasSeenOnboarding(onboardingType as any);

  // Debug logging
  console.log(`Onboarding check:`, {
    sequence,
    onboardingType,
    hasCompletedSequence,
    allowRestart,
  });

  // Don't show onboarding if already completed (unless restart is allowed and forced)
  if (hasCompletedSequence && !allowRestart) {
    console.log("Skipping onboarding - already completed");
    return null;
  }

  // Store initial user level to prevent dynamic sequence changes
  const [initialUserLevel] = useState(providedUserLevel);
  const [initialSequence] = useState(() => {
    // Generate static sequence based on initial state
    if (sequence === "custom" && customSteps) {
      return customSteps;
    }
    return null; // Will be generated in useEffect
  });

  return (
    <ProgressiveDisclosureManager
      onLevelChange={(level) => {
        // Optional: notify parent about level changes
        console.log("User level changed to:", level);
      }}
      onEngagementChange={(level) => {
        // Optional: notify parent about engagement changes
        console.log("Engagement level changed to:", level);
      }}
    >
      {({
        userLevel,
        engagementLevel,
        availableCategories,
        updateProgress,
        getRecommendedSequence,
      }) => {
        const [steps, setSteps] = useState<OnboardingStep[]>([]);

        // Generate steps based on sequence type and INITIAL user level (static)
        useEffect(() => {
          if (initialSequence) {
            setSteps(initialSequence);
            return;
          }

          if (sequence === "custom" && customSteps) {
            setSteps(customSteps);
            return;
          }

          const options = {
            onLearnMore: () => {
              setTimeout(() => updateProgress("helpAccessed"), 0);
              onLearnMore?.();
            },
            onConnectWallet: () => {
              setTimeout(() => updateProgress("walletConnected"), 0);
              onConnectWallet?.();
            },
            onExploreGames: () => {
              setTimeout(() => updateProgress("gamesPlayed"), 0);
              onExploreGames?.();
            },
            onMintNFT: () => {
              setTimeout(() => updateProgress("nftsMinted"), 0);
              onMintNFT?.();
            },
            onPlayMore: () => {
              setTimeout(() => updateProgress("gamesPlayed"), 0);
              onPlayMore?.();
            },
            onTryChallenges: () => {
              setTimeout(() => updateProgress("socialGamesPlayed"), 0);
              onTryChallenges?.();
            },
          };

          switch (sequence) {
            case "welcome":
              // Generate static sequence based on initial user level
              const staticSteps = generateStaticWelcomeSequence(
                initialUserLevel || userLevel
              );
              setSteps(staticSteps);
              break;
            case "game-complete":
              const gameSteps = createGameCompleteSequence(options);
              setSteps(gameSteps);
              break;
            case "advanced-features":
              const advancedSteps = createAdvancedFeaturesSequence(options);
              setSteps(advancedSteps);
              break;
            default:
              setSteps([]);
          }
        }, [
          sequence,
          customSteps,
          initialSequence,
          initialUserLevel,
          // Removed userLevel to prevent re-generation on level changes
        ]);

        if (steps.length === 0) {
          return null;
        }

        return (
          <UnifiedOnboardingSystem
            steps={steps}
            userLevel={providedUserLevel || userLevel}
            completedSteps={completedSteps}
            onStepComplete={(stepId) => {
              // Track step completion asynchronously to avoid state update during render
              setTimeout(() => {
                updateProgress("helpAccessed");
              }, 0);
              onStepComplete?.(stepId);
            }}
            onSequenceComplete={() => {
              // Mark sequence as completed in localStorage
              const localStorageKey = `onboarding_${onboardingType.toLowerCase()}`;
              console.log(
                `[OnboardingIntegration ${instanceId}] Marking onboarding complete for ${localStorageKey}`
              );
              if (typeof window !== "undefined") {
                localStorage.setItem(localStorageKey, "true");
              }
              markOnboardingCompleted(onboardingType as any);
              const afterMarkValue =
                typeof window !== "undefined"
                  ? localStorage.getItem(localStorageKey)
                  : null;
              console.log(
                `[OnboardingIntegration ${instanceId}] localStorage after mark for ${localStorageKey}:`,
                afterMarkValue
              );
              console.log(
                `[OnboardingIntegration ${instanceId}] onSequenceComplete callback called`
              );
              onSequenceComplete?.();
            }}
            autoStart={autoStart}
            delay={delay}
            allowRestart={allowRestart}
            onRestart={() => {
              // Track restart asynchronously to avoid state update during render
              setTimeout(() => {
                updateProgress("helpAccessed");
              }, 0);
              onRestart?.();
            }}
            sequenceKey={sequence}
          />
        );
      }}
    </ProgressiveDisclosureManager>
  );
}

// Generate static welcome sequence based on initial user level
function generateStaticWelcomeSequence(
  userLevel: "newcomer" | "player" | "challenger" | "whale_hunter"
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
      onClick: () => {
        // This will be handled by the parent component
      },
    },
    duration: 6000,
  });

  return baseSequence;
}

// Hook for easy integration
export function useUnifiedOnboarding() {
  const [isActive, setIsActive] = useState(false);
  const [currentSequence, setCurrentSequence] = useState<
    "welcome" | "game-complete" | "advanced-features" | "custom"
  >("welcome");

  // Use progressive disclosure for smart defaults
  const { getCurrentLevel, getEngagementLevel, updateProgress } =
    useProgressiveDisclosure();

  const startOnboarding = (
    sequence:
      | "welcome"
      | "game-complete"
      | "advanced-features"
      | "custom" = "welcome"
  ) => {
    setCurrentSequence(sequence);
    setIsActive(true);
    setTimeout(() => updateProgress("helpAccessed"), 0);
  };

  const stopOnboarding = () => {
    setIsActive(false);
  };

  const restartOnboarding = () => {
    // Update progress tracking asynchronously
    setTimeout(() => updateProgress("onboardingRestarted"), 0);

    // Clear old onboarding data
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("onboarding_")
      );
      keys.forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  return {
    isActive,
    currentSequence,
    startOnboarding,
    stopOnboarding,
    restartOnboarding,
    userLevel: getCurrentLevel(),
    engagementLevel: getEngagementLevel(),
    updateProgress,
  };
}

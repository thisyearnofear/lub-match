/**
 * Unified Onboarding Integration
 * CLEAN: Simple wrapper for the unified onboarding system
 * MODULAR: Easy to use throughout the app
 * FLEXIBLE: Supports different sequences and user levels
 */

"use client";

import { useState, useEffect } from "react";
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

        // Generate steps based on sequence type and user level
        useEffect(() => {
          if (sequence === "custom" && customSteps) {
            setSteps(customSteps);
            return;
          }

          const options = {
            onLearnMore: () => {
              updateProgress("helpAccessed");
              onLearnMore?.();
            },
            onConnectWallet: () => {
              updateProgress("walletConnected", 1);
              onConnectWallet?.();
            },
            onExploreGames: () => {
              updateProgress("gamesPlayed");
              onExploreGames?.();
            },
            onMintNFT: () => {
              updateProgress("nftsMinted");
              onMintNFT?.();
            },
            onPlayMore: () => {
              updateProgress("gamesPlayed");
              onPlayMore?.();
            },
            onTryChallenges: () => {
              updateProgress("challengesAttempted");
              onTryChallenges?.();
            },
          };

          switch (sequence) {
            case "welcome":
              // Use recommended sequence based on user level
              setSteps(getRecommendedSequence());
              break;
            case "game-complete":
              setSteps(createGameCompleteSequence(options));
              break;
            case "advanced-features":
              setSteps(createAdvancedFeaturesSequence(options));
              break;
            default:
              setSteps([]);
          }
        }, [
          sequence,
          customSteps,
          userLevel,
          availableCategories,
          getRecommendedSequence,
          onLearnMore,
          onConnectWallet,
          onExploreGames,
          onMintNFT,
          onPlayMore,
          onTryChallenges,
          updateProgress,
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
              // Track step completion by incrementing help accessed or games played
              updateProgress("helpAccessed", 1);
              onStepComplete?.(stepId);
            }}
            onSequenceComplete={onSequenceComplete}
            autoStart={autoStart}
            delay={delay}
            allowRestart={allowRestart}
            onRestart={() => {
              updateProgress("onboardingRestarted");
              onRestart?.();
            }}
            sequenceKey={sequence}
          />
        );
      }}
    </ProgressiveDisclosureManager>
  );
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
    updateProgress("helpAccessed");
  };

  const stopOnboarding = () => {
    setIsActive(false);
  };

  const restartOnboarding = () => {
    // Update progress tracking
    updateProgress("onboardingRestarted");

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

/**
 * Progressive Disclosure Manager
 * SMART: Automatically determines user level based on behavior
 * ADAPTIVE: Adjusts content based on user actions and progress
 * LAYERED: Reveals features progressively as user becomes more engaged
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { OnboardingStep } from "./UnifiedOnboardingSystem";

export type UserLevel = "newcomer" | "player" | "challenger" | "whale_hunter";
export type EngagementLevel = "none" | "curious" | "engaged" | "expert";

interface UserProgress {
  gamesPlayed: number;
  gamesCompleted: number;
  nftsMinted: number;
  challengesAttempted: number;
  socialShares: number;
  walletConnected: boolean;
  helpAccessed: number;
  onboardingRestarted: number;
  lastActive: Date;
}

interface DisclosureState {
  userLevel: UserLevel;
  engagementLevel: EngagementLevel;
  availableCategories: string[];
  shouldShowAdvanced: boolean;
  shouldShowRewards: boolean;
  shouldShowSocial: boolean;
}

export default function ProgressiveDisclosureManager({
  children,
  onLevelChange,
  onEngagementChange,
}: {
  children: (
    state: DisclosureState & {
      updateProgress: (action: keyof UserProgress, value?: number) => void;
      getRecommendedSequence: () => OnboardingStep[];
    }
  ) => React.ReactNode;
  onLevelChange?: (level: UserLevel) => void;
  onEngagementChange?: (level: EngagementLevel) => void;
}) {
  const [progress, setProgress] = useState<UserProgress>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user-progress");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...parsed, lastActive: new Date(parsed.lastActive) };
        } catch (e) {
          console.warn("Failed to parse saved progress:", e);
        }
      }
    }

    return {
      gamesPlayed: 0,
      gamesCompleted: 0,
      nftsMinted: 0,
      challengesAttempted: 0,
      socialShares: 0,
      walletConnected: false,
      helpAccessed: 0,
      onboardingRestarted: 0,
      lastActive: new Date(),
    };
  });

  // Calculate user level based on progress
  const calculateUserLevel = useCallback(
    (progress: UserProgress): UserLevel => {
      const {
        gamesCompleted,
        nftsMinted,
        challengesAttempted,
        walletConnected,
      } = progress;

      if (gamesCompleted >= 10 || nftsMinted >= 3 || challengesAttempted >= 5) {
        return "whale_hunter";
      } else if (
        gamesCompleted >= 5 ||
        nftsMinted >= 1 ||
        (walletConnected && challengesAttempted >= 2)
      ) {
        return "challenger";
      } else if (
        gamesCompleted >= 2 ||
        walletConnected ||
        challengesAttempted >= 1
      ) {
        return "player";
      } else {
        return "newcomer";
      }
    },
    []
  );

  // Calculate engagement level
  const calculateEngagementLevel = useCallback(
    (progress: UserProgress): EngagementLevel => {
      const { gamesPlayed, helpAccessed, onboardingRestarted, socialShares } =
        progress;

      if (gamesPlayed >= 5 || socialShares >= 3 || onboardingRestarted >= 2) {
        return "expert";
      } else if (gamesPlayed >= 2 || helpAccessed >= 1 || socialShares >= 1) {
        return "engaged";
      } else if (gamesPlayed >= 1 || helpAccessed >= 1) {
        return "curious";
      } else {
        return "none";
      }
    },
    []
  );

  // Get available categories based on user level and engagement
  const getAvailableCategories = useCallback(
    (userLevel: UserLevel, engagementLevel: EngagementLevel): string[] => {
      const baseCategories = ["intro", "game"];

      if (engagementLevel === "curious" || userLevel !== "newcomer") {
        baseCategories.push("social");
      }

      if (
        engagementLevel === "engaged" ||
        userLevel === "challenger" ||
        userLevel === "whale_hunter"
      ) {
        baseCategories.push("rewards");
      }

      if (engagementLevel === "expert" || userLevel === "whale_hunter") {
        baseCategories.push("advanced");
      }

      return baseCategories;
    },
    []
  );

  // Calculate disclosure state
  const disclosureState: DisclosureState = {
    userLevel: calculateUserLevel(progress),
    engagementLevel: calculateEngagementLevel(progress),
    availableCategories: getAvailableCategories(
      calculateUserLevel(progress),
      calculateEngagementLevel(progress)
    ),
    shouldShowAdvanced:
      calculateUserLevel(progress) === "whale_hunter" ||
      calculateEngagementLevel(progress) === "expert",
    shouldShowRewards:
      calculateUserLevel(progress) !== "newcomer" ||
      calculateEngagementLevel(progress) === "engaged",
    shouldShowSocial: calculateEngagementLevel(progress) !== "none",
  };

  // Update progress
  const updateProgress = useCallback(
    (action: keyof UserProgress, value: number = 1) => {
      setProgress((prev) => {
        const newProgress = {
          ...prev,
          [action]:
            typeof prev[action] === "number"
              ? (prev[action] as number) + value
              : value,
          lastActive: new Date(),
        };

        // Save to localStorage with unique key
        if (typeof window !== "undefined") {
          localStorage.setItem("user-progress", JSON.stringify(newProgress));
        }

        return newProgress;
      });
    },
    []
  );

  // Get recommended onboarding sequence based on current state
  const getRecommendedSequence = useCallback((): OnboardingStep[] => {
    const { userLevel, engagementLevel, availableCategories } = disclosureState;

    // Base sequence for newcomers
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

    // Add social features for engaged users
    if (availableCategories.includes("social")) {
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

    // Add rewards for players
    if (availableCategories.includes("rewards")) {
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

    // Add advanced features for experts
    if (availableCategories.includes("advanced")) {
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
          updateProgress("gamesPlayed");
          // Trigger game start
        },
      },
      duration: 6000,
    });

    return baseSequence;
  }, [disclosureState, updateProgress]);

  // Notify about level changes
  useEffect(() => {
    const newUserLevel = calculateUserLevel(progress);
    const newEngagementLevel = calculateEngagementLevel(progress);

    onLevelChange?.(newUserLevel);
    onEngagementChange?.(newEngagementLevel);
  }, [
    progress,
    calculateUserLevel,
    calculateEngagementLevel,
    onLevelChange,
    onEngagementChange,
  ]);

  return children({
    ...disclosureState,
    updateProgress,
    getRecommendedSequence,
  });
}

// Hook for easy access to disclosure state
export function useProgressiveDisclosure() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const updateProgress = useCallback(
    (action: keyof UserProgress, value: number = 1) => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("user-progress");
        if (saved) {
          try {
            const current = JSON.parse(saved);
            const newProgress = {
              ...current,
              [action]:
                typeof current[action] === "number"
                  ? (current[action] as number) + value
                  : value,
              lastActive: new Date(),
            };
            localStorage.setItem("user-progress", JSON.stringify(newProgress));
            setProgress(newProgress);
          } catch (e) {
            console.warn("Failed to update progress:", e);
          }
        }
      }
    },
    []
  );

  const getCurrentLevel = useCallback((): UserLevel => {
    if (!progress) return "newcomer";
    return calculateUserLevel(progress);
  }, [progress]);

  const getEngagementLevel = useCallback((): EngagementLevel => {
    if (!progress) return "none";
    return calculateEngagementLevel(progress);
  }, [progress]);

  return {
    progress,
    updateProgress,
    getCurrentLevel,
    getEngagementLevel,
  };
}

// Helper functions
function calculateUserLevel(progress: UserProgress): UserLevel {
  const { gamesCompleted, nftsMinted, challengesAttempted, walletConnected } =
    progress;

  if (gamesCompleted >= 10 || nftsMinted >= 3 || challengesAttempted >= 5) {
    return "whale_hunter";
  } else if (
    gamesCompleted >= 5 ||
    nftsMinted >= 1 ||
    (walletConnected && challengesAttempted >= 2)
  ) {
    return "challenger";
  } else if (
    gamesCompleted >= 2 ||
    walletConnected ||
    challengesAttempted >= 1
  ) {
    return "player";
  } else {
    return "newcomer";
  }
}

function calculateEngagementLevel(progress: UserProgress): EngagementLevel {
  const { gamesPlayed, helpAccessed, onboardingRestarted, socialShares } =
    progress;

  if (gamesPlayed >= 5 || socialShares >= 3 || onboardingRestarted >= 2) {
    return "expert";
  } else if (gamesPlayed >= 2 || helpAccessed >= 1 || socialShares >= 1) {
    return "engaged";
  } else if (gamesPlayed >= 1 || helpAccessed >= 1) {
    return "curious";
  } else {
    return "none";
  }
}

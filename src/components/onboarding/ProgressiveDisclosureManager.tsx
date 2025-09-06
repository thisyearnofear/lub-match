/**
 * Progressive Disclosure Manager
 * SMART: Automatically determines user level based on behavior
 * ADAPTIVE: Adjusts content based on user actions and progress
 * LAYERED: Reveals features progressively as user becomes more engaged
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { OnboardingStep } from "./UnifiedOnboardingSystem";
import {
  userProgression,
  UserProgress,
  useUserProgression,
} from "@/utils/userProgression";

export type UserLevel = "newcomer" | "player" | "challenger" | "whale_hunter";
export type EngagementLevel = "none" | "curious" | "engaged" | "expert";

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
      updateProgress: (eventType: string, data?: Record<string, any>) => void;
      getRecommendedSequence: () => OnboardingStep[];
    }
  ) => React.ReactNode;
  onLevelChange?: (level: UserLevel) => void;
  onEngagementChange?: (level: EngagementLevel) => void;
}) {
  // Use the centralized user progression system
  const { progress, recordEvent } = useUserProgression();

  // Calculate user level based on progress
  const calculateUserLevel = useCallback(
    (progress: UserProgress): UserLevel => {
      const {
        gamesCompleted,
        nftsMinted,
        socialGamesPlayed,
        hasConnectedWallet,
      } = progress;

      if (gamesCompleted >= 10 || nftsMinted >= 3 || socialGamesPlayed >= 5) {
        return "whale_hunter";
      } else if (
        gamesCompleted >= 5 ||
        nftsMinted >= 1 ||
        (hasConnectedWallet && socialGamesPlayed >= 2)
      ) {
        return "challenger";
      } else if (
        gamesCompleted >= 2 ||
        hasConnectedWallet ||
        socialGamesPlayed >= 1
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
      const { gamesCompleted, socialGamesPlayed, gamesShared } = progress;
      const totalGamesPlayed = gamesCompleted + socialGamesPlayed;

      if (totalGamesPlayed >= 5 || gamesShared >= 3) {
        return "expert";
      } else if (totalGamesPlayed >= 2 || gamesShared >= 1) {
        return "engaged";
      } else if (totalGamesPlayed >= 1) {
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
  const disclosureState: DisclosureState = useMemo(() => {
    const userLevel = calculateUserLevel(progress);
    const engagementLevel = calculateEngagementLevel(progress);
    const availableCategories = getAvailableCategories(
      userLevel,
      engagementLevel
    );

    return {
      userLevel,
      engagementLevel,
      availableCategories,
      shouldShowAdvanced:
        userLevel === "whale_hunter" || engagementLevel === "expert",
      shouldShowRewards:
        userLevel !== "newcomer" || engagementLevel === "engaged",
      shouldShowSocial: engagementLevel !== "none",
    };
  }, [
    progress,
    calculateUserLevel,
    calculateEngagementLevel,
    getAvailableCategories,
  ]);

  // Update progress using centralized system
  const updateProgress = useCallback(
    (eventType: string, data?: Record<string, any>) => {
      // Map common onboarding events to progression events
      const eventMap: Record<string, any> = {
        gamesPlayed: { type: "game_complete" },
        gamesCompleted: { type: "game_complete" },
        socialGamesPlayed: { type: "social_game" },
        nftsMinted: { type: "nft_minted" },
        walletConnected: { type: "wallet_connected" },
        gamesShared: { type: "game_shared" },
        helpAccessed: { type: "game_complete" }, // Track as engagement
      };

      const mappedEvent = eventMap[eventType];
      if (mappedEvent) {
        recordEvent({
          type: mappedEvent.type,
          timestamp: new Date().toISOString(),
          data: data || {},
        });
      }
    },
    [recordEvent]
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
          setTimeout(() => updateProgress("gamesPlayed"), 0);
          // Trigger game start
        },
      },
      duration: 6000,
    });

    return baseSequence;
  }, [
    disclosureState.userLevel,
    disclosureState.engagementLevel,
    disclosureState.availableCategories,
  ]); // More specific dependencies to prevent unnecessary re-renders

  // Notify about level changes
  useEffect(() => {
    const newUserLevel = calculateUserLevel(progress);
    const newEngagementLevel = calculateEngagementLevel(progress);

    onLevelChange?.(newUserLevel);
    onEngagementChange?.(newEngagementLevel);
  }, [
    progress.gamesCompleted,
    progress.nftsMinted,
    progress.socialGamesPlayed,
    progress.hasConnectedWallet,
    progress.gamesShared,
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

// Hook for easy access to disclosure state - now uses centralized system
export function useProgressiveDisclosure() {
  const { progress, recordEvent } = useUserProgression();

  const updateProgress = useCallback(
    (eventType: string, data?: Record<string, any>) => {
      // Map common onboarding events to progression events
      const eventMap: Record<string, any> = {
        gamesPlayed: { type: "game_complete" },
        gamesCompleted: { type: "game_complete" },
        socialGamesPlayed: { type: "social_game" },
        nftsMinted: { type: "nft_minted" },
        walletConnected: { type: "wallet_connected" },
        gamesShared: { type: "game_shared" },
        helpAccessed: { type: "game_complete" },
      };

      const mappedEvent = eventMap[eventType];
      if (mappedEvent) {
        recordEvent({
          type: mappedEvent.type,
          timestamp: new Date().toISOString(),
          data: data || {},
        });
      }
    },
    [recordEvent]
  );

  const getCurrentLevel = useCallback((): UserLevel => {
    const {
      gamesCompleted,
      nftsMinted,
      socialGamesPlayed,
      hasConnectedWallet,
    } = progress;

    if (gamesCompleted >= 10 || nftsMinted >= 3 || socialGamesPlayed >= 5) {
      return "whale_hunter";
    } else if (
      gamesCompleted >= 5 ||
      nftsMinted >= 1 ||
      (hasConnectedWallet && socialGamesPlayed >= 2)
    ) {
      return "challenger";
    } else if (
      gamesCompleted >= 2 ||
      hasConnectedWallet ||
      socialGamesPlayed >= 1
    ) {
      return "player";
    } else {
      return "newcomer";
    }
  }, [progress]);

  const getEngagementLevel = useCallback((): EngagementLevel => {
    const { gamesCompleted, socialGamesPlayed, gamesShared } = progress;
    const totalGamesPlayed = gamesCompleted + socialGamesPlayed;

    if (totalGamesPlayed >= 5 || gamesShared >= 3) {
      return "expert";
    } else if (totalGamesPlayed >= 2 || gamesShared >= 1) {
      return "engaged";
    } else if (totalGamesPlayed >= 1) {
      return "curious";
    } else {
      return "none";
    }
  }, [progress]);

  return {
    progress,
    updateProgress,
    getCurrentLevel,
    getEngagementLevel,
  };
}

"use client";

import { useCallback, useState } from "react";
import { useUserProgression } from "@/utils/userProgression";

// Storage keys for tracking onboarding state
const STORAGE_KEYS = {
  MAIN_INTRO: "subtle_onboarding_main",
  GAME_INTRO: "subtle_onboarding_game",
  GAME_COMPLETE: "subtle_onboarding_complete",
  ADVANCED_FEATURES: "subtle_onboarding_advanced",
  // Enhanced onboarding keys
  CHALLENGE_INTRO: "enhanced_onboarding_challenge",
  WHALE_HUNTING: "enhanced_onboarding_whale",
  VIRAL_SYSTEM: "enhanced_onboarding_viral",
  SAFETY_INTRO: "enhanced_onboarding_safety",
  REWARDS_SYSTEM: "enhanced_onboarding_rewards",
} as const;

type OnboardingType = keyof typeof STORAGE_KEYS;
export type UserLevel = "newcomer" | "player" | "challenger" | "whale_hunter";
export type EngagementLevel = "none" | "curious" | "engaged" | "expert";

export function useSubtleOnboarding() {
  const [activeSequence, setActiveSequence] = useState<string | null>(null);

  // Check if user has seen a specific onboarding sequence
  const hasSeenOnboarding = useCallback((type: OnboardingType): boolean => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEYS[type]) === "1";
  }, []);

  // Mark onboarding as completed
  const markOnboardingCompleted = useCallback((type: OnboardingType) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS[type], "1");
  }, []);

  // Start an onboarding sequence if not already seen
  const startOnboarding = useCallback((
    type: OnboardingType,
    sequenceId: string,
    options?: { force?: boolean; delay?: number }
  ) => {
    const { force = false, delay = 1000 } = options || {};
    
    if (!force && hasSeenOnboarding(type)) {
      return false; // Already seen
    }

    setTimeout(() => {
      setActiveSequence(sequenceId);
    }, delay);
    
    return true; // Will show
  }, [hasSeenOnboarding]);

  // Complete the current sequence
  const completeOnboarding = useCallback((type: OnboardingType) => {
    markOnboardingCompleted(type);
    setActiveSequence(null);
  }, [markOnboardingCompleted]);

  // Skip/cancel current sequence
  const skipOnboarding = useCallback(() => {
    setActiveSequence(null);
  }, []);

  // Smart onboarding that determines what to show based on context
  const showSmartOnboarding = useCallback((context: {
    isMainPage?: boolean;
    isGamePage?: boolean;
    justCompletedGame?: boolean;
    isFirstVisit?: boolean;
  }) => {
    const { isMainPage, isGamePage, justCompletedGame, isFirstVisit } = context;

    // Game completion takes priority
    if (justCompletedGame) {
      return startOnboarding("GAME_COMPLETE", "game-complete", { delay: 500 });
    }

    // First visit to main page gets full intro
    if (isMainPage && isFirstVisit && !hasSeenOnboarding("MAIN_INTRO")) {
      return startOnboarding("MAIN_INTRO", "main-intro");
    }

    // Game page gets quick intro if not seen
    if (isGamePage && !hasSeenOnboarding("GAME_INTRO")) {
      return startOnboarding("GAME_INTRO", "game-intro");
    }

    return false;
  }, [startOnboarding, hasSeenOnboarding]);

  // Enhanced user level detection using userProgression system
  const { progress } = useUserProgression();
  
  const getUserLevel = useCallback((): UserLevel => {
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

  const getCompletedSteps = useCallback((): string[] => {
    if (typeof window === "undefined") return [];

    const completed: string[] = [];
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      if (localStorage.getItem(storageKey) === "1") {
        completed.push(key.toLowerCase().replace('_', '-'));
      }
    });
    return completed;
  }, []);

  // Smart onboarding sequence generation based on user level and context
  const getRecommendedSequence = useCallback((context?: {
    isGameComplete?: boolean;
    isFirstChallenge?: boolean;
    justCompletedWhaleChallenge?: boolean;
  }) => {
    const userLevel = getUserLevel();
    const engagementLevel = getEngagementLevel();
    
    // Game completion sequence
    if (context?.isGameComplete && !hasSeenOnboarding("GAME_COMPLETE")) {
      return "game-complete";
    }
    
    // Main intro sequence
    if (!hasSeenOnboarding("MAIN_INTRO")) {
      return "welcome";
    }
    
    // Advanced features for experienced users
    if ((userLevel === "challenger" || userLevel === "whale_hunter") && 
        !hasSeenOnboarding("ADVANCED_FEATURES")) {
      return "advanced-features";
    }
    
    return null;
  }, [getUserLevel, getEngagementLevel, hasSeenOnboarding]);

  return {
    // State
    activeSequence,

    // Actions
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    showSmartOnboarding,

    // Utilities
    hasSeenOnboarding,
    markOnboardingCompleted,

    // Enhanced onboarding utilities
    getUserLevel,
    getEngagementLevel,
    getCompletedSteps,
    getRecommendedSequence,
  };
}
"use client";

import { useCallback, useState } from "react";

// Storage keys for tracking onboarding state
const STORAGE_KEYS = {
  MAIN_INTRO: "subtle_onboarding_main",
  GAME_INTRO: "subtle_onboarding_game",
  GAME_COMPLETE: "subtle_onboarding_complete",
  ADVANCED_FEATURES: "subtle_onboarding_advanced",
  // NEW: Enhanced onboarding keys (ENHANCEMENT FIRST)
  CHALLENGE_INTRO: "enhanced_onboarding_challenge",
  WHALE_HUNTING: "enhanced_onboarding_whale",
  VIRAL_SYSTEM: "enhanced_onboarding_viral",
  SAFETY_INTRO: "enhanced_onboarding_safety",
  REWARDS_SYSTEM: "enhanced_onboarding_rewards",
} as const;

type OnboardingType = keyof typeof STORAGE_KEYS;

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

  // NEW: Enhanced onboarding utilities (ENHANCEMENT FIRST)
  const getUserLevel = useCallback((): 'newcomer' | 'player' | 'challenger' | 'whale_hunter' => {
    if (typeof window === "undefined") return 'newcomer';

    const hasPlayedGame = hasSeenOnboarding("GAME_COMPLETE");
    const hasChallenged = hasSeenOnboarding("CHALLENGE_INTRO");
    const hasWhaleHunted = hasSeenOnboarding("WHALE_HUNTING");

    if (hasWhaleHunted) return 'whale_hunter';
    if (hasChallenged) return 'challenger';
    if (hasPlayedGame) return 'player';
    return 'newcomer';
  }, [hasSeenOnboarding]);

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

  const shouldShowEnhancedOnboarding = useCallback((context: {
    isFirstChallenge?: boolean;
    justCompletedWhaleChallenge?: boolean;
    justWentViral?: boolean;
    justEarnedMajorReward?: boolean;
  }): boolean => {
    const userLevel = getUserLevel();
    const { isFirstChallenge, justCompletedWhaleChallenge, justWentViral, justEarnedMajorReward } = context;

    // Show challenge intro for players who haven't seen it
    if (isFirstChallenge && userLevel === 'player' && !hasSeenOnboarding("CHALLENGE_INTRO")) {
      return true;
    }

    // Show whale hunting intro after successful whale challenge
    if (justCompletedWhaleChallenge && !hasSeenOnboarding("WHALE_HUNTING")) {
      return true;
    }

    // Show viral system explanation after first viral detection
    if (justWentViral && !hasSeenOnboarding("VIRAL_SYSTEM")) {
      return true;
    }

    // Show rewards system after major earning
    if (justEarnedMajorReward && !hasSeenOnboarding("REWARDS_SYSTEM")) {
      return true;
    }

    return false;
  }, [getUserLevel, hasSeenOnboarding]);

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

    // NEW: Enhanced onboarding (ENHANCEMENT FIRST)
    getUserLevel,
    getCompletedSteps,
    shouldShowEnhancedOnboarding,
  };
}
"use client";

import { useCallback, useState } from "react";

// Storage keys for tracking onboarding state
const STORAGE_KEYS = {
  MAIN_INTRO: "subtle_onboarding_main",
  GAME_INTRO: "subtle_onboarding_game", 
  GAME_COMPLETE: "subtle_onboarding_complete",
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
  };
}
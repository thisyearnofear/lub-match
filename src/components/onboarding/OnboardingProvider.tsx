"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useOnboardingToasts } from "./OnboardingToast";
import UnifiedOnboardingSystem, {
  OnboardingStep,
} from "./UnifiedOnboardingSystem";

interface OnboardingContextType {
  showToast: (
    title: string,
    message: string,
    options?: {
      icon?: string;
      duration?: number;
      actionButton?: {
        text: string;
        onClick: () => void;
      };
    }
  ) => void;
  hasSeenOnboarding: (type: string) => boolean;
  markOnboardingCompleted: (type: string) => void;
  isOnboardingActive: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const STORAGE_PREFIX = "onboarding_";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { showToast, ToastContainer } = useOnboardingToasts();

  const [isClient, setIsClient] = useState(false);
  const [completionState, setCompletionState] = useState<
    Record<string, boolean>
  >({});

  const [isOnboardingActive, setIsOnboardingActive] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Sync localStorage on mount
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(STORAGE_PREFIX)
      );
      const state: Record<string, boolean> = {};
      keys.forEach((key) => {
        state[key.replace(STORAGE_PREFIX, "")] =
          localStorage.getItem(key) === "true";
      });
      setCompletionState(state);
    }
  }, []);
  const hasSeenOnboarding = useCallback(
    (type: string): boolean => {
      return completionState[type] || false;
    },
    [completionState]
  );

  const markOnboardingCompleted = useCallback((type: string) => {
    if (typeof window !== "undefined") {
      const key = `${STORAGE_PREFIX}${type}`;
      localStorage.setItem(key, "true");
    }
    setCompletionState((prev) => ({ ...prev, [type]: true }));
    setIsOnboardingActive(false);
  }, []);

  // Render single instance of onboarding system if not completed
  const showWelcomeOnboarding = !hasSeenOnboarding("MAIN_INTRO") && isClient;

  if (showWelcomeOnboarding) {
    const welcomeSteps: OnboardingStep[] = [
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
        id: "ready-to-play",
        title: "Ready to Play?",
        message: "That's it! Start matching and have fun.",
        icon: "🚀",
        category: "intro",
        complexity: "basic",
        duration: 6000,
      },
    ];

    return (
      <OnboardingContext.Provider
        value={{
          showToast,
          hasSeenOnboarding,
          markOnboardingCompleted,
          isOnboardingActive: true,
        }}
      >
        {children}
        <ToastContainer />
        <UnifiedOnboardingSystem
          steps={welcomeSteps}
          userLevel="newcomer"
          onSequenceComplete={() => markOnboardingCompleted("MAIN_INTRO")}
          autoStart={true}
          sequenceKey="welcome"
        />
      </OnboardingContext.Provider>
    );
  }

  return (
    <OnboardingContext.Provider
      value={{
        showToast,
        hasSeenOnboarding,
        markOnboardingCompleted,
        isOnboardingActive: false,
      }}
    >
      {children}
      <ToastContainer />
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext must be used within OnboardingProvider"
    );
  }
  return context;
}

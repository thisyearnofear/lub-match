"use client";

import { useCallback } from "react";
import { useOnboardingContext } from "@/components/onboarding/OnboardingProvider";

// Types for onboarding messages
interface OnboardingMessage {
  title: string;
  message: string;
  icon: string;
  duration: number;
  storageKey: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

// Centralized onboarding messages and logic
export const ONBOARDING_MESSAGES: Record<string, OnboardingMessage> = {
  FARCASTER_INTRO: {
    title: "🎮 Playing with Real Farcaster Users!",
    message: "These profile photos belong to trending users on Farcaster, a decentralized social network. Match the pairs to complete the game!",
    icon: "👥",
    duration: 8000,
    storageKey: "onboarding_farcaster_toast_seen",
    actionButton: {
      text: "Learn More",
      onClick: () => window.open("https://www.farcaster.xyz/", "_blank")
    }
  },
  GAME_COMPLETED: {
    title: "🎉 Congratulations!",
    message: "You've successfully matched all the Farcaster user profiles! Now you can mint this moment as an NFT or explore more social games.",
    icon: "💝",
    duration: 6000,
    storageKey: "game_completion_seen"
  },
  NEXT_STEPS: {
    title: "🚀 Your Options",
    message: "• Mint an NFT of your game\n• Play social games with other users\n• Create your own custom game\n• Share this experience with friends",
    icon: "✨",
    duration: 8000,
    storageKey: "next_steps_seen"
  }
};

export function useOnboarding() {
  const { showToast } = useOnboardingContext();

  const showOnboardingMessage = useCallback((
    messageKey: keyof typeof ONBOARDING_MESSAGES,
    options?: {
      skipStorageCheck?: boolean;
      delay?: number;
    }
  ) => {
    const message = ONBOARDING_MESSAGES[messageKey];
    const { skipStorageCheck = false, delay = 0 } = options || {};

    // Check if user has already seen this message
    if (!skipStorageCheck && typeof window !== "undefined") {
      const hasSeenMessage = localStorage.getItem(message.storageKey);
      if (hasSeenMessage) return;
    }

    const showMessage = () => {
      showToast(message.title, message.message, {
        icon: message.icon,
        duration: message.duration,
        actionButton: message.actionButton
      });

      // Mark as seen
      if (typeof window !== "undefined" && message.storageKey) {
        localStorage.setItem(message.storageKey, "1");
      }
    };

    if (delay > 0) {
      setTimeout(showMessage, delay);
    } else {
      showMessage();
    }
  }, [showToast]);

  const showGameCompletionFlow = useCallback(() => {
    showOnboardingMessage("GAME_COMPLETED", { skipStorageCheck: true });
    
    // Show next steps after a delay
    setTimeout(() => {
      showOnboardingMessage("NEXT_STEPS", { skipStorageCheck: true });
    }, 3000);
  }, [showOnboardingMessage]);

  return {
    showOnboardingMessage,
    showGameCompletionFlow
  };
}
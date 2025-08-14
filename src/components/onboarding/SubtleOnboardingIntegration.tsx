"use client";

import { useEffect } from "react";
import { useSubtleOnboarding } from "@/hooks/useSubtleOnboarding";
import { 
  SubtleOnboardingSystem, 
  createSubtleOnboardingSteps, 
  createQuickIntro, 
  createGameCompleteSteps 
} from "./SubtleOnboardingSystem";

interface SubtleOnboardingIntegrationProps {
  context: {
    isMainPage?: boolean;
    isGamePage?: boolean;
    justCompletedGame?: boolean;
    isFirstVisit?: boolean;
  };
  handlers?: {
    onWalletConnect?: () => void;
    onLearnMore?: () => void;
    onMintNFT?: () => void;
    onExploreGames?: () => void;
  };
}

export function SubtleOnboardingIntegration({
  context,
  handlers = {},
}: SubtleOnboardingIntegrationProps) {
  const {
    activeSequence,
    showSmartOnboarding,
    completeOnboarding,
    skipOnboarding,
  } = useSubtleOnboarding();

  const {
    onWalletConnect,
    onLearnMore = () => window.open("https://www.farcaster.xyz/", "_blank"),
    onMintNFT,
    onExploreGames,
  } = handlers;

  // Auto-trigger onboarding based on context
  useEffect(() => {
    showSmartOnboarding(context);
  }, [context, showSmartOnboarding]);

  // Determine which steps to show based on active sequence
  const getStepsForSequence = () => {
    switch (activeSequence) {
      case "main-intro":
        return createSubtleOnboardingSteps({
          onLearnMore,
          onConnectWallet: onWalletConnect,
          onExploreGames,
        });
      
      case "game-intro":
        return createQuickIntro();
      
      case "game-complete":
        return createGameCompleteSteps({
          onMintNFT,
          onPlayMore: onExploreGames,
        });
      
      default:
        return [];
    }
  };

  const handleComplete = () => {
    const typeMap = {
      "main-intro": "MAIN_INTRO" as const,
      "game-intro": "GAME_INTRO" as const,
      "game-complete": "GAME_COMPLETE" as const,
    };
    
    if (activeSequence && typeMap[activeSequence as keyof typeof typeMap]) {
      completeOnboarding(typeMap[activeSequence as keyof typeof typeMap]);
    }
  };

  if (!activeSequence) {
    return null;
  }

  return (
    <SubtleOnboardingSystem
      steps={getStepsForSequence()}
      onComplete={handleComplete}
      autoStart={true}
      delay={0} // Already handled by the hook
    />
  );
}

// Convenience components for specific contexts
export function MainPageSubtleOnboarding(props: Omit<SubtleOnboardingIntegrationProps, 'context'>) {
  const isFirstVisit = typeof window !== 'undefined' && !localStorage.getItem('has_visited');
  
  return (
    <SubtleOnboardingIntegration
      {...props}
      context={{
        isMainPage: true,
        isFirstVisit,
      }}
    />
  );
}

export function GamePageSubtleOnboarding(props: Omit<SubtleOnboardingIntegrationProps, 'context'>) {
  return (
    <SubtleOnboardingIntegration
      {...props}
      context={{
        isGamePage: true,
      }}
    />
  );
}

export function GameCompletionSubtleOnboarding(props: Omit<SubtleOnboardingIntegrationProps, 'context'>) {
  return (
    <SubtleOnboardingIntegration
      {...props}
      context={{
        justCompletedGame: true,
      }}
    />
  );
}
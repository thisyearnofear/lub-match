/**
 * Enhanced Onboarding Integration
 * CLEAN: Context-aware onboarding with progressive disclosure
 * MODULAR: Composable onboarding sequences for different user journeys
 * PERFORMANT: Smart triggering based on user actions and progress
 */

"use client";

import { useEffect, useState } from "react";
import { useSubtleOnboarding } from "@/hooks/useSubtleOnboarding";
import ProgressiveOnboardingSystem from "./ProgressiveOnboardingSystem";
import {
  createWelcomeSequence,
  createGameIntroSequence,
  createChallengeSystemIntro,
  createSafetyIntro,
  createRewardsExplanation,
  createPostGameSequence,
  createChallengeSuccessSequence,
  EnhancedOnboardingStep
} from "./EnhancedOnboardingSteps";

interface EnhancedOnboardingProps {
  context: {
    // Basic context
    isMainPage?: boolean;
    isGamePage?: boolean;
    isSocialGamesPage?: boolean;
    isFirstVisit?: boolean;
    
    // Game context
    justCompletedGame?: boolean;
    gameStats?: {
      score: number;
      accuracy: number;
      earnedLUB: number;
    };
    
    // Challenge context
    isFirstChallenge?: boolean;
    justCompletedChallenge?: boolean;
    challengeResult?: {
      success: boolean;
      reward: number;
      whaleMultiplier: number;
      viralDetected: boolean;
    };
    
    // Achievement context
    justCompletedWhaleChallenge?: boolean;
    justWentViral?: boolean;
    justEarnedMajorReward?: boolean;
    
    // User progress
    totalGamesPlayed?: number;
    totalChallengesCompleted?: number;
    totalLUBEarned?: number;
  };
  
  handlers?: {
    onWalletConnect?: () => void;
    onLearnMore?: () => void;
    onMintNFT?: () => void;
    onExploreGames?: () => void;
    onTryChallenges?: () => void;
    onShareSuccess?: () => void;
    onLearnWhales?: () => void;
  };
}

export default function EnhancedOnboardingIntegration({
  context,
  handlers = {}
}: EnhancedOnboardingProps) {
  const {
    getUserLevel,
    getCompletedSteps,
    shouldShowEnhancedOnboarding,
    hasSeenOnboarding,
    markOnboardingCompleted
  } = useSubtleOnboarding();

  const [currentSequence, setCurrentSequence] = useState<{
    steps: EnhancedOnboardingStep[];
    type: string;
  } | null>(null);

  const userLevel = getUserLevel();
  const completedSteps = getCompletedSteps();

  // Default handlers
  const {
    onWalletConnect,
    onLearnMore = () => window.open("https://www.farcaster.xyz/", "_blank"),
    onMintNFT,
    onExploreGames,
    onTryChallenges,
    onShareSuccess,
    onLearnWhales
  } = handlers;

  // Determine which onboarding sequence to show
  useEffect(() => {
    // Priority order: specific achievements > general progress > first visit
    
    // Challenge success celebration (highest priority)
    if (context.justCompletedChallenge && context.challengeResult) {
      const steps = createChallengeSuccessSequence({
        onShareSuccess,
        onTryHarder: onTryChallenges,
        challengeResult: context.challengeResult
      });
      setCurrentSequence({ steps, type: 'challenge-success' });
      return;
    }
    
    // Post-game sequence for completed games
    if (context.justCompletedGame && context.gameStats) {
      const steps = createPostGameSequence({
        onMintNFT,
        onTryChallenges,
        onExploreMore: onExploreGames,
        gameStats: context.gameStats
      });
      setCurrentSequence({ steps, type: 'post-game' });
      return;
    }
    
    // First challenge introduction
    if (context.isFirstChallenge && userLevel === 'player' && !hasSeenOnboarding("CHALLENGE_INTRO")) {
      const steps = createChallengeSystemIntro({
        onTryChallenges,
        onLearnWhales
      });
      setCurrentSequence({ steps, type: 'challenge-intro' });
      return;
    }
    
    // Safety introduction for new challengers
    if (context.isSocialGamesPage && userLevel === 'challenger' && !hasSeenOnboarding("SAFETY_INTRO")) {
      const steps = createSafetyIntro();
      setCurrentSequence({ steps, type: 'safety-intro' });
      return;
    }
    
    // Rewards explanation for users earning significant LUB
    if (context.justEarnedMajorReward && !hasSeenOnboarding("REWARDS_SYSTEM")) {
      const steps = createRewardsExplanation({
        onConnectWallet: onWalletConnect,
        onMintNFT
      });
      setCurrentSequence({ steps, type: 'rewards-explanation' });
      return;
    }
    
    // Game introduction for game page
    if (context.isGamePage && userLevel === 'newcomer' && !hasSeenOnboarding("GAME_INTRO")) {
      const steps = createGameIntroSequence();
      setCurrentSequence({ steps, type: 'game-intro' });
      return;
    }
    
    // Welcome sequence for first-time visitors
    if (context.isMainPage && context.isFirstVisit && !hasSeenOnboarding("MAIN_INTRO")) {
      const steps = createWelcomeSequence({
        onLearnMore,
        onConnectWallet: onWalletConnect,
        onStartGame: onExploreGames
      });
      setCurrentSequence({ steps, type: 'welcome' });
      return;
    }
    
    // Enhanced onboarding for specific achievements
    if (shouldShowEnhancedOnboarding(context)) {
      // This will be handled by the specific context checks above
      return;
    }
    
    // No onboarding needed
    setCurrentSequence(null);
  }, [
    context,
    userLevel,
    hasSeenOnboarding,
    shouldShowEnhancedOnboarding,
    onWalletConnect,
    onLearnMore,
    onMintNFT,
    onExploreGames,
    onTryChallenges,
    onShareSuccess,
    onLearnWhales
  ]);

  // Handle step completion
  const handleStepComplete = (stepId: string) => {
    console.log(`Onboarding step completed: ${stepId}`);
    // Could track analytics here
  };

  // Handle sequence completion
  const handleSequenceComplete = () => {
    if (!currentSequence) return;
    
    // Mark the appropriate onboarding as completed
    const completionMap: Record<string, keyof typeof import("@/hooks/useSubtleOnboarding").STORAGE_KEYS> = {
      'welcome': 'MAIN_INTRO',
      'game-intro': 'GAME_INTRO',
      'post-game': 'GAME_COMPLETE',
      'challenge-intro': 'CHALLENGE_INTRO',
      'challenge-success': 'CHALLENGE_INTRO', // Same as intro
      'safety-intro': 'SAFETY_INTRO',
      'rewards-explanation': 'REWARDS_SYSTEM'
    };
    
    const completionKey = completionMap[currentSequence.type];
    if (completionKey) {
      markOnboardingCompleted(completionKey);
    }
    
    setCurrentSequence(null);
  };

  // Don't render if no sequence
  if (!currentSequence || currentSequence.steps.length === 0) {
    return null;
  }

  return (
    <ProgressiveOnboardingSystem
      steps={currentSequence.steps}
      userLevel={userLevel}
      completedSteps={completedSteps}
      onStepComplete={handleStepComplete}
      onSequenceComplete={handleSequenceComplete}
      autoStart={true}
      delay={1000}
    />
  );
}

// Convenience components for specific contexts
export function MainPageEnhancedOnboarding(props: Omit<EnhancedOnboardingProps, 'context'> & {
  context?: Partial<EnhancedOnboardingProps['context']>;
}) {
  const isFirstVisit = typeof window !== 'undefined' && !localStorage.getItem('has_visited');
  
  return (
    <EnhancedOnboardingIntegration
      {...props}
      context={{
        isMainPage: true,
        isFirstVisit,
        ...props.context
      }}
    />
  );
}

export function GamePageEnhancedOnboarding(props: Omit<EnhancedOnboardingProps, 'context'> & {
  context?: Partial<EnhancedOnboardingProps['context']>;
}) {
  return (
    <EnhancedOnboardingIntegration
      {...props}
      context={{
        isGamePage: true,
        ...props.context
      }}
    />
  );
}

export function SocialGamesEnhancedOnboarding(props: Omit<EnhancedOnboardingProps, 'context'> & {
  context?: Partial<EnhancedOnboardingProps['context']>;
}) {
  return (
    <EnhancedOnboardingIntegration
      {...props}
      context={{
        isSocialGamesPage: true,
        ...props.context
      }}
    />
  );
}

export function ChallengeSuccessOnboarding(props: Omit<EnhancedOnboardingProps, 'context'> & {
  challengeResult: NonNullable<EnhancedOnboardingProps['context']['challengeResult']>;
}) {
  return (
    <EnhancedOnboardingIntegration
      {...props}
      context={{
        justCompletedChallenge: true,
        challengeResult: props.challengeResult
      }}
    />
  );
}

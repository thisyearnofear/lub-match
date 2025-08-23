/**
 * Enhanced Onboarding Steps for AI Challenge System
 * CLEAN: Progressive disclosure of features with clear explanations
 * MODULAR: Reusable step definitions for different user journeys
 * PERFORMANT: Lazy loading of complex explanations
 */

import { OnboardingStep } from "./SubtleOnboardingSystem";

// Enhanced onboarding step types
export interface EnhancedOnboardingStep extends OnboardingStep {
  category?: 'intro' | 'game' | 'challenge' | 'social' | 'rewards' | 'safety';
  complexity?: 'basic' | 'intermediate' | 'advanced';
  prerequisites?: string[]; // IDs of steps that should be completed first
  visual?: {
    animation?: 'bounce' | 'pulse' | 'glow' | 'shake';
    gradient?: string;
    emoji?: string;
  };
}

// Progressive onboarding sequences
export const createWelcomeSequence = (options: {
  onLearnMore?: () => void;
  onConnectWallet?: () => void;
  onStartGame?: () => void;
}): EnhancedOnboardingStep[] => [
  {
    id: "welcome-new",
    title: "Welcome to Lub Match! 💝",
    message: "A viral social gaming platform where memory meets AI-powered challenges!",
    icon: "🚀",
    category: 'intro',
    complexity: 'basic',
    duration: 6000,
    visual: {
      animation: 'bounce',
      gradient: 'from-pink-500 to-purple-600',
      emoji: '💝'
    }
  },
  {
    id: "platform-overview",
    title: "Three Ways to Play",
    message: "🧠 Memory Games • 🤖 AI Challenges • 🐋 Whale Hunting - All with real rewards!",
    icon: "🎮",
    category: 'intro',
    complexity: 'basic',
    duration: 8000,
    actionButton: {
      text: "Start Playing",
      onClick: () => options.onStartGame?.(),
    }
  },
  {
    id: "farcaster-integration",
    title: "Social Gaming Revolution",
    message: "Challenge real Farcaster users, earn LUB tokens, and go viral with your success!",
    icon: "🌐",
    category: 'social',
    complexity: 'basic',
    duration: 7000,
    actionButton: {
      text: "Learn About Farcaster",
      onClick: () => options.onLearnMore?.(),
    }
  }
];

export const createGameIntroSequence = (): EnhancedOnboardingStep[] => [
  {
    id: "memory-game-intro",
    title: "Heart-Shaped Memory Game 💝",
    message: "Match pairs of trending Farcaster users to complete the heart puzzle!",
    icon: "🧠",
    category: 'game',
    complexity: 'basic',
    duration: 5000,
    visual: {
      animation: 'pulse',
      emoji: '💝'
    }
  },
  {
    id: "earn-while-playing",
    title: "Earn LUB Tokens",
    message: "Every game completion earns you LUB tokens - the more accurate, the more you earn!",
    icon: "✨",
    category: 'rewards',
    complexity: 'basic',
    duration: 6000,
    visual: {
      animation: 'glow',
      gradient: 'from-yellow-400 to-orange-500'
    }
  }
];

export const createChallengeSystemIntro = (options: {
  onTryChallenges?: () => void;
  onLearnWhales?: () => void;
}): EnhancedOnboardingStep[] => [
  {
    id: "challenge-system-intro",
    title: "🤖 AI Challenge System",
    message: "Create custom challenges for Farcaster users with AI-generated tasks!",
    icon: "🎯",
    category: 'challenge',
    complexity: 'intermediate',
    duration: 7000,
    prerequisites: ['memory-game-intro'],
    visual: {
      animation: 'bounce',
      gradient: 'from-purple-500 to-pink-500'
    }
  },
  {
    id: "whale-hunting-intro",
    title: "🐋 Whale Hunting",
    message: "Target users with 10k+ followers for massive rewards - up to 25x multiplier!",
    icon: "🐋",
    category: 'challenge',
    complexity: 'advanced',
    duration: 8000,
    actionButton: {
      text: "See Whale Rewards",
      onClick: () => options.onLearnWhales?.(),
    },
    visual: {
      animation: 'shake',
      gradient: 'from-cyan-500 to-blue-600'
    }
  },
  {
    id: "viral-detection",
    title: "🚀 Viral Rewards",
    message: "When your challenge target mentions $LUB, you both get bonus rewards!",
    icon: "🚀",
    category: 'challenge',
    complexity: 'advanced',
    duration: 7000,
    visual: {
      animation: 'glow',
      gradient: 'from-pink-500 to-red-500'
    }
  },
  {
    id: "try-challenges",
    title: "Ready to Challenge?",
    message: "Start with easy challenges and work your way up to whale hunting!",
    icon: "💪",
    category: 'challenge',
    complexity: 'intermediate',
    duration: 6000,
    actionButton: {
      text: "Try Challenges",
      onClick: () => options.onTryChallenges?.(),
    }
  }
];

export const createSafetyIntro = (): EnhancedOnboardingStep[] => [
  {
    id: "community-safety",
    title: "🛡️ Safe Community",
    message: "Our AI prevents spam and abuse. Report inappropriate content to keep everyone safe!",
    icon: "🛡️",
    category: 'safety',
    complexity: 'basic',
    duration: 6000,
    visual: {
      gradient: 'from-green-500 to-emerald-600'
    }
  },
  {
    id: "rate-limits",
    title: "Fair Play Rules",
    message: "5 challenges per hour, quality content only. Build reputation for better rewards!",
    icon: "⚖️",
    category: 'safety',
    complexity: 'basic',
    duration: 5000
  }
];

export const createRewardsExplanation = (options: {
  onConnectWallet?: () => void;
  onMintNFT?: () => void;
}): EnhancedOnboardingStep[] => [
  {
    id: "lub-token-intro",
    title: "💰 LUB Token Economy",
    message: "Earn LUB through games and challenges. Use it for NFT minting and premium features!",
    icon: "💰",
    category: 'rewards',
    complexity: 'basic',
    duration: 7000,
    visual: {
      animation: 'glow',
      gradient: 'from-yellow-400 to-orange-500'
    }
  },
  {
    id: "reward-tiers",
    title: "Reward Structure",
    message: "🐟 Fish (2x) • 🦈 Shark (5x) • 🐋 Whale (10x) • 🌊 Mega Whale (25x)",
    icon: "📊",
    category: 'rewards',
    complexity: 'intermediate',
    duration: 8000
  },
  {
    id: "nft-minting",
    title: "Mint Your Success",
    message: "Turn your game victories into collectible NFTs with social metadata!",
    icon: "🎨",
    category: 'rewards',
    complexity: 'intermediate',
    duration: 6000,
    actionButton: {
      text: "Connect Wallet",
      onClick: () => options.onConnectWallet?.(),
    }
  }
];

export const createPostGameSequence = (options: {
  onMintNFT?: () => void;
  onTryChallenges?: () => void;
  onExploreMore?: () => void;
  gameStats?: {
    score: number;
    accuracy: number;
    earnedLUB: number;
  };
}): EnhancedOnboardingStep[] => {
  const { gameStats } = options;
  
  return [
    {
      id: "game-complete-celebration",
      title: "🎉 Game Complete!",
      message: gameStats 
        ? `Score: ${gameStats.score} • Accuracy: ${gameStats.accuracy}% • Earned: ${gameStats.earnedLUB} LUB`
        : "Great job completing your first game!",
      icon: "🏆",
      category: 'game',
      complexity: 'basic',
      duration: 6000,
      visual: {
        animation: 'bounce',
        gradient: 'from-green-400 to-emerald-500'
      }
    },
    {
      id: "next-level-unlock",
      title: "🚀 Level Up Your Game",
      message: "Ready for bigger rewards? Try AI challenges for 10x-25x more LUB!",
      icon: "⬆️",
      category: 'challenge',
      complexity: 'intermediate',
      duration: 7000,
      actionButton: {
        text: "Try Challenges",
        onClick: () => options.onTryChallenges?.(),
      }
    },
    {
      id: "mint-your-victory",
      title: "🎨 Immortalize Your Win",
      message: "Mint an NFT of your game with the Farcaster users you matched!",
      icon: "🎨",
      category: 'rewards',
      complexity: 'intermediate',
      duration: 6000,
      actionButton: {
        text: "Mint NFT",
        onClick: () => options.onMintNFT?.(),
      }
    }
  ];
};

export const createChallengeSuccessSequence = (options: {
  onShareSuccess?: () => void;
  onTryHarder?: () => void;
  challengeResult?: {
    success: boolean;
    reward: number;
    whaleMultiplier: number;
    viralDetected: boolean;
  };
}): EnhancedOnboardingStep[] => {
  const { challengeResult } = options;
  
  if (!challengeResult) return [];
  
  const steps: EnhancedOnboardingStep[] = [];
  
  if (challengeResult.success) {
    steps.push({
      id: "challenge-success",
      title: challengeResult.viralDetected ? "🚀 VIRAL SUCCESS!" : "🎯 Challenge Complete!",
      message: `Earned ${challengeResult.reward} LUB${challengeResult.whaleMultiplier > 1 ? ` (${challengeResult.whaleMultiplier}x whale bonus!)` : ''}`,
      icon: challengeResult.viralDetected ? "🚀" : "🎯",
      category: 'challenge',
      complexity: 'intermediate',
      duration: 8000,
      visual: {
        animation: challengeResult.viralDetected ? 'glow' : 'bounce',
        gradient: challengeResult.viralDetected ? 'from-pink-500 to-red-500' : 'from-purple-500 to-pink-500'
      }
    });
    
    if (challengeResult.whaleMultiplier >= 10) {
      steps.push({
        id: "whale-master",
        title: "🐋 Whale Master!",
        message: "You've successfully challenged a whale! You're becoming a legend!",
        icon: "👑",
        category: 'challenge',
        complexity: 'advanced',
        duration: 7000,
        visual: {
          animation: 'glow',
          gradient: 'from-cyan-500 to-blue-600'
        }
      });
    }
    
    steps.push({
      id: "share-victory",
      title: "📢 Share Your Victory",
      message: "Let the world know about your challenge success and earn viral bonuses!",
      icon: "📢",
      category: 'social',
      complexity: 'basic',
      duration: 6000,
      actionButton: {
        text: "Share Success",
        onClick: () => options.onShareSuccess?.(),
      }
    });
  } else {
    steps.push({
      id: "challenge-learning",
      title: "💪 Keep Trying!",
      message: "Challenges are tough! Try easier targets first, then work up to whales.",
      icon: "💪",
      category: 'challenge',
      complexity: 'basic',
      duration: 6000,
      actionButton: {
        text: "Try Again",
        onClick: () => options.onTryHarder?.(),
      }
    });
  }
  
  return steps;
};

// Utility function to filter steps by complexity for progressive disclosure
export const filterStepsByComplexity = (
  steps: EnhancedOnboardingStep[], 
  maxComplexity: 'basic' | 'intermediate' | 'advanced' = 'basic'
): EnhancedOnboardingStep[] => {
  const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 };
  const maxLevel = complexityOrder[maxComplexity];
  
  return steps.filter(step => {
    const stepLevel = complexityOrder[step.complexity || 'basic'];
    return stepLevel <= maxLevel;
  });
};

// Utility function to check prerequisites
export const checkPrerequisites = (
  step: EnhancedOnboardingStep,
  completedSteps: string[]
): boolean => {
  if (!step.prerequisites) return true;
  return step.prerequisites.every(prereq => completedSteps.includes(prereq));
};

/**
 * Experience Tier Hook
 * ENHANCEMENT FIRST: Manages the three-tier experience state
 * CLEAN: Pure hook with clear state management
 * DRY: Single source of truth for experience tier logic
 * PERFORMANT: Optimized state updates and caching
 */

import { useState, useEffect, useCallback } from 'react';
import { ExperienceTier, SocialUser } from '@/types/socialGames';
import { CollaborationService, EXPERIENCE_TIERS } from '@/services/collaborationService';

interface UseExperienceTierOptions {
  initialTier?: ExperienceTier;
  user?: SocialUser;
  gameHistory?: any[];
  autoDetect?: boolean;
}

interface UseExperienceTierReturn {
  currentTier: ExperienceTier;
  tierConfig: typeof EXPERIENCE_TIERS[ExperienceTier];
  setTier: (tier: ExperienceTier) => void;
  canAccessFeature: (feature: keyof typeof EXPERIENCE_TIERS[ExperienceTier]['features']) => boolean;
  getTierStyling: () => typeof EXPERIENCE_TIERS[ExperienceTier]['styling'];
  getAvailableTiers: () => ExperienceTier[];
  isFeatureEnabled: (feature: string) => boolean;
  upgradeToTier: (tier: ExperienceTier) => void;
  getNextTier: () => ExperienceTier | null;
  canUpgrade: boolean;
}

export function useExperienceTier(options: UseExperienceTierOptions = {}): UseExperienceTierReturn {
  const {
    initialTier = 'love',
    user,
    gameHistory = [],
    autoDetect = true
  } = options;

  // PERFORMANT: State management with localStorage persistence
  const [currentTier, setCurrentTier] = useState<ExperienceTier>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lub-match-experience-tier');
      if (saved && (saved === 'love' || saved === 'social' || saved === 'professional')) {
        return saved as ExperienceTier;
      }
    }
    return initialTier;
  });

  // CLEAN: Auto-detect tier based on user activity
  useEffect(() => {
    if (autoDetect && user) {
      const detectedTier = CollaborationService.getUserExperienceTier(user, gameHistory);
      if (detectedTier !== currentTier) {
        setCurrentTier(detectedTier);
      }
    }
  }, [user, gameHistory, autoDetect, currentTier]);

  // PERFORMANT: Persist tier changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lub-match-experience-tier', currentTier);
    }
  }, [currentTier]);

  // CLEAN: Get current tier configuration
  const tierConfig = EXPERIENCE_TIERS[currentTier];

  // MODULAR: Tier management functions
  const setTier = useCallback((tier: ExperienceTier) => {
    setCurrentTier(tier);
  }, []);

  const canAccessFeature = useCallback((feature: keyof typeof EXPERIENCE_TIERS[ExperienceTier]['features']) => {
    return tierConfig.features[feature];
  }, [tierConfig]);

  const getTierStyling = useCallback(() => {
    return tierConfig.styling;
  }, [tierConfig]);

  const getAvailableTiers = useCallback((): ExperienceTier[] => {
    // ENHANCED: More intuitive tier progression with clear requirements
    const tiers: ExperienceTier[] = ['love']; // Everyone starts with love

    // Social tier available after first game completion or social activity
    if (gameHistory.length > 0 || (user && user.followerCount > 10)) {
      tiers.push('social');
    }

    // Professional tier available with higher engagement or explicit interest
    if ((user?.collaborationProfile?.lookingForCollaborators) ||
        (gameHistory.length > 3 && user && user.followerCount > 50) ||
        (gameHistory.length > 10)) {
      tiers.push('professional');
    }

    return tiers;
  }, [user, gameHistory]);

  const isFeatureEnabled = useCallback((feature: string) => {
    switch (feature) {
      case 'memoryGame':
        return tierConfig.features.memoryGame;
      case 'socialGames':
        return tierConfig.features.socialGames;
      case 'collaboration':
        return tierConfig.features.collaboration;
      case 'nftMinting':
        return tierConfig.features.nftMinting;
      case 'crossPlatform':
        return tierConfig.features.crossPlatform;
      default:
        return false;
    }
  }, [tierConfig]);

  const upgradeToTier = useCallback((tier: ExperienceTier) => {
    const availableTiers = getAvailableTiers();
    if (availableTiers.includes(tier)) {
      setCurrentTier(tier);
    }
  }, [getAvailableTiers]);

  const getNextTier = useCallback((): ExperienceTier | null => {
    const tierOrder: ExperienceTier[] = ['love', 'social', 'professional'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const availableTiers = getAvailableTiers();
    
    for (let i = currentIndex + 1; i < tierOrder.length; i++) {
      if (availableTiers.includes(tierOrder[i])) {
        return tierOrder[i];
      }
    }
    
    return null;
  }, [currentTier, getAvailableTiers]);

  const canUpgrade = getNextTier() !== null;

  return {
    currentTier,
    tierConfig,
    setTier,
    canAccessFeature,
    getTierStyling,
    getAvailableTiers,
    isFeatureEnabled,
    upgradeToTier,
    getNextTier,
    canUpgrade
  };
}

// MODULAR: Utility functions for tier management
export const ExperienceTierUtils = {
  /**
   * Get tier progression requirements
   */
  getTierRequirements: (tier: ExperienceTier): string[] => {
    switch (tier) {
      case 'love':
        return ['Complete your first memory game'];
      case 'social':
        return ['Play memory games', 'Connect with social networks'];
      case 'professional':
        return [
          'Complete 3+ games to prove your creative spirit ✨',
          'Grow your creative community (50+ followers)',
          'Show your collaborative magic',
          'AI weaves you with kindred creative souls 🎨'
        ];
      default:
        return [];
    }
  },

  /**
   * Get tier benefits
   */
  getTierBenefits: (tier: ExperienceTier): string[] => {
    const config = EXPERIENCE_TIERS[tier];
    const benefits: string[] = [];

    if (config.features.memoryGame) benefits.push('Heart-shaped memory games');
    if (config.features.socialGames) benefits.push('Social challenges and games');
    if (config.features.collaboration) {
      benefits.push('🎨 AI-powered creative soul matching');
      benefits.push('🌈 Cross-universe creative connections');
      benefits.push('✨ Magical collaboration sparks');
    }
    if (config.features.nftMinting) benefits.push('NFT minting and collection');
    if (config.features.crossPlatform) benefits.push('Cross-platform social connections');

    return benefits;
  },

  /**
   * Check if user meets tier requirements
   */
  meetsRequirements: (tier: ExperienceTier, user?: SocialUser, gameHistory: any[] = []): boolean => {
    switch (tier) {
      case 'love':
        return true; // Everyone can access love tier
      case 'social':
        return gameHistory.length > 0 || (user?.followerCount || 0) > 0;
      case 'professional':
        return !!user?.collaborationProfile || gameHistory.length > 5;
      default:
        return false;
    }
  },

  /**
   * Get recommended tier for user
   */
  getRecommendedTier: (user?: SocialUser, gameHistory: any[] = []): ExperienceTier => {
    if (user?.collaborationProfile?.lookingForCollaborators) {
      return 'professional';
    }
    
    if (gameHistory.length > 2 || (user?.followerCount || 0) > 100) {
      return 'social';
    }
    
    return 'love';
  }
};
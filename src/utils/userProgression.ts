// User Progression System - Track user journey and enable progressive Web3 features
// Maintains user state across sessions and determines feature visibility

import { WEB3_CONFIG } from "@/config";
import { pricingEngine, UserPricingState, LubMode } from "./pricingEngine";
import { analytics } from "./analytics";

export type UserTier = "newcomer" | "engaged" | "web3-ready" | "power-user";

export interface UserProgress {
  // Activity tracking
  gamesCompleted: number;
  socialGamesPlayed: number;
  farcasterLubsCreated: number;
  romanceLubsCreated: number;
  nftsMinted: number;
  
  // Engagement tracking
  gamesShared: number;
  photosSharedByOthers: number;
  referralsSent: number;
  
  // Web3 progression
  hasConnectedWallet: boolean;
  hasViewedWeb3Explanation: boolean;
  lubBalance: bigint;
  totalLubEarned: bigint;
  
  // Timestamps
  firstVisit: string;
  lastActivity: string;
  
  // Computed properties
  tier: UserTier;
  totalLubsCreated: number;
}

export interface ProgressionEvent {
  type: 'game_complete' | 'social_game' | 'lub_created' | 'nft_minted' | 'wallet_connected' | 'lub_earned' | 'game_shared' | 'referral_sent';
  timestamp: string;
  data?: Record<string, any>;
}

export interface FeatureVisibility {
  // Core features (always visible)
  demoGame: boolean;
  socialGames: boolean;
  gameSharing: boolean;
  
  // Progressive features
  lubCreation: boolean;
  web3Explanation: boolean;
  walletConnection: boolean;
  nftMinting: boolean;
  tokenEarning: boolean;
  
  // Advanced features
  tokenEconomics: boolean;
  pricingDisplay: boolean;
  earningHistory: boolean;
}

export interface UserMessaging {
  welcomeMessage: string;
  primaryCTA: string;
  secondaryCTA?: string;
  web3Hint?: string;
  earningOpportunity?: string;
}

class UserProgressionManager {
  private readonly STORAGE_KEY = 'lub-user-progression-v2';
  
  // Get current user progress
  getUserProgress(): UserProgress {
    if (typeof window === 'undefined') {
      return this.getDefaultProgress();
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return this.getDefaultProgress();
      
      const progress = JSON.parse(stored) as Partial<UserProgress>;
      const fullProgress = {
        ...this.getDefaultProgress(),
        ...progress,
        // Ensure BigInt fields are properly restored
        lubBalance: typeof progress.lubBalance === 'string' ? BigInt(progress.lubBalance) : BigInt(0),
        totalLubEarned: typeof progress.totalLubEarned === 'string' ? BigInt(progress.totalLubEarned) : BigInt(0),
      };
      
      // Recalculate computed properties
      fullProgress.totalLubsCreated = fullProgress.farcasterLubsCreated + fullProgress.romanceLubsCreated;
      fullProgress.tier = this.calculateTier(fullProgress);
      
      return fullProgress;
    } catch (error) {
      console.warn('Failed to load user progression:', error);
      return this.getDefaultProgress();
    }
  }
  
  // Record user action and update progression
  recordEvent(event: ProgressionEvent): UserProgress {
    const current = this.getUserProgress();
    const updated = { ...current };
    
    // Update counters based on event type
    switch (event.type) {
      case 'game_complete':
        updated.gamesCompleted += 1;
        break;
        
      case 'social_game':
        updated.socialGamesPlayed += 1;
        break;
        
      case 'lub_created':
        const mode = event.data?.mode as LubMode;
        if (mode === 'farcaster') {
          updated.farcasterLubsCreated += 1;
        } else if (mode === 'romance') {
          updated.romanceLubsCreated += 1;
        }
        updated.totalLubsCreated = updated.farcasterLubsCreated + updated.romanceLubsCreated;
        break;
        
      case 'nft_minted':
        updated.nftsMinted += 1;
        break;
        
      case 'wallet_connected':
        updated.hasConnectedWallet = true;
        break;
        
      case 'lub_earned':
        const amount = BigInt(event.data?.amount || 0);
        updated.lubBalance += amount;
        updated.totalLubEarned += amount;
        break;
        
      case 'game_shared':
        updated.gamesShared += 1;
        break;
        
      case 'referral_sent':
        updated.referralsSent += 1;
        break;
    }
    
    // Update timestamps
    updated.lastActivity = event.timestamp;
    
    // Recalculate tier
    updated.tier = this.calculateTier(updated);
    
    // Save to localStorage
    this.saveProgress(updated);
    
    return updated;
  }
  
  // Update LUB balance (from wallet connection)
  updateLubBalance(balance: bigint): UserProgress {
    const current = this.getUserProgress();
    const updated = { ...current, lubBalance: balance };
    updated.tier = this.calculateTier(updated);
    this.saveProgress(updated);
    return updated;
  }
  
  // Mark Web3 explanation as viewed
  markWeb3ExplanationViewed(): UserProgress {
    const current = this.getUserProgress();
    const updated = { ...current, hasViewedWeb3Explanation: true };
    this.saveProgress(updated);
    return updated;
  }
  
  // Get feature visibility based on user progression
  getFeatureVisibility(progress: UserProgress): FeatureVisibility {
    const features = WEB3_CONFIG.features;
    
    return {
      // Always visible
      demoGame: true,
      socialGames: true,
      gameSharing: true,
      
      // Progressive disclosure
      lubCreation: progress.gamesCompleted >= 1,
      web3Explanation: progress.gamesCompleted >= 2 || progress.gamesShared >= 1,
      walletConnection: progress.hasViewedWeb3Explanation || progress.tier !== 'newcomer',
      nftMinting: features.nftMintingEnabled && (progress.hasConnectedWallet || progress.tier === 'web3-ready'),
      tokenEarning: features.socialEarning && progress.tier !== 'newcomer',
      
      // Advanced features
      tokenEconomics: features.tokenEconomics && progress.tier === 'power-user',
      pricingDisplay: features.tokenEconomics && progress.hasConnectedWallet,
      earningHistory: features.socialEarning && progress.totalLubEarned > BigInt(0),
    };
  }
  
  // Get contextual messaging for current tier
  getMessaging(progress: UserProgress): UserMessaging {
    switch (progress.tier) {
      case 'newcomer':
        return {
          welcomeMessage: "💝 Welcome to Lub Match! Complete the heart to unlock social games.",
          primaryCTA: "Play Demo Game",
          secondaryCTA: "Learn More",
          web3Hint: undefined
        };
        
      case 'engaged':
        return {
          welcomeMessage: "🎮 Ready to create your own lub? Choose your adventure!",
          primaryCTA: "Create Lub",
          secondaryCTA: "Play Social Games",
          web3Hint: "💎 Turn your completed hearts into permanent digital keepsakes",
          earningOpportunity: "🎁 Earn LUB tokens by playing and sharing!"
        };
        
      case 'web3-ready':
        return {
          welcomeMessage: "💰 You're Web3 ready! Create lubs and mint NFTs.",
          primaryCTA: "Create Lub",
          secondaryCTA: "Mint NFT",
          web3Hint: `💎 You have ${this.formatLub(progress.lubBalance)} LUB`,
          earningOpportunity: "🚀 Earn more LUB by sharing photos and referring friends!"
        };
        
      case 'power-user':
        return {
          welcomeMessage: "🏆 Lub Master! You're earning and creating like a pro.",
          primaryCTA: "Create Premium Lub",
          secondaryCTA: "View Earnings",
          web3Hint: `💰 Balance: ${this.formatLub(progress.lubBalance)} LUB | Earned: ${this.formatLub(progress.totalLubEarned)} LUB`,
          earningOpportunity: "🎯 Maximize earnings with strategic photo sharing!"
        };
    }
  }
  
  // Get user's pricing state for pricing engine
  getUserPricingState(progress: UserProgress): UserPricingState {
    return {
      lubBalance: progress.lubBalance,
      farcasterLubsCreated: progress.farcasterLubsCreated,
      romanceLubsCreated: progress.romanceLubsCreated,
      totalLubsCreated: progress.totalLubsCreated,
      hasConnectedWallet: progress.hasConnectedWallet
    };
  }
  
  // Check if user should see Web3 onboarding
  shouldShowWeb3Onboarding(progress: UserProgress): boolean {
    return (
      progress.tier === 'engaged' && 
      !progress.hasViewedWeb3Explanation &&
      (progress.gamesCompleted >= 2 || progress.gamesShared >= 1)
    );
  }
  
  // Private methods
  private getDefaultProgress(): UserProgress {
    const now = new Date().toISOString();
    return {
      gamesCompleted: 0,
      socialGamesPlayed: 0,
      farcasterLubsCreated: 0,
      romanceLubsCreated: 0,
      nftsMinted: 0,
      gamesShared: 0,
      photosSharedByOthers: 0,
      referralsSent: 0,
      hasConnectedWallet: false,
      hasViewedWeb3Explanation: false,
      lubBalance: BigInt(0),
      totalLubEarned: BigInt(0),
      firstVisit: now,
      lastActivity: now,
      tier: 'newcomer',
      totalLubsCreated: 0
    };
  }
  
  private calculateTier(progress: UserProgress): UserTier {
    return pricingEngine.getUserTier(this.getUserPricingState(progress));
  }
  
  private saveProgress(progress: UserProgress): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Convert BigInt to string for JSON serialization
      const serializable = {
        ...progress,
        lubBalance: progress.lubBalance.toString(),
        totalLubEarned: progress.totalLubEarned.toString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to save user progression:', error);
    }
  }
  
  private formatLub(amount: bigint): string {
    const formatted = Number(amount) / 10 ** 18;
    return `${formatted.toLocaleString()} LUB`;
  }
}

// Singleton instance
export const userProgression = new UserProgressionManager();

// React hook for easy component integration
import { useState, useCallback, useEffect } from 'react';

export function useUserProgression() {
  const [progress, setProgress] = useState<UserProgress>(() =>
    userProgression.getUserProgress()
  );

  // Sync with localStorage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = () => {
      setProgress(userProgression.getUserProgress());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const recordEvent = useCallback((event: ProgressionEvent) => {
    const updated = userProgression.recordEvent(event);
    setProgress(updated);

    // Also send to analytics system
    analytics.track(event.type, event.data);

    return updated;
  }, []);

  const updateLubBalance = useCallback((balance: bigint) => {
    const updated = userProgression.updateLubBalance(balance);
    setProgress(updated);
    return updated;
  }, []);

  const markWeb3ExplanationViewed = useCallback(() => {
    const updated = userProgression.markWeb3ExplanationViewed();
    setProgress(updated);
    return updated;
  }, []);

  // Memoized derived state
  const features = userProgression.getFeatureVisibility(progress);
  const messaging = userProgression.getMessaging(progress);
  const pricingState = userProgression.getUserPricingState(progress);
  const shouldShowOnboarding = userProgression.shouldShowWeb3Onboarding(progress);

  return {
    progress,
    features,
    messaging,
    pricingState,
    shouldShowOnboarding,
    recordEvent,
    updateLubBalance,
    markWeb3ExplanationViewed
  };
}

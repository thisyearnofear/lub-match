/**
 * Unified User Statistics Service
 * Single source of truth for all user stats and progression
 */

import { UserStats, FormattedUserStats, StatsEvent, TIER_DISPLAY_NAMES, SOCIAL_GAME_LEVELS, SocialGameLevel } from "@/types/userStats";
import { pricingEngine, formatLubAmount } from "@/utils/pricingEngine";
import { UserTier } from "@/utils/userProgression";

export class UserStatsService {
  private readonly STORAGE_KEY = 'user-stats-unified';
  
  // Get current user stats
  getUserStats(): UserStats {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return this.getDefaultStats();
      
      const parsed = JSON.parse(stored);
      
      // Convert BigInt fields back from strings
      return {
        ...parsed,
        lubBalance: BigInt(parsed.lubBalance || 0),
        totalLubEarned: BigInt(parsed.totalLubEarned || 0),
        tier: this.calculateTier(parsed)
      };
    } catch (error) {
      console.warn('Failed to load user stats:', error);
      return this.getDefaultStats();
    }
  }
  
  // Update stats based on event
  recordEvent(event: StatsEvent): UserStats {
    const current = this.getUserStats();
    const updated = { ...current };
    
    switch (event.type) {
      case 'game_complete':
        if (event.gameType === 'memory') {
          updated.gamesCompleted += 1;
        } else if (event.gameType === 'social') {
          updated.socialGamesPlayed += 1;
        }
        break;
        
      case 'lub_created':
        if (event.mode === 'farcaster') {
          updated.farcasterLubsCreated += 1;
        } else if (event.mode === 'romance') {
          updated.romanceLubsCreated += 1;
        }
        updated.lubsCreated = updated.farcasterLubsCreated + updated.romanceLubsCreated;
        break;
        
      case 'nft_minted':
        updated.nftsMinted += 1;
        break;
        
      case 'game_shared':
        updated.gamesShared += 1;
        break;
        
      case 'referral_sent':
        updated.referralsSent += 1;
        break;
        
      case 'lub_earned':
        updated.lubBalance += event.amount;
        updated.totalLubEarned += event.amount;
        updated.lubTransactionCount += 1;
        break;

      case 'wallet_connected':
        // No specific stats to update, just triggers tier recalculation
        break;

      case 'social_game_result':
        // Update social game stats with new result
        this.updateSocialGameStats(updated, event.score, event.accuracy);
        break;
    }
    
    // Update timestamps and tier
    updated.lastActivity = new Date().toISOString();
    updated.tier = this.calculateTier(updated);
    updated.tierProgress = this.calculateTierProgress(updated);
    updated.nextTierRequirement = this.getNextTierRequirement(updated);
    
    // Save to localStorage
    this.saveStats(updated);
    
    return updated;
  }
  
  // Get formatted stats for UI display
  getFormattedStats(): FormattedUserStats {
    const stats = this.getUserStats();
    
    return {
      // Game Activity
      gamesCompleted: stats.gamesCompleted,
      socialGamesPlayed: stats.socialGamesPlayed,
      
      // Social Activity
      lubsCreated: stats.lubsCreated,
      gamesShared: stats.gamesShared,
      referralsSent: stats.referralsSent,
      
      // Web3 Activity
      nftsMinted: stats.nftsMinted,
      lubBalance: formatLubAmount(stats.lubBalance),
      totalLubEarned: formatLubAmount(stats.totalLubEarned),
      
      // Social Game Performance
      socialGameScore: stats.socialGameScore,
      socialGameAccuracy: `${stats.socialGameAccuracy.toFixed(1)}%`,
      socialGameLevel: this.getSocialGameLevel(stats),
      
      // Progression
      tier: stats.tier,
      tierDisplayName: TIER_DISPLAY_NAMES[stats.tier],
      tierProgress: stats.tierProgress,
      nextTierRequirement: stats.nextTierRequirement
    };
  }
  
  // Update LUB balance from wallet
  updateLubBalance(balance: bigint): UserStats {
    const current = this.getUserStats();
    const updated = { ...current, lubBalance: balance };
    updated.tier = this.calculateTier(updated);
    updated.tierProgress = this.calculateTierProgress(updated);
    updated.nextTierRequirement = this.getNextTierRequirement(updated);
    this.saveStats(updated);
    return updated;
  }
  
  // Reset all stats
  resetStats(): UserStats {
    const defaultStats = this.getDefaultStats();
    this.saveStats(defaultStats);
    return defaultStats;
  }
  
  // Private methods
  private getDefaultStats(): UserStats {
    const now = new Date().toISOString();
    return {
      gamesCompleted: 0,
      socialGamesPlayed: 0,
      lubsCreated: 0,
      farcasterLubsCreated: 0,
      romanceLubsCreated: 0,
      gamesShared: 0,
      referralsSent: 0,
      nftsMinted: 0,
      lubBalance: BigInt(0),
      totalLubEarned: BigInt(0),
      lubTransactionCount: 0,
      socialGameScore: 0,
      socialGameAccuracy: 0,
      socialGameBestScore: 0,
      tier: 'newcomer',
      tierProgress: 0,
      nextTierRequirement: 'Complete your first game!',
      firstVisit: now,
      lastActivity: now
    };
  }
  
  private updateSocialGameStats(stats: UserStats, score: number, accuracy: number) {
    // Update total score
    stats.socialGameScore += score;
    
    // Update best score
    stats.socialGameBestScore = Math.max(stats.socialGameBestScore, score);
    
    // Calculate running average accuracy
    const totalGames = stats.socialGamesPlayed + 1; // +1 for current game
    stats.socialGameAccuracy = ((stats.socialGameAccuracy * (totalGames - 1)) + accuracy) / totalGames;
  }
  
  private calculateTier(stats: UserStats): UserTier {
    // Use existing pricing engine logic
    return pricingEngine.getUserTier({
      lubBalance: stats.lubBalance,
      farcasterLubsCreated: stats.farcasterLubsCreated,
      romanceLubsCreated: stats.romanceLubsCreated,
      totalLubsCreated: stats.lubsCreated,
      hasConnectedWallet: stats.lubTransactionCount > 0
    });
  }
  
  private calculateTierProgress(stats: UserStats): number {
    // Simplified tier progress calculation
    switch (stats.tier) {
      case 'newcomer':
        return Math.min(100, (stats.gamesCompleted / 3) * 100);
      case 'engaged':
        return Math.min(100, (stats.socialGamesPlayed / 5) * 100);
      case 'web3-ready':
        return Math.min(100, (stats.lubsCreated / 10) * 100);
      case 'power-user':
        return 100;
      default:
        return 0;
    }
  }
  
  private getNextTierRequirement(stats: UserStats): string {
    switch (stats.tier) {
      case 'newcomer':
        const gamesNeeded = Math.max(0, 3 - stats.gamesCompleted);
        return gamesNeeded > 0 ? `Complete ${gamesNeeded} more games` : 'Ready for next tier!';
      case 'engaged':
        const socialNeeded = Math.max(0, 5 - stats.socialGamesPlayed);
        return socialNeeded > 0 ? `Play ${socialNeeded} more social games` : 'Ready for next tier!';
      case 'web3-ready':
        const lubsNeeded = Math.max(0, 10 - stats.lubsCreated);
        return lubsNeeded > 0 ? `Create ${lubsNeeded} more LUBs` : 'Ready for next tier!';
      case 'power-user':
        return 'Max tier achieved!';
      default:
        return 'Unknown';
    }
  }
  
  private getSocialGameLevel(stats: UserStats): string {
    if (stats.socialGamesPlayed === 0) return SOCIAL_GAME_LEVELS.NEWCOMER;
    if (stats.socialGameAccuracy < 30) return SOCIAL_GAME_LEVELS.CASUAL;
    if (stats.socialGameAccuracy < 60) return SOCIAL_GAME_LEVELS.ENGAGED;
    if (stats.socialGameAccuracy < 80) return SOCIAL_GAME_LEVELS.EXPERT;
    return SOCIAL_GAME_LEVELS.MASTER;
  }
  
  private saveStats(stats: UserStats): void {
    try {
      // Convert BigInt to string for storage
      const toStore = {
        ...stats,
        lubBalance: stats.lubBalance.toString(),
        totalLubEarned: stats.totalLubEarned.toString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save user stats:', error);
    }
  }
}

// Singleton instance
export const userStatsService = new UserStatsService();

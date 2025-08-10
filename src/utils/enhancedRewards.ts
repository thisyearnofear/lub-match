/**
 * Enhanced Daily Rewards System
 * 
 * Implements engaging daily earning mechanisms to increase user retention
 * and create compelling reasons to return to the game every day.
 */

import { pricingEngine } from "./pricingEngine";
import { WEB3_CONFIG } from "@/config";

export interface DailyReward {
  type: 'login' | 'firstGame' | 'perfectGame' | 'speedBonus' | 'socialShare' | 'achievement';
  amount: bigint;
  description: string;
  requirement?: string;
  streak?: number;
  multiplier?: number;
}

export interface UserStreak {
  loginStreak: number;
  perfectGameStreak: number;
  lastLoginDate: string;
  lastPerfectGameDate: string;
}

/**
 * Enhanced Rewards System - Extension of existing pricing engine
 * Integrates cleanly with current LUB token economy and user progression
 */
export class EnhancedRewardsSystem {
  private static instance: EnhancedRewardsSystem;
  
  static getInstance(): EnhancedRewardsSystem {
    if (!EnhancedRewardsSystem.instance) {
      EnhancedRewardsSystem.instance = new EnhancedRewardsSystem();
    }
    return EnhancedRewardsSystem.instance;
  }

  // Daily Login Rewards with Streak Multipliers (uses config values)
  calculateDailyLoginReward(streak: number): DailyReward {
    const baseAmount = WEB3_CONFIG.earning.dailyLogin;
    const multipliers = WEB3_CONFIG.economy.streakMultipliers;
    const streakIndex = Math.min(streak - 1, multipliers.length - 1);
    const multiplier = multipliers[streakIndex];
    
    let bonusDescription = "";
    if (streak >= 7) {
      bonusDescription = " (🔥 Week+ streak bonus!)";
    } else if (streak >= 3) {
      bonusDescription = " (🔥 Streak bonus!)";
    }

    return {
      type: 'login',
      amount: BigInt(Math.floor(Number(baseAmount) * multiplier)),
      description: `Daily login reward${bonusDescription}`,
      streak,
      multiplier
    };
  }

  // Game Performance Rewards (uses config values)
  calculateGameReward(
    completionTime: number,
    accuracy: number,
    isFirstToday: boolean = false
  ): DailyReward[] {
    const rewards: DailyReward[] = [];

    // Base game completion reward
    rewards.push({
      type: 'firstGame',
      amount: WEB3_CONFIG.earning.gameCompletion,
      description: "Game completed!"
    });

    // First game of the day bonus
    if (isFirstToday) {
      rewards.push({
        type: 'firstGame',
        amount: WEB3_CONFIG.earning.firstGameDaily,
        description: "First game of the day bonus!"
      });
    }

    // Perfect accuracy bonus
    if (accuracy >= 100) {
      rewards.push({
        type: 'perfectGame',
        amount: WEB3_CONFIG.earning.perfectGame,
        description: "Perfect accuracy! 🎯"
      });
    }

    // Speed bonus (under 30 seconds)
    if (completionTime <= 30) {
      rewards.push({
        type: 'speedBonus',
        amount: WEB3_CONFIG.earning.speedBonus,
        description: "Lightning fast! ⚡"
      });
    }

    return rewards;
  }

  // Social Sharing Rewards (uses config values)
  calculateSocialReward(
    shareType: 'game' | 'score' | 'achievement' | 'referral',
    viralityScore: number = 1
  ): DailyReward {
    let baseAmount: bigint;
    
    if (shareType === 'referral') {
      baseAmount = WEB3_CONFIG.earning.referralBonus;
    } else {
      baseAmount = WEB3_CONFIG.earning.socialShare;
    }

    // Viral bonus: each virality point adds viralBonus amount
    const viralBonusAmount = WEB3_CONFIG.earning.viralBonus;
    const viralMultiplier = Math.min(viralityScore, 5); // Max 5x viral multiplier
    const finalAmount = baseAmount + (viralBonusAmount * BigInt(viralMultiplier));

    return {
      type: 'socialShare',
      amount: finalAmount,
      description: `Shared ${shareType} with the community! 📱`,
      multiplier: viralMultiplier
    };
  }

  // Achievement Unlocked Rewards (uses tiered config values)
  calculateAchievementReward(achievementId: string, tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze'): DailyReward {
    const tierAmounts = {
      bronze: WEB3_CONFIG.earning.achievementBronze,
      silver: WEB3_CONFIG.earning.achievementSilver,
      gold: WEB3_CONFIG.earning.achievementGold,
      platinum: WEB3_CONFIG.earning.achievementPlatinum
    };

    const achievementMeta = {
      // Skill-based achievements
      'first-steps': { tier: 'bronze', desc: "First Steps: Complete your first game" },
      'memory-novice': { tier: 'bronze', desc: "Memory Novice: Complete 10 games" },
      'speed-demon-10': { tier: 'silver', desc: "Speed Demon: 10 games under 30s" },
      'perfect-streak-5': { tier: 'silver', desc: "Perfect Streak: 5 perfect games" },
      'memory-master-100': { tier: 'gold', desc: "Memory Master: 100 games completed" },
      
      // Social achievements
      'social-butterfly': { tier: 'silver', desc: "Social Butterfly: 10 shares" },
      'viral-creator': { tier: 'gold', desc: "Viral Creator: Game played 100+ times" },
      'community-builder': { tier: 'platinum', desc: "Community Builder: 10 friends joined" },
      
      // Collection achievements
      'nft-collector-5': { tier: 'silver', desc: "NFT Collector: Own 5 NFTs" },
      'nft-collector-10': { tier: 'gold', desc: "NFT Collector: Own 10 NFTs" },
      'rare-hunter': { tier: 'gold', desc: "Rare Hunter: Own legendary NFT" },
    } as const;

    const achievement = achievementMeta[achievementId as keyof typeof achievementMeta];
    const finalTier = achievement?.tier || tier;
    
    return {
      type: 'achievement',
      amount: tierAmounts[finalTier],
      description: achievement?.desc || `Achievement unlocked: ${achievementId}! 🏆`
    };
  }

  // Calculate total daily earning potential
  calculateDailyPotential(
    loginStreak: number,
    gamesPlayed: number,
    averageAccuracy: number,
    socialShares: number
  ): {
    minEarning: bigint;
    maxEarning: bigint;
    recommendations: string[];
  } {
    let minEarning = BigInt(0);
    let maxEarning = BigInt(0);
    const recommendations: string[] = [];

    // Login bonus (guaranteed)
    const loginReward = this.calculateDailyLoginReward(loginStreak);
    minEarning += loginReward.amount;
    maxEarning += loginReward.amount;

    // First game bonus (likely)
    if (gamesPlayed > 0) {
      minEarning += BigInt(10 * 1e18);
      maxEarning += BigInt(10 * 1e18);
    } else {
      recommendations.push("🎮 Play your first game for 10 LUB bonus!");
    }

    // Game performance rewards (variable)
    if (gamesPlayed > 0) {
      // Conservative estimate
      minEarning += BigInt(gamesPlayed * 10 * 1e18);
      
      // Optimistic estimate (perfect + speed bonuses)
      maxEarning += BigInt(gamesPlayed * 40 * 1e18);
    }

    // Social rewards
    minEarning += BigInt(socialShares * 15 * 1e18);
    maxEarning += BigInt(socialShares * 30 * 1e18); // With viral bonus

    if (socialShares === 0) {
      recommendations.push("📱 Share a game for 20+ LUB!");
    }

    if (averageAccuracy < 100) {
      recommendations.push("🎯 Aim for perfect accuracy for 25 LUB bonus!");
    }

    return {
      minEarning,
      maxEarning,
      recommendations
    };
  }

  // Track and update user streaks
  updateUserStreak(
    currentStreak: UserStreak,
    action: 'login' | 'perfectGame'
  ): UserStreak {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (action === 'login') {
      if (currentStreak.lastLoginDate === today) {
        // Already logged in today
        return currentStreak;
      } else if (currentStreak.lastLoginDate === yesterday) {
        // Consecutive day
        return {
          ...currentStreak,
          loginStreak: currentStreak.loginStreak + 1,
          lastLoginDate: today
        };
      } else {
        // Streak broken
        return {
          ...currentStreak,
          loginStreak: 1,
          lastLoginDate: today
        };
      }
    }

    if (action === 'perfectGame') {
      if (currentStreak.lastPerfectGameDate === today) {
        // Multiple perfect games today - maintain streak
        return currentStreak;
      } else if (currentStreak.lastPerfectGameDate === yesterday) {
        // Consecutive day
        return {
          ...currentStreak,
          perfectGameStreak: currentStreak.perfectGameStreak + 1,
          lastPerfectGameDate: today
        };
      } else {
        // Streak broken or first perfect game
        return {
          ...currentStreak,
          perfectGameStreak: 1,
          lastPerfectGameDate: today
        };
      }
    }

    return currentStreak;
  }

  // Get motivational messages based on progress
  getMotivationalMessage(
    streak: number,
    totalEarnings: bigint,
    gamesPlayed: number
  ): string {
    const messages = [
      // Streak-based
      ...(streak >= 30 ? ["🔥 Incredible 30-day streak! You're a LUB legend!"] : []),
      ...(streak >= 7 ? ["💪 One week strong! Keep the momentum going!"] : []),
      ...(streak >= 3 ? ["🚀 You're on a roll! Don't break the streak!"] : []),
      
      // Earning-based
      ...(totalEarnings >= BigInt(1000 * 1e18) ? ["💰 LUB millionaire! Share the wealth!"] : []),
      ...(totalEarnings >= BigInt(500 * 1e18) ? ["💎 LUB collector! You're building wealth!"] : []),
      
      // Game-based
      ...(gamesPlayed >= 100 ? ["🎮 Century club! 100 games completed!"] : []),
      ...(gamesPlayed >= 50 ? ["🏆 Half century! You're getting good at this!"] : []),
      
      // Default encouragements
      "❤️ Every game is a chance to earn and connect!",
      "🎯 Perfect your skills and perfect your earnings!",
      "📱 Share your games and spread the love!",
      "🌟 Your next big reward is just a game away!"
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }
}

// Export singleton instance
export const enhancedRewards = EnhancedRewardsSystem.getInstance();

// Helper function for components
export function formatRewardAmount(amount: bigint): string {
  const formatted = Number(amount) / 1e18;
  return `${formatted.toLocaleString()} LUB`;
}

// Hook for React components
export function useEnhancedRewards() {
  // This would integrate with your existing user progression system
  return enhancedRewards;
}

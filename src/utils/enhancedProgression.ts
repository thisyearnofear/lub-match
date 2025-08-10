/**
 * Enhanced User Progression - Clean extension of existing userProgression
 * 
 * Adds enhanced earning mechanics, achievements, and gamification while
 * maintaining full compatibility with the existing progression system.
 */

import { userProgression, UserProgress, ProgressionEvent, useUserProgression } from './userProgression';
import { enhancedRewards, DailyReward, UserStreak } from './enhancedRewards';
import { useStreakRewards } from './onchainLoginStreak';
import { WEB3_CONFIG } from '@/config';
import { useState, useCallback, useEffect } from 'react';

// Extended progression data stored alongside existing progression
export interface EnhancedProgressionData {
  // Daily engagement tracking
  currentLoginStreak: number;
  longestLoginStreak: number;
  lastLoginDate: string;
  
  // Achievement system
  achievementsUnlocked: string[];
  achievementProgress: Record<string, number>;
  
  // Daily earning tracking
  dailyLubEarned: bigint;
  lastEarningReset: string; // For daily cap enforcement
  
  // Performance stats
  perfectGameStreak: number;
  totalPerfectGames: number;
  avgCompletionTime: number;
  bestCompletionTime: number;
  
  // Social engagement
  totalShares: number;
  viralityScore: number; // Cumulative viral impact
  referralsCompleted: number; // Successfully referred friends
  
  // Marketplace activity
  itemsPurchased: string[];
  totalLubSpent: bigint;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'skill' | 'social' | 'collection' | 'special';
  progress: number;
  target: number;
  unlocked: boolean;
  emoji: string;
  reward: bigint;
}

// Enhanced progression manager that wraps existing system
class EnhancedProgressionManager {
  private readonly STORAGE_KEY = 'lub-enhanced-progression-v1';
  private achievements: Achievement[] = [
    // Skill achievements
    {
      id: 'first-steps',
      name: 'First Steps',
      description: 'Complete your first memory game',
      tier: 'bronze',
      category: 'skill',
      progress: 0,
      target: 1,
      unlocked: false,
      emoji: '👶',
      reward: WEB3_CONFIG.earning.achievementBronze
    },
    {
      id: 'memory-novice', 
      name: 'Memory Novice',
      description: 'Complete 10 memory games',
      tier: 'bronze',
      category: 'skill',
      progress: 0,
      target: 10,
      unlocked: false,
      emoji: '🎮',
      reward: WEB3_CONFIG.earning.achievementBronze
    },
    {
      id: 'speed-demon-10',
      name: 'Speed Demon',
      description: 'Complete 10 games under 30 seconds',
      tier: 'silver',
      category: 'skill', 
      progress: 0,
      target: 10,
      unlocked: false,
      emoji: '⚡',
      reward: WEB3_CONFIG.earning.achievementSilver
    },
    {
      id: 'perfect-streak-5',
      name: 'Perfection Streak',
      description: 'Achieve perfect accuracy in 5 consecutive games',
      tier: 'silver',
      category: 'skill',
      progress: 0,
      target: 5,
      unlocked: false,
      emoji: '🎯',
      reward: WEB3_CONFIG.earning.achievementSilver
    },
    {
      id: 'memory-master-100',
      name: 'Memory Master',
      description: 'Complete 100 memory games',
      tier: 'gold',
      category: 'skill',
      progress: 0,
      target: 100,
      unlocked: false,
      emoji: '🧠',
      reward: WEB3_CONFIG.earning.achievementGold
    },
    
    // Social achievements
    {
      id: 'social-butterfly',
      name: 'Social Butterfly', 
      description: 'Share 10 games on social media',
      tier: 'silver',
      category: 'social',
      progress: 0,
      target: 10,
      unlocked: false,
      emoji: '🦋',
      reward: WEB3_CONFIG.earning.achievementSilver
    },
    {
      id: 'viral-creator',
      name: 'Viral Creator',
      description: 'Achieve high virality score (100+)',
      tier: 'gold',
      category: 'social',
      progress: 0,
      target: 100,
      unlocked: false,
      emoji: '🚀',
      reward: WEB3_CONFIG.earning.achievementGold
    },
    {
      id: 'community-builder',
      name: 'Community Builder',
      description: 'Successfully refer 5 friends',
      tier: 'platinum',
      category: 'social',
      progress: 0,
      target: 5,
      unlocked: false,
      emoji: '🏗️',
      reward: WEB3_CONFIG.earning.achievementPlatinum
    },
  ];

  getEnhancedData(): EnhancedProgressionData {
    if (typeof window === 'undefined') {
      return this.getDefaultEnhancedData();
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return this.getDefaultEnhancedData();
      
      const data = JSON.parse(stored);
      return {
        ...this.getDefaultEnhancedData(),
        ...data,
        // Ensure BigInt fields are properly restored
        dailyLubEarned: typeof data.dailyLubEarned === 'string' ? BigInt(data.dailyLubEarned) : BigInt(0),
        totalLubSpent: typeof data.totalLubSpent === 'string' ? BigInt(data.totalLubSpent) : BigInt(0),
      };
    } catch {
      return this.getDefaultEnhancedData();
    }
  }

  private getDefaultEnhancedData(): EnhancedProgressionData {
    return {
      currentLoginStreak: 0,
      longestLoginStreak: 0,
      lastLoginDate: '',
      achievementsUnlocked: [],
      achievementProgress: {},
      dailyLubEarned: BigInt(0),
      lastEarningReset: new Date().toDateString(),
      perfectGameStreak: 0,
      totalPerfectGames: 0,
      avgCompletionTime: 0,
      bestCompletionTime: 0,
      totalShares: 0,
      viralityScore: 0,
      referralsCompleted: 0,
      itemsPurchased: [],
      totalLubSpent: BigInt(0)
    };
  }

  private saveEnhancedData(data: EnhancedProgressionData): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Convert BigInt to string for JSON serialization
      const serializable = {
        ...data,
        dailyLubEarned: data.dailyLubEarned.toString(),
        totalLubSpent: data.totalLubSpent.toString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to save enhanced progression:', error);
    }
  }

  // Check if daily earning cap is reached
  checkDailyEarningCap(currentEarning: bigint): boolean {
    const cap = WEB3_CONFIG.economy.dailyEarningCap;
    return currentEarning >= cap;
  }

  // Reset daily tracking if new day
  private resetDailyIfNeeded(data: EnhancedProgressionData): EnhancedProgressionData {
    const today = new Date().toDateString();
    if (data.lastEarningReset !== today) {
      return {
        ...data,
        dailyLubEarned: BigInt(0),
        lastEarningReset: today
      };
    }
    return data;
  }

  // Update achievement progress
  updateAchievementProgress(
    userProgress: UserProgress, 
    enhancedData: EnhancedProgressionData
  ): { updatedData: EnhancedProgressionData; newAchievements: Achievement[] } {
    const newAchievements: Achievement[] = [];
    const updatedProgress = { ...enhancedData.achievementProgress };

    this.achievements.forEach(achievement => {
      if (enhancedData.achievementsUnlocked.includes(achievement.id)) {
        return; // Already unlocked
      }

      let currentProgress = 0;
      
      // Calculate progress based on achievement type
      switch (achievement.id) {
        case 'first-steps':
          currentProgress = userProgress.gamesCompleted >= 1 ? 1 : 0;
          break;
        case 'memory-novice':
          currentProgress = Math.min(userProgress.gamesCompleted, 10);
          break;
        case 'speed-demon-10':
          // Would need to track speed games separately
          currentProgress = updatedProgress['speed-demon-10'] || 0;
          break;
        case 'perfect-streak-5':
          currentProgress = enhancedData.perfectGameStreak;
          break;
        case 'memory-master-100':
          currentProgress = Math.min(userProgress.gamesCompleted, 100);
          break;
        case 'social-butterfly':
          currentProgress = Math.min(enhancedData.totalShares, 10);
          break;
        case 'viral-creator':
          currentProgress = Math.min(enhancedData.viralityScore, 100);
          break;
        case 'community-builder':
          currentProgress = Math.min(enhancedData.referralsCompleted, 5);
          break;
      }

      updatedProgress[achievement.id] = currentProgress;

      // Check if achievement should be unlocked
      if (currentProgress >= achievement.target) {
        newAchievements.push({
          ...achievement,
          progress: currentProgress,
          unlocked: true
        });
      }
    });

    const updatedData = {
      ...enhancedData,
      achievementProgress: updatedProgress,
      achievementsUnlocked: [
        ...enhancedData.achievementsUnlocked,
        ...newAchievements.map(a => a.id)
      ]
    };

    return { updatedData, newAchievements };
  }

  // Get user's achievements with progress
  getAchievements(enhancedData: EnhancedProgressionData): Achievement[] {
    return this.achievements.map(achievement => ({
      ...achievement,
      progress: enhancedData.achievementProgress[achievement.id] || 0,
      unlocked: enhancedData.achievementsUnlocked.includes(achievement.id)
    }));
  }

  // Calculate login streak
  updateLoginStreak(enhancedData: EnhancedProgressionData): EnhancedProgressionData {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (enhancedData.lastLoginDate === today) {
      return enhancedData; // Already logged in today
    }

    let newStreak = 1;
    if (enhancedData.lastLoginDate === yesterday) {
      newStreak = enhancedData.currentLoginStreak + 1;
    }

    return {
      ...enhancedData,
      currentLoginStreak: newStreak,
      longestLoginStreak: Math.max(enhancedData.longestLoginStreak, newStreak),
      lastLoginDate: today
    };
  }

  // Main integration point - extends existing recordEvent
  recordEnhancedEvent(
    event: ProgressionEvent,
    gameData?: {
      completionTime?: number;
      accuracy?: number;
      isFirstToday?: boolean;
    }
  ): {
    rewards: DailyReward[];
    newAchievements: Achievement[];
    dailyCapReached: boolean;
  } {
    let enhancedData = this.getEnhancedData();
    enhancedData = this.resetDailyIfNeeded(enhancedData);
    
    const rewards: DailyReward[] = [];
    let newAchievements: Achievement[] = [];
    
    // Calculate rewards based on event type
    switch (event.type) {
      case 'game_complete':
        if (gameData) {
          const gameRewards = enhancedRewards.calculateGameReward(
            gameData.completionTime || 0,
            gameData.accuracy || 0,
            gameData.isFirstToday
          );
          rewards.push(...gameRewards);

          // Update performance stats
          if (gameData.accuracy !== undefined && gameData.accuracy >= 100) {
            enhancedData.perfectGameStreak += 1;
            enhancedData.totalPerfectGames += 1;
          } else {
            enhancedData.perfectGameStreak = 0;
          }

          if (gameData.completionTime !== undefined) {
            if (enhancedData.bestCompletionTime === 0 || gameData.completionTime < enhancedData.bestCompletionTime) {
              enhancedData.bestCompletionTime = gameData.completionTime;
            }
            // Update average (simplified)
            enhancedData.avgCompletionTime = 
              (enhancedData.avgCompletionTime + gameData.completionTime) / 2;
          }
        }
        break;

      case 'game_shared':
        const shareReward = enhancedRewards.calculateSocialReward('game', 1);
        rewards.push(shareReward);
        enhancedData.totalShares += 1;
        break;

      case 'referral_sent':
        const referralReward = enhancedRewards.calculateSocialReward('referral', 1);
        rewards.push(referralReward);
        enhancedData.referralsCompleted += 1;
        break;
    }

    // Update login streak
    enhancedData = this.updateLoginStreak(enhancedData);

    // Get current user progress from base system
    const baseProgress = userProgression.getUserProgress();
    
    // Check for new achievements
    const { updatedData, newAchievements: achievementRewards } = 
      this.updateAchievementProgress(baseProgress, enhancedData);
    enhancedData = updatedData;
    newAchievements = achievementRewards;

    // Add achievement rewards
    newAchievements.forEach(achievement => {
      const reward = enhancedRewards.calculateAchievementReward(achievement.id, achievement.tier);
      rewards.push(reward);
    });

    // Calculate total reward amount
    const totalRewardAmount = rewards.reduce((sum, reward) => sum + reward.amount, BigInt(0));
    
    // Check daily earning cap
    const newDailyTotal = enhancedData.dailyLubEarned + totalRewardAmount;
    const dailyCapReached = this.checkDailyEarningCap(newDailyTotal);
    
    if (!dailyCapReached) {
      enhancedData.dailyLubEarned = newDailyTotal;
    } else {
      // Reduce rewards to hit cap exactly
      const remainingCap = WEB3_CONFIG.economy.dailyEarningCap - enhancedData.dailyLubEarned;
      enhancedData.dailyLubEarned = WEB3_CONFIG.economy.dailyEarningCap;
      
      // Proportionally reduce all rewards
      if (totalRewardAmount > BigInt(0)) {
        const reductionFactor = Number(remainingCap) / Number(totalRewardAmount);
        rewards.forEach(reward => {
          reward.amount = BigInt(Math.floor(Number(reward.amount) * reductionFactor));
        });
      }
    }

    // Save enhanced data
    this.saveEnhancedData(enhancedData);

    return {
      rewards,
      newAchievements,
      dailyCapReached
    };
  }
}

// Singleton instance
export const enhancedProgression = new EnhancedProgressionManager();

// Enhanced hook that wraps existing useUserProgression
export function useEnhancedProgression() {
  const baseProgression = useUserProgression();
  const streakData = useStreakRewards(); // Use onchain streak data
  const [enhancedData, setEnhancedData] = useState<EnhancedProgressionData>(() => {
    const data = enhancedProgression.getEnhancedData();
    // Override streak data with onchain values
    return {
      ...data,
      currentLoginStreak: streakData.currentStreak || data.currentLoginStreak,
      longestLoginStreak: Math.max(streakData.longestStreak || 0, data.longestLoginStreak),
      lastLoginDate: streakData.lastActivityDate || data.lastLoginDate
    };
  });
  const [recentRewards, setRecentRewards] = useState<DailyReward[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);

  // Update enhanced data when onchain streak changes
  useEffect(() => {
    if (streakData.currentStreak !== undefined) {
      setEnhancedData(prev => ({
        ...prev,
        currentLoginStreak: streakData.currentStreak,
        longestLoginStreak: Math.max(streakData.longestStreak, prev.longestLoginStreak),
        lastLoginDate: streakData.lastActivityDate || prev.lastLoginDate
      }));
    }
  }, [streakData.currentStreak, streakData.longestStreak, streakData.lastActivityDate]);

  // Enhanced event recording that triggers both systems
  const recordEnhancedEvent = useCallback((
    event: ProgressionEvent,
    gameData?: {
      completionTime?: number;
      accuracy?: number;
      isFirstToday?: boolean;
    }
  ) => {
    // Record in base system first
    const updatedProgress = baseProgression.recordEvent(event);
    
    // Then record in enhanced system
    const { rewards, newAchievements, dailyCapReached } = 
      enhancedProgression.recordEnhancedEvent(event, gameData);
    
    // Update local state
    setEnhancedData(enhancedProgression.getEnhancedData());
    setRecentRewards(prev => [...rewards, ...prev].slice(0, 10)); // Keep last 10
    setRecentAchievements(prev => [...newAchievements, ...prev].slice(0, 5)); // Keep last 5

    return {
      progress: updatedProgress,
      rewards,
      newAchievements,
      dailyCapReached
    };
  }, [baseProgression]);

  const clearRecentRewards = useCallback(() => {
    setRecentRewards([]);
  }, []);

  const clearRecentAchievements = useCallback(() => {
    setRecentAchievements([]);
  }, []);

  // Get daily login reward
  const getDailyLoginReward = useCallback(() => {
    const reward = enhancedRewards.calculateDailyLoginReward(enhancedData.currentLoginStreak);
    
    if (!enhancedProgression.checkDailyEarningCap(enhancedData.dailyLubEarned + reward.amount)) {
      setRecentRewards(prev => [reward, ...prev]);
      
      // Update enhanced data
      const newData = {
        ...enhancedData,
        dailyLubEarned: enhancedData.dailyLubEarned + reward.amount
      };
      setEnhancedData(newData);
      // Save to localStorage would happen here in real implementation
    }
    
    return reward;
  }, [enhancedData]);

  // Get current achievements
  const achievements = enhancedProgression.getAchievements(enhancedData);

  // Daily earning info
  const dailyEarningInfo = {
    earned: enhancedData.dailyLubEarned,
    cap: WEB3_CONFIG.economy.dailyEarningCap,
    remaining: WEB3_CONFIG.economy.dailyEarningCap - enhancedData.dailyLubEarned,
    isAtCap: enhancedProgression.checkDailyEarningCap(enhancedData.dailyLubEarned)
  };

  return {
    // Base progression data
    ...baseProgression,
    
    // Enhanced data
    enhancedData,
    achievements,
    recentRewards,
    recentAchievements,
    dailyEarningInfo,
    
    // Actions
    recordEnhancedEvent,
    getDailyLoginReward,
    clearRecentRewards,
    clearRecentAchievements,
  };
}

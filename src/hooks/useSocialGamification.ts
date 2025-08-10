/**
 * Social Gamification Hook
 * 
 * Manages achievements, leaderboards, social sharing, and competitive features
 * to create engaging social loops that drive user retention and virality.
 */

import { useState, useEffect, useCallback } from 'react';
import { enhancedRewards, DailyReward } from '../utils/enhancedRewards';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'skill' | 'social' | 'collection' | 'special';
  emoji: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: {
    type: 'games_completed' | 'perfect_streak' | 'speed_runs' | 'social_shares' | 'nft_collection' | 'friends_joined';
    target: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  reward: {
    lub: number;
    xp: number;
    title?: string;
  };
  unlockedAt?: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  change: number; // Position change from yesterday
  streak?: number;
  badges: string[];
}

export interface SocialChallenge {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'team' | 'community';
  startDate: Date;
  endDate: Date;
  progress: number;
  target: number;
  participants: number;
  rewards: {
    winner: { lub: number; achievement?: string };
    participant: { lub: number };
  };
  emoji: string;
}

export interface UserSocialStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalGamesCreated: number;
  totalGamesPlayed: number;
  perfectGameStreak: number;
  socialShares: number;
  friendsReferred: number;
  achievementsUnlocked: string[];
  currentTitle: string;
  socialScore: number; // Composite score for social activities
}

// Predefined achievements system
const ACHIEVEMENTS: Achievement[] = [
  // Skill-based achievements
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first memory game',
    category: 'skill',
    emoji: '👶',
    rarity: 'bronze',
    requirement: { type: 'games_completed', target: 1 },
    reward: { lub: 10, xp: 50 }
  },
  {
    id: 'memory-novice',
    name: 'Memory Novice',
    description: 'Complete 10 memory games',
    category: 'skill',
    emoji: '🎮',
    rarity: 'bronze',
    requirement: { type: 'games_completed', target: 10 },
    reward: { lub: 50, xp: 200 }
  },
  {
    id: 'perfect-streak-5',
    name: 'Perfection Streak',
    description: 'Achieve perfect accuracy in 5 consecutive games',
    category: 'skill',
    emoji: '🎯',
    rarity: 'silver',
    requirement: { type: 'perfect_streak', target: 5 },
    reward: { lub: 100, xp: 300, title: 'Perfectionist' }
  },
  {
    id: 'speed-demon-10',
    name: 'Speed Demon',
    description: 'Complete 10 games under 30 seconds',
    category: 'skill',
    emoji: '⚡',
    rarity: 'gold',
    requirement: { type: 'speed_runs', target: 10 },
    reward: { lub: 200, xp: 500, title: 'Lightning Fast' }
  },
  {
    id: 'memory-master-100',
    name: 'Memory Master',
    description: 'Complete 100 memory games',
    category: 'skill',
    emoji: '🧠',
    rarity: 'platinum',
    requirement: { type: 'games_completed', target: 100 },
    reward: { lub: 500, xp: 1000, title: 'Memory Master' }
  },

  // Social achievements
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Share 10 games on social media',
    category: 'social',
    emoji: '🦋',
    rarity: 'silver',
    requirement: { type: 'social_shares', target: 10 },
    reward: { lub: 150, xp: 400 }
  },
  {
    id: 'viral-creator',
    name: 'Viral Creator',
    description: 'Have one of your games played 100+ times',
    category: 'social',
    emoji: '🚀',
    rarity: 'gold',
    requirement: { type: 'games_completed', target: 100 }, // This would track plays of user's created games
    reward: { lub: 500, xp: 800, title: 'Viral Creator' }
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description: 'Refer 5 friends who each complete 10 games',
    category: 'social',
    emoji: '🏗️',
    rarity: 'platinum',
    requirement: { type: 'friends_joined', target: 5 },
    reward: { lub: 1000, xp: 1500, title: 'Community Builder' }
  },

  // Collection achievements
  {
    id: 'nft-collector-5',
    name: 'NFT Collector',
    description: 'Own 5 different Heart NFTs',
    category: 'collection',
    emoji: '🎨',
    rarity: 'silver',
    requirement: { type: 'nft_collection', target: 5 },
    reward: { lub: 200, xp: 400 }
  },
  {
    id: 'rare-hunter',
    name: 'Rare Hunter',
    description: 'Own a legendary Heart NFT',
    category: 'collection',
    emoji: '💎',
    rarity: 'gold',
    requirement: { type: 'nft_collection', target: 1 }, // Would check for legendary rarity
    reward: { lub: 300, xp: 600, title: 'Rare Hunter' }
  }
];

// Sample leaderboard data (would come from backend in real app)
const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: '1', username: 'MemoryMaster', score: 15420, change: 2, streak: 15, badges: ['🏆', '⚡', '🎯'] },
  { rank: 2, userId: '2', username: 'HeartHunter', score: 14830, change: -1, streak: 8, badges: ['💎', '🦋'] },
  { rank: 3, userId: '3', username: 'SpeedRunner', score: 13950, change: 1, streak: 22, badges: ['⚡', '🚀'] },
  { rank: 4, userId: '4', username: 'SocialStar', score: 12100, change: 0, badges: ['🦋', '🏗️'] },
  { rank: 5, userId: '5', username: 'CardShark', score: 11750, change: 3, streak: 5, badges: ['🎮'] }
];

const SAMPLE_CHALLENGES: SocialChallenge[] = [
  {
    id: 'valentine-week-2024',
    name: 'Valentine\'s Week Challenge',
    description: 'Community goal: Complete 10,000 games together!',
    type: 'community',
    startDate: new Date('2024-02-07'),
    endDate: new Date('2024-02-14'),
    progress: 7834,
    target: 10000,
    participants: 456,
    rewards: {
      winner: { lub: 500 },
      participant: { lub: 50 }
    },
    emoji: '❤️'
  },
  {
    id: 'speed-challenge',
    name: 'Speed Challenge',
    description: 'Complete 10 games under 45 seconds this week',
    type: 'individual',
    startDate: new Date('2024-02-12'),
    endDate: new Date('2024-02-19'),
    progress: 3,
    target: 10,
    participants: 89,
    rewards: {
      winner: { lub: 200, achievement: 'speed-champion' },
      participant: { lub: 25 }
    },
    emoji: '⚡'
  }
];

export function useSocialGamification() {
  const [userStats, setUserStats] = useState<UserSocialStats>({
    level: 5,
    xp: 2340,
    xpToNextLevel: 660,
    totalGamesCreated: 15,
    totalGamesPlayed: 42,
    perfectGameStreak: 3,
    socialShares: 8,
    friendsReferred: 2,
    achievementsUnlocked: ['first-steps', 'memory-novice', 'social-butterfly'],
    currentTitle: 'Memory Enthusiast',
    socialScore: 85
  });

  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(SAMPLE_LEADERBOARD);
  const [activeChallenges, setActiveChallenges] = useState<SocialChallenge[]>(SAMPLE_CHALLENGES);
  const [recentRewards, setRecentRewards] = useState<DailyReward[]>([]);

  // Calculate user level from XP
  const calculateLevel = (xp: number): { level: number; xpToNext: number } => {
    // XP required doubles every 5 levels, starting at 500
    let level = 1;
    let totalXpForLevel = 0;
    let xpForNextLevel = 500;

    while (xp >= totalXpForLevel + xpForNextLevel) {
      totalXpForLevel += xpForNextLevel;
      level++;
      
      // Increase XP requirement every 5 levels
      if (level % 5 === 0) {
        xpForNextLevel = Math.floor(xpForNextLevel * 1.5);
      }
    }

    const xpToNext = totalXpForLevel + xpForNextLevel - xp;
    return { level, xpToNext };
  };

  // Check for newly unlocked achievements
  const checkAchievements = useCallback((stats: UserSocialStats): Achievement[] => {
    const newlyUnlocked: Achievement[] = [];
    
    achievements.forEach(achievement => {
      if (stats.achievementsUnlocked.includes(achievement.id)) return;
      
      let isUnlocked = false;
      const req = achievement.requirement;
      
      switch (req.type) {
        case 'games_completed':
          isUnlocked = stats.totalGamesPlayed >= req.target;
          break;
        case 'perfect_streak':
          isUnlocked = stats.perfectGameStreak >= req.target;
          break;
        case 'social_shares':
          isUnlocked = stats.socialShares >= req.target;
          break;
        case 'friends_joined':
          isUnlocked = stats.friendsReferred >= req.target;
          break;
        // Add more achievement types as needed
      }
      
      if (isUnlocked) {
        achievement.unlockedAt = new Date();
        newlyUnlocked.push(achievement);
      }
    });
    
    return newlyUnlocked;
  }, [achievements]);

  // Award XP and check for level ups
  const awardXP = useCallback((amount: number, reason: string) => {
    setUserStats(prevStats => {
      const newXP = prevStats.xp + amount;
      const levelData = calculateLevel(newXP);
      
      const newStats = {
        ...prevStats,
        xp: newXP,
        level: levelData.level,
        xpToNextLevel: levelData.xpToNext
      };
      
      // Check for new achievements
      const newAchievements = checkAchievements(newStats);
      if (newAchievements.length > 0) {
        // Award achievement rewards
        newAchievements.forEach(achievement => {
          const reward = enhancedRewards.calculateAchievementReward(achievement.id);
          setRecentRewards(prev => [...prev, reward]);
          
          // Update title if achievement grants one
          if (achievement.reward.title) {
            newStats.currentTitle = achievement.reward.title;
          }
        });
        
        // Update unlocked achievements
        newStats.achievementsUnlocked = [
          ...prevStats.achievementsUnlocked,
          ...newAchievements.map(a => a.id)
        ];
      }
      
      return newStats;
    });
    
    // Add XP reward to recent rewards
    setRecentRewards(prev => [...prev, {
      type: 'achievement',
      amount: BigInt(0), // XP doesn't have LUB value
      description: `+${amount} XP: ${reason}`
    }]);
  }, [checkAchievements]);

  // Handle game completion
  const onGameComplete = useCallback((
    completionTime: number,
    accuracy: number,
    isFirstToday: boolean = false
  ) => {
    // Update game stats
    setUserStats(prev => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
      perfectGameStreak: accuracy >= 100 ? prev.perfectGameStreak + 1 : 0
    }));
    
    // Award XP based on performance
    let xpAwarded = 50; // Base XP
    if (accuracy >= 100) xpAwarded += 25;
    if (completionTime <= 30) xpAwarded += 15;
    if (isFirstToday) xpAwarded += 20;
    
    awardXP(xpAwarded, 'Game completed');
    
    // Get LUB rewards
    const gameRewards = enhancedRewards.calculateGameReward(completionTime, accuracy, isFirstToday);
    setRecentRewards(prev => [...prev, ...gameRewards]);
  }, [awardXP]);

  // Handle social sharing
  const onSocialShare = useCallback((
    shareType: 'game' | 'score' | 'achievement' | 'referral',
    viralityScore: number = 1
  ) => {
    // Update social stats
    setUserStats(prev => ({
      ...prev,
      socialShares: prev.socialShares + 1,
      socialScore: Math.min(prev.socialScore + 2, 100)
    }));
    
    // Award XP
    awardXP(30, `Shared ${shareType}`);
    
    // Get LUB reward
    const socialReward = enhancedRewards.calculateSocialReward(shareType, viralityScore);
    setRecentRewards(prev => [...prev, socialReward]);
  }, [awardXP]);

  // Handle friend referral
  const onFriendReferred = useCallback((friendId: string) => {
    setUserStats(prev => ({
      ...prev,
      friendsReferred: prev.friendsReferred + 1,
      socialScore: Math.min(prev.socialScore + 5, 100)
    }));
    
    // Award significant XP and LUB for referrals
    awardXP(100, 'Friend joined through referral');
    
    const referralReward = enhancedRewards.calculateSocialReward('referral');
    setRecentRewards(prev => [...prev, referralReward]);
  }, [awardXP]);

  // Get user's rank on leaderboard
  const getUserRank = useCallback((): number => {
    // In real implementation, this would be calculated based on user's actual score
    return Math.floor(Math.random() * 100) + 1; // Demo rank
  }, []);

  // Get progress towards next achievement
  const getAchievementProgress = useCallback((achievementId: string): { progress: number; target: number } => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return { progress: 0, target: 1 };
    
    const req = achievement.requirement;
    let progress = 0;
    
    switch (req.type) {
      case 'games_completed':
        progress = userStats.totalGamesPlayed;
        break;
      case 'perfect_streak':
        progress = userStats.perfectGameStreak;
        break;
      case 'social_shares':
        progress = userStats.socialShares;
        break;
      case 'friends_joined':
        progress = userStats.friendsReferred;
        break;
    }
    
    return { progress, target: req.target };
  }, [achievements, userStats]);

  // Get motivational message
  const getMotivationalMessage = useCallback((): string => {
    return enhancedRewards.getMotivationalMessage(
      userStats.level,
      BigInt(userStats.socialScore * 1e18), // Mock total earnings
      userStats.totalGamesPlayed
    );
  }, [userStats]);

  // Clear recent rewards (called after showing notifications)
  const clearRecentRewards = useCallback(() => {
    setRecentRewards([]);
  }, []);

  return {
    // State
    userStats,
    achievements: achievements.filter(a => userStats.achievementsUnlocked.includes(a.id)),
    availableAchievements: achievements.filter(a => !userStats.achievementsUnlocked.includes(a.id)),
    leaderboard,
    activeChallenges,
    recentRewards,
    
    // Actions
    onGameComplete,
    onSocialShare,
    onFriendReferred,
    awardXP,
    clearRecentRewards,
    
    // Getters
    getUserRank,
    getAchievementProgress,
    getMotivationalMessage,
    
    // Computed values
    levelProgress: userStats.xpToNextLevel > 0 
      ? ((userStats.xp % 1000) / (1000 - userStats.xpToNextLevel)) * 100 
      : 100,
    nextAchievement: achievements
      .filter(a => !userStats.achievementsUnlocked.includes(a.id))
      .sort((a, b) => {
        const progressA = getAchievementProgress(a.id);
        const progressB = getAchievementProgress(b.id);
        return (progressB.progress / progressB.target) - (progressA.progress / progressA.target);
      })[0]
  };
}

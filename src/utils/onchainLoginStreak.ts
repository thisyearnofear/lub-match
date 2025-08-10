/**
 * Onchain Login Streak Tracker
 * 
 * Uses onchain events from PhotoPairLeaderboard contract to track login streaks
 * persistently across devices and sessions. Replaces localStorage-based tracking
 * with true onchain-derived streak data.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { createPublicClient, http, parseAbi } from 'viem';
import { arbitrum } from 'viem/chains';
import { WEB3_CONFIG } from '@/config';

// Contract ABI for event queries
const LEADERBOARD_EVENTS_ABI = parseAbi([
  'event ScoreSubmitted(address indexed player, string farcasterUsername, uint32 time, uint8 accuracy, uint256 lubFee)',
  'event AchievementUnlocked(address indexed player, string achievement, uint256 lubReward)',
  'event TournamentJoined(uint256 indexed tournamentId, address indexed player, uint256 entryFee)',
  'event TournamentEnded(uint256 indexed tournamentId, address[] winners, uint256[] prizes)'
]);

// Activity types that count as "login" events
export type OnchainActivityType = 
  | 'score_submitted'
  | 'achievement_unlocked' 
  | 'tournament_joined'
  | 'tournament_ended';

export interface OnchainActivity {
  type: OnchainActivityType;
  date: string; // YYYY-MM-DD format
  timestamp: number;
  blockNumber: bigint;
  transactionHash: string;
  data?: any;
}

export interface OnchainStreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  firstActivityDate: string;
  lastActivityDate: string;
  recentActivities: OnchainActivity[];
  isLoading: boolean;
  error?: string;
}

// Create dedicated client for event queries
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http()
});

class OnchainStreakTracker {
  private readonly LEADERBOARD_ADDRESS = WEB3_CONFIG.contracts.photoPairLeaderboard;
  
  /**
   * Fetch user's onchain activities from contract events
   */
  async fetchUserActivities(userAddress: string, fromBlock?: bigint): Promise<OnchainActivity[]> {
    if (!this.LEADERBOARD_ADDRESS) {
      throw new Error('PhotoPairLeaderboard contract address not configured');
    }

    const activities: OnchainActivity[] = [];
    
    try {
      // Calculate block range (default: last 30 days)
      const latestBlock = await publicClient.getBlockNumber();
      const blocksPerDay = BigInt(Math.floor(86400 / 12)); // Assuming ~12sec blocks on Arbitrum
      const startBlock = fromBlock || (latestBlock - (blocksPerDay * BigInt(30)));

      // Fetch ScoreSubmitted events
      const scoreEvents = await publicClient.getLogs({
        address: this.LEADERBOARD_ADDRESS,
        event: {
          type: 'event',
          name: 'ScoreSubmitted',
          inputs: [
            { type: 'address', name: 'player', indexed: true },
            { type: 'string', name: 'farcasterUsername' },
            { type: 'uint32', name: 'time' },
            { type: 'uint8', name: 'accuracy' },
            { type: 'uint256', name: 'lubFee' }
          ]
        },
        args: { player: userAddress as `0x${string}` },
        fromBlock: startBlock,
        toBlock: latestBlock
      });

      for (const event of scoreEvents) {
        const block = await publicClient.getBlock({ blockHash: event.blockHash });
        const date = new Date(Number(block.timestamp) * 1000);
        
        activities.push({
          type: 'score_submitted',
          date: date.toISOString().split('T')[0],
          timestamp: Number(block.timestamp) * 1000,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          data: {
            time: event.args.time,
            accuracy: event.args.accuracy,
            username: event.args.farcasterUsername
          }
        });
      }

      // Fetch AchievementUnlocked events
      const achievementEvents = await publicClient.getLogs({
        address: this.LEADERBOARD_ADDRESS,
        event: {
          type: 'event',
          name: 'AchievementUnlocked',
          inputs: [
            { type: 'address', name: 'player', indexed: true },
            { type: 'string', name: 'achievement' },
            { type: 'uint256', name: 'lubReward' }
          ]
        },
        args: { player: userAddress as `0x${string}` },
        fromBlock: startBlock,
        toBlock: latestBlock
      });

      for (const event of achievementEvents) {
        const block = await publicClient.getBlock({ blockHash: event.blockHash });
        const date = new Date(Number(block.timestamp) * 1000);
        
        activities.push({
          type: 'achievement_unlocked',
          date: date.toISOString().split('T')[0],
          timestamp: Number(block.timestamp) * 1000,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          data: {
            achievement: event.args.achievement,
            lubReward: event.args.lubReward
          }
        });
      }

      // Fetch TournamentJoined events
      const tournamentEvents = await publicClient.getLogs({
        address: this.LEADERBOARD_ADDRESS,
        event: {
          type: 'event',
          name: 'TournamentJoined',
          inputs: [
            { type: 'uint256', name: 'tournamentId', indexed: true },
            { type: 'address', name: 'player', indexed: true },
            { type: 'uint256', name: 'entryFee' }
          ]
        },
        args: { player: userAddress as `0x${string}` },
        fromBlock: startBlock,
        toBlock: latestBlock
      });

      for (const event of tournamentEvents) {
        const block = await publicClient.getBlock({ blockHash: event.blockHash });
        const date = new Date(Number(block.timestamp) * 1000);
        
        activities.push({
          type: 'tournament_joined',
          date: date.toISOString().split('T')[0],
          timestamp: Number(block.timestamp) * 1000,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          data: {
            tournamentId: event.args.tournamentId,
            entryFee: event.args.entryFee
          }
        });
      }

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp - a.timestamp);
      
      return activities;
    } catch (error) {
      console.error('Failed to fetch onchain activities:', error);
      throw error;
    }
  }

  /**
   * Calculate streak data from onchain activities
   */
  calculateStreakFromActivities(activities: OnchainActivity[]): Omit<OnchainStreakData, 'isLoading' | 'error' | 'recentActivities'> {
    if (activities.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        firstActivityDate: '',
        lastActivityDate: ''
      };
    }

    // Group activities by date
    const activeDatesSet = new Set<string>();
    activities.forEach(activity => {
      activeDatesSet.add(activity.date);
    });

    const activeDates = Array.from(activeDatesSet).sort();
    const totalActiveDays = activeDates.length;
    const firstActivityDate = activeDates[0];
    const lastActivityDate = activeDates[activeDates.length - 1];

    // Calculate current streak (consecutive days ending today or yesterday)
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Start from the most recent date and count backwards
    const reversedDates = [...activeDates].reverse();
    let streakDate = today;
    
    // Check if user was active today or yesterday
    if (reversedDates.includes(today)) {
      streakDate = today;
    } else if (reversedDates.includes(yesterday)) {
      streakDate = yesterday;
    } else {
      // No recent activity, streak is 0
      currentStreak = 0;
    }

    // Count consecutive days backwards from streak start date
    if (streakDate) {
      for (let i = 0; i < reversedDates.length; i++) {
        const expectedDate = new Date(new Date(streakDate).getTime() - (i * 86400000))
          .toISOString().split('T')[0];
        
        if (reversedDates.includes(expectedDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < activeDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(activeDates[i - 1]);
        const currDate = new Date(activeDates[i]);
        const daysDiff = (currDate.getTime() - prevDate.getTime()) / 86400000;
        
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalActiveDays,
      firstActivityDate,
      lastActivityDate
    };
  }

  /**
   * Get streak multiplier based on current streak
   */
  getStreakMultiplier(streak: number): number {
    const multipliers = WEB3_CONFIG.economy.streakMultipliers;
    const index = Math.min(streak - 1, multipliers.length - 1);
    return Math.max(multipliers[index] || 1, 1);
  }

  /**
   * Calculate daily login reward based on streak
   */
  calculateStreakReward(streak: number): bigint {
    const baseReward = WEB3_CONFIG.earning.dailyLogin;
    const multiplier = this.getStreakMultiplier(streak);
    return BigInt(Math.floor(Number(baseReward) * multiplier));
  }
}

// Singleton instance
export const onchainStreakTracker = new OnchainStreakTracker();

/**
 * React hook for onchain-based login streak tracking
 */
export function useOnchainLoginStreak(): OnchainStreakData {
  const { address, isConnected } = useAccount();
  const [streakData, setStreakData] = useState<OnchainStreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    firstActivityDate: '',
    lastActivityDate: '',
    recentActivities: [],
    isLoading: false
  });

  const fetchStreakData = useCallback(async () => {
    if (!address || !isConnected) {
      setStreakData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setStreakData(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // Fetch user's onchain activities
      const activities = await onchainStreakTracker.fetchUserActivities(address);
      
      // Calculate streak from activities
      const calculatedStreak = onchainStreakTracker.calculateStreakFromActivities(activities);
      
      setStreakData({
        ...calculatedStreak,
        recentActivities: activities.slice(0, 10), // Keep last 10 activities
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
      setStreakData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch streak data'
      }));
    }
  }, [address, isConnected]);

  // Fetch data when wallet connects or address changes
  useEffect(() => {
    if (isConnected && address) {
      fetchStreakData();
    }
  }, [isConnected, address, fetchStreakData]);

  // Optional: Set up periodic refresh (every 5 minutes)
  useEffect(() => {
    if (!isConnected || !address) return;
    
    const interval = setInterval(() => {
      fetchStreakData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isConnected, address, fetchStreakData]);

  return streakData;
}

/**
 * Hook to get streak rewards and multipliers
 */
export function useStreakRewards() {
  const streakData = useOnchainLoginStreak();
  
  const getStreakMultiplier = useCallback((streak?: number) => {
    const currentStreak = streak ?? streakData.currentStreak;
    return onchainStreakTracker.getStreakMultiplier(currentStreak);
  }, [streakData.currentStreak]);

  const calculateStreakReward = useCallback((streak?: number) => {
    const currentStreak = streak ?? streakData.currentStreak;
    return onchainStreakTracker.calculateStreakReward(currentStreak);
  }, [streakData.currentStreak]);

  const getStreakMilestone = useCallback((streak?: number) => {
    const currentStreak = streak ?? streakData.currentStreak;
    
    if (currentStreak >= 30) {
      return { 
        milestone: 'Month Master! 🗓️', 
        emoji: '🏆',
        specialReward: WEB3_CONFIG.earning.achievementGold 
      };
    }
    if (currentStreak >= 14) {
      return { 
        milestone: 'Two Week Warrior! 💪', 
        emoji: '🔥',
        specialReward: WEB3_CONFIG.earning.achievementSilver 
      };
    }
    if (currentStreak >= 7) {
      return { 
        milestone: 'Week Champion! 📅', 
        emoji: '⭐',
        specialReward: WEB3_CONFIG.earning.achievementBronze 
      };
    }
    if (currentStreak >= 3) {
      return { milestone: 'Getting Consistent! 📈', emoji: '🌟' };
    }
    
    return { milestone: null, emoji: '✨' };
  }, [streakData.currentStreak]);

  return {
    ...streakData,
    getStreakMultiplier,
    calculateStreakReward,
    getStreakMilestone
  };
}

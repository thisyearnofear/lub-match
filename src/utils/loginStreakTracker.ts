/**
 * Login Streak Tracking System - Simplified
 *
 * Following AGGRESSIVE CONSOLIDATION principles, this provides a minimal
 * interface for compatibility while removing complex onchain dependencies.
 */

// Simple types for compatibility
export interface OnchainActivity {
  timestamp: number;
  activityType: string;
}

export interface LoginStreakData {
  currentStreak: number;
  totalActiveDays: number;
  lastActivityDate: string;
}

// Simplified hook that returns minimal data
export function useLoginStreak() {
  return {
    currentStreak: 0,
    totalActiveDays: 0,
    lastActivityDate: new Date().toISOString(),
    recordActivity: () => {},
    isLoading: false,
  };
}

// Simplified streak rewards hook
export function useStreakRewards() {
  return {
    currentStreak: 0,
    totalActiveDays: 0,
    availableRewards: [],
    claimReward: () => Promise.resolve(false),
    isLoading: false,
  };
}

// Simplified tracker object
export const loginStreakTracker = {
  recordActivity: () => {},
  getStreakData: () => ({
    currentStreak: 0,
    totalActiveDays: 0,
    lastActivityDate: new Date().toISOString(),
  }),
  isEnabled: false,
};

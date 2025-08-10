/**
 * Onchain Login Streak Tracking System
 * 
 * Uses contract events to track daily login streaks persistently across
 * devices and sessions. Replaces localStorage with true onchain data.
 */

// Re-export from the new onchain implementation
export {
  useOnchainLoginStreak as useLoginStreak,
  useStreakRewards,
  onchainStreakTracker as loginStreakTracker,
  type OnchainActivity
} from './onchainLoginStreak';

// Export the onchain type directly
export type { OnchainStreakData as LoginStreakData } from './onchainLoginStreak';

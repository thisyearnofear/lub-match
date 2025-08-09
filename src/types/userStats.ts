/**
 * Unified User Statistics Types
 * Single source of truth for all user progression and stats
 */

import { UserTier } from "@/utils/userProgression";

// Core stats interface - only track what we actually use
export interface UserStats {
  // Game Activity (main progression)
  gamesCompleted: number;
  socialGamesPlayed: number;
  
  // Social Activity
  lubsCreated: number; // farcaster + romance combined
  farcasterLubsCreated: number;
  romanceLubsCreated: number;
  gamesShared: number;
  referralsSent: number;
  
  // Web3 Activity
  nftsMinted: number;
  lubBalance: bigint;
  totalLubEarned: bigint;
  lubTransactionCount: number;
  
  // Social Game Specific (derived from game results)
  socialGameScore: number; // total score from social games
  socialGameAccuracy: number; // average accuracy
  socialGameBestScore: number; // highest single game score
  
  // Progression
  tier: UserTier;
  tierProgress: number; // 0-100 percentage to next tier
  nextTierRequirement: string;
  
  // Timestamps
  firstVisit: string;
  lastActivity: string;
}

// Display-ready stats (formatted for UI)
export interface FormattedUserStats {
  // Game Activity
  gamesCompleted: number;
  socialGamesPlayed: number;
  
  // Social Activity  
  lubsCreated: number;
  gamesShared: number;
  referralsSent: number;
  
  // Web3 Activity
  nftsMinted: number;
  lubBalance: string; // formatted amount
  totalLubEarned: string; // formatted amount
  
  // Social Game Performance
  socialGameScore: number;
  socialGameAccuracy: string; // formatted percentage
  socialGameLevel: string; // knowledge level
  
  // Progression
  tier: UserTier;
  tierDisplayName: string;
  tierProgress: number;
  nextTierRequirement: string;
}

// Events for updating stats
export type StatsEvent = 
  | { type: 'game_complete'; gameType: 'memory' | 'social' }
  | { type: 'lub_created'; mode: 'farcaster' | 'romance' }
  | { type: 'nft_minted' }
  | { type: 'game_shared' }
  | { type: 'referral_sent' }
  | { type: 'lub_earned'; amount: bigint }
  | { type: 'wallet_connected' }
  | { type: 'social_game_result'; score: number; accuracy: number; timeSpent: number };

// Tier display configuration
export const TIER_DISPLAY_NAMES: Record<UserTier, string> = {
  newcomer: "💕 New Lover",
  engaged: "💖 Heart Matcher", 
  "web3-ready": "💝 Love Token Holder",
  "power-user": "👑 Cupid Master"
};

// Social game knowledge levels based on performance
export const SOCIAL_GAME_LEVELS = {
  NEWCOMER: 'Newcomer',
  CASUAL: 'Casual Player', 
  ENGAGED: 'Social Explorer',
  EXPERT: 'Farcaster Expert',
  MASTER: 'Social Master'
} as const;

export type SocialGameLevel = typeof SOCIAL_GAME_LEVELS[keyof typeof SOCIAL_GAME_LEVELS];

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
  
  // Leaderboard Data for Photo Pair Game
  photoPairLeaderboard: {
    // Local stats (existing)
    bestTime: number; // seconds (0 = not set)
    bestAccuracy: number; // percentage (0 = not set)
    lastSubmission: string; // ISO date
    submissionCount: number;
    totalTime: number; // cumulative time for average calculation
    totalAccuracy: number; // cumulative accuracy for average calculation
    totalGames: number; // number of games played for average calculation
    achievements: string[]; // unlocked achievements

    // Global leaderboard integration
    globalSubmissions: number; // number of times submitted to global leaderboard
    globalBestTime: number; // best time submitted globally (0 = not set)
    globalBestAccuracy: number; // best accuracy submitted globally (0 = not set)
    globalRank: number; // current global rank (0 = not ranked)
    globalLubEarned: number; // LUB earned from global leaderboard
    lastGlobalSubmission: string; // ISO date of last global submission
    canSubmitGlobal: boolean; // whether user can submit to global (rate limiting)

    // Tournament data
    activeTournamentId: number; // ID of active tournament (0 = none)
    tournamentSubmissions: number; // submissions in current tournament
    tournamentBestTime: number; // best time in current tournament
    tournamentBestAccuracy: number; // best accuracy in current tournament
    tournamentsJoined: number; // total tournaments joined
    tournamentsWon: number; // tournaments won (1st place)
    tournamentLubEarned: number; // LUB earned from tournaments
  };
  
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
  
  // Photo Pair Game Leaderboard Stats (Local)
  photoPairBestTime: string; // formatted time (e.g., "45s")
  photoPairBestAccuracy: string; // formatted percentage (e.g., "92%")
  photoPairAverageTime: string; // formatted time
  photoPairAverageAccuracy: string; // formatted percentage
  photoPairSubmissionCount: number;
  photoPairAchievements: string[]; // unlocked achievements

  // Global Leaderboard Stats
  photoPairGlobalRank: string; // formatted rank (e.g., "#42" or "Unranked")
  photoPairGlobalBestTime: string; // formatted global best time
  photoPairGlobalBestAccuracy: string; // formatted global best accuracy
  photoPairGlobalSubmissions: number; // global submissions count
  photoPairGlobalLubEarned: string; // formatted LUB earned from global
  photoPairCanSubmitGlobal: boolean; // whether can submit to global
  photoPairNextGlobalSubmission: string; // when can submit next (e.g., "in 45m")

  // Tournament Stats
  photoPairActiveTournament: string; // active tournament name or "None"
  photoPairTournamentRank: string; // current tournament rank
  photoPairTournamentBestTime: string; // best time in current tournament
  photoPairTournamentBestAccuracy: string; // best accuracy in current tournament
  photoPairTournamentsJoined: number; // total tournaments joined
  photoPairTournamentsWon: number; // tournaments won
  photoPairTournamentLubEarned: string; // formatted LUB earned from tournaments
  
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
  | { type: 'social_game_result'; score: number; accuracy: number; timeSpent: number }
  | { type: 'photo_pair_leaderboard_submission'; time: number; accuracy: number; attempts: number; matches: number }
  | { type: 'global_leaderboard_submission'; time: number; accuracy: number; rank: number; lubEarned: number }
  | { type: 'global_achievement_unlocked'; achievement: string; lubReward: number }
  | { type: 'tournament_joined'; tournamentId: number; entryFee: number }
  | { type: 'tournament_submission'; tournamentId: number; time: number; accuracy: number }
  | { type: 'tournament_ended'; tournamentId: number; rank: number; prize: number };

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

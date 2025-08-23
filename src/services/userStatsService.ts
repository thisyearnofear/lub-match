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
  
  // Update stats based on event (ENHANCED with challenge support)
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

      // NEW: Challenge event handling (ENHANCEMENT FIRST)
      case 'challenge_created':
        updated.challengeStats.challengesCreated += 1;
        if (event.whaleMultiplier > 2) {
          updated.challengeStats.whalesTargeted += 1;
        }
        break;

      case 'challenge_completed':
        updated.challengeStats.challengesCompleted += 1;
        if (event.success) {
          updated.challengeStats.challengesSuccessful += 1;
          updated.challengeStats.challengeStreak += 1;
          updated.challengeStats.longestChallengeStreak = Math.max(
            updated.challengeStats.longestChallengeStreak,
            updated.challengeStats.challengeStreak
          );
        } else {
          updated.challengeStats.challengeStreak = 0;
        }

        // Add rewards
        updated.challengeStats.totalChallengeRewards += event.reward;
        updated.challengeStats.whaleBonus += event.whaleBonus;
        updated.challengeStats.viralBonus += event.viralBonus;

        // Update LUB balance
        updated.lubBalance += event.reward;
        updated.totalLubEarned += event.reward;

        if (event.viralDetected) {
          updated.challengeStats.viralDetections += 1;
        }
        break;

      case 'whale_harpooned':
        updated.challengeStats.whalesHarpooned += 1;
        updated.challengeStats.bestWhaleMultiplier = Math.max(
          updated.challengeStats.bestWhaleMultiplier,
          event.multiplier
        );
        break;

      case 'viral_detected':
        updated.challengeStats.viralDetections += 1;
        updated.challengeStats.viralBonus += event.bonus;
        break;
        
      case 'photo_pair_leaderboard_submission':
        // Update photo pair leaderboard stats
        this.updatePhotoPairLeaderboardStats(updated, event.time, event.accuracy, event.attempts, event.matches);
        break;

      case 'global_leaderboard_submission':
        // Update global leaderboard stats
        this.updateGlobalLeaderboardStats(updated, event.time, event.accuracy, event.rank, event.lubEarned);
        break;

      case 'global_achievement_unlocked':
        // Add global achievement and LUB reward
        this.addGlobalAchievement(updated, event.achievement, event.lubReward);
        break;

      case 'tournament_joined':
        // Update tournament participation
        this.updateTournamentJoined(updated, event.tournamentId, event.entryFee);
        break;

      case 'tournament_submission':
        // Update tournament performance
        this.updateTournamentSubmission(updated, event.tournamentId, event.time, event.accuracy);
        break;

      case 'tournament_ended':
        // Update tournament results
        this.updateTournamentEnded(updated, event.tournamentId, event.rank, event.prize);
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
    
    // Calculate averages for photo pair stats
    const averageTime = stats.photoPairLeaderboard.totalGames > 0 
      ? stats.photoPairLeaderboard.totalTime / stats.photoPairLeaderboard.totalGames 
      : 0;
      
    const averageAccuracy = stats.photoPairLeaderboard.totalGames > 0 
      ? stats.photoPairLeaderboard.totalAccuracy / stats.photoPairLeaderboard.totalGames 
      : 0;
    
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

      // NEW: Challenge System Display (ENHANCEMENT FIRST)
      challengeStats: {
        challengesCreated: stats.challengeStats.challengesCreated,
        challengesCompleted: stats.challengeStats.challengesCompleted,
        successRate: stats.challengeStats.challengesCompleted > 0
          ? `${((stats.challengeStats.challengesSuccessful / stats.challengeStats.challengesCompleted) * 100).toFixed(1)}%`
          : '0%',
        whalesHarpooned: stats.challengeStats.whalesHarpooned,
        viralDetections: stats.challengeStats.viralDetections,
        totalRewards: formatLubAmount(stats.challengeStats.totalChallengeRewards),
        currentStreak: stats.challengeStats.challengeStreak,
        longestStreak: stats.challengeStats.longestChallengeStreak,
        whaleHunterLevel: this.getWhaleHunterLevel(stats.challengeStats),
      },
      
      // Photo Pair Game Leaderboard Stats (Local)
      photoPairBestTime: stats.photoPairLeaderboard.bestTime > 0 ? `${stats.photoPairLeaderboard.bestTime}s` : 'N/A',
      photoPairBestAccuracy: stats.photoPairLeaderboard.bestAccuracy > 0 ? `${stats.photoPairLeaderboard.bestAccuracy}%` : 'N/A',
      photoPairAverageTime: averageTime > 0 ? `${Math.round(averageTime)}s` : 'N/A',
      photoPairAverageAccuracy: averageAccuracy > 0 ? `${Math.round(averageAccuracy)}%` : 'N/A',
      photoPairSubmissionCount: stats.photoPairLeaderboard.submissionCount,
      photoPairAchievements: stats.photoPairLeaderboard.achievements,

      // Global Leaderboard Stats
      photoPairGlobalRank: stats.photoPairLeaderboard.globalRank > 0 ? `#${stats.photoPairLeaderboard.globalRank}` : 'Unranked',
      photoPairGlobalBestTime: stats.photoPairLeaderboard.globalBestTime > 0 ? `${stats.photoPairLeaderboard.globalBestTime}s` : 'N/A',
      photoPairGlobalBestAccuracy: stats.photoPairLeaderboard.globalBestAccuracy > 0 ? `${stats.photoPairLeaderboard.globalBestAccuracy}%` : 'N/A',
      photoPairGlobalSubmissions: stats.photoPairLeaderboard.globalSubmissions,
      photoPairGlobalLubEarned: `${stats.photoPairLeaderboard.globalLubEarned} LUB`,
      photoPairCanSubmitGlobal: stats.photoPairLeaderboard.canSubmitGlobal,
      photoPairNextGlobalSubmission: this.getNextGlobalSubmissionTime(stats),

      // Tournament Stats
      photoPairActiveTournament: stats.photoPairLeaderboard.activeTournamentId > 0 ? `Tournament #${stats.photoPairLeaderboard.activeTournamentId}` : 'None',
      photoPairTournamentRank: this.getTournamentRank(stats),
      photoPairTournamentBestTime: stats.photoPairLeaderboard.tournamentBestTime > 0 ? `${stats.photoPairLeaderboard.tournamentBestTime}s` : 'N/A',
      photoPairTournamentBestAccuracy: stats.photoPairLeaderboard.tournamentBestAccuracy > 0 ? `${stats.photoPairLeaderboard.tournamentBestAccuracy}%` : 'N/A',
      photoPairTournamentsJoined: stats.photoPairLeaderboard.tournamentsJoined,
      photoPairTournamentsWon: stats.photoPairLeaderboard.tournamentsWon,
      photoPairTournamentLubEarned: `${stats.photoPairLeaderboard.tournamentLubEarned} LUB`,
      
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

      // NEW: Challenge stats defaults (ENHANCEMENT FIRST)
      challengeStats: {
        challengesCreated: 0,
        challengesCompleted: 0,
        challengesSuccessful: 0,
        whalesTargeted: 0,
        whalesHarpooned: 0,
        viralDetections: 0,
        totalChallengeRewards: BigInt(0),
        whaleBonus: BigInt(0),
        viralBonus: BigInt(0),
        bestWhaleMultiplier: 1,
        challengeStreak: 0,
        longestChallengeStreak: 0,
      },
      photoPairLeaderboard: {
        // Local stats
        bestTime: 0,
        bestAccuracy: 0,
        lastSubmission: now,
        submissionCount: 0,
        totalTime: 0,
        totalAccuracy: 0,
        totalGames: 0,
        achievements: [],

        // Global leaderboard
        globalSubmissions: 0,
        globalBestTime: 0,
        globalBestAccuracy: 0,
        globalRank: 0,
        globalLubEarned: 0,
        lastGlobalSubmission: now,
        canSubmitGlobal: true,

        // Tournament data
        activeTournamentId: 0,
        tournamentSubmissions: 0,
        tournamentBestTime: 0,
        tournamentBestAccuracy: 0,
        tournamentsJoined: 0,
        tournamentsWon: 0,
        tournamentLubEarned: 0
      },
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
  
  private updatePhotoPairLeaderboardStats(stats: UserStats, time: number, accuracy: number, attempts: number, matches: number) {
    // Abuse prevention: Rate limiting
    const now = new Date();
    const lastSubmission = new Date(stats.photoPairLeaderboard.lastSubmission);
    const hoursSinceLastSubmission = (now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60);
    
    // Prevent submissions more than once per hour
    if (hoursSinceLastSubmission < 1) {
      console.log('Photo pair leaderboard submission rate limited');
      return;
    }
    
    // Abuse prevention: Minimum quality thresholds
    // Games under 10 seconds or over 95% accuracy might be bots
    if (time < 10 && accuracy > 95) {
      console.log('Photo pair leaderboard submission flagged as potential bot activity');
      return;
    }
    
    // Update submission count
    stats.photoPairLeaderboard.submissionCount += 1;
    
    // Update cumulative stats for averages
    stats.photoPairLeaderboard.totalTime += time;
    stats.photoPairLeaderboard.totalAccuracy += accuracy;
    stats.photoPairLeaderboard.totalGames += 1;
    
    // Update best time (0 means not set yet)
    if (stats.photoPairLeaderboard.bestTime === 0 || time < stats.photoPairLeaderboard.bestTime) {
      stats.photoPairLeaderboard.bestTime = time;
    }
    
    // Update best accuracy (0 means not set yet)
    if (stats.photoPairLeaderboard.bestAccuracy === 0 || accuracy > stats.photoPairLeaderboard.bestAccuracy) {
      stats.photoPairLeaderboard.bestAccuracy = accuracy;
    }
    
    // Update last submission time
    stats.photoPairLeaderboard.lastSubmission = new Date().toISOString();
    
    // Check for achievements
    const newAchievements: string[] = [];
    
    // Perfect game achievement (100% accuracy)
    if (accuracy === 100) {
      newAchievements.push('perfect');
    }
    
    // Speed demon achievement (under 30 seconds)
    if (time <= 30) {
      newAchievements.push('speed-demon');
    }
    
    // Comeback king achievement (many attempts but still good accuracy)
    if (attempts > 12 && accuracy >= 80) {
      newAchievements.push('comeback-king');
    }
    
    // First timer achievement
    if (stats.photoPairLeaderboard.submissionCount === 1) {
      newAchievements.push('first-timer');
    }
    
    // Add new achievements (avoiding duplicates)
    newAchievements.forEach(achievement => {
      if (!stats.photoPairLeaderboard.achievements.includes(achievement)) {
        stats.photoPairLeaderboard.achievements.push(achievement);
      }
    });
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

  // Global leaderboard methods
  private updateGlobalLeaderboardStats(stats: UserStats, time: number, accuracy: number, rank: number, lubEarned: number) {
    const leaderboard = stats.photoPairLeaderboard;

    // Update global submission count
    leaderboard.globalSubmissions += 1;

    // Update global bests
    if (leaderboard.globalBestTime === 0 || time < leaderboard.globalBestTime) {
      leaderboard.globalBestTime = time;
    }
    if (accuracy > leaderboard.globalBestAccuracy) {
      leaderboard.globalBestAccuracy = accuracy;
    }

    // Update rank and earnings
    leaderboard.globalRank = rank;
    leaderboard.globalLubEarned += lubEarned;
    leaderboard.lastGlobalSubmission = new Date().toISOString();

    // Set rate limiting (1 hour cooldown)
    leaderboard.canSubmitGlobal = false;
    setTimeout(() => {
      leaderboard.canSubmitGlobal = true;
      this.saveStats(stats);
    }, 60 * 60 * 1000); // 1 hour
  }

  private addGlobalAchievement(stats: UserStats, achievement: string, lubReward: number) {
    const leaderboard = stats.photoPairLeaderboard;

    // Add achievement if not already present
    if (!leaderboard.achievements.includes(achievement)) {
      leaderboard.achievements.push(achievement);
      leaderboard.globalLubEarned += lubReward;
    }
  }

  private updateTournamentJoined(stats: UserStats, tournamentId: number, entryFee: number) {
    const leaderboard = stats.photoPairLeaderboard;

    leaderboard.activeTournamentId = tournamentId;
    leaderboard.tournamentsJoined += 1;
    leaderboard.tournamentSubmissions = 0; // Reset for new tournament
    leaderboard.tournamentBestTime = 0;
    leaderboard.tournamentBestAccuracy = 0;
  }

  private updateTournamentSubmission(stats: UserStats, tournamentId: number, time: number, accuracy: number) {
    const leaderboard = stats.photoPairLeaderboard;

    // Only update if this is the active tournament
    if (leaderboard.activeTournamentId === tournamentId) {
      leaderboard.tournamentSubmissions += 1;

      // Update tournament bests
      if (leaderboard.tournamentBestTime === 0 || time < leaderboard.tournamentBestTime) {
        leaderboard.tournamentBestTime = time;
      }
      if (accuracy > leaderboard.tournamentBestAccuracy) {
        leaderboard.tournamentBestAccuracy = accuracy;
      }
    }
  }

  private updateTournamentEnded(stats: UserStats, tournamentId: number, rank: number, prize: number) {
    const leaderboard = stats.photoPairLeaderboard;

    // Only update if this was the active tournament
    if (leaderboard.activeTournamentId === tournamentId) {
      leaderboard.activeTournamentId = 0; // Clear active tournament
      leaderboard.tournamentLubEarned += prize;

      // Track wins (1st place)
      if (rank === 1) {
        leaderboard.tournamentsWon += 1;
      }
    }
  }

  private getNextGlobalSubmissionTime(stats: UserStats): string {
    if (stats.photoPairLeaderboard.canSubmitGlobal) {
      return 'Available now';
    }

    const lastSubmission = new Date(stats.photoPairLeaderboard.lastGlobalSubmission);
    const nextSubmission = new Date(lastSubmission.getTime() + 60 * 60 * 1000); // 1 hour later
    const now = new Date();

    if (now >= nextSubmission) {
      return 'Available now';
    }

    const minutesLeft = Math.ceil((nextSubmission.getTime() - now.getTime()) / (1000 * 60));
    return `in ${minutesLeft}m`;
  }

  private getTournamentRank(stats: UserStats): string {
    const leaderboard = stats.photoPairLeaderboard;

    if (leaderboard.activeTournamentId === 0) {
      return 'N/A';
    }

    if (leaderboard.tournamentSubmissions === 0) {
      return 'Not submitted';
    }

    // This would need to be updated from the smart contract
    // For now, return a placeholder
    return 'TBD';
  }

  // NEW: Whale hunter level calculation (ENHANCEMENT FIRST)
  private getWhaleHunterLevel(challengeStats: UserStats['challengeStats']): string {
    const { whalesHarpooned, bestWhaleMultiplier } = challengeStats;

    if (whalesHarpooned === 0) return 'Minnow';
    if (whalesHarpooned < 5) return 'Fisher';
    if (whalesHarpooned < 15) return 'Shark Hunter';
    if (whalesHarpooned < 50) return 'Whale Hunter';
    if (bestWhaleMultiplier >= 25) return 'Leviathan Slayer';
    return 'Whale Master';
  }
}

// Singleton instance
export const userStatsService = new UserStatsService();

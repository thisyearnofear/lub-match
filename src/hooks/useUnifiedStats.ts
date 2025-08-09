/**
 * Unified User Statistics Hook
 * Single hook for all user stats and progression
 * Replaces: useUserProgression, useUserStats, useUser (stats part)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { userStatsService } from "@/services/userStatsService";
import { UserStats, FormattedUserStats, StatsEvent } from "@/types/userStats";

export function useUnifiedStats() {
  const [stats, setStats] = useState<UserStats>(() => userStatsService.getUserStats());
  const [formattedStats, setFormattedStats] = useState<FormattedUserStats>(() => 
    userStatsService.getFormattedStats()
  );

  // Sync with localStorage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = () => {
      const newStats = userStatsService.getUserStats();
      setStats(newStats);
      setFormattedStats(userStatsService.getFormattedStats());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Record an event and update stats
  const recordEvent = useCallback((event: StatsEvent) => {
    const updatedStats = userStatsService.recordEvent(event);
    setStats(updatedStats);
    setFormattedStats(userStatsService.getFormattedStats());
    return updatedStats;
  }, []);

  // Update LUB balance from wallet
  const updateLubBalance = useCallback((balance: bigint) => {
    const updatedStats = userStatsService.updateLubBalance(balance);
    setStats(updatedStats);
    setFormattedStats(userStatsService.getFormattedStats());
    return updatedStats;
  }, []);

  // Reset all stats
  const resetStats = useCallback(() => {
    const defaultStats = userStatsService.resetStats();
    setStats(defaultStats);
    setFormattedStats(userStatsService.getFormattedStats());
    return defaultStats;
  }, []);

  // Refresh stats from storage
  const refreshStats = useCallback(() => {
    const currentStats = userStatsService.getUserStats();
    setStats(currentStats);
    setFormattedStats(userStatsService.getFormattedStats());
    return currentStats;
  }, []);

  // Convenience methods for common actions
  const recordGameCompletion = useCallback((gameType: 'memory' | 'social' = 'memory') => {
    return recordEvent({ type: 'game_complete', gameType });
  }, [recordEvent]);

  const recordLubCreation = useCallback((mode: 'farcaster' | 'romance') => {
    return recordEvent({ type: 'lub_created', mode });
  }, [recordEvent]);

  const recordNFTMint = useCallback(() => {
    return recordEvent({ type: 'nft_minted' });
  }, [recordEvent]);

  const recordGameShare = useCallback(() => {
    return recordEvent({ type: 'game_shared' });
  }, [recordEvent]);

  const recordReferral = useCallback(() => {
    return recordEvent({ type: 'referral_sent' });
  }, [recordEvent]);

  const recordLubEarning = useCallback((amount: bigint) => {
    return recordEvent({ type: 'lub_earned', amount });
  }, [recordEvent]);

  const recordSocialGameResult = useCallback((score: number, accuracy: number, timeSpent: number) => {
    return recordEvent({ type: 'social_game_result', score, accuracy, timeSpent });
  }, [recordEvent]);

  return {
    // Raw stats
    stats,
    
    // Formatted stats for UI
    formattedStats,
    
    // Actions
    recordEvent,
    updateLubBalance,
    resetStats,
    refreshStats,
    
    // Convenience methods
    recordGameCompletion,
    recordLubCreation,
    recordNFTMint,
    recordGameShare,
    recordReferral,
    recordLubEarning,
    recordSocialGameResult,
    
    // Computed properties for easy access
    tier: stats.tier,
    tierDisplayName: formattedStats.tierDisplayName,
    tierProgress: stats.tierProgress,
    nextTierRequirement: stats.nextTierRequirement,
    
    // Game stats
    gamesCompleted: stats.gamesCompleted,
    socialGamesPlayed: stats.socialGamesPlayed,
    
    // Social stats
    lubsCreated: stats.lubsCreated,
    gamesShared: stats.gamesShared,
    referralsSent: stats.referralsSent,
    
    // Web3 stats
    nftsMinted: stats.nftsMinted,
    lubBalance: formattedStats.lubBalance,
    totalLubEarned: formattedStats.totalLubEarned,
    
    // Social game performance
    socialGameScore: stats.socialGameScore,
    socialGameAccuracy: formattedStats.socialGameAccuracy,
    socialGameLevel: formattedStats.socialGameLevel,
    socialGameBestScore: stats.socialGameBestScore
  };
}

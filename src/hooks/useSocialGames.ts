// Hook for managing social games state and interactions

import { useState, useCallback } from 'react';
import { FarcasterUser, GameResult, LeaderboardEntry } from '@/types/socialGames';
import { gameStorage } from '@/utils/gameStorage';
import { scoreCalculator } from '@/utils/scoreCalculator';

interface UseSocialGamesReturn {
  // Game state
  isGameActive: boolean;
  currentGameResult: GameResult | null;
  
  // Player data
  playerStats: LeaderboardEntry | null;
  leaderboard: LeaderboardEntry[];
  
  // Actions
  startSocialGames: () => void;
  closeSocialGames: () => void;
  refreshPlayerData: () => Promise<void>;
  
  // Utilities
  canPlayGames: (users: FarcasterUser[]) => boolean;
  getPlayerAchievements: () => Promise<string[]>;
}

export function useSocialGames(): UseSocialGamesReturn {
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentGameResult, setCurrentGameResult] = useState<GameResult | null>(null);
  const [playerStats, setPlayerStats] = useState<LeaderboardEntry | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const startSocialGames = useCallback(() => {
    setIsGameActive(true);
  }, []);

  const closeSocialGames = useCallback(() => {
    setIsGameActive(false);
    setCurrentGameResult(null);
  }, []);

  const refreshPlayerData = useCallback(async () => {
    try {
      const playerId = await gameStorage.generatePlayerId();
      const stats = await gameStorage.getPlayerStats(playerId);
      const board = await gameStorage.getLeaderboard(undefined, 10);
      
      setPlayerStats(stats);
      setLeaderboard(board);
    } catch (error) {
      console.error('Failed to refresh player data:', error);
    }
  }, []);

  const canPlayGames = useCallback((users: FarcasterUser[]): boolean => {
    // We need at least 4 users with valid profile pictures and usernames
    const validUsers = users.filter(user =>
      user.pfp_url &&
      user.username &&
      user.pfp_url.trim() !== ''
    );

    return validUsers.length >= 4;
  }, []);

  const getPlayerAchievements = useCallback(async (): Promise<string[]> => {
    try {
      const playerId = await gameStorage.generatePlayerId();
      const results = await gameStorage.getPlayerResults(playerId);
      return scoreCalculator.generateAchievements(results);
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }, []);

  return {
    isGameActive,
    currentGameResult,
    playerStats,
    leaderboard,
    startSocialGames,
    closeSocialGames,
    refreshPlayerData,
    canPlayGames,
    getPlayerAchievements
  };
}
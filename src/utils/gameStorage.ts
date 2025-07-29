// Local storage implementation for game results and leaderboards

import { 
  GameStorage, 
  GameResult, 
  LeaderboardEntry 
} from '@/types/socialGames';
import { scoreCalculator } from './scoreCalculator';

export class LocalGameStorage implements GameStorage {
  private readonly STORAGE_KEYS = {
    GAME_RESULTS: 'farcaster-game-results',
    PLAYER_ID: 'farcaster-player-id',
    PLAYER_NAME: 'farcaster-player-name'
  };

  async saveGameResult(result: GameResult): Promise<void> {
    try {
      const existingResults = await this.getAllResults();
      const updatedResults = [...existingResults, result];
      
      localStorage.setItem(
        this.STORAGE_KEYS.GAME_RESULTS, 
        JSON.stringify(updatedResults)
      );
    } catch (error) {
      console.error('Failed to save game result:', error);
      throw new Error('Failed to save game result');
    }
  }

  async getPlayerResults(playerId: string): Promise<GameResult[]> {
    try {
      const allResults = await this.getAllResults();
      return allResults.filter(result => result.playerId === playerId);
    } catch (error) {
      console.error('Failed to get player results:', error);
      return [];
    }
  }

  async getLeaderboard(gameType?: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const allResults = await this.getAllResults();
      
      // Filter by game type if specified
      const filteredResults = gameType 
        ? allResults.filter(result => result.gameId.includes(gameType))
        : allResults;

      // Group results by player
      const playerResultsMap = new Map<string, GameResult[]>();
      
      filteredResults.forEach(result => {
        const playerId = result.playerId || 'anonymous';
        if (!playerResultsMap.has(playerId)) {
          playerResultsMap.set(playerId, []);
        }
        playerResultsMap.get(playerId)!.push(result);
      });

      // Calculate leaderboard entries
      const leaderboardEntries: LeaderboardEntry[] = [];
      
      for (const [playerId, results] of playerResultsMap.entries()) {
        const stats = scoreCalculator.calculatePlayerStats(results);
        const playerName = await this.getPlayerName(playerId);
        
        leaderboardEntries.push({
          playerId: playerId === 'anonymous' ? undefined : playerId,
          playerName,
          ...stats
        });
      }

      // Sort by total score and return top entries
      return leaderboardEntries
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  async getPlayerStats(playerId: string): Promise<LeaderboardEntry | null> {
    try {
      const playerResults = await this.getPlayerResults(playerId);
      
      if (playerResults.length === 0) {
        return null;
      }

      const stats = scoreCalculator.calculatePlayerStats(playerResults);
      const playerName = await this.getPlayerName(playerId);

      return {
        playerId,
        playerName,
        ...stats
      };
    } catch (error) {
      console.error('Failed to get player stats:', error);
      return null;
    }
  }

  // Helper methods
  private async getAllResults(): Promise<GameResult[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.GAME_RESULTS);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return parsed.map((result: any) => ({
        ...result,
        completedAt: new Date(result.completedAt)
      }));
    } catch (error) {
      console.error('Failed to parse stored results:', error);
      return [];
    }
  }

  async generatePlayerId(): Promise<string> {
    let playerId = localStorage.getItem(this.STORAGE_KEYS.PLAYER_ID);
    
    if (!playerId) {
      playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.STORAGE_KEYS.PLAYER_ID, playerId);
    }
    
    return playerId;
  }

  async setPlayerName(name: string): Promise<void> {
    localStorage.setItem(this.STORAGE_KEYS.PLAYER_NAME, name);
  }

  async getPlayerName(playerId: string): Promise<string | undefined> {
    if (playerId === 'anonymous') return 'Anonymous Player';
    
    const stored = localStorage.getItem(this.STORAGE_KEYS.PLAYER_NAME);
    return stored || undefined;
  }

  async clearAllData(): Promise<void> {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Analytics methods
  async getGameTypeStats(): Promise<Record<string, { played: number; avgScore: number }>> {
    const allResults = await this.getAllResults();
    const stats: Record<string, { played: number; totalScore: number }> = {};

    allResults.forEach(result => {
      const gameType = this.extractGameType(result.gameId);
      if (!stats[gameType]) {
        stats[gameType] = { played: 0, totalScore: 0 };
      }
      stats[gameType].played++;
      stats[gameType].totalScore += result.score;
    });

    // Convert to average scores
    const finalStats: Record<string, { played: number; avgScore: number }> = {};
    Object.entries(stats).forEach(([gameType, data]) => {
      finalStats[gameType] = {
        played: data.played,
        avgScore: Math.round(data.totalScore / data.played)
      };
    });

    return finalStats;
  }

  private extractGameType(gameId: string): string {
    if (gameId.includes('username-guessing')) return 'Username Guessing';
    if (gameId.includes('pfp-matching')) return 'PFP Matching';
    if (gameId.includes('social-trivia')) return 'Social Trivia';
    return 'Unknown';
  }
}

// Singleton instance
export const gameStorage = new LocalGameStorage();
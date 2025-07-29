// Score calculation utilities for social games

import { 
  ScoreCalculator, 
  GameResult, 
  UsernameGuessingResult, 
  PfpMatchingResult,
  LeaderboardEntry
} from '@/types/socialGames';

export class SocialScoreCalculator implements ScoreCalculator {
  
  calculateUsernameGuessingScore(result: UsernameGuessingResult): number {
    const { correctGuesses, totalQuestions, questionsData } = result.gameData;
    
    // Base score from accuracy
    const accuracyScore = (correctGuesses / totalQuestions) * 1000;
    
    // Time bonus (faster = better, but cap the bonus)
    const avgTimePerQuestion = result.timeSpent / totalQuestions;
    const timeBonus = Math.max(0, (30 - avgTimePerQuestion) * 10); // Bonus for under 30s per question
    
    // Difficulty multiplier
    const difficultyMultipliers = { easy: 1, medium: 1.2, hard: 1.5 };
    const gameId = result.gameId;
    const difficulty = gameId.includes('easy') ? 'easy' : gameId.includes('hard') ? 'hard' : 'medium';
    const difficultyMultiplier = difficultyMultipliers[difficulty];
    
    // Streak bonus for consecutive correct answers
    let streakBonus = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (const question of questionsData) {
      if (question.isCorrect) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    streakBonus = maxStreak >= 3 ? maxStreak * 50 : 0;
    
    return Math.round((accuracyScore + timeBonus + streakBonus) * difficultyMultiplier);
  }

  calculatePfpMatchingScore(result: PfpMatchingResult): number {
    const { matches } = result.gameData;
    const correctMatches = matches.filter(m => m.isCorrect).length;
    const totalMatches = matches.length;
    
    // Base score from accuracy
    const accuracyScore = (correctMatches / totalMatches) * 1000;
    
    // Time bonus
    const avgTimePerMatch = result.timeSpent / totalMatches;
    const timeBonus = Math.max(0, (20 - avgTimePerMatch) * 15);
    
    // Perfect game bonus
    const perfectBonus = correctMatches === totalMatches ? 200 : 0;
    
    return Math.round(accuracyScore + timeBonus + perfectBonus);
  }

  calculateOverallFarcasterKnowledge(results: GameResult[]): LeaderboardEntry['farcasterKnowledgeLevel'] {
    if (results.length === 0) return 'Newcomer';
    
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
    const gamesPlayed = results.length;
    
    // Calculate knowledge level based on multiple factors
    const scoreThreshold = totalScore / gamesPlayed;
    
    if (gamesPlayed >= 20 && avgAccuracy >= 90 && scoreThreshold >= 1200) {
      return 'Legend';
    } else if (gamesPlayed >= 15 && avgAccuracy >= 80 && scoreThreshold >= 1000) {
      return 'OG';
    } else if (gamesPlayed >= 10 && avgAccuracy >= 70 && scoreThreshold >= 800) {
      return 'Power User';
    } else if (gamesPlayed >= 5 && avgAccuracy >= 60) {
      return 'Regular';
    }
    
    return 'Newcomer';
  }

  // Helper method to calculate comprehensive player stats
  calculatePlayerStats(results: GameResult[]): Omit<LeaderboardEntry, 'playerId' | 'playerName'> {
    if (results.length === 0) {
      return {
        totalScore: 0,
        gamesPlayed: 0,
        averageAccuracy: 0,
        bestGame: {} as GameResult,
        farcasterKnowledgeLevel: 'Newcomer'
      };
    }

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
    const bestGame = results.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      totalScore,
      gamesPlayed: results.length,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      bestGame,
      farcasterKnowledgeLevel: this.calculateOverallFarcasterKnowledge(results)
    };
  }

  // Method to generate achievement badges
  generateAchievements(results: GameResult[]): string[] {
    const achievements: string[] = [];
    
    if (results.length >= 10) achievements.push('🎯 Dedicated Player');
    if (results.some(r => r.accuracy === 100)) achievements.push('🎪 Perfect Game');
    if (results.filter(r => r.accuracy >= 90).length >= 5) achievements.push('🧠 Sharp Mind');
    if (results.length >= 50) achievements.push('🏆 Farcaster Expert');
    
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    if (avgScore >= 1000) achievements.push('⭐ High Scorer');
    
    return achievements;
  }
}

// Singleton instance
export const scoreCalculator = new SocialScoreCalculator();
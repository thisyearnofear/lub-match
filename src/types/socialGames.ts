// Social game types and interfaces for Farcaster integration

export interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

// Base game interface
export interface SocialGame {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  minUsers: number;
  maxUsers: number;
  estimatedDuration: number; // in seconds
}

// Game result interface
export interface GameResult {
  gameId: string;
  playerId?: string; // Optional for anonymous play
  score: number;
  maxScore: number;
  accuracy: number; // percentage
  timeSpent: number; // in seconds
  completedAt: Date;
  gameData: Record<string, any>; // Game-specific data
}

// Leaderboard entry
export interface LeaderboardEntry {
  playerId?: string;
  playerName?: string;
  totalScore: number;
  gamesPlayed: number;
  averageAccuracy: number;
  bestGame: GameResult;
  farcasterKnowledgeLevel: 'Newcomer' | 'Regular' | 'Power User' | 'OG' | 'Legend';
}

// Username guessing game specific types
export interface UsernameGuessingGame extends SocialGame {
  users: FarcasterUser[];
  options: string[]; // Multiple choice options
  correctAnswers: string[];
}

export interface UsernameGuessingResult extends GameResult {
  gameData: {
    correctGuesses: number;
    totalQuestions: number;
    questionsData: Array<{
      user: FarcasterUser;
      userGuess: string;
      correctAnswer: string;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  };
}

// PFP matching game types
export interface PfpMatchingGame extends SocialGame {
  users: FarcasterUser[];
  shuffledPfps: string[];
  shuffledUsernames: string[];
}

export interface PfpMatchingResult extends GameResult {
  gameData: {
    matches: Array<{
      pfp: string;
      username: string;
      userMatch: string;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  };
}

// Social trivia game types
export interface SocialTriviaGame extends SocialGame {
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'followers' | 'bio' | 'activity' | 'connections';
    relatedUsers?: FarcasterUser[];
  }>;
}

// Game factory interface
export interface GameFactory {
  createUsernameGuessingGame(users: FarcasterUser[], difficulty?: 'easy' | 'medium' | 'hard'): UsernameGuessingGame;
  createPfpMatchingGame(users: FarcasterUser[], difficulty?: 'easy' | 'medium' | 'hard'): PfpMatchingGame;
  createSocialTriviaGame(users: FarcasterUser[], difficulty?: 'easy' | 'medium' | 'hard'): SocialTriviaGame;
}

// Score calculation interface
export interface ScoreCalculator {
  calculateUsernameGuessingScore(result: UsernameGuessingResult): number;
  calculatePfpMatchingScore(result: PfpMatchingResult): number;
  calculateOverallFarcasterKnowledge(results: GameResult[]): LeaderboardEntry['farcasterKnowledgeLevel'];
}

// Storage interface for scores and progress
export interface GameStorage {
  saveGameResult(result: GameResult): Promise<void>;
  getPlayerResults(playerId: string): Promise<GameResult[]>;
  getLeaderboard(gameType?: string, limit?: number): Promise<LeaderboardEntry[]>;
  getPlayerStats(playerId: string): Promise<LeaderboardEntry | null>;
}
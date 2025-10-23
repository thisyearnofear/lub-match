// Social game types and interfaces for Farcaster integration

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  powerBadge?: boolean;
  verifiedAddresses?: {
    ethAddresses: string[];
    solAddresses: string[];
  };
}

export interface LensUser {
  id: string;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  lensHandle?: string;
  lensProfileId?: string;
  ownedBy?: string;
  totalPosts?: number;
  totalCollects?: number;
  totalMirrors?: number;
  totalComments?: number;
  totalReactions?: number;
}

// ENHANCED: Three-tier experience types
export type ExperienceTier = 'love' | 'social' | 'professional';

// ENHANCED: Collaboration profile for professional tier
export interface CollaborationProfile {
  skills: string[];
  interests: string[];
  availability: 'available' | 'busy' | 'unavailable';
  lookingForCollaborators: boolean;
  preferredProjectTypes: string[];
  location?: string;
  timezone?: string;
  portfolioLinks?: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  collaborationHistory?: {
    completedProjects: number;
    successRate: number;
    averageRating: number;
  };
}

// ENHANCED: Discriminated union with collaboration support
export type SocialUser = (FarcasterUser & { 
  network: 'farcaster';
  collaborationProfile?: CollaborationProfile;
}) | (LensUser & { 
  network: 'lens';
  collaborationProfile?: CollaborationProfile;
});

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

// ENHANCED: Game result interface with collaboration support
export interface GameResult {
  gameId: string;
  playerId?: string; // Optional for anonymous play
  score: number;
  maxScore: number;
  accuracy: number; // percentage
  timeSpent: number; // in seconds
  completedAt: Date;
  gameData: Record<string, any>; // Game-specific data
  challengeResult?: any; // Add this for challenge results
  // NEW: Collaboration insights from gameplay
  collaborationInsights?: {
    skillsDiscovered: string[];
    compatibleUsers: SocialUser[];
    crossPlatformConnections: number;
    professionalOpportunities: number;
  };
}

// NEW: Collaboration-specific result type
export interface CollaborationResult extends GameResult {
  collaborationType: 'skill_match' | 'project_match' | 'cross_platform';
  participants: SocialUser[];
  matchScore: number;
  collaborationData: {
    projectBrief?: string;
    skillsMatched: string[];
    estimatedDuration?: string;
    proposedBudget?: number;
    communicationPreferences?: string[];
  };
}

// NEW: Collaboration request interface
export interface CollaborationRequest {
  id: string;
  requesterId: string;
  targetId: string;
  projectBrief: string;
  skillsNeeded: string[];
  timeline?: string;
  budget?: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
  rating?: number;
  feedback?: string;
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

// ENHANCED: Storage interface with collaboration support
export interface GameStorage {
  saveGameResult(result: GameResult): Promise<void>;
  getPlayerResults(playerId: string): Promise<GameResult[]>;
  getLeaderboard(gameType?: string, limit?: number): Promise<LeaderboardEntry[]>;
  getPlayerStats(playerId: string): Promise<LeaderboardEntry | null>;
  // NEW: Collaboration storage methods
  saveCollaborationRequest(request: CollaborationRequest): Promise<void>;
  getCollaborationRequests(userId: string): Promise<CollaborationRequest[]>;
  updateCollaborationStatus(requestId: string, status: CollaborationRequest['status']): Promise<void>;
  getCollaborationHistory(userId: string): Promise<CollaborationResult[]>;
}

// NEW: Experience tier configuration
export interface ExperienceTierConfig {
  tier: ExperienceTier;
  features: {
    memoryGame: boolean;
    socialGames: boolean;
    collaboration: boolean;
    nftMinting: boolean;
    crossPlatform: boolean;
  };
  styling: {
    primaryColor: string;
    accentColor: string;
    icon: string;
    description: string;
  };
}
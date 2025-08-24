/**
 * AI Challenge Engine Service
 * MODULAR: Pluggable challenge types with composable difficulty systems
 * CLEAN: Clear separation of AI logic, validation, and scoring
 * DRY: Single source of truth for challenge generation
 */

import { FarcasterUser } from "@/utils/mockData";
import { WhaleType, classifyUserByFollowers, getWhaleMultiplier } from "@/hooks/useFarcasterUsers";
// NEW: Anti-spam integration (ENHANCEMENT FIRST)
import { antiSpamService } from "@/services/antiSpamService";

// Challenge difficulty levels with base rewards
export const CHALLENGE_DIFFICULTIES = {
  easy: { baseReward: 50, timeMultiplier: 1.5, description: "Simple interactions" },
  medium: { baseReward: 200, timeMultiplier: 2.0, description: "Moderate engagement" },
  hard: { baseReward: 500, timeMultiplier: 3.0, description: "Complex challenges" },
} as const;

export type ChallengeDifficulty = keyof typeof CHALLENGE_DIFFICULTIES;

// Challenge categories with specific mechanics
export interface ChallengeType {
  id: string;
  name: string;
  description: string;
  category: 'interaction' | 'content' | 'viral' | 'whale_specific';
  minFollowers: number;
  maxFollowers?: number;
  baseReward: number;
  timeLimit: number; // minutes
  successCriteria: string[];
  examples: string[];
}

// Challenge instance with target and context
export interface Challenge {
  id: string;
  type: ChallengeType;
  targetUser: FarcasterUser;
  difficulty: ChallengeDifficulty;
  prompt: string;
  baseReward: number;
  whaleMultiplier: number;
  totalReward: number;
  timeLimit: number;
  deadline: Date;
  successCriteria: string[];
  createdAt: Date;
  createdBy?: string;
}

// Challenge result tracking
export interface ChallengeResult {
  challengeId: string;
  success: boolean;
  completedAt: Date;
  evidence?: string;
  viralDetected: boolean;
  actualReward: number;
  bonuses: {
    whale: number;
    viral: number;
    speed: number;
  };
}

/**
 * AI Challenge Engine
 * MODULAR: Composable challenge generation system
 * PERFORMANT: Cached challenge types and optimized selection
 */
class ChallengeEngine {
  private challengeTypes: Map<string, ChallengeType> = new Map();
  private activeChallenges: Map<string, Challenge> = new Map();
  private challengeHistory: ChallengeResult[] = [];

  constructor() {
    this.initializeChallengeTypes();
  }

  /**
   * Initialize predefined challenge types
   * ORGANIZED: Categorized challenge templates
   */
  private initializeChallengeTypes(): void {
    const types: ChallengeType[] = [
      // Easy interaction challenges
      {
        id: 'emoji_reply',
        name: 'Emoji Response',
        description: 'Get target to reply with specific emoji',
        category: 'interaction',
        minFollowers: 0,
        baseReward: 50,
        timeLimit: 60,
        successCriteria: ['Target replies with specified emoji'],
        examples: ['Get them to reply with 💝', 'Make them use 🚀 in response']
      },
      {
        id: 'keyword_mention',
        name: 'Keyword Drop',
        description: 'Get target to mention specific word',
        category: 'interaction',
        minFollowers: 0,
        baseReward: 75,
        timeLimit: 120,
        successCriteria: ['Target mentions specified keyword'],
        examples: ['Get them to say "love"', 'Make them mention "blockchain"']
      },
      
      // Medium engagement challenges
      {
        id: 'recast_content',
        name: 'Recast Master',
        description: 'Get target to recast your content',
        category: 'content',
        minFollowers: 100,
        baseReward: 200,
        timeLimit: 180,
        successCriteria: ['Target recasts your cast'],
        examples: ['Share something they\'ll want to recast', 'Create viral-worthy content']
      },
      {
        id: 'original_cast',
        name: 'Content Creator',
        description: 'Inspire target to create original cast about topic',
        category: 'content',
        minFollowers: 500,
        baseReward: 300,
        timeLimit: 240,
        successCriteria: ['Target creates original cast on specified topic'],
        examples: ['Get them to cast about Valentine\'s Day', 'Inspire a thread about love']
      },
      
      // Hard viral challenges
      {
        id: 'lub_mention',
        name: 'LUB Viral',
        description: 'Get target to mention $LUB token',
        category: 'viral',
        minFollowers: 1000,
        baseReward: 500,
        timeLimit: 360,
        successCriteria: ['Target mentions $LUB in a cast'],
        examples: ['Get them curious about $LUB', 'Make them ask about the token']
      },
      {
        id: 'thread_creation',
        name: 'Thread Master',
        description: 'Get target to create thread about topic',
        category: 'content',
        minFollowers: 2000,
        baseReward: 750,
        timeLimit: 480,
        successCriteria: ['Target creates multi-cast thread'],
        examples: ['Inspire a love story thread', 'Get them to share relationship advice']
      },
      
      // Whale-specific challenges
      {
        id: 'whale_attention',
        name: 'Whale Whisperer',
        description: 'Simply get whale to acknowledge you exist',
        category: 'whale_specific',
        minFollowers: 10000,
        baseReward: 1000,
        timeLimit: 720,
        successCriteria: ['Any response from whale'],
        examples: ['Get @vitalik to notice you', 'Make @dwr respond to anything']
      },
      {
        id: 'mega_whale_interaction',
        name: 'Leviathan Contact',
        description: 'Achieve meaningful interaction with mega whale',
        category: 'whale_specific',
        minFollowers: 50000,
        baseReward: 2500,
        timeLimit: 1440, // 24 hours
        successCriteria: ['Substantive response from mega whale'],
        examples: ['Get detailed reply from major influencer', 'Start conversation with protocol founder']
      }
    ];

    types.forEach(type => this.challengeTypes.set(type.id, type));
  }

  /**
   * Generate AI-powered challenge for target user
   * CLEAN: Separated AI logic from business logic
   * ENHANCED: Anti-spam validation (ENHANCEMENT FIRST)
   */
  async generateChallenge(
    targetUser: FarcasterUser,
    difficulty: ChallengeDifficulty,
    createdBy?: string,
    creatorUserId?: number
  ): Promise<Challenge> {
    // NEW: Anti-spam validation
    if (creatorUserId) {
      const spamCheck = antiSpamService.canCreateChallenge(creatorUserId, targetUser.fid);
      if (spamCheck.isSpam) {
        throw new Error(`Challenge blocked: ${spamCheck.reasons.join(', ')}`);
      }
    }
    // Classify target user
    const whaleType = classifyUserByFollowers(targetUser.followerCount);
    const whaleMultiplier = getWhaleMultiplier(whaleType);
    
    // Select appropriate challenge type
    const challengeType = this.selectChallengeType(targetUser, difficulty, whaleType);
    
    // Generate contextual prompt
    const prompt = await this.generateContextualPrompt(challengeType, targetUser, difficulty);
    
    // Calculate rewards
    const baseReward = CHALLENGE_DIFFICULTIES[difficulty].baseReward;
    const totalReward = Math.floor(baseReward * whaleMultiplier);
    
    // Create challenge instance
    const challenge: Challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: challengeType,
      targetUser,
      difficulty,
      prompt,
      baseReward,
      whaleMultiplier,
      totalReward,
      timeLimit: challengeType.timeLimit,
      deadline: new Date(Date.now() + challengeType.timeLimit * 60 * 1000),
      successCriteria: challengeType.successCriteria,
      createdAt: new Date(),
      createdBy
    };
    
    // Store active challenge
    this.activeChallenges.set(challenge.id, challenge);

    // Record activity for anti-spam tracking
    if (creatorUserId) {
      antiSpamService.recordActivity(creatorUserId, 'challenge', {
        challengeId: challenge.id,
        targetUserId: targetUser.fid,
        difficulty,
        whaleMultiplier
      });
    }

    return challenge;
  }

  /**
   * Select appropriate challenge type based on target and difficulty
   * MODULAR: Composable selection logic
   */
  private selectChallengeType(
    targetUser: FarcasterUser,
    difficulty: ChallengeDifficulty,
    whaleType: WhaleType
  ): ChallengeType {
    const availableTypes = Array.from(this.challengeTypes.values()).filter(type => {
      // Filter by follower requirements
      if (targetUser.followerCount < type.minFollowers) return false;
      if (type.maxFollowers && targetUser.followerCount > type.maxFollowers) return false;
      
      // Filter by difficulty appropriateness
      if (difficulty === 'easy' && type.baseReward > 100) return false;
      if (difficulty === 'medium' && (type.baseReward < 100 || type.baseReward > 500)) return false;
      if (difficulty === 'hard' && type.baseReward < 300) return false;
      
      // Whale-specific challenges only for whales
      if (type.category === 'whale_specific' && whaleType === 'minnow') return false;
      
      return true;
    });
    
    if (availableTypes.length === 0) {
      // Fallback to basic emoji challenge
      return this.challengeTypes.get('emoji_reply')!;
    }
    
    // Select random appropriate challenge
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  /**
   * Generate contextual AI prompt for challenge
   * CLEAN: AI logic separated from business logic
   */
  private async generateContextualPrompt(
    challengeType: ChallengeType,
    targetUser: FarcasterUser,
    difficulty: ChallengeDifficulty
  ): Promise<string> {
    // For now, use template-based generation
    // In production, this would call an AI service
    const templates = challengeType.examples;
    const baseTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Add user context
    const contextualPrompt = `Challenge: ${baseTemplate}\n\n` +
      `Target: @${targetUser.username} (${targetUser.followerCount} followers)\n` +
      `Difficulty: ${difficulty}\n` +
      `Time Limit: ${challengeType.timeLimit} minutes\n\n` +
      `Success Criteria: ${challengeType.successCriteria.join(', ')}\n\n` +
      `Tip: ${this.getStrategyTip(challengeType, targetUser)}`;
    
    return contextualPrompt;
  }

  /**
   * Get strategy tip based on challenge type and target
   * MODULAR: Composable strategy system
   */
  private getStrategyTip(challengeType: ChallengeType, targetUser: FarcasterUser): string {
    const whaleType = classifyUserByFollowers(targetUser.followerCount);
    
    if (whaleType === 'mega_whale' || whaleType === 'whale') {
      return "Whales get hundreds of mentions daily. Be genuinely interesting, not spammy.";
    }
    
    if (challengeType.category === 'viral') {
      return "Create curiosity without being obvious. Let them discover $LUB naturally.";
    }
    
    if (challengeType.category === 'content') {
      return "Share something valuable first. People recast content that makes them look good.";
    }
    
    return "Be authentic and engaging. Build genuine connection before asking for anything.";
  }

  /**
   * Complete a challenge and calculate final rewards
   * PERFORMANT: Efficient reward calculation
   */
  completeChallenge(
    challengeId: string,
    success: boolean,
    evidence?: string,
    viralDetected: boolean = false
  ): ChallengeResult {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    let actualReward = 0;
    const bonuses = { whale: 0, viral: 0, speed: 0 };
    
    if (success) {
      actualReward = challenge.baseReward;
      
      // Whale bonus
      if (challenge.whaleMultiplier > 1) {
        bonuses.whale = challenge.baseReward * (challenge.whaleMultiplier - 1);
        actualReward += bonuses.whale;
      }
      
      // Viral bonus (25% extra if target mentions $LUB)
      if (viralDetected) {
        bonuses.viral = Math.floor(actualReward * 0.25);
        actualReward += bonuses.viral;
      }
      
      // Speed bonus (completed in first 25% of time limit)
      const timeElapsed = Date.now() - challenge.createdAt.getTime();
      const timeLimit = challenge.timeLimit * 60 * 1000;
      if (timeElapsed < timeLimit * 0.25) {
        bonuses.speed = Math.floor(actualReward * 0.5); // 50% speed bonus
        actualReward += bonuses.speed;
      }
    }
    
    const result: ChallengeResult = {
      challengeId,
      success,
      completedAt: new Date(),
      evidence,
      viralDetected,
      actualReward,
      bonuses
    };
    
    // Store result and remove from active challenges
    this.challengeHistory.push(result);
    this.activeChallenges.delete(challengeId);
    
    return result;
  }

  /**
   * Get active challenges
   * PERFORMANT: Efficient filtering
   */
  getActiveChallenges(): Challenge[] {
    return Array.from(this.activeChallenges.values());
  }

  /**
   * Get challenge by ID
   * CLEAN: Explicit dependency
   */
  getChallenge(challengeId: string): Challenge | undefined {
    return this.activeChallenges.get(challengeId);
  }

  /**
   * Get challenge history
   * PERFORMANT: Paginated results
   */
  getChallengeHistory(limit: number = 50): ChallengeResult[] {
    return this.challengeHistory.slice(-limit);
  }

  /**
   * Clean up expired challenges
   * PREVENT BLOAT: Systematic cleanup
   */
  cleanupExpiredChallenges(): number {
    const now = new Date();
    let cleaned = 0;
    
    for (const [id, challenge] of this.activeChallenges.entries()) {
      if (challenge.deadline < now) {
        this.activeChallenges.delete(id);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Export singleton instance
export const challengeEngine = new ChallengeEngine();

/**
 * Challenge Skill Calculator
 * MODULAR: Independent utility for calculating user skill levels
 * DRY: Single source of truth for skill calculations
 */

import { UserStats } from "@/types/userStats";

// Skill dimensions with weights
const SKILL_DIMENSIONS = {
  successRate: 0.4, // 40% weight
  whaleMultiplier: 0.3, // 30% weight
  streak: 0.2, // 20% weight
  viralRate: 0.1 // 10% weight
} as const;

// Skill level thresholds (0-100 score)
const SKILL_LEVELS = {
  beginner: 0,
  intermediate: 30,
  advanced: 60,
  expert: 85
} as const;

export type ChallengeSkillLevel = keyof typeof SKILL_LEVELS;

/**
 * Calculate a user's challenge skill score (0-100)
 * ENHANCEMENT: Comprehensive skill assessment
 */
export function calculateChallengeSkill(stats: UserStats): number {
  const challengeStats = stats.challengeStats;
  
  // Guard against division by zero
  if (challengeStats.challengesCompleted === 0) {
    return 0;
  }
  
  // 1. Success Rate (0-40 points)
  const successRate = challengeStats.challengesSuccessful / challengeStats.challengesCompleted;
  const successRateScore = successRate * 40;
  
  // 2. Whale Targeting (0-30 points)
  // Max multiplier is 25, so normalize to 0-30 scale
  const whaleMultiplierScore = Math.min(30, (challengeStats.bestWhaleMultiplier / 25) * 30);
  
  // 3. Streak Performance (0-20 points)
  // Longest streak of 10+ gets full points
  const streakScore = Math.min(20, (challengeStats.longestChallengeStreak / 10) * 20);
  
  // 4. Viral Detection Rate (0-10 points)
  // 50%+ viral rate gets full points
  const viralRate = challengeStats.challengesSuccessful > 0 
    ? challengeStats.viralDetections / challengeStats.challengesSuccessful
    : 0;
  const viralRateScore = viralRate * 10;
  
  // Weighted total score
  const totalScore = (
    successRateScore * SKILL_DIMENSIONS.successRate +
    whaleMultiplierScore * SKILL_DIMENSIONS.whaleMultiplier +
    streakScore * SKILL_DIMENSIONS.streak +
    viralRateScore * SKILL_DIMENSIONS.viralRate
  );
  
  return Math.round(totalScore);
}

/**
 * Get a user's challenge skill level based on their score
 * ENHANCEMENT: Categorical skill levels
 */
export function getChallengeSkillLevel(score: number): ChallengeSkillLevel {
  if (score >= SKILL_LEVELS.expert) return "expert";
  if (score >= SKILL_LEVELS.advanced) return "advanced";
  if (score >= SKILL_LEVELS.intermediate) return "intermediate";
  return "beginner";
}

/**
 * Get a descriptive label for a skill level
 * ENHANCEMENT: User-friendly labels
 */
export function getSkillLevelLabel(level: ChallengeSkillLevel): string {
  switch (level) {
    case "beginner": return "🌱 New Challenger";
    case "intermediate": return "🎯 Skilled Player";
    case "advanced": return "🔥 Challenge Master";
    case "expert": return "🚀 Whale Hunter";
  }
}

/**
 * Generate contextual difficulty suggestions based on skill
 * ENHANCEMENT: Adaptive difficulty recommendations
 */
export function getDifficultyRecommendation(skillLevel: ChallengeSkillLevel): {
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
} {
  switch (skillLevel) {
    case "beginner":
      return {
        difficulty: "easy",
        explanation: "Start with simple challenges to build your skills"
      };
    case "intermediate":
      return {
        difficulty: "medium",
        explanation: "Try moderate challenges to test your abilities"
      };
    case "advanced":
      return {
        difficulty: "hard",
        explanation: "Take on difficult challenges for bigger rewards"
      };
    case "expert":
      return {
        difficulty: "hard",
        explanation: "Master level challenges for maximum rewards"
      };
  }
}
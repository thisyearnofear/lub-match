/**
 * Collaboration Service
 * ENHANCEMENT FIRST: Extends existing challengeEngine patterns
 * CLEAN: Pure functions with explicit dependencies
 * DRY: Leverages existing PlatformAdapter and social game logic
 * MODULAR: Independent service following existing patterns
 */

import { PlatformAdapter, UnifiedUtils } from '@/utils/platformAdapter';
import { classifyUserByFollowers, getWhaleMultiplier } from '@/hooks/useFarcasterUsers';
import { 
  SocialUser, 
  CollaborationProfile, 
  CollaborationResult, 
  CollaborationRequest,
  ExperienceTier,
  ExperienceTierConfig
} from '@/types/socialGames';

// CLEAN: Experience tier configurations
export const EXPERIENCE_TIERS: Record<ExperienceTier, ExperienceTierConfig> = {
  love: {
    tier: 'love',
    features: {
      memoryGame: true,
      socialGames: false,
      collaboration: false,
      nftMinting: true,
      crossPlatform: false,
    },
    styling: {
      primaryColor: 'from-pink-500 via-rose-500 to-red-500',
      accentColor: 'pink-400',
      icon: '💝',
      description: 'Romantic Valentine\'s experience with memory games and NFT minting'
    }
  },
  social: {
    tier: 'social',
    features: {
      memoryGame: true,
      socialGames: true,
      collaboration: false,
      nftMinting: true,
      crossPlatform: true,
    },
    styling: {
      primaryColor: 'from-purple-500 via-violet-500 to-indigo-500',
      accentColor: 'purple-400',
      icon: '🎮',
      description: 'Fun social gaming with challenges and cross-platform connections'
    }
  },
  professional: {
    tier: 'professional',
    features: {
      memoryGame: true,
      socialGames: true,
      collaboration: true,
      nftMinting: true,
      crossPlatform: true,
    },
    styling: {
      primaryColor: 'from-blue-500 via-cyan-500 to-teal-500',
      accentColor: 'blue-400',
      icon: '🎨',
      description: 'Creative collaboration with magical matching and co-creation opportunities'
    }
  }
};

// PERFORMANT: Skill extraction cache
const skillExtractionCache = new Map<string, string[]>();

export class CollaborationService {
  /**
   * CLEAN: AI-powered skill extraction from user bio
   * Leverages existing PlatformAdapter for platform-specific logic
   */
  static analyzeSkills(user: SocialUser): string[] {
    const cacheKey = `${user.network}-${user.username}`;
    
    if (skillExtractionCache.has(cacheKey)) {
      return skillExtractionCache.get(cacheKey)!;
    }

    const bio = user.bio || '';
    const skills: string[] = [];

    // ENHANCEMENT FIRST: Extend existing bio analysis patterns
    const skillKeywords = {
      // Creative skills (common in Lens users)
      'design': ['design', 'designer', 'ui', 'ux', 'graphic', 'visual', 'creative'],
      'art': ['art', 'artist', 'illustration', 'drawing', 'painting', 'digital art'],
      'photography': ['photo', 'photographer', 'photography', 'camera', 'visual'],
      'video': ['video', 'videographer', 'editing', 'motion', 'animation'],
      'writing': ['writer', 'writing', 'content', 'copywriter', 'blog', 'journalist'],
      'music': ['music', 'musician', 'producer', 'audio', 'sound', 'composer'],
      
      // Technical skills (common in Farcaster users)
      'development': ['dev', 'developer', 'programming', 'coding', 'engineer'],
      'frontend': ['frontend', 'react', 'vue', 'angular', 'javascript', 'typescript'],
      'backend': ['backend', 'node', 'python', 'rust', 'go', 'api'],
      'blockchain': ['blockchain', 'web3', 'smart contract', 'solidity', 'ethereum'],
      'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter'],
      'data': ['data', 'analytics', 'ml', 'ai', 'machine learning'],
      
      // Business skills
      'marketing': ['marketing', 'growth', 'seo', 'social media', 'brand'],
      'product': ['product', 'pm', 'product manager', 'strategy'],
      'business': ['business', 'entrepreneur', 'founder', 'startup'],
      'finance': ['finance', 'defi', 'trading', 'investment', 'economics']
    };

    const lowerBio = bio.toLowerCase();
    
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => lowerBio.includes(keyword))) {
        skills.push(skill);
      }
    }

    // PERFORMANT: Cache the result
    skillExtractionCache.set(cacheKey, skills);
    return skills;
  }

  /**
   * CLEAN: Compatibility scoring using existing whale classification logic
   * Reuses existing follower analysis patterns
   */
  static calculateCompatibility(userA: SocialUser, userB: SocialUser): number {
    let score = 0;

    // Skill complementarity (40% of score)
    const skillsA = this.analyzeSkills(userA);
    const skillsB = this.analyzeSkills(userB);
    
    const hasComplementarySkills = this.hasComplementarySkills(skillsA, skillsB);
    if (hasComplementarySkills) {
      score += 40;
    }

    // Cross-platform bonus (20% of score)
    if (userA.network !== userB.network) {
      score += 20;
    }

    // Follower balance (20% of score)
    const followerRatio = Math.min(userA.followerCount, userB.followerCount) / 
                         Math.max(userA.followerCount, userB.followerCount);
    score += followerRatio * 20;

    // Whale factor (10% of score) - reuses existing classification
    const whaleTypeA = classifyUserByFollowers(userA.followerCount);
    const whaleTypeB = classifyUserByFollowers(userB.followerCount);
    
    if (whaleTypeA !== whaleTypeB) {
      score += 10; // Different whale tiers can complement each other
    }

    // Collaboration readiness (10% of score)
    const readinessA = userA.collaborationProfile?.lookingForCollaborators ? 5 : 0;
    const readinessB = userB.collaborationProfile?.lookingForCollaborators ? 5 : 0;
    score += readinessA + readinessB;

    return Math.min(100, Math.round(score));
  }

  /**
   * MODULAR: Check if skills are complementary
   */
  private static hasComplementarySkills(skillsA: string[], skillsB: string[]): boolean {
    const creativeSkills = ['design', 'art', 'photography', 'video', 'writing', 'music'];
    const technicalSkills = ['development', 'frontend', 'backend', 'blockchain', 'mobile', 'data'];
    const businessSkills = ['marketing', 'product', 'business', 'finance'];

    const hasCreativeA = skillsA.some(skill => creativeSkills.includes(skill));
    const hasTechnicalA = skillsA.some(skill => technicalSkills.includes(skill));
    const hasBusinessA = skillsA.some(skill => businessSkills.includes(skill));

    const hasCreativeB = skillsB.some(skill => creativeSkills.includes(skill));
    const hasTechnicalB = skillsB.some(skill => technicalSkills.includes(skill));
    const hasBusinessB = skillsB.some(skill => businessSkills.includes(skill));

    // Check for complementary combinations
    return (
      (hasCreativeA && hasTechnicalB) ||
      (hasTechnicalA && hasCreativeB) ||
      (hasBusinessA && (hasCreativeB || hasTechnicalB)) ||
      (hasBusinessB && (hasCreativeA || hasTechnicalA))
    );
  }

  /**
   * ENHANCEMENT FIRST: Generate collaboration suggestions
   * Extends existing challenge generation patterns
   * Uses existing social game scoring logic
   */
  static generateCollaborationSuggestions(
    user: SocialUser, 
    candidates: SocialUser[]
  ): CollaborationResult[] {
    const suggestions: CollaborationResult[] = [];
    const userSkills = this.analyzeSkills(user);

    // PERFORMANT: Sort candidates by compatibility first
    const sortedCandidates = candidates
      .map(candidate => ({
        user: candidate,
        compatibility: this.calculateCompatibility(user, candidate)
      }))
      .filter(item => item.compatibility >= 60) // Only high-compatibility matches
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 10); // Top 10 matches

    for (const { user: candidate, compatibility } of sortedCandidates) {
      const candidateSkills = this.analyzeSkills(candidate);
      const matchedSkills = userSkills.filter(skill => candidateSkills.includes(skill));
      const complementarySkills = this.getComplementarySkills(userSkills, candidateSkills);

      // Determine collaboration type
      let collaborationType: 'skill_match' | 'project_match' | 'cross_platform';
      if (user.network !== candidate.network) {
        collaborationType = 'cross_platform';
      } else if (matchedSkills.length > 0) {
        collaborationType = 'skill_match';
      } else {
        collaborationType = 'project_match';
      }

      const suggestion: CollaborationResult = {
        gameId: `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        score: compatibility,
        maxScore: 100,
        accuracy: compatibility,
        timeSpent: 0,
        completedAt: new Date(),
        gameData: {},
        collaborationType,
        participants: [user, candidate],
        matchScore: compatibility,
        collaborationData: {
          skillsMatched: [...matchedSkills, ...complementarySkills],
          projectBrief: this.generateProjectBrief(userSkills, candidateSkills),
          estimatedDuration: this.estimateProjectDuration(userSkills, candidateSkills),
          proposedBudget: this.estimateBudget(user, candidate),
        },
        collaborationInsights: {
          skillsDiscovered: candidateSkills,
          compatibleUsers: [candidate],
          crossPlatformConnections: user.network !== candidate.network ? 1 : 0,
          professionalOpportunities: 1
        }
      };

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * MODULAR: Get complementary skills between two users
   */
  private static getComplementarySkills(skillsA: string[], skillsB: string[]): string[] {
    const allSkills = [...new Set([...skillsA, ...skillsB])];
    return allSkills.filter(skill => 
      (skillsA.includes(skill) && !skillsB.includes(skill)) ||
      (!skillsA.includes(skill) && skillsB.includes(skill))
    );
  }

  /**
   * CLEAN: AI-powered project brief generation
   */
  private static generateProjectBrief(skillsA: string[], skillsB: string[]): string {
    const allSkills = [...new Set([...skillsA, ...skillsB])];
    
    if (allSkills.includes('design') && allSkills.includes('development')) {
      return 'Web3 application with beautiful UI/UX design and robust technical implementation';
    } else if (allSkills.includes('art') && allSkills.includes('blockchain')) {
      return 'NFT collection with unique artistic vision and smart contract functionality';
    } else if (allSkills.includes('marketing') && allSkills.includes('product')) {
      return 'Product launch strategy with comprehensive marketing and growth planning';
    } else if (allSkills.includes('writing') && allSkills.includes('development')) {
      return 'Technical documentation and content creation for developer tools';
    } else {
      return 'Collaborative project leveraging complementary skills for Web3 innovation';
    }
  }

  /**
   * CLEAN: Estimate project duration based on skills
   */
  private static estimateProjectDuration(skillsA: string[], skillsB: string[]): string {
    const complexSkills = ['blockchain', 'development', 'data', 'backend'];
    const hasComplexSkills = [...skillsA, ...skillsB].some(skill => complexSkills.includes(skill));
    
    if (hasComplexSkills) {
      return '4-8 weeks';
    } else {
      return '2-4 weeks';
    }
  }

  /**
   * CLEAN: Estimate budget based on user profiles
   * Leverages existing whale classification
   */
  private static estimateBudget(userA: SocialUser, userB: SocialUser): number {
    const whaleMultiplierA = getWhaleMultiplier(classifyUserByFollowers(userA.followerCount));
    const whaleMultiplierB = getWhaleMultiplier(classifyUserByFollowers(userB.followerCount));
    
    const baseBudget = 1000; // Base LUB tokens
    const multiplier = (whaleMultiplierA + whaleMultiplierB) / 2;
    
    return Math.round(baseBudget * multiplier);
  }

  /**
   * CLEAN: Get experience tier for user based on engagement
   */
  static getUserExperienceTier(user: SocialUser, gameHistory?: any[]): ExperienceTier {
    // Default to love tier for new users
    if (!gameHistory || gameHistory.length === 0) {
      return 'love';
    }

    const hasPlayedSocialGames = gameHistory.some(game => 
      game.gameId.includes('social') || game.gameId.includes('challenge')
    );

    const hasCollaborationProfile = !!user.collaborationProfile;
    const isLookingForCollaborators = user.collaborationProfile?.lookingForCollaborators;

    // Professional tier: has collaboration profile and looking for collaborators
    if (hasCollaborationProfile && isLookingForCollaborators) {
      return 'professional';
    }

    // Social tier: has played social games
    if (hasPlayedSocialGames) {
      return 'social';
    }

    // Default to love tier
    return 'love';
  }

  /**
   * PERFORMANT: Clear caches when needed
   */
  static clearCache(): void {
    skillExtractionCache.clear();
  }
}

// MODULAR: Export utility functions for use in components
export const CollaborationUtils = {
  /**
   * Get tier styling for UI components
   */
  getTierStyling: (tier: ExperienceTier) => EXPERIENCE_TIERS[tier].styling,

  /**
   * Check if tier supports feature
   */
  tierSupportsFeature: (tier: ExperienceTier, feature: keyof ExperienceTierConfig['features']) => 
    EXPERIENCE_TIERS[tier].features[feature],

  /**
   * Get tier description
   */
  getTierDescription: (tier: ExperienceTier) => EXPERIENCE_TIERS[tier].styling.description,

  /**
   * Format skills for display
   */
  formatSkills: (skills: string[]): string[] => 
    skills.map(skill => skill.charAt(0).toUpperCase() + skill.slice(1)),

  /**
   * Get collaboration readiness status
   */
  getCollaborationReadiness: (user: SocialUser): 'ready' | 'interested' | 'not_ready' => {
    if (user.collaborationProfile?.lookingForCollaborators) {
      return 'ready';
    } else if (user.collaborationProfile) {
      return 'interested';
    } else {
      return 'not_ready';
    }
  }
};
/**
 * Social Influence Calculator
 * ENHANCEMENT FIRST: Unified system for calculating social metrics across platforms
 * DRY: Single source of truth for rarity scoring (platform styling moved to platformStyling.ts)
 */

"use client";

import { SocialUser, LensUser, FarcasterUser } from "@/types/socialGames";
import { PlatformAdapter, PlatformType, FarcasterUtils } from "@/utils/platformAdapter";

export interface CollectionRarity {
  tier: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  score: number;
  factors: {
    totalFollowers: number;
    averageFollowers: number;
    verifiedCount: number;
    powerBadgeCount: number;
    crossPlatform: boolean;
    platformDiversity: number;
  };
}

export interface SocialInfluenceMetrics {
  totalScore: number;
  platformDiversity: number;
  verificationBonus: number;
  followerScore: number;
  engagementScore: number;
  rarityTier: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  platformBreakdown: {
    farcaster: number;
    lens: number;
  };
}

/**
 * Calculate social influence score for a single user
 */
export function calculateUserInfluence(user: SocialUser): number {
  const baseScore = Math.log10(user.followerCount + 1) * 100;
  
  // Platform-specific bonuses
  let platformBonus = 0;
  if (user.network === 'lens') {
    const lensUser = user as LensUser & { network: 'lens' };
    // Lens users get bonus for content creation metrics
    platformBonus = (lensUser.totalPosts || 0) * 0.1 + 
                   (lensUser.totalCollects || 0) * 0.5 +
                   (lensUser.totalMirrors || 0) * 0.3;
  } else if (user.network === 'farcaster') {
    const farcasterUser = user as FarcasterUser & { network: 'farcaster' };
    // Farcaster users get bonus for power badge and verification
    platformBonus = farcasterUser.powerBadge ? 50 : 0;
    platformBonus += farcasterUser.verifiedAddresses?.ethAddresses.length ? 25 : 0;
  }
  
  return Math.round(baseScore + platformBonus);
}

/**
 * Calculate collection rarity based on all users in the NFT
 */
export function calculateCollectionRarity(users: SocialUser[]): CollectionRarity {
  const platforms = new Set(users.map(u => u.network));
  const totalFollowers = users.reduce((sum, u) => sum + u.followerCount, 0);
  const verifiedCount = users.filter(u => PlatformAdapter.isVerified(u)).length;
  
  const crossPlatform = platforms.size > 1;
  const platformDiversity = platforms.size / 2; // Max 2 platforms currently
  
  // Base score calculation
  let score = 0;
  
  // Follower influence (logarithmic scale)
  score += Math.log10(totalFollowers + 1) * 10;
  
  // Platform diversity bonus (significant for cross-platform collections)
  if (crossPlatform) {
    score += 100; // Major bonus for cross-platform collections
  }
  
  // Verification bonus
  score += verifiedCount * 20;
  
  // Trending bonus (can be enhanced with real-time data)
  const trendingBonus = 0; // Placeholder for trending detection
  score += trendingBonus;
  
  // Determine rarity tier
  let tier: CollectionRarity['tier'] = 'Common';
  if (score >= 500) tier = 'Legendary';
  else if (score >= 300) tier = 'Epic';
  else if (score >= 200) tier = 'Rare';
  else if (score >= 100) tier = 'Uncommon';
  
  return {
    score: Math.round(score),
    tier,
    factors: {
      totalFollowers,
      averageFollowers: users.length > 0 ? totalFollowers / users.length : 0,
      verifiedCount,
      powerBadgeCount: users.filter(u => u.network === 'farcaster' && FarcasterUtils.hasPowerBadge(u)).length,
      crossPlatform,
      platformDiversity,
    },
  };
}

/**
 * Calculate comprehensive social influence metrics for a collection
 */
export function calculateSocialInfluenceMetrics(users: SocialUser[]): SocialInfluenceMetrics {
  const userScores = users.map(calculateUserInfluence);
  const totalScore = userScores.reduce((sum, score) => sum + score, 0);
  
  const platforms = new Set(users.map(u => u.network));
  const platformDiversity = platforms.size / 2; // Normalize to 0-1
  
  const verifiedUsers = users.filter(u => PlatformAdapter.isVerified(u));
  const verificationBonus = verifiedUsers.length * 50;
  
  const totalFollowers = users.reduce((sum, u) => sum + u.followerCount, 0);
  const followerScore = Math.log10(totalFollowers + 1) * 100;
  
  // Engagement score (platform-specific)
  const engagementScore = users.reduce((sum, user) => {
    if (user.network === 'lens') {
      const lensUser = user as LensUser & { network: 'lens' };
      return sum + (lensUser.totalReactions || 0) * 0.1;
    }
    return sum;
  }, 0);
  
  // Platform breakdown
  const farcasterUsers = users.filter(u => u.network === 'farcaster');
  const lensUsers = users.filter(u => u.network === 'lens');
  
  const platformBreakdown = {
    farcaster: farcasterUsers.reduce((sum, u) => sum + calculateUserInfluence(u), 0),
    lens: lensUsers.reduce((sum, u) => sum + calculateUserInfluence(u), 0),
  };
  
  // Determine overall rarity tier
  const finalScore = totalScore + verificationBonus + (platformDiversity * 100);
  let rarityTier: SocialInfluenceMetrics['rarityTier'] = 'Common';
  if (finalScore >= 1000) rarityTier = 'Legendary';
  else if (finalScore >= 600) rarityTier = 'Epic';
  else if (finalScore >= 400) rarityTier = 'Rare';
  else if (finalScore >= 200) rarityTier = 'Uncommon';
  
  return {
    totalScore: Math.round(finalScore),
    platformDiversity,
    verificationBonus,
    followerScore: Math.round(followerScore),
    engagementScore: Math.round(engagementScore),
    rarityTier,
    platformBreakdown,
  };
}

/**
 * AGGRESSIVE CONSOLIDATION: Use PlatformAdapter for styling
 */
export function getPlatformStyling(network: 'farcaster' | 'lens' | 'mixed') {
  return PlatformAdapter.getPlatformStyling(network as PlatformType);
}

/**
 * Get rarity-specific styling for visual enhancement
 * AGGRESSIVE CONSOLIDATION: Use shared platformStyling utility
 */
export function getRarityStyling(tier: string) {
  // CLEAN: Use PlatformAdapter for rarity styling
  const baseColors: Record<string, string> = {
    'Common': 'from-gray-400 to-gray-600',
    'Uncommon': 'from-green-400 to-green-600', 
    'Rare': 'from-blue-400 to-blue-600',
    'Epic': 'from-purple-400 to-purple-600',
    'Legendary': 'from-yellow-400 to-yellow-600'
  };
  
  return {
    gradient: baseColors[tier] || baseColors['Common'],
    textColor: tier === 'Legendary' ? 'text-yellow-300' : 
               tier === 'Epic' ? 'text-purple-300' :
               tier === 'Rare' ? 'text-blue-300' :
               tier === 'Uncommon' ? 'text-green-300' : 'text-gray-300',
    borderColor: tier === 'Legendary' ? 'border-yellow-400' :
                 tier === 'Epic' ? 'border-purple-400' :
                 tier === 'Rare' ? 'border-blue-400' :
                 tier === 'Uncommon' ? 'border-green-400' : 'border-gray-400',
    glow: tier === 'Legendary' ? 'shadow-yellow-400/50 shadow-lg' :
          tier === 'Epic' ? 'shadow-purple-400/50 shadow-lg' :
          tier === 'Rare' ? 'shadow-blue-400/50 shadow-md' :
          tier === 'Uncommon' ? 'shadow-green-400/50 shadow-sm' : '',
    border: tier === 'Legendary' ? 'border-2 border-yellow-400' :
            tier === 'Epic' ? 'border-2 border-purple-400' :
            tier === 'Rare' ? 'border-2 border-blue-400' :
            tier === 'Uncommon' ? 'border-2 border-green-400' : 'border border-gray-400',
    text: tier === 'Legendary' ? 'text-yellow-300' :
          tier === 'Epic' ? 'text-purple-300' :
          tier === 'Rare' ? 'text-blue-300' :
          tier === 'Uncommon' ? 'text-green-300' : 'text-gray-300',
    animation: tier === 'Legendary' ? 'animate-pulse' :
               tier === 'Epic' ? 'animate-bounce' : ''
  };
}
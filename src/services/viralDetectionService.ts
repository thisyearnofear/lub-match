/**
 * Viral Detection and Reward System
 * PERFORMANT: Real-time monitoring with efficient rate limiting
 * CLEAN: Clear separation between detection, validation, and reward logic
 * MODULAR: Pluggable detection strategies and reward calculators
 */

import { FarcasterUser } from "@/utils/mockData";
import { Challenge } from "@/services/challengeEngine";
import { socialInteractionService } from "@/services/socialInteractionService";
// NEW: Anti-spam integration (ENHANCEMENT FIRST)
import { antiSpamService } from "@/services/antiSpamService";

// Viral detection configuration
export const VIRAL_CONFIG = {
  // Detection keywords and patterns
  lubMentions: ['$lub', '$LUB', 'lub token', 'LUB token', '#lub', '#LUB'],
  challengeKeywords: ['challenge', 'game', 'lub match', 'valentine'],
  
  // Rate limiting (per user per hour)
  maxDetectionsPerHour: 10,
  maxRewardsPerDay: 50,
  
  // Reward multipliers
  baseViralReward: 25, // LUB
  whaleViralMultiplier: 2.0, // 2x for whales
  speedBonusMultiplier: 1.5, // 1.5x if detected within 1 hour
  
  // Quality scoring thresholds
  minCastLength: 10,
  maxCastLength: 280,
  minEngagement: 1, // likes/recasts
  
  // Anti-spam measures
  cooldownPeriod: 300000, // 5 minutes between detections
  maxSameUserDetections: 3, // per day
} as const;

// Viral detection result
export interface ViralDetection {
  id: string;
  challengeId: string;
  targetUser: FarcasterUser;
  detectedAt: Date;
  castContent: string;
  detectionType: 'lub_mention' | 'challenge_reference' | 'organic_share';
  confidence: number; // 0-100
  reward: number;
  bonuses: {
    whale: number;
    speed: number;
    engagement: number;
  };
  verified: boolean;
}

// Detection statistics
export interface DetectionStats {
  totalDetections: number;
  verifiedDetections: number;
  totalRewards: number;
  averageConfidence: number;
  topDetectors: Array<{
    user: FarcasterUser;
    detections: number;
    rewards: number;
  }>;
}

/**
 * Viral Detection Service
 * CLEAN: Separated concerns for detection, validation, and rewards
 */
class ViralDetectionService {
  private detections: Map<string, ViralDetection> = new Map();
  private userDetectionCounts: Map<number, { count: number; lastDetection: Date }> = new Map();
  private rewardHistory: Array<{ userId: number; amount: number; timestamp: Date }> = [];

  /**
   * Monitor for viral mentions of challenges or $LUB
   * PERFORMANT: Efficient pattern matching with rate limiting
   */
  async detectViralMention(
    challengeId: string,
    targetUser: FarcasterUser,
    castContent: string,
    engagement?: { likes: number; recasts: number; replies: number }
  ): Promise<ViralDetection | null> {
    try {
      // NEW: Enhanced anti-spam validation (ENHANCEMENT FIRST)
      const contentQuality = antiSpamService.validateContentQuality(castContent, targetUser.fid);
      if (contentQuality.isSpam) {
        console.log(`Content blocked by anti-spam: ${contentQuality.reasons.join(', ')}`);
        return null;
      }

      // Rate limiting check
      if (!this.checkRateLimit(targetUser.fid)) {
        console.log(`Rate limit exceeded for user ${targetUser.fid}`);
        return null;
      }

      // REMOVED: Legacy quality validation - now handled by anti-spam service (AGGRESSIVE CONSOLIDATION)

      // Detect viral patterns
      const detectionResult = this.analyzeViralPatterns(castContent);
      if (!detectionResult.detected) {
        return null;
      }

      // Calculate rewards
      const rewardCalculation = this.calculateViralReward(
        targetUser,
        detectionResult.type,
        detectionResult.confidence,
        engagement
      );

      // Create detection record
      const detection: ViralDetection = {
        id: `viral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        challengeId,
        targetUser,
        detectedAt: new Date(),
        castContent,
        detectionType: detectionResult.type,
        confidence: detectionResult.confidence,
        reward: rewardCalculation.totalReward,
        bonuses: rewardCalculation.bonuses,
        verified: false // Will be verified by community or automated checks
      };

      // Store detection
      this.detections.set(detection.id, detection);
      this.updateUserDetectionCount(targetUser.fid);
      this.recordReward(targetUser.fid, rewardCalculation.totalReward);

      // Record activity for anti-spam tracking
      antiSpamService.recordActivity(targetUser.fid, 'viral', {
        detectionId: detection.id,
        challengeId,
        type: detectionResult.type,
        confidence: detectionResult.confidence,
        reward: rewardCalculation.totalReward
      });

      console.log(`Viral detection created: ${detection.id} for ${targetUser.username}`);
      return detection;

    } catch (error) {
      console.error('Viral detection failed:', error);
      return null;
    }
  }

  /**
   * Verify viral detection through multiple validation methods
   * MODULAR: Pluggable verification strategies
   */
  async verifyDetection(detectionId: string): Promise<boolean> {
    const detection = this.detections.get(detectionId);
    if (!detection) return false;

    try {
      // Automated verification checks
      const automatedScore = this.runAutomatedVerification(detection);
      
      // Community verification (placeholder for future implementation)
      const communityScore = await this.getCommunityVerificationScore(detection);
      
      // Combined verification score
      const totalScore = (automatedScore * 0.7) + (communityScore * 0.3);
      const verified = totalScore >= 70; // 70% threshold

      // Update detection
      detection.verified = verified;
      this.detections.set(detectionId, detection);

      if (verified) {
        console.log(`Detection verified: ${detectionId}`);
        // Trigger reward distribution
        await this.distributeVerifiedReward(detection);
      }

      return verified;

    } catch (error) {
      console.error('Detection verification failed:', error);
      return false;
    }
  }

  /**
   * Get detection statistics
   * PERFORMANT: Cached statistics with efficient aggregation
   */
  getDetectionStats(): DetectionStats {
    const detections = Array.from(this.detections.values());
    const verified = detections.filter(d => d.verified);
    
    const totalRewards = verified.reduce((sum, d) => sum + d.reward, 0);
    const avgConfidence = detections.length > 0 
      ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
      : 0;

    // Calculate top detectors
    const userStats = new Map<number, { user: FarcasterUser; detections: number; rewards: number }>();
    
    verified.forEach(detection => {
      const existing = userStats.get(detection.targetUser.fid) || {
        user: detection.targetUser,
        detections: 0,
        rewards: 0
      };
      
      existing.detections++;
      existing.rewards += detection.reward;
      userStats.set(detection.targetUser.fid, existing);
    });

    const topDetectors = Array.from(userStats.values())
      .sort((a, b) => b.rewards - a.rewards)
      .slice(0, 10);

    return {
      totalDetections: detections.length,
      verifiedDetections: verified.length,
      totalRewards,
      averageConfidence: Math.round(avgConfidence),
      topDetectors
    };
  }

  /**
   * Clean up old detections and reset rate limits
   * PREVENT BLOAT: Systematic cleanup of expired data
   */
  cleanup(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Clean up old detections (keep last 1000)
    const detectionArray = Array.from(this.detections.entries());
    if (detectionArray.length > 1000) {
      const toKeep = detectionArray
        .sort(([, a], [, b]) => b.detectedAt.getTime() - a.detectedAt.getTime())
        .slice(0, 1000);
      
      this.detections.clear();
      toKeep.forEach(([id, detection]) => this.detections.set(id, detection));
    }

    // Reset daily rate limits
    for (const [userId, data] of this.userDetectionCounts.entries()) {
      if (data.lastDetection < oneDayAgo) {
        this.userDetectionCounts.delete(userId);
      }
    }

    // Clean up old reward history
    this.rewardHistory = this.rewardHistory.filter(r => r.timestamp > oneDayAgo);
  }

  // Private helper methods

  private checkRateLimit(userId: number): boolean {
    const now = new Date();
    const userData = this.userDetectionCounts.get(userId);
    
    if (!userData) return true;
    
    // Check cooldown period
    const timeSinceLastDetection = now.getTime() - userData.lastDetection.getTime();
    if (timeSinceLastDetection < VIRAL_CONFIG.cooldownPeriod) {
      return false;
    }
    
    // Check daily limit
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (userData.lastDetection > oneDayAgo && userData.count >= VIRAL_CONFIG.maxSameUserDetections) {
      return false;
    }
    
    return true;
  }

  // REMOVED: validateCastQuality method - now handled by antiSpamService.validateContentQuality (AGGRESSIVE CONSOLIDATION)

  private analyzeViralPatterns(content: string): {
    detected: boolean;
    type: 'lub_mention' | 'challenge_reference' | 'organic_share';
    confidence: number;
  } {
    const lowerContent = content.toLowerCase();
    let confidence = 0;
    let type: 'lub_mention' | 'challenge_reference' | 'organic_share' = 'organic_share';
    
    // Check for LUB mentions
    const lubMentions = VIRAL_CONFIG.lubMentions.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
    
    if (lubMentions.length > 0) {
      confidence += 40;
      type = 'lub_mention';
    }
    
    // Check for challenge keywords
    const challengeKeywords = VIRAL_CONFIG.challengeKeywords.filter(keyword =>
      lowerContent.includes(keyword.toLowerCase())
    );
    
    if (challengeKeywords.length > 0) {
      confidence += 30;
      if (type === 'organic_share') type = 'challenge_reference';
    }
    
    // Positive sentiment indicators
    const positiveWords = ['love', 'fun', 'amazing', 'cool', 'awesome', 'great'];
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    confidence += positiveCount * 5;
    
    // Emoji indicators
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    confidence += Math.min(emojiCount * 3, 15);
    
    return {
      detected: confidence >= 30, // 30% confidence threshold
      type,
      confidence: Math.min(confidence, 100)
    };
  }

  private calculateViralReward(
    user: FarcasterUser,
    type: 'lub_mention' | 'challenge_reference' | 'organic_share',
    confidence: number,
    engagement?: { likes: number; recasts: number; replies: number }
  ): {
    totalReward: number;
    bonuses: { whale: number; speed: number; engagement: number };
  } {
    let baseReward = VIRAL_CONFIG.baseViralReward;
    
    // Type-based multipliers
    const typeMultipliers = {
      lub_mention: 2.0,
      challenge_reference: 1.5,
      organic_share: 1.0
    };
    
    baseReward *= typeMultipliers[type];
    
    // Confidence multiplier
    baseReward *= (confidence / 100);
    
    // Calculate bonuses
    const bonuses = {
      whale: 0,
      speed: 0,
      engagement: 0
    };
    
    // Whale bonus
    if (user.followerCount >= 10000) {
      bonuses.whale = Math.floor(baseReward * (VIRAL_CONFIG.whaleViralMultiplier - 1));
    }
    
    // Engagement bonus
    if (engagement) {
      const totalEngagement = engagement.likes + engagement.recasts + engagement.replies;
      bonuses.engagement = Math.floor(totalEngagement * 2); // 2 LUB per engagement
    }
    
    const totalReward = Math.floor(baseReward + bonuses.whale + bonuses.speed + bonuses.engagement);
    
    return { totalReward, bonuses };
  }

  private runAutomatedVerification(detection: ViralDetection): number {
    let score = 0;
    
    // Confidence score (40% weight)
    score += detection.confidence * 0.4;
    
    // User credibility (30% weight)
    const followerScore = Math.min(detection.targetUser.followerCount / 1000, 30);
    score += followerScore;
    
    // Content quality (30% weight)
    const contentLength = detection.castContent.length;
    const lengthScore = contentLength >= 50 && contentLength <= 200 ? 30 : 15;
    score += lengthScore;
    
    return Math.min(score, 100);
  }

  private async getCommunityVerificationScore(detection: ViralDetection): Promise<number> {
    // Placeholder for community verification
    // In production, this would integrate with community voting or reputation systems
    return 50; // Neutral score
  }

  private async distributeVerifiedReward(detection: ViralDetection): Promise<void> {
    try {
      // In production, this would trigger actual token distribution
      console.log(`Distributing ${detection.reward} LUB to ${detection.targetUser.username}`);
      
      // Record in social interaction service
      await socialInteractionService.recordViralDetection(
        detection.targetUser.fid,
        detection.reward,
        detection.detectionType
      );
      
    } catch (error) {
      console.error('Reward distribution failed:', error);
    }
  }

  private updateUserDetectionCount(userId: number): void {
    const existing = this.userDetectionCounts.get(userId) || { count: 0, lastDetection: new Date(0) };
    existing.count++;
    existing.lastDetection = new Date();
    this.userDetectionCounts.set(userId, existing);
  }

  private recordReward(userId: number, amount: number): void {
    this.rewardHistory.push({
      userId,
      amount,
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const viralDetectionService = new ViralDetectionService();

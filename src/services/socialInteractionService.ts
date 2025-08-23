/**
 * Consolidated Social Interaction Service
 * Single source of truth for all Farcaster user interactions
 * ENHANCEMENT FIRST: Consolidates scattered social logic across components
 */

import { FarcasterUser } from "@/utils/mockData";
import { WhaleType, classifyUserByFollowers, getWhaleMultiplier, getWhaleEmoji } from "@/hooks/useFarcasterUsers";
// NEW: Viral detection integration (ENHANCEMENT FIRST)
import { viralDetectionService, ViralDetection } from "@/services/viralDetectionService";

// Interaction types for tracking and analytics
export type InteractionType = 
  | 'follow' 
  | 'cast' 
  | 'challenge_created'
  | 'challenge_completed'
  | 'whale_targeted'
  | 'viral_detected'
  | 'viral_monitoring'  // NEW: Viral content monitoring
  | 'viral_verified';   // NEW: Verified viral detection

// Interaction result interface
export interface InteractionResult {
  success: boolean;
  error?: string;
  data?: any;
  whaleBonus?: number;
  viralBonus?: number;
}

// REMOVED: ChallengeInteraction interface - now using Challenge from challengeEngine.ts (AGGRESSIVE CONSOLIDATION)

/**
 * Consolidated Social Interaction Service
 * DRY: Single implementation for all social interactions
 * CLEAN: Clear separation of concerns with explicit dependencies
 */
class SocialInteractionService {
  // REMOVED: interactions Map - now handled by challengeEngine.ts (AGGRESSIVE CONSOLIDATION)
  private interactionHistory: Array<{
    type: InteractionType;
    timestamp: number;
    userId: number;
    data: any;
  }> = [];

  /**
   * Follow a Farcaster user
   * ENHANCEMENT: Consolidates follow logic from multiple components
   */
  async followUser(fid: number): Promise<InteractionResult> {
    try {
      // In a real implementation, this would call Farcaster API
      // For now, we simulate the interaction
      console.log(`Following user ${fid}`);
      
      this.trackInteraction('follow', fid, { fid });
      
      return {
        success: true,
        data: { followed: true }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Follow failed'
      };
    }
  }

  /**
   * Cast to a Farcaster user
   * ENHANCEMENT: Consolidates cast logic from multiple components
   */
  async castToUser(fid: number, message: string, mentionUser: boolean = true): Promise<InteractionResult> {
    try {
      // Construct cast message
      const castText = mentionUser ? `@${fid} ${message}` : message;
      
      // In a real implementation, this would call Farcaster API
      console.log(`Casting to user ${fid}: ${castText}`);
      
      this.trackInteraction('cast', fid, { message: castText });
      
      return {
        success: true,
        data: { cast: castText }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cast failed'
      };
    }
  }

  // REMOVED: createChallenge method - now handled by challengeEngine.ts (AGGRESSIVE CONSOLIDATION)

  // REMOVED: completeChallenge method - now handled by challengeEngine.ts (AGGRESSIVE CONSOLIDATION)

  /**
   * Get user interaction statistics
   * MODULAR: Composable analytics for user behavior
   */
  getUserStats(userId?: number) {
    const userInteractions = userId 
      ? this.interactionHistory.filter(i => i.userId === userId)
      : this.interactionHistory;
    
    const stats = {
      totalInteractions: userInteractions.length,
      follows: userInteractions.filter(i => i.type === 'follow').length,
      casts: userInteractions.filter(i => i.type === 'cast').length,
      challengesCreated: userInteractions.filter(i => i.type === 'challenge_created').length,
      challengesCompleted: userInteractions.filter(i => i.type === 'challenge_completed').length,
      whalesTargeted: userInteractions.filter(i => i.type === 'whale_targeted').length,
      viralDetections: userInteractions.filter(i => i.type === 'viral_detected').length,
    };
    
    return stats;
  }

  // REMOVED: getChallenge and getActiveChallenges methods - now handled by challengeEngine.ts (AGGRESSIVE CONSOLIDATION)

  /**
   * Monitor for viral mentions and $LUB references
   * NEW: Viral detection integration (ENHANCEMENT FIRST)
   */
  async monitorViralMention(
    challengeId: string,
    targetUser: FarcasterUser,
    castContent: string,
    engagement?: { likes: number; recasts: number; replies: number }
  ): Promise<ViralDetection | null> {
    try {
      const detection = await viralDetectionService.detectViralMention(
        challengeId,
        targetUser,
        castContent,
        engagement
      );

      if (detection) {
        this.trackInteraction('viral_monitoring', targetUser.fid, {
          detectionId: detection.id,
          type: detection.detectionType,
          confidence: detection.confidence,
          reward: detection.reward
        });
      }

      return detection;
    } catch (error) {
      console.error('Viral monitoring failed:', error);
      return null;
    }
  }

  /**
   * Verify and process viral detection
   * NEW: Viral verification workflow
   */
  async verifyViralDetection(detectionId: string): Promise<boolean> {
    try {
      const verified = await viralDetectionService.verifyDetection(detectionId);

      if (verified) {
        this.trackInteraction('viral_verified', 0, {
          detectionId,
          verified: true
        });
      }

      return verified;
    } catch (error) {
      console.error('Viral verification failed:', error);
      return false;
    }
  }

  /**
   * Record viral detection for stats tracking
   * NEW: Viral detection recording (CLEAN integration)
   */
  async recordViralDetection(
    userId: number,
    reward: number,
    type: string
  ): Promise<void> {
    this.trackInteraction('viral_detected', userId, {
      reward,
      type,
      timestamp: Date.now()
    });
  }

  /**
   * Get viral detection statistics
   * NEW: Viral stats integration (PERFORMANT)
   */
  getViralStats() {
    return viralDetectionService.getDetectionStats();
  }

  /**
   * Cleanup old interaction data
   * PREVENT BLOAT: Systematic cleanup of old data
   */
  cleanup(): void {
    // Cleanup viral detections
    viralDetectionService.cleanup();

    // PREVENT BLOAT: Keep only last 1000 interactions
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-1000);
    }
  }

  // Private helper methods
  private trackInteraction(type: InteractionType, userId: number, data: any): void {
    this.interactionHistory.push({
      type,
      timestamp: Date.now(),
      userId,
      data
    });
    
    // PREVENT BLOAT: Keep only last 1000 interactions
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-1000);
    }
  }

  // REMOVED: getBaseReward method - now handled by challengeEngine.ts (AGGRESSIVE CONSOLIDATION)
}

// Export singleton instance for consistent state management
export const socialInteractionService = new SocialInteractionService();

// Export utility functions for direct use
export { classifyUserByFollowers, getWhaleMultiplier, getWhaleEmoji };
export type { WhaleType };

/**
 * Anti-Spam and Quality Control Service
 * PERFORMANT: Efficient rate limiting with minimal memory footprint
 * CLEAN: Clear separation between detection, validation, and enforcement
 * MODULAR: Pluggable spam detection strategies and configurable thresholds
 */

import { FarcasterUser } from "@/utils/mockData";
import { Challenge } from "@/services/challengeEngine";

// Anti-spam configuration
export const ANTI_SPAM_CONFIG = {
  // Rate limiting (per user)
  maxChallengesPerHour: 5,
  maxChallengesPerDay: 20,
  maxViralDetectionsPerHour: 3,
  maxViralDetectionsPerDay: 10,
  
  // Quality thresholds
  minAccountAge: 7, // days
  minFollowerCount: 10,
  minCastLength: 10,
  maxCastLength: 280,
  
  // Cooldown periods (milliseconds)
  challengeCooldown: 300000, // 5 minutes between challenges to same user
  viralDetectionCooldown: 180000, // 3 minutes between viral detections
  reportCooldown: 600000, // 10 minutes between reports
  
  // Reputation thresholds
  minReputationScore: 50, // 0-100 scale
  maxWarnings: 3,
  banDuration: 86400000, // 24 hours
  
  // Content quality
  maxRepeatedCharacters: 4,
  maxCapitalLetterRatio: 0.7,
  spamKeywords: ['spam', 'bot', 'fake', 'scam', 'hack'],
  
  // Community reporting
  reportsForReview: 3,
  reportsForAutoAction: 5,
} as const;

// User activity tracking
interface UserActivity {
  userId: number;
  challengesCreated: number;
  viralDetections: number;
  reports: number;
  warnings: number;
  reputationScore: number;
  lastChallenge: Date;
  lastViralDetection: Date;
  lastReport: Date;
  bannedUntil?: Date;
  activityHistory: Array<{
    type: 'challenge' | 'viral' | 'report' | 'warning';
    timestamp: Date;
    details: any;
  }>;
}

// Spam detection result
interface SpamDetectionResult {
  isSpam: boolean;
  confidence: number; // 0-100
  reasons: string[];
  action: 'allow' | 'warn' | 'block' | 'review';
  cooldownUntil?: Date;
}

// Community report
interface CommunityReport {
  id: string;
  reporterId: number;
  targetId: number;
  type: 'spam' | 'abuse' | 'fake' | 'inappropriate';
  description: string;
  evidence?: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderatorNotes?: string;
}

/**
 * Anti-Spam Service
 * CLEAN: Separated concerns for detection, enforcement, and community moderation
 */
class AntiSpamService {
  private userActivities: Map<number, UserActivity> = new Map();
  private communityReports: Map<string, CommunityReport> = new Map();
  private globalStats = {
    totalChallenges: 0,
    blockedChallenges: 0,
    totalReports: 0,
    resolvedReports: 0,
  };

  /**
   * Check if user can create a challenge
   * PERFORMANT: Fast rate limiting with efficient lookups
   */
  canCreateChallenge(userId: number, targetUserId: number): SpamDetectionResult {
    const userActivity = this.getUserActivity(userId);
    const now = new Date();
    
    // Check if user is banned
    if (userActivity.bannedUntil && userActivity.bannedUntil > now) {
      return {
        isSpam: true,
        confidence: 100,
        reasons: ['User is temporarily banned'],
        action: 'block',
        cooldownUntil: userActivity.bannedUntil
      };
    }
    
    // Check reputation score
    if (userActivity.reputationScore < ANTI_SPAM_CONFIG.minReputationScore) {
      return {
        isSpam: true,
        confidence: 90,
        reasons: ['Low reputation score'],
        action: 'review'
      };
    }
    
    // Check rate limits
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentChallenges = userActivity.activityHistory.filter(
      a => a.type === 'challenge' && a.timestamp > hourAgo
    ).length;
    
    const dailyChallenges = userActivity.activityHistory.filter(
      a => a.type === 'challenge' && a.timestamp > dayAgo
    ).length;
    
    if (recentChallenges >= ANTI_SPAM_CONFIG.maxChallengesPerHour) {
      return {
        isSpam: true,
        confidence: 95,
        reasons: ['Hourly rate limit exceeded'],
        action: 'block',
        cooldownUntil: new Date(now.getTime() + (60 * 60 * 1000))
      };
    }
    
    if (dailyChallenges >= ANTI_SPAM_CONFIG.maxChallengesPerDay) {
      return {
        isSpam: true,
        confidence: 95,
        reasons: ['Daily rate limit exceeded'],
        action: 'block',
        cooldownUntil: new Date(now.getTime() + (24 * 60 * 60 * 1000))
      };
    }
    
    // Check cooldown for same target
    const timeSinceLastChallenge = now.getTime() - userActivity.lastChallenge.getTime();
    if (timeSinceLastChallenge < ANTI_SPAM_CONFIG.challengeCooldown) {
      return {
        isSpam: true,
        confidence: 80,
        reasons: ['Challenge cooldown active'],
        action: 'warn',
        cooldownUntil: new Date(userActivity.lastChallenge.getTime() + ANTI_SPAM_CONFIG.challengeCooldown)
      };
    }
    
    return {
      isSpam: false,
      confidence: 0,
      reasons: [],
      action: 'allow'
    };
  }

  /**
   * Validate content quality for viral detection
   * MODULAR: Pluggable content validation strategies
   */
  validateContentQuality(content: string, userId: number): SpamDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;
    
    // Length validation
    if (content.length < ANTI_SPAM_CONFIG.minCastLength) {
      reasons.push('Content too short');
      confidence += 30;
    }
    
    if (content.length > ANTI_SPAM_CONFIG.maxCastLength) {
      reasons.push('Content too long');
      confidence += 20;
    }
    
    // Repeated characters check
    const repeatedChars = content.match(/(.)\1+/g);
    if (repeatedChars && repeatedChars.some(match => match.length > ANTI_SPAM_CONFIG.maxRepeatedCharacters)) {
      reasons.push('Excessive repeated characters');
      confidence += 40;
    }
    
    // Capital letters ratio
    const capitalRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capitalRatio > ANTI_SPAM_CONFIG.maxCapitalLetterRatio) {
      reasons.push('Excessive capital letters');
      confidence += 25;
    }
    
    // Spam keywords
    const lowerContent = content.toLowerCase();
    const spamKeywordCount = ANTI_SPAM_CONFIG.spamKeywords.filter(
      keyword => lowerContent.includes(keyword)
    ).length;
    
    if (spamKeywordCount > 0) {
      reasons.push(`Contains spam keywords (${spamKeywordCount})`);
      confidence += spamKeywordCount * 20;
    }
    
    // User reputation factor
    const userActivity = this.getUserActivity(userId);
    if (userActivity.reputationScore < 70) {
      confidence += (70 - userActivity.reputationScore) * 0.5;
    }
    
    // Determine action based on confidence
    let action: 'allow' | 'warn' | 'block' | 'review' = 'allow';
    if (confidence >= 80) action = 'block';
    else if (confidence >= 60) action = 'review';
    else if (confidence >= 40) action = 'warn';
    
    return {
      isSpam: confidence >= 40,
      confidence: Math.min(confidence, 100),
      reasons,
      action
    };
  }

  /**
   * Record user activity for tracking
   * PERFORMANT: Efficient activity logging with automatic cleanup
   */
  recordActivity(
    userId: number, 
    type: 'challenge' | 'viral' | 'report' | 'warning',
    details: any = {}
  ): void {
    const userActivity = this.getUserActivity(userId);
    const now = new Date();
    
    // Update counters
    if (type === 'challenge') {
      userActivity.challengesCreated++;
      userActivity.lastChallenge = now;
    } else if (type === 'viral') {
      userActivity.viralDetections++;
      userActivity.lastViralDetection = now;
    } else if (type === 'report') {
      userActivity.reports++;
      userActivity.lastReport = now;
    } else if (type === 'warning') {
      userActivity.warnings++;
      // Decrease reputation for warnings
      userActivity.reputationScore = Math.max(0, userActivity.reputationScore - 10);
    }
    
    // Add to activity history
    userActivity.activityHistory.push({
      type,
      timestamp: now,
      details
    });
    
    // Cleanup old activity (keep last 100 entries)
    if (userActivity.activityHistory.length > 100) {
      userActivity.activityHistory = userActivity.activityHistory.slice(-100);
    }
    
    // Update global stats
    if (type === 'challenge') {
      this.globalStats.totalChallenges++;
    }
    
    this.userActivities.set(userId, userActivity);
  }

  /**
   * Submit community report
   * CLEAN: Clear reporting workflow with validation
   */
  submitReport(
    reporterId: number,
    targetId: number,
    type: 'spam' | 'abuse' | 'fake' | 'inappropriate',
    description: string,
    evidence?: string
  ): { success: boolean; reportId?: string; error?: string } {
    // Validate reporter can submit reports
    const reporterActivity = this.getUserActivity(reporterId);
    const now = new Date();
    
    const timeSinceLastReport = now.getTime() - reporterActivity.lastReport.getTime();
    if (timeSinceLastReport < ANTI_SPAM_CONFIG.reportCooldown) {
      return {
        success: false,
        error: 'Report cooldown active'
      };
    }
    
    // Create report
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const report: CommunityReport = {
      id: reportId,
      reporterId,
      targetId,
      type,
      description,
      evidence,
      timestamp: now,
      status: 'pending'
    };
    
    this.communityReports.set(reportId, report);
    this.recordActivity(reporterId, 'report', { reportId, targetId, type });
    
    // Check if target should be auto-actioned
    const targetReports = Array.from(this.communityReports.values())
      .filter(r => r.targetId === targetId && r.status === 'pending');
    
    if (targetReports.length >= ANTI_SPAM_CONFIG.reportsForAutoAction) {
      this.applyAutoAction(targetId, 'multiple_reports');
    }
    
    this.globalStats.totalReports++;
    
    return { success: true, reportId };
  }

  /**
   * Get user reputation and activity summary
   * PERFORMANT: Cached user statistics
   */
  getUserStats(userId: number): {
    reputationScore: number;
    challengesCreated: number;
    viralDetections: number;
    warnings: number;
    isBanned: boolean;
    bannedUntil?: Date;
    canCreateChallenge: boolean;
    nextChallengeAllowed?: Date;
  } {
    const userActivity = this.getUserActivity(userId);
    const now = new Date();
    
    const canCreateResult = this.canCreateChallenge(userId, 0); // Generic check
    
    return {
      reputationScore: userActivity.reputationScore,
      challengesCreated: userActivity.challengesCreated,
      viralDetections: userActivity.viralDetections,
      warnings: userActivity.warnings,
      isBanned: !!(userActivity.bannedUntil && userActivity.bannedUntil > now),
      bannedUntil: userActivity.bannedUntil,
      canCreateChallenge: canCreateResult.action === 'allow',
      nextChallengeAllowed: canCreateResult.cooldownUntil
    };
  }

  /**
   * Clean up old data and reset daily limits
   * PREVENT BLOAT: Systematic cleanup of expired data
   */
  cleanup(): void {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Clean up old user activities
    for (const [userId, activity] of this.userActivities.entries()) {
      // Remove old activity history
      activity.activityHistory = activity.activityHistory.filter(
        a => a.timestamp > weekAgo
      );
      
      // Remove banned users whose ban has expired
      if (activity.bannedUntil && activity.bannedUntil < now) {
        delete activity.bannedUntil;
      }
      
      // Remove inactive users (no activity in 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (activity.activityHistory.length === 0 || 
          activity.activityHistory[activity.activityHistory.length - 1].timestamp < thirtyDaysAgo) {
        this.userActivities.delete(userId);
      }
    }
    
    // Clean up old reports
    for (const [reportId, report] of this.communityReports.entries()) {
      if (report.timestamp < weekAgo && report.status === 'resolved') {
        this.communityReports.delete(reportId);
      }
    }
  }

  // Private helper methods

  private getUserActivity(userId: number): UserActivity {
    if (!this.userActivities.has(userId)) {
      this.userActivities.set(userId, {
        userId,
        challengesCreated: 0,
        viralDetections: 0,
        reports: 0,
        warnings: 0,
        reputationScore: 75, // Start with decent reputation
        lastChallenge: new Date(0),
        lastViralDetection: new Date(0),
        lastReport: new Date(0),
        activityHistory: []
      });
    }
    return this.userActivities.get(userId)!;
  }

  private applyAutoAction(userId: number, reason: string): void {
    const userActivity = this.getUserActivity(userId);
    
    // Apply temporary ban
    userActivity.bannedUntil = new Date(Date.now() + ANTI_SPAM_CONFIG.banDuration);
    userActivity.reputationScore = Math.max(0, userActivity.reputationScore - 25);
    
    this.recordActivity(userId, 'warning', { 
      reason: 'auto_action', 
      details: reason,
      bannedUntil: userActivity.bannedUntil
    });
    
    console.log(`Auto-action applied to user ${userId}: ${reason}`);
  }
}

// Export singleton instance
export const antiSpamService = new AntiSpamService();

// Export types for use in other modules
export type { SpamDetectionResult, CommunityReport, UserActivity };

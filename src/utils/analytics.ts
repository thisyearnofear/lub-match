"use client";

import { WEB3_CONFIG } from "@/config";

// Analytics Event Types
export interface AnalyticsEvent {
  type: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  metadata?: {
    userAgent?: string;
    referrer?: string;
    platform?: string;
    walletConnected?: boolean;
    chainId?: number;
  };
}

// Metrics Categories
export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  conversionRate: number; // Web2 to Web3
}

export interface GameMetrics {
  totalGamesCreated: number;
  totalGamesCompleted: number;
  averageCompletionTime: number;
  popularGameTypes: Record<string, number>;
  shareRate: number;
}

export interface TokenMetrics {
  totalLubEarned: bigint;
  totalLubSpent: bigint;
  circulatingSupply: bigint;
  activeHolders: number;
  averageBalance: bigint;
  topHolders: Array<{ address: string; balance: bigint }>;
}

export interface NFTMetrics {
  totalMinted: number;
  mintingRevenue: bigint;
  uniqueHolders: number;
  averageMintPrice: bigint;
  popularGameTypes: Record<string, number>;
}

export interface ViralMetrics {
  totalShares: number;
  shareConversionRate: number;
  referralChain: Record<string, number>;
  viralCoefficient: number;
  organicGrowthRate: number;
}

// Analytics Manager Class
class AnalyticsManager {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAnalytics() {
    if (typeof window === "undefined") return;
    
    // Load existing events from localStorage
    try {
      const stored = localStorage.getItem("lub_analytics_events");
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load analytics events:", error);
    }

    // Track page view
    this.track("page_view", {
      path: window.location.pathname,
      search: window.location.search,
    });

    this.isInitialized = true;
  }

  // Track an analytics event
  track(eventType: string, data: Record<string, any> = {}) {
    if (typeof window === "undefined") return;

    const event: AnalyticsEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      data,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        platform: this.detectPlatform(),
        walletConnected: !!window.ethereum,
      },
    };

    this.events.push(event);
    this.persistEvents();

    // Send to analytics service (if configured)
    this.sendToAnalyticsService(event);
  }

  private detectPlatform(): string {
    if (typeof window === "undefined") return "server";
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("mobile")) return "mobile";
    if (userAgent.includes("tablet")) return "tablet";
    return "desktop";
  }

  private persistEvents() {
    try {
      // Keep only last 1000 events to prevent storage bloat
      const recentEvents = this.events.slice(-1000);
      localStorage.setItem("lub_analytics_events", JSON.stringify(recentEvents));
      this.events = recentEvents;
    } catch (error) {
      console.warn("Failed to persist analytics events:", error);
    }
  }

  private async sendToAnalyticsService(event: AnalyticsEvent) {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Analytics Event:", event);
    }

    // Send to analytics API endpoint
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Fail silently to not disrupt user experience
      console.warn("Failed to send analytics event:", error);
    }
  }

  // Get analytics summary
  getAnalyticsSummary(): {
    userMetrics: Partial<UserMetrics>;
    gameMetrics: Partial<GameMetrics>;
    viralMetrics: Partial<ViralMetrics>;
  } {
    const events = this.events;
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate user metrics
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const recentEvents = events.filter(e => new Date(e.timestamp) > dayAgo);
    const activeSessions = new Set(recentEvents.map(e => e.sessionId)).size;

    // Calculate game metrics
    const gameCreatedEvents = events.filter(e => e.type === "lub_created");
    const gameCompletedEvents = events.filter(e => e.type === "game_complete");
    const shareEvents = events.filter(e => e.type === "game_shared");

    // Calculate viral metrics
    const shareConversionRate = shareEvents.length > 0 
      ? gameCreatedEvents.length / shareEvents.length 
      : 0;

    return {
      userMetrics: {
        totalUsers: uniqueSessions,
        activeUsers: activeSessions,
        conversionRate: this.calculateWeb3ConversionRate(),
      },
      gameMetrics: {
        totalGamesCreated: gameCreatedEvents.length,
        totalGamesCompleted: gameCompletedEvents.length,
        shareRate: gameCreatedEvents.length > 0 
          ? shareEvents.length / gameCreatedEvents.length 
          : 0,
      },
      viralMetrics: {
        totalShares: shareEvents.length,
        shareConversionRate,
        viralCoefficient: shareConversionRate,
      },
    };
  }

  private calculateWeb3ConversionRate(): number {
    const walletConnectEvents = this.events.filter(e => e.type === "wallet_connected");
    const uniqueSessions = new Set(this.events.map(e => e.sessionId)).size;
    return uniqueSessions > 0 ? walletConnectEvents.length / uniqueSessions : 0;
  }

  // Get events by type
  getEventsByType(eventType: string): AnalyticsEvent[] {
    return this.events.filter(e => e.type === eventType);
  }

  // Get events in time range
  getEventsInRange(startDate: Date, endDate: Date): AnalyticsEvent[] {
    return this.events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  // Clear old events (for privacy)
  clearOldEvents(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.events = this.events.filter(e => new Date(e.timestamp) > cutoffDate);
    this.persistEvents();
  }
}

// Global analytics instance
export const analytics = new AnalyticsManager();

// Convenience functions for common events
export const trackGameCreated = (gameType: string, mode: string) => {
  analytics.track("lub_created", { gameType, mode });
};

export const trackGameCompleted = (gameType: string, timeSpent: number) => {
  analytics.track("game_complete", { gameType, timeSpent });
};

export const trackGameShared = (platform: string, gameType: string) => {
  analytics.track("game_shared", { platform, gameType });
};

export const trackWalletConnected = (chainId: number, address: string) => {
  analytics.track("wallet_connected", { chainId, address });
};

export const trackNFTMinted = (tokenId: string, price: string, usedDiscount: boolean) => {
  analytics.track("nft_minted", { tokenId, price, usedDiscount });
};

export const trackLubEarned = (amount: string, reason: string) => {
  analytics.track("lub_earned", { amount, reason });
};

export const trackSocialGamePlayed = (gameType: string, score: number) => {
  analytics.track("social_game", { gameType, score });
};

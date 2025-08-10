/**
 * Tournament Manager Utility
 * Provides helper functions for tournament scheduling and management
 * Used by admin interfaces and automated tournament creation
 */

"use client";

// Tournament interface moved inline to avoid service dependencies
export interface Tournament {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  participants: string[];
  isActive: boolean;
  prizesDistributed: boolean;
}

export interface TournamentTemplate {
  name: string;
  duration: number; // in seconds
  entryFee: number; // in LUB
  maxParticipants: number;
  description: string;
  prizeStructure: string;
}

export interface TournamentSchedule {
  template: TournamentTemplate;
  startTime: Date;
  recurring?: {
    interval: 'daily' | 'weekly' | 'monthly';
    count?: number; // number of tournaments to create, undefined = infinite
  };
}

export class TournamentManager {
  
  // Predefined tournament templates
  static readonly TEMPLATES: Record<string, TournamentTemplate> = {
    daily: {
      name: "Daily Speed Challenge",
      duration: 24 * 60 * 60, // 24 hours
      entryFee: 25, // 25 LUB
      maxParticipants: 50,
      description: "Daily tournament for speed demons! Complete the game as fast as possible.",
      prizeStructure: "1st: 60%, 2nd: 25%, 3rd: 15%"
    },
    
    weekly: {
      name: "Weekly Championship",
      duration: 7 * 24 * 60 * 60, // 7 days
      entryFee: 100, // 100 LUB
      maxParticipants: 200,
      description: "Weekly championship with bigger prizes! Show your consistency over a week.",
      prizeStructure: "1st: 50%, 2nd: 30%, 3rd: 20%"
    },
    
    weekend: {
      name: "Weekend Warrior",
      duration: 2 * 24 * 60 * 60, // 48 hours
      entryFee: 50, // 50 LUB
      maxParticipants: 100,
      description: "Weekend tournament for casual players. Perfect for weekend gaming sessions.",
      prizeStructure: "1st: 50%, 2nd: 30%, 3rd-5th: 5% each"
    },
    
    blitz: {
      name: "Blitz Tournament",
      duration: 4 * 60 * 60, // 4 hours
      entryFee: 10, // 10 LUB
      maxParticipants: 30,
      description: "Quick 4-hour tournament for immediate competition!",
      prizeStructure: "1st: 70%, 2nd: 20%, 3rd: 10%"
    },
    
    monthly: {
      name: "Monthly Grand Championship",
      duration: 30 * 24 * 60 * 60, // 30 days
      entryFee: 500, // 500 LUB
      maxParticipants: 1000,
      description: "The ultimate monthly championship with massive prizes!",
      prizeStructure: "1st: 40%, 2nd: 25%, 3rd: 15%, 4th-10th: 2.86% each"
    },
    
    free: {
      name: "Free Play Tournament",
      duration: 3 * 24 * 60 * 60, // 3 days
      entryFee: 0, // Free entry
      maxParticipants: 500,
      description: "Free tournament for everyone! Great for newcomers to try competitive play.",
      prizeStructure: "Sponsored prizes from community pool"
    }
  };
  
  /**
   * Generate tournament name with date
   */
  static generateTournamentName(template: TournamentTemplate, startTime: Date): string {
    const dateStr = startTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: startTime.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    
    return `${template.name} - ${dateStr}`;
  }
  
  /**
   * Calculate optimal tournament schedule
   */
  static generateTournamentSchedule(
    templateKey: keyof typeof TournamentManager.TEMPLATES,
    startDate: Date = new Date(),
    options: {
      recurring?: boolean;
      count?: number;
      customStartTimes?: number[]; // hours of day to start (0-23)
    } = {}
  ): TournamentSchedule[] {
    const template = this.TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Unknown tournament template: ${templateKey}`);
    }
    
    const schedules: TournamentSchedule[] = [];
    const { recurring = false, count = 1, customStartTimes } = options;
    
    if (!recurring) {
      // Single tournament
      schedules.push({
        template: {
          ...template,
          name: this.generateTournamentName(template, startDate)
        },
        startTime: startDate
      });
    } else {
      // Recurring tournaments
      let currentDate = new Date(startDate);
      const tournamentCount = count || 10; // Default to 10 if infinite
      
      for (let i = 0; i < tournamentCount; i++) {
        // Adjust start time if custom times specified
        if (customStartTimes && customStartTimes.length > 0) {
          const startHour = customStartTimes[i % customStartTimes.length];
          currentDate.setHours(startHour, 0, 0, 0);
        }
        
        schedules.push({
          template: {
            ...template,
            name: this.generateTournamentName(template, currentDate)
          },
          startTime: new Date(currentDate),
          recurring: {
            interval: this.getRecurringInterval(templateKey),
            count: tournamentCount
          }
        });
        
        // Calculate next tournament date
        currentDate = this.getNextTournamentDate(currentDate, templateKey);
      }
    }
    
    return schedules;
  }
  
  /**
   * Get recurring interval for template
   */
  private static getRecurringInterval(templateKey: string): 'daily' | 'weekly' | 'monthly' {
    switch (templateKey) {
      case 'daily':
      case 'blitz':
        return 'daily';
      case 'weekly':
      case 'weekend':
        return 'weekly';
      case 'monthly':
        return 'monthly';
      default:
        return 'weekly';
    }
  }
  
  /**
   * Calculate next tournament date based on template
   */
  private static getNextTournamentDate(currentDate: Date, templateKey: string): Date {
    const nextDate = new Date(currentDate);
    
    switch (templateKey) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'blitz':
        nextDate.setHours(nextDate.getHours() + 6); // Every 6 hours
        break;
      case 'weekend':
        // Next weekend (Friday evening)
        const daysUntilFriday = (5 - nextDate.getDay() + 7) % 7;
        nextDate.setDate(nextDate.getDate() + (daysUntilFriday || 7));
        nextDate.setHours(18, 0, 0, 0); // 6 PM Friday
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(1); // First of the month
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 7);
    }
    
    return nextDate;
  }
  
  /**
   * Validate tournament parameters
   */
  static validateTournament(tournament: Partial<TournamentTemplate>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!tournament.name || tournament.name.trim().length === 0) {
      errors.push("Tournament name is required");
    }
    
    if (!tournament.duration || tournament.duration < 60 * 60) {
      errors.push("Tournament duration must be at least 1 hour");
    }
    
    if (tournament.duration && tournament.duration > 30 * 24 * 60 * 60) {
      errors.push("Tournament duration cannot exceed 30 days");
    }
    
    if (tournament.entryFee !== undefined && tournament.entryFee < 0) {
      errors.push("Entry fee cannot be negative");
    }
    
    if (!tournament.maxParticipants || tournament.maxParticipants < 2) {
      errors.push("Tournament must allow at least 2 participants");
    }
    
    if (tournament.maxParticipants && tournament.maxParticipants > 10000) {
      errors.push("Tournament cannot exceed 10,000 participants");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Calculate estimated prize pool
   */
  static calculatePrizePool(entryFee: number, participantCount: number): {
    totalPool: number;
    prizes: { rank: number; amount: number; percentage: number }[];
  } {
    const totalPool = entryFee * participantCount;
    const prizes: { rank: number; amount: number; percentage: number }[] = [];
    
    if (totalPool === 0) {
      return { totalPool: 0, prizes: [] };
    }
    
    const prizeCount = Math.min(participantCount, 10); // Top 10 get prizes
    
    if (prizeCount === 1) {
      prizes.push({ rank: 1, amount: totalPool, percentage: 100 });
    } else if (prizeCount === 2) {
      prizes.push({ rank: 1, amount: totalPool * 0.7, percentage: 70 });
      prizes.push({ rank: 2, amount: totalPool * 0.3, percentage: 30 });
    } else if (prizeCount >= 3) {
      prizes.push({ rank: 1, amount: totalPool * 0.5, percentage: 50 });
      prizes.push({ rank: 2, amount: totalPool * 0.3, percentage: 30 });
      prizes.push({ rank: 3, amount: totalPool * 0.2, percentage: 20 });
      
      // Distribute remaining to 4th-10th place
      if (prizeCount > 3) {
        const remaining = 0; // Already distributed 100%
        const perPlayer = remaining / (prizeCount - 3);
        for (let i = 4; i <= prizeCount; i++) {
          prizes.push({ 
            rank: i, 
            amount: perPlayer, 
            percentage: (perPlayer / totalPool) * 100 
          });
        }
      }
    }
    
    return { totalPool, prizes };
  }
  
  /**
   * Get tournament status
   */
  static getTournamentStatus(tournament: Tournament): {
    status: 'upcoming' | 'active' | 'ended';
    timeRemaining?: number; // seconds
    timeUntilStart?: number; // seconds
  } {
    const now = Math.floor(Date.now() / 1000);
    
    if (now < tournament.startTime) {
      return {
        status: 'upcoming',
        timeUntilStart: tournament.startTime - now
      };
    } else if (now <= tournament.endTime && tournament.isActive) {
      return {
        status: 'active',
        timeRemaining: tournament.endTime - now
      };
    } else {
      return {
        status: 'ended'
      };
    }
  }
  
  /**
   * Format time duration for display
   */
  static formatDuration(seconds: number): string {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

// Export commonly used tournament schedules
export const TOURNAMENT_SCHEDULES = {
  // Daily tournaments at 12 PM UTC
  daily: () => TournamentManager.generateTournamentSchedule('daily', new Date(), {
    recurring: true,
    count: 30,
    customStartTimes: [12] // 12 PM UTC
  }),
  
  // Weekly tournaments on Sundays at 6 PM UTC
  weekly: () => TournamentManager.generateTournamentSchedule('weekly', new Date(), {
    recurring: true,
    count: 12,
    customStartTimes: [18] // 6 PM UTC
  }),
  
  // Weekend tournaments on Fridays at 6 PM UTC
  weekend: () => TournamentManager.generateTournamentSchedule('weekend', new Date(), {
    recurring: true,
    count: 8,
    customStartTimes: [18] // 6 PM UTC
  }),
  
  // Monthly tournaments on the 1st at 12 PM UTC
  monthly: () => TournamentManager.generateTournamentSchedule('monthly', new Date(), {
    recurring: true,
    count: 6,
    customStartTimes: [12] // 12 PM UTC
  })
};

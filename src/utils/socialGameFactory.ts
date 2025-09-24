// Social game factory for creating different types of Farcaster-based games

import { SocialUser } from '@/types/socialGames';
import { PlatformAdapter } from '@/utils/platformAdapter';
import {
  GameFactory,
  UsernameGuessingGame,
  PfpMatchingGame,
  SocialTriviaGame
} from '@/types/socialGames';
import { shuffleArray } from './mockData';
// NEW: Whale classification integration (ENHANCEMENT FIRST)
import {
  classifyUserByFollowers,
  getWhaleMultiplier,
  WhaleType
} from '@/hooks/useFarcasterUsers';

// ENHANCED: Social Game Factory with whale classification (ENHANCEMENT FIRST)
export class SocialGameFactory {
  
  createUsernameGuessingGame(
    users: SocialUser[], 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): UsernameGuessingGame {
    const gameUsers = this.selectUsersByDifficulty(users, difficulty);
    const allUsernames = users.map(u => u.username);
    
    // Create multiple choice options for each user
    const options = gameUsers.map(user => {
      const correctAnswer = user.username;
      const wrongAnswers = shuffleArray(
        allUsernames.filter(u => u !== correctAnswer)
      ).slice(0, 3);
      
      return shuffleArray([correctAnswer, ...wrongAnswers]);
    }).flat();

    return {
      id: `username-guessing-${Date.now()}`,
      name: 'Farcaster Username Challenge',
      description: 'Can you match the profile pictures to their usernames?',
      difficulty,
      minUsers: 4,
      maxUsers: 16,
      estimatedDuration: gameUsers.length * (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20),
      users: gameUsers.map(user => PlatformAdapter.toLegacyFarcasterUser(user)),
      options: [...new Set(options)], // Remove duplicates
      correctAnswers: gameUsers.map(u => u.username)
    };
  }

  createPfpMatchingGame(
    users: SocialUser[], 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): PfpMatchingGame {
    const gameUsers = this.selectUsersByDifficulty(users, difficulty);
    
    return {
      id: `pfp-matching-${Date.now()}`,
      name: 'Profile Picture Memory Match',
      description: 'Match the profile pictures with their usernames!',
      difficulty,
      minUsers: 4,
      maxUsers: 16,
      estimatedDuration: gameUsers.length * (difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 18),
      users: gameUsers.map(user => PlatformAdapter.toLegacyFarcasterUser(user)),
      shuffledPfps: shuffleArray(gameUsers.map(u => u.pfpUrl)),
      shuffledUsernames: shuffleArray(gameUsers.map(u => u.username))
    };
  }

  createSocialTriviaGame(
    users: SocialUser[], 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): SocialTriviaGame {
    const gameUsers = this.selectUsersByDifficulty(users, difficulty);
    const questions = this.generateTriviaQuestions(gameUsers, difficulty);
    
    return {
      id: `social-trivia-${Date.now()}`,
      name: 'Farcaster Social Trivia',
      description: 'Test your knowledge of the Farcaster community!',
      difficulty,
      minUsers: 3,
      maxUsers: 20,
      estimatedDuration: questions.length * (difficulty === 'easy' ? 15 : difficulty === 'medium' ? 20 : 30),
      questions: questions.map(q => ({
        ...q,
        relatedUsers: q.relatedUsers?.map(user => PlatformAdapter.toLegacyFarcasterUser(user))
      }))
    };
  }

  // ENHANCED: Whale-aware user selection (ENHANCEMENT FIRST)
  private selectUsersByDifficulty(users: SocialUser[], difficulty: 'easy' | 'medium' | 'hard'): SocialUser[] {
    const counts = { easy: 4, medium: 8, hard: 12 };
    const count = Math.min(counts[difficulty], users.length);

    // NEW: Whale-based selection for enhanced challenge progression
    if (difficulty === 'hard') {
      return this.selectWhaleBalancedUsers(users, count);
    } else if (difficulty === 'medium') {
      return this.selectMixedWhaleUsers(users, count);
    } else {
      // Easy: Mostly nano and micro whales for approachable gameplay
      return this.selectEasyUsers(users, count);
    }
  }

  // NEW: Whale-balanced selection for hard difficulty (MODULAR)
  private selectWhaleBalancedUsers(users: SocialUser[], count: number): SocialUser[] {
    const whaleGroups = this.groupUsersByWhaleType(users);
    const selected: SocialUser[] = [];

    // Hard difficulty: Include whales for high-stakes gameplay
    // 25% whales/mega_whales, 25% mini whales, 50% micro/nano whales
    const whaleCount = Math.max(1, Math.floor(count * 0.25));
    const miniCount = Math.max(1, Math.floor(count * 0.25));
    const microCount = count - whaleCount - miniCount;

    // Add whales (highest reward potential)
    const whales = [...(whaleGroups.whale || []), ...(whaleGroups.mega_whale || [])];
    selected.push(...shuffleArray(whales).slice(0, whaleCount));

    // Add mini whales (medium-high reward)
    selected.push(...shuffleArray(whaleGroups.mini || []).slice(0, miniCount));

    // Fill remaining with micro and nano whales
    const smallWhales = [...(whaleGroups.micro || []), ...(whaleGroups.nano || [])];
    selected.push(...shuffleArray(smallWhales).slice(0, microCount));

    return shuffleArray(selected).slice(0, count);
  }

  // NEW: Mixed whale selection for medium difficulty (MODULAR)
  private selectMixedWhaleUsers(users: SocialUser[], count: number): SocialUser[] {
    const whaleGroups = this.groupUsersByWhaleType(users);
    const selected: SocialUser[] = [];

    // Medium difficulty: Balanced mix with some challenge
    // 10% whales, 30% mini whales, 60% micro/nano whales
    const whaleCount = Math.max(0, Math.floor(count * 0.1));
    const miniCount = Math.max(1, Math.floor(count * 0.3));
    const microCount = count - whaleCount - miniCount;

    if (whaleCount > 0) {
      const whales = [...(whaleGroups.whale || []), ...(whaleGroups.mega_whale || [])];
      selected.push(...shuffleArray(whales).slice(0, whaleCount));
    }

    selected.push(...shuffleArray(whaleGroups.mini || []).slice(0, miniCount));

    const smallWhales = [...(whaleGroups.micro || []), ...(whaleGroups.nano || [])];
    selected.push(...shuffleArray(smallWhales).slice(0, microCount));

    return shuffleArray(selected).slice(0, count);
  }

  // NEW: Easy user selection (MODULAR)
  private selectEasyUsers(users: SocialUser[], count: number): SocialUser[] {
    const whaleGroups = this.groupUsersByWhaleType(users);

    // Easy difficulty: Mostly approachable users
    // 80% nano/micro whales, 20% mini whales (no big whales for easy mode)
    const easyUsers = [...(whaleGroups.nano || []), ...(whaleGroups.micro || [])];
    const miniWhales = whaleGroups.mini || [];

    const miniCount = Math.min(Math.floor(count * 0.2), miniWhales.length);
    const easyCount = count - miniCount;

    const selected = [
      ...shuffleArray(easyUsers).slice(0, easyCount),
      ...shuffleArray(miniWhales).slice(0, miniCount)
    ];

    return shuffleArray(selected).slice(0, count);
  }

  // NEW: Group users by whale classification (PERFORMANT caching)
  private groupUsersByWhaleType(users: SocialUser[]): Record<WhaleType, SocialUser[]> {
    const groups: Record<WhaleType, SocialUser[]> = {
      nano: [],
      micro: [],
      mini: [],
      whale: [],
      mega_whale: [],
      orca: []
    };

    users.forEach(user => {
      const whaleType = classifyUserByFollowers(user.followerCount);
      groups[whaleType].push(user);
    });

    return groups;
  }

  private generateTriviaQuestions(users: SocialUser[], difficulty: 'easy' | 'medium' | 'hard') {
    const questions = [];
    
    // Follower count questions
    for (const user of users.slice(0, 3)) {
      const otherUsers = users.filter(u => u.username !== user.username);
      const options = shuffleArray([
        this.formatFollowerCount(user.followerCount),
         ...otherUsers.slice(0, 3).map(u => this.formatFollowerCount(u.followerCount))
      ]);
      
      questions.push({
        id: `followers-${user.username}`,
        question: `How many followers does @${user.username} have?`,
        options,
        correctAnswer: this.formatFollowerCount(user.followerCount),
        difficulty,
        category: 'followers' as const,
        relatedUsers: [user]
      });
    }

    // Bio questions (if available)
    const usersWithBios = users.filter(u => u.bio && u.bio.length > 10);
    for (const user of usersWithBios.slice(0, 2)) {
      const bioWords = user.bio!.split(' ');
      const keyPhrase = bioWords.slice(0, Math.min(4, bioWords.length)).join(' ');
      
      const otherBios = usersWithBios
        .filter(u => u.username !== user.username)
        .map(u => u.bio!.split(' ').slice(0, 4).join(' '))
        .slice(0, 3);
      
      const options = shuffleArray([keyPhrase, ...otherBios]);
      
      questions.push({
        id: `bio-${user.username}`,
        question: `Which bio snippet belongs to @${user.username}?`,
        options,
        correctAnswer: keyPhrase,
        difficulty,
        category: 'bio' as const,
        relatedUsers: [user]
      });
    }

    return questions;
  }

  private formatFollowerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  // NEW: Whale-aware reward calculation (ENHANCEMENT FIRST)
  calculateGameReward(
    users: SocialUser[],
    difficulty: 'easy' | 'medium' | 'hard',
    accuracy: number,
    timeSpent: number
  ): {
    baseReward: number;
    whaleBonus: number;
    difficultyMultiplier: number;
    accuracyBonus: number;
    speedBonus: number;
    totalReward: number;
    breakdown: string[];
  } {
    // Base rewards by difficulty
    const baseRewards = { easy: 10, medium: 25, hard: 50 };
    const baseReward = baseRewards[difficulty];

    // Calculate whale bonus based on users in game
    const whaleBonus = this.calculateWhaleBonus(users);

    // Difficulty multiplier
    const difficultyMultipliers = { easy: 1, medium: 1.5, hard: 2 };
    const difficultyMultiplier = difficultyMultipliers[difficulty];

    // Accuracy bonus (perfect accuracy = 50% bonus)
    const accuracyBonus = Math.floor(baseReward * (accuracy / 100) * 0.5);

    // Speed bonus (under 30 seconds per user = 25% bonus)
    const avgTimePerUser = timeSpent / users.length;
    const speedBonus = avgTimePerUser < 30 ? Math.floor(baseReward * 0.25) : 0;

    // Calculate total
    const subtotal = Math.floor(baseReward * difficultyMultiplier);
    const totalReward = subtotal + whaleBonus + accuracyBonus + speedBonus;

    // Create breakdown for display
    const breakdown = [
      `Base reward: ${baseReward} LUB`,
      `Difficulty (${difficulty}): ${Math.floor(baseReward * (difficultyMultiplier - 1))} LUB`,
      ...(whaleBonus > 0 ? [`Whale bonus: ${whaleBonus} LUB`] : []),
      ...(accuracyBonus > 0 ? [`Accuracy bonus: ${accuracyBonus} LUB`] : []),
      ...(speedBonus > 0 ? [`Speed bonus: ${speedBonus} LUB`] : [])
    ];

    return {
      baseReward,
      whaleBonus,
      difficultyMultiplier,
      accuracyBonus,
      speedBonus,
      totalReward,
      breakdown
    };
  }

  // NEW: Calculate whale bonus for game (COMPOSABLE)
  private calculateWhaleBonus(users: SocialUser[]): number {
    let bonus = 0;
    const whaleGroups = this.groupUsersByWhaleType(users);

    // Bonus points for each whale type in the game
    bonus += (whaleGroups.micro?.length || 0) * 2;      // 2 LUB per micro whale
    bonus += (whaleGroups.mini?.length || 0) * 5;       // 5 LUB per mini whale
    bonus += (whaleGroups.whale?.length || 0) * 15;     // 15 LUB per whale
    bonus += (whaleGroups.mega_whale?.length || 0) * 40; // 40 LUB per mega whale
    bonus += (whaleGroups.orca?.length || 0) * 100;     // 100 LUB per orca

    return bonus;
  }

  // NEW: Get whale statistics for game preview (PERFORMANT)
  getWhaleStats(users: SocialUser[]): {
    whaleCount: number;
    totalMultiplier: number;
    whaleBreakdown: Record<WhaleType, number>;
    potentialBonus: number;
  } {
    const whaleGroups = this.groupUsersByWhaleType(users);
    const whaleBreakdown: Record<WhaleType, number> = {
      nano: whaleGroups.nano?.length || 0,
      micro: whaleGroups.micro?.length || 0,
      mini: whaleGroups.mini?.length || 0,
      whale: whaleGroups.whale?.length || 0,
      mega_whale: whaleGroups.mega_whale?.length || 0,
      orca: whaleGroups.orca?.length || 0
    };

    const whaleCount = users.length - whaleBreakdown.nano;
    const totalMultiplier = users.reduce((sum, user) => {
      return sum + getWhaleMultiplier(classifyUserByFollowers(user.followerCount));
    }, 0) / users.length;

    const potentialBonus = this.calculateWhaleBonus(users);

    return {
      whaleCount,
      totalMultiplier,
      whaleBreakdown,
      potentialBonus
    };
  }
}

// ENHANCED: Singleton instance with whale capabilities
export const socialGameFactory = new SocialGameFactory();
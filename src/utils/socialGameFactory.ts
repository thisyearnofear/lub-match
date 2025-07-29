// Social game factory for creating different types of Farcaster-based games

import { 
  FarcasterUser, 
  GameFactory, 
  UsernameGuessingGame, 
  PfpMatchingGame, 
  SocialTriviaGame 
} from '@/types/socialGames';
import { shuffleArray } from './mockData';

export class SocialGameFactory implements GameFactory {
  
  createUsernameGuessingGame(
    users: FarcasterUser[], 
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
      users: gameUsers,
      options: [...new Set(options)], // Remove duplicates
      correctAnswers: gameUsers.map(u => u.username)
    };
  }

  createPfpMatchingGame(
    users: FarcasterUser[], 
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
      users: gameUsers,
      shuffledPfps: shuffleArray(gameUsers.map(u => u.pfp_url)),
      shuffledUsernames: shuffleArray(gameUsers.map(u => u.username))
    };
  }

  createSocialTriviaGame(
    users: FarcasterUser[], 
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
      questions
    };
  }

  private selectUsersByDifficulty(users: FarcasterUser[], difficulty: 'easy' | 'medium' | 'hard'): FarcasterUser[] {
    const counts = { easy: 4, medium: 8, hard: 12 };
    const count = Math.min(counts[difficulty], users.length);
    
    // For harder difficulties, include more diverse follower counts
    if (difficulty === 'hard') {
      // Mix of high and low follower users for more challenge
      const sorted = [...users].sort((a, b) => b.follower_count - a.follower_count);
      const highFollowers = sorted.slice(0, Math.floor(count / 2));
      const lowFollowers = sorted.slice(-Math.floor(count / 2));
      return shuffleArray([...highFollowers, ...lowFollowers]).slice(0, count);
    }
    
    return shuffleArray(users).slice(0, count);
  }

  private generateTriviaQuestions(users: FarcasterUser[], difficulty: 'easy' | 'medium' | 'hard') {
    const questions = [];
    
    // Follower count questions
    for (const user of users.slice(0, 3)) {
      const otherUsers = users.filter(u => u.fid !== user.fid);
      const options = shuffleArray([
        this.formatFollowerCount(user.follower_count),
        ...otherUsers.slice(0, 3).map(u => this.formatFollowerCount(u.follower_count))
      ]);
      
      questions.push({
        id: `followers-${user.fid}`,
        question: `How many followers does @${user.username} have?`,
        options,
        correctAnswer: this.formatFollowerCount(user.follower_count),
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
        .filter(u => u.fid !== user.fid)
        .map(u => u.bio!.split(' ').slice(0, 4).join(' '))
        .slice(0, 3);
      
      const options = shuffleArray([keyPhrase, ...otherBios]);
      
      questions.push({
        id: `bio-${user.fid}`,
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
}

// Singleton instance
export const socialGameFactory = new SocialGameFactory();
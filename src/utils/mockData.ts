// Mock data utilities for development and fallback scenarios

// Re-export the FarcasterUser interface for consistency
export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  powerBadge?: boolean;
  verifiedAddresses?: {
    ethAddresses: string[];
    solAddresses: string[];
  };
}

// Mock data functions removed - app should fail gracefully when Farcaster data unavailable

/**
 * Utility function to shuffle array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

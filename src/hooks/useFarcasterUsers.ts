import { useState, useEffect, useCallback } from 'react';
import { FarcasterUser } from '@/types/socialGames';

interface UseFarcasterUsersOptions {
  count?: number;
  minFollowers?: number;
  type?: 'trending' | 'active' | 'quality';
  searchQuery?: string;
  enableAutoRefresh?: boolean;
}

interface UseFarcasterUsersReturn {
  users: FarcasterUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshUsers: () => Promise<void>; // Alias for refetch for backward compatibility
  getRandomPairs: () => string[];
  hasApiKey: boolean | null;
  apiCheckComplete: boolean;
}

/**
 * Whale type classification
 */
export type WhaleType = 'minnow' | 'fish' | 'shark' | 'whale' | 'mega_whale';

/**
 * Hook for fetching and managing Farcaster users
 */
export function useFarcasterUsers(options: UseFarcasterUsersOptions = {}): UseFarcasterUsersReturn {
  const {
    count = 20,
    minFollowers = 100,
    type = 'trending',
    searchQuery,
    enableAutoRefresh = true
  } = options;

  const [users, setUsers] = useState<FarcasterUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiCheckComplete, setApiCheckComplete] = useState(false);

  // Check if API key is available
  const checkApiKey = useCallback(async () => {
    try {
      const response = await fetch('/api/farcaster-users?check=true');
      const result = await response.json();
      setHasApiKey(result.hasApiKey || false);
    } catch {
      setHasApiKey(false);
    } finally {
      setApiCheckComplete(true);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type,
        count: count.toString(),
        minFollowers: minFollowers.toString(),
        ...(searchQuery && { query: searchQuery })
      });

      const response = await fetch(`/api/farcaster-users?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching Farcaster users:', err);
    } finally {
      setLoading(false);
    }
  }, [type, count, minFollowers, searchQuery]);

  // Get random pairs for memory game
  const getRandomPairs = useCallback((): string[] => {
    if (users.length < 8) {
      console.warn('Not enough users for game pairs');
      return [];
    }

    // Shuffle users and take first 8
    const shuffled = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, 8);
    
    // Return profile picture URLs
    return selectedUsers.map(user => user.pfpUrl).filter(Boolean);
  }, [users]);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  useEffect(() => {
    if (apiCheckComplete && hasApiKey && enableAutoRefresh) {
      fetchUsers();
    }
  }, [apiCheckComplete, hasApiKey, enableAutoRefresh, fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    refreshUsers: fetchUsers, // Alias for backward compatibility
    getRandomPairs,
    hasApiKey,
    apiCheckComplete
  };
}

/**
 * Utility function to get whale emoji based on follower count
 */
export function getWhaleEmoji(whaleType: WhaleType): string {
  switch (whaleType) {
    case 'minnow':
      return '🐟';
    case 'fish':
      return '🐠';
    case 'shark':
      return '🦈';
    case 'whale':
      return '🐋';
    case 'mega_whale':
      return '🐳';
    default:
      return '🐟';
  }
}

/**
 * Classify user based on follower count
 */
export function classifyWhaleType(followerCount: number): WhaleType {
  if (followerCount >= 50000) return 'mega_whale';
  if (followerCount >= 10000) return 'whale';
  if (followerCount >= 5000) return 'shark';
  if (followerCount >= 1000) return 'fish';
  return 'minnow';
}

/**
 * Legacy alias for classifyWhaleType
 */
export function classifyUserByFollowers(followerCount: number): WhaleType {
  return classifyWhaleType(followerCount);
}

/**
 * Get whale multiplier for reward calculations
 */
export function getWhaleMultiplier(whaleType: WhaleType): number {
  switch (whaleType) {
    case 'minnow':
      return 1;
    case 'fish':
      return 1.2;
    case 'shark':
      return 1.5;
    case 'whale':
      return 2;
    case 'mega_whale':
      return 3;
    default:
      return 1;
  }
}

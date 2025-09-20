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

  // Check if API key is available with timeout and error handling
  const checkApiKey = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/farcaster-users?check=true', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API check failed: ${response.status}`);
      }
      
      const result = await response.json();
      setHasApiKey(result.hasApiKey || false);
    } catch (err) {
      console.warn('API key check failed:', err);
      setHasApiKey(false);
    } finally {
      setApiCheckComplete(true);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    // Don't fetch if we know there's no API key
    if (hasApiKey === false) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type,
        count: count.toString(),
        minFollowers: minFollowers.toString(),
        ...(searchQuery && { query: searchQuery })
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`/api/farcaster-users?${params}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      const usersArray = data.users || data || [];
      setUsers(usersArray);
      
      // If we got users, we know the API key works
      if (usersArray.length > 0 && hasApiKey === null) {
        setHasApiKey(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching Farcaster users:', err);
      
      // If this is a timeout or network error, don't mark API as unavailable
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('timeout'))) {
        console.warn('Request timed out, but API might still be available');
      } else if (hasApiKey === null) {
        // Only set to false if we haven't determined API availability yet
        setHasApiKey(false);
      }
    } finally {
      setLoading(false);
    }
  }, [type, count, minFollowers, searchQuery, hasApiKey]);

  // Get random pairs for memory game
  const getRandomPairs = useCallback((): string[] => {
    if (users.length < 10) {
      console.warn('Not enough users for game pairs, need at least 10');
      return [];
    }

    // Shuffle users and take first 10 for 20 cards (10 pairs)
    const shuffled = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, 10);
    
    // Return profile picture URLs, duplicated for pairs
    const images = selectedUsers.map(user => user.pfpUrl).filter(Boolean);
    return [...images, ...images]; // Duplicate for pairs
  }, [users]);

  // Check API key on mount
  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // ENHANCEMENT FIRST: Consolidated timeout logic
  useEffect(() => {
    if (apiCheckComplete && hasApiKey === true && enableAutoRefresh) {
      // Add a small delay to prevent rapid-fire requests
      const timer = setTimeout(() => {
        fetchUsers();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [apiCheckComplete, hasApiKey, enableAutoRefresh, fetchUsers]);

  // ENHANCEMENT FIRST: Global timeout to prevent infinite loading
  useEffect(() => {
    if (loading || !apiCheckComplete) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout reached, forcing completion');
        if (!apiCheckComplete) {
          setApiCheckComplete(true);
        }
        if (hasApiKey === null) {
          setHasApiKey(false); // Force fallback mode
        }
        setLoading(false);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, apiCheckComplete, hasApiKey]);

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
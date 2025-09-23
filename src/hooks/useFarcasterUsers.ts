import { useState, useEffect, useCallback } from 'react';
import { FarcasterUser } from '@/types/socialGames';

// Debug flag for development
const DEBUG = process.env.NODE_ENV === 'development';

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
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Check if API key is available with timeout and error handling
  const checkApiKey = useCallback(async () => {
    if (DEBUG) console.log('🔑 Checking API key availability...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/farcaster-users?check=true', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API check failed: ${response.status}`);
      }
      
      const result = await response.json();
      if (DEBUG) console.log('🔑 API check result:', result);
      setHasApiKey(result.hasApiKey || false);
    } catch (err) {
      console.warn('API key check failed:', err);
      setHasApiKey(false);
    } finally {
      setApiCheckComplete(true);
      if (DEBUG) console.log('✅ API check complete, hasApiKey:', hasApiKey);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (hasApiKey === false) {
      if (DEBUG) console.log('❌ Skipping fetch - no API key');
      setLoading(false);
      return;
    }

    if (DEBUG) console.log('🔄 Fetching users...');
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
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`/api/farcaster-users?${params}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const usersArray = data.users || data || [];
      
      if (DEBUG) console.log('📥 Received users:', usersArray.length);
      setUsers(usersArray);
      
      if (usersArray.length > 0 && hasApiKey === null) {
        setHasApiKey(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching Farcaster users:', err);
      
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('timeout'))) {
        console.warn('Request timed out, but API might still be available');
      } else if (hasApiKey === null) {
        setHasApiKey(false);
      }
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
      if (DEBUG) console.log('🏁 Fetch complete:', { usersCount: users.length, hasApiKey, error });
    }
  }, [type, count, minFollowers, searchQuery, hasApiKey]);

  const getRandomPairs = useCallback((): string[] => {
    if (users.length < 10) {
      console.warn('Not enough users for game pairs, need at least 10');
      return [];
    }

    const shuffled = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, 10);
    const images = selectedUsers.map(user => user.pfpUrl).filter(Boolean);
    return [...images, ...images];
  }, [users]);

  // Initial API key check
  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // Initial fetch after API check
  useEffect(() => {
    if (apiCheckComplete && hasApiKey === true && !initialFetchDone) {
      if (DEBUG) console.log('🚀 Triggering initial fetch');
      fetchUsers();
    }
  }, [apiCheckComplete, hasApiKey, initialFetchDone, fetchUsers]);

  // Auto-refresh setup
  useEffect(() => {
    if (enableAutoRefresh && initialFetchDone) {
      if (DEBUG) console.log('⏰ Setting up auto-refresh');
      const refreshInterval = setInterval(fetchUsers, 60000);
      return () => clearInterval(refreshInterval);
    }
  }, [enableAutoRefresh, initialFetchDone, fetchUsers]);

  // Safety timeout
  useEffect(() => {
    if (loading || !apiCheckComplete) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Loading timeout reached, forcing completion');
        if (!apiCheckComplete) setApiCheckComplete(true);
        if (hasApiKey === null) setHasApiKey(false);
        setLoading(false);
      }, 15000);

      return () => clearTimeout(timeout);
    }
  }, [loading, apiCheckComplete, hasApiKey]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    refreshUsers: fetchUsers,
    getRandomPairs,
    hasApiKey,
    apiCheckComplete
  };
}
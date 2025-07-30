import { useState, useEffect, useCallback } from "react";
import {
  CACHE_DURATION,
  REFRESH_INTERVAL,
  DEFAULT_USER_COUNT,
  MIN_FOLLOWERS
} from "@/config";
import {
  FarcasterUser
} from "@/utils/mockData";

// Hook options interface
interface UseFarcasterUsersOptions {
  count?: number;
  minFollowers?: number;
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

// Hook return interface
interface UseFarcasterUsersReturn {
  users: FarcasterUser[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  getRandomPairs: () => string[];
  isUsingMockData: boolean;
  hasApiKey: boolean | null; // null = checking, true/false = determined
  apiCheckComplete: boolean;
}

// API response interface
interface FarcasterUsersResponse {
  users: FarcasterUser[];
  count: number;
  timestamp: number;
}

// Cache for API responses to avoid excessive calls
const userCache = new Map<string, { data: FarcasterUser[]; timestamp: number }>();

/**
 * Hook for fetching and managing Farcaster users
 * Handles server-side API calls, caching, and fallback to mock data
 */
export function useFarcasterUsers(
  options: UseFarcasterUsersOptions = {},
): UseFarcasterUsersReturn {
  const {
    count = DEFAULT_USER_COUNT,
    minFollowers = MIN_FOLLOWERS,
    refreshInterval = REFRESH_INTERVAL,
    enableAutoRefresh = false,
  } = options;

  const [users, setUsers] = useState<FarcasterUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Check if API features are available by testing the API endpoint
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null); // null = checking, true/false = determined
  const [apiCheckComplete, setApiCheckComplete] = useState(false);

  // Check API availability on mount with timeout
  useEffect(() => {
    if (!isClient) return;

    const checkApiAvailability = async () => {
      try {
        // Give the API up to 5 seconds to respond
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/farcaster-users?count=1', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        setHasApiKey(!data.error);
      } catch (error) {
        // Only set to false if it's not an abort error (timeout)
        if (error instanceof Error && error.name !== 'AbortError') {
          setHasApiKey(false);
        } else {
          // If timeout, assume API is not available
          setHasApiKey(false);
        }
      } finally {
        setApiCheckComplete(true);
      }
    };

    checkApiAvailability();
  }, [isClient]);

  // Check cache first
  const getCachedUsers = useCallback(
    (cacheKey: string): FarcasterUser[] | null => {
      const cached = userCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
      return null;
    },
    [],
  );

  // Fetch users from our API route
  const fetchUsersFromAPI = useCallback(async (): Promise<FarcasterUser[]> => {
    if (hasApiKey === false) {
      throw new Error("NEYNAR_API_KEY not configured - Farcaster features unavailable");
    }

    if (hasApiKey === null) {
      throw new Error("API availability check in progress");
    }

    try {
      const cacheKey = `trending-${count}-${minFollowers}`;
      const cached = getCachedUsers(cacheKey);
      if (cached) {
        setIsUsingMockData(false);
        return cached;
      }

      // Fetch from our server-side API route
      const response = await fetch(
        `/api/farcaster-users?count=${count}&minFollowers=${minFollowers}&type=trending`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: FarcasterUsersResponse = await response.json();

      // Cache the results
      userCache.set(cacheKey, {
        data: data.users,
        timestamp: Date.now(),
      });

      setIsUsingMockData(false);
      return data.users;
    } catch (err) {
      console.error("Error fetching Farcaster users:", err);
      throw err;
    }
  }, [hasApiKey, count, minFollowers, getCachedUsers]);



  // Main function to refresh users
  const refreshUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedUsers = await fetchUsersFromAPI();
      setUsers(fetchedUsers);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);

      // Don't fallback to mock data - let the app handle the error state
      setUsers([]);
      setIsUsingMockData(false);
    } finally {
      setLoading(false);
    }
  }, [fetchUsersFromAPI]);

  // Generate random pairs from users for the memory game
  const getRandomPairs = useCallback((): string[] => {
    if (users.length < 8) {
      // Not enough users, return empty array to indicate unavailable
      return [];
    }

    // Take first 8 users and use their profile pictures
    return users.slice(0, 8).map((user) => user.pfp_url);
  }, [users]);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-refresh effect - only run on client
  useEffect(() => {
    if (isClient) {
      refreshUsers();
    }
  }, [refreshUsers, isClient]);

  useEffect(() => {
    if (!enableAutoRefresh || !isClient) return;

    const interval = setInterval(refreshUsers, refreshInterval);
    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, refreshUsers, isClient]);

  return {
    users,
    loading,
    error,
    refreshUsers,
    getRandomPairs,
    isUsingMockData,
    hasApiKey,
    apiCheckComplete,
  };
}



/**
 * Hook for getting a single Farcaster user profile by FID
 * Uses the server-side API route for secure authentication
 */
export function useFarcasterUser(fid: number | null) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasApiKey, setHasApiKey] = useState(false);

  const fetchUser = useCallback(
    async (userFid: number) => {
      if (!hasApiKey) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/farcaster-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fids: [userFid] }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`);
        }

        const data: FarcasterUsersResponse = await response.json();
        const userData = data.users?.[0];

        if (userData) {
          setUser(userData);
        } else {
          setError("User not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    },
    [hasApiKey],
  );

  useEffect(() => {
    if (fid) {
      fetchUser(fid);
    } else {
      setUser(null);
      setError(null);
    }
  }, [fid, fetchUser]);

  return { user, loading, error };
}

import { useState, useEffect, useCallback } from "react";
import { 
  NEXT_PUBLIC_NEYNAR_API_KEY, 
  CACHE_DURATION, 
  REFRESH_INTERVAL,
  DEFAULT_USER_COUNT,
  MIN_FOLLOWERS 
} from "@/config";
import { 
  FarcasterUser, 
  generateMockUsers, 
  getFallbackGameImages 
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

  // Check if API key is available
  const hasApiKey = Boolean(NEXT_PUBLIC_NEYNAR_API_KEY);

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
    if (!hasApiKey) {
      setIsUsingMockData(true);
      return generateMockUsers(count);
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
      setIsUsingMockData(true);
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

      // Fallback to mock data on error
      const mockUsers = generateMockUsers(count);
      setUsers(mockUsers);
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [fetchUsersFromAPI, count]);

  // Generate random pairs from users for the memory game
  const getRandomPairs = useCallback((): string[] => {
    if (users.length < 8) {
      // Not enough users, return fallback images
      return getFallbackGameImages();
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

  const hasApiKey = Boolean(NEXT_PUBLIC_NEYNAR_API_KEY);

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

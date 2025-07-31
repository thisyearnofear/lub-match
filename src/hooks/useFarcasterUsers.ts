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

  // Check API availability on mount with improved timing and retry logic
  useEffect(() => {
    if (!isClient) return;

    const checkApiAvailability = async () => {
      const startTime = Date.now();
      const MIN_LOADING_TIME = 2500; // Minimum 2.5 seconds for smooth UX
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000; // 1 second between retries

      let lastError: Error | null = null;

      // Try multiple times with exponential backoff
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // Longer timeout per attempt

          const response = await fetch('/api/farcaster-users?count=1', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const data = await response.json();
          
          // If we get a successful response without error, API is available
          if (!data.error) {
            setHasApiKey(true);
            break;
          } else {
            // API responded but with an error (likely missing key)
            lastError = new Error(data.error);
            if (attempt === MAX_RETRIES) {
              setHasApiKey(false);
            }
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.log(`API check attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);
          
          // If this is the last attempt, mark as unavailable
          if (attempt === MAX_RETRIES) {
            setHasApiKey(false);
          } else {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          }
        }
      }

      // Ensure minimum loading time for smooth UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setApiCheckComplete(true);
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
    // Don't try to refresh if API check hasn't completed yet
    if (!apiCheckComplete) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedUsers = await fetchUsersFromAPI();
      setUsers(fetchedUsers);
      // Clear any previous errors on successful fetch
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      
      // Only set error if API check is complete and we know the API should work
      if (hasApiKey === true) {
        setError(errorMessage);
      } else if (hasApiKey === false) {
        // Set a more user-friendly error message for missing API key
        setError("Neynar API key not configured - social features unavailable");
      }

      // Don't fallback to mock data - let the app handle the error state
      setUsers([]);
      setIsUsingMockData(false);
    } finally {
      setLoading(false);
    }
  }, [fetchUsersFromAPI, apiCheckComplete, hasApiKey]);

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

  // Auto-refresh effect - only run on client after API check is complete
  useEffect(() => {
    if (isClient && apiCheckComplete && hasApiKey === true) {
      refreshUsers();
    }
  }, [refreshUsers, isClient, apiCheckComplete, hasApiKey]);

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

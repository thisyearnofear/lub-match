"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// Types for Neynar API responses
interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

interface FarcasterFeed {
  casts: Array<{
    hash: string;
    author: FarcasterUser;
    text: string;
    timestamp: string;
    reactions: {
      likes_count: number;
      recasts_count: number;
      replies_count: number;
    };
  }>;
}

interface UseFarcasterUsersOptions {
  count?: number;
  minFollowers?: number;
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

interface UseFarcasterUsersReturn {
  users: FarcasterUser[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  getRandomPairs: () => string[];
}

const NEYNAR_API_BASE = "https://api.neynar.com/v2/farcaster";

// Cache for API responses to avoid excessive calls
const userCache = new Map<
  string,
  { data: FarcasterUser[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useFarcasterUsers(
  options: UseFarcasterUsersOptions = {},
): UseFarcasterUsersReturn {
  const {
    count = 16, // Need 8 pairs = 16 users
    minFollowers = 100,
    refreshInterval = 10 * 60 * 1000, // 10 minutes
    enableAutoRefresh = false,
  } = options;

  const [users, setUsers] = useState<FarcasterUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Get API key from environment (can be client-side for public data)
  const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;

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

  // Fetch trending feed to get active users
  const fetchTrendingUsers = useCallback(async (): Promise<FarcasterUser[]> => {
    if (!apiKey) {
      // Fallback to mock data for development
      return generateMockUsers(count);
    }

    try {
      const cacheKey = `trending-${count}-${minFollowers}`;
      const cached = getCachedUsers(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch trending feed to get active users
      const response = await fetch(
        `${NEYNAR_API_BASE}/feed/trending?limit=100`,
        {
          headers: {
            api_key: apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status}`);
      }

      const data: FarcasterFeed = await response.json();

      // Extract unique users from feed
      const uniqueUsers = new Map<number, FarcasterUser>();

      data.casts.forEach((cast) => {
        const user = cast.author;
        if (
          user.follower_count >= minFollowers &&
          user.pfp_url &&
          user.username &&
          !uniqueUsers.has(user.fid)
        ) {
          uniqueUsers.set(user.fid, user);
        }
      });

      const usersArray = Array.from(uniqueUsers.values());

      // Shuffle and take the number we need
      const shuffledUsers = shuffleArray(usersArray).slice(0, count);

      // Ensure we have enough users, supplement with high-quality users if needed
      if (shuffledUsers.length < count) {
        const additionalUsers = await fetchHighQualityUsers(
          count - shuffledUsers.length,
        );
        shuffledUsers.push(...additionalUsers);
      }

      // Cache the results
      userCache.set(cacheKey, {
        data: shuffledUsers,
        timestamp: Date.now(),
      });

      return shuffledUsers;
    } catch (err) {
      console.error("Error fetching Farcaster users:", err);
      throw err;
    }
  }, [apiKey, count, minFollowers, getCachedUsers]);

  // Fetch high-quality users as backup
  const fetchHighQualityUsers = useCallback(
    async (needed: number): Promise<FarcasterUser[]> => {
      if (!apiKey) return generateMockUsers(needed);

      try {
        // Use a curated list of high-quality FIDs
        const qualityFids = [
          3, 2, 1, 5650, 575, 99, 213, 315, 2433, 1309, 3621, 602, 6131, 194,
          239, 8513, 1371, 5577, 1048, 6553, 3289, 2486, 1842, 457,
        ];

        const selectedFids = shuffleArray(qualityFids).slice(0, needed);
        const fidsQuery = selectedFids.join(",");

        const response = await fetch(
          `${NEYNAR_API_BASE}/user/bulk?fids=${fidsQuery}`,
          {
            headers: {
              api_key: apiKey,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Neynar API error: ${response.status}`);
        }

        const data = await response.json();
        return data.users || [];
      } catch (err) {
        console.error("Error fetching high-quality users:", err);
        return generateMockUsers(needed);
      }
    },
    [apiKey],
  );

  // Main function to refresh users
  const refreshUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedUsers = await fetchTrendingUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);

      // Fallback to mock data on error
      const mockUsers = generateMockUsers(count);
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  }, [fetchTrendingUsers, count]);

  // Generate random pairs from users for the memory game
  const getRandomPairs = useCallback((): string[] => {
    if (users.length < 8) {
      // Not enough users, return fallback
      return [
        "/game-photos/1.avif",
        "/game-photos/2.avif",
        "/game-photos/3.avif",
        "/game-photos/4.avif",
        "/game-photos/5.avif",
        "/game-photos/6.avif",
        "/game-photos/7.avif",
        "/game-photos/8.avif",
      ];
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
  };
}

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Mock data generator for development/fallback
function generateMockUsers(count: number): FarcasterUser[] {
  const mockUsernames = [
    "vitalik",
    "dwr",
    "balajis",
    "linda",
    "jessepollak",
    "rish",
    "manan",
    "ted",
    "horsefacts",
    "proxystudio",
    "keccers",
    "july",
    "varunsrin",
    "colin",
    "davidfurlong",
    "nolanz",
    "trevor",
    "luc",
    "schmoodles",
    "gami",
  ];

  // Use deterministic data to avoid hydration mismatches
  return Array.from({ length: count }, (_, i) => ({
    fid: 1000 + i,
    username: mockUsernames[i % mockUsernames.length] || `user${i}`,
    display_name: `Farcaster User ${i + 1}`,
    pfp_url: `/game-photos/${(i % 8) + 1}.avif`, // Fallback to existing images
    bio: "Building the future of social",
    follower_count: 1000 + i * 123, // Deterministic follower count
    following_count: 100 + i * 47, // Deterministic following count
    verified_addresses: {
      eth_addresses: [
        `0x${"0".repeat(40 - i.toString(16).length)}${i.toString(16)}`,
      ],
      sol_addresses: [],
    },
  }));
}

// Hook for getting user profile by FID
export function useFarcasterUser(fid: number | null) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;

  const fetchUser = useCallback(
    async (userFid: number) => {
      if (!apiKey) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${NEYNAR_API_BASE}/user/bulk?fids=${userFid}`,
          {
            headers: {
              api_key: apiKey,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`);
        }

        const data = await response.json();
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
    [apiKey],
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

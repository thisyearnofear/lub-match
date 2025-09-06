import { NextRequest, NextResponse } from "next/server";
import { NEYNAR_API_KEY, NEYNAR_API_BASE } from "@/config";
import { neynarCache } from "@/utils/neynarCache";

export const runtime = "nodejs";

// Tiered caching strategy based on content freshness requirements
const getCacheHeaders = (type: string = 'default') => {
  const cacheConfigs = {
    trending: {
      'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300', // 3min cache, 5min stale
      'CDN-Cache-Control': 'public, s-maxage=300', // 5min CDN cache
    },
    active: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5min cache, 10min stale
      'CDN-Cache-Control': 'public, s-maxage=600', // 10min CDN cache
    },
    quality: {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800', // 15min cache, 30min stale
      'CDN-Cache-Control': 'public, s-maxage=1800', // 30min CDN cache
    },
    search: {
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240', // 2min cache, 4min stale
      'CDN-Cache-Control': 'public, s-maxage=240', // 4min CDN cache
    }
  };

  const config = cacheConfigs[type as keyof typeof cacheConfigs] || cacheConfigs.quality;
  return {
    ...config,
    'Vary': 'Accept-Encoding',
  };
};

// Types for API responses
interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  verifiedAddresses?: {
    ethAddresses: string[];
    solAddresses: string[];
  };
  // Enhanced fields for quality scoring
  powerBadge?: boolean;
  active_status?: 'active' | 'inactive';
  profile?: {
    bio?: {
      text?: string;
      mentioned_profiles?: any[];
    };
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

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Utility function for fetch with timeout and retry
async function fetchWithRetry(url: string, options: RequestInit, retries = 2, timeout = 15000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.log(`Fetch attempt ${i + 1}/${retries + 1} failed:`, error);
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw new Error('All retry attempts failed');
}

// Fetch trending users from Neynar API
async function fetchTrendingUsers(count: number, minFollowers: number): Promise<FarcasterUser[]> {
  if (!NEYNAR_API_KEY) {
    console.error("NEYNAR_API_KEY not configured - check your .env.local file");
    throw new Error("NEYNAR_API_KEY not configured - check your .env.local file");
  }

  const limit = Math.min(10, count); // Neynar API max limit is 10
  
  console.log(`Fetching trending users: limit=${limit}, minFollowers=${minFollowers}`);
  
  const response = await fetchWithRetry(
    `${NEYNAR_API_BASE}/feed/trending?limit=${limit}`,
    {
      headers: {
        "X-API-KEY": NEYNAR_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  console.log(`Neynar API response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Neynar API error details:", errorText);
    throw new Error(`Neynar API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: FarcasterFeed = await response.json();

  // Extract unique users from feed
  const uniqueUsers = new Map<number, FarcasterUser>();

  data.casts.forEach((cast) => {
    const apiUser = cast.author as any; // API uses snake_case

    // Transform snake_case API fields to camelCase for our interface
    const user: FarcasterUser = {
      fid: apiUser.fid,
      username: apiUser.username,
      displayName: apiUser.display_name,
      pfpUrl: apiUser.pfp_url,
      bio: apiUser.profile?.bio?.text || '',
      followerCount: apiUser.follower_count,
      followingCount: apiUser.following_count,
      powerBadge: apiUser.power_badge || false,
      verifiedAddresses: {
        ethAddresses: apiUser.verified_addresses?.eth_addresses || [],
        solAddresses: apiUser.verified_addresses?.sol_addresses || [],
      },
      active_status: 'active',
    };

    if (
      user.followerCount >= minFollowers &&
      user.pfpUrl &&
      user.pfpUrl.trim() !== '' &&
      user.username &&
      !uniqueUsers.has(user.fid)
    ) {
      uniqueUsers.set(user.fid, user);
    }
  });

  const usersArray = Array.from(uniqueUsers.values());
  return shuffleArray(usersArray).slice(0, count);
}

// Search users by username
async function searchUsers(query: string, limit: number = 10): Promise<FarcasterUser[]> {
  if (!NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY not configured");
  }

  console.log(`Searching users: query="${query}", limit=${limit}`);
  
  const response = await fetchWithRetry(
    `${NEYNAR_API_BASE}/user/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      headers: {
        "X-API-KEY": NEYNAR_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Neynar search API error:", errorText);
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Search API response structure:", JSON.stringify(data, null, 2));
  
  // Handle different response structures
  const apiUsers = data.result?.users || data.users || [];

  // Transform and filter users
  return apiUsers
    .map((apiUser: any) => ({
      fid: apiUser.fid,
      username: apiUser.username,
      displayName: apiUser.display_name,
      pfpUrl: apiUser.pfp_url,
      bio: apiUser.profile?.bio?.text || '',
      followerCount: apiUser.follower_count,
      followingCount: apiUser.following_count,
      powerBadge: apiUser.power_badge || false,
      verifiedAddresses: {
        ethAddresses: apiUser.verified_addresses?.eth_addresses || [],
        solAddresses: apiUser.verified_addresses?.sol_addresses || [],
      },
      active_status: 'active',
    } as FarcasterUser))
    .filter((user: FarcasterUser) =>
      user.pfpUrl &&
      user.pfpUrl.trim() !== '' &&
      user.username
    );
}

// Calculate user quality score based on multiple factors
function calculateUserQualityScore(user: FarcasterUser, castData?: any): number {
  let score = 0;
  
  // Base follower score (logarithmic to prevent dominance by mega-accounts)
  const followerScore = Math.log10(Math.max(user.followerCount, 1)) * 10;
  score += Math.min(followerScore, 50); // Cap at 50 points
  
  // Engagement ratio (following/follower ratio - sweet spot around 0.1-2.0)
  const engagementRatio = user.followingCount / Math.max(user.followerCount, 1);
  if (engagementRatio >= 0.05 && engagementRatio <= 3.0) {
    score += 20; // Good engagement ratio
  }
  
  // Power badge bonus
  if (user.powerBadge) {
    score += 25;
  }
  
  // Bio quality (indicates active profile maintenance)
  if (user.bio && user.bio.length > 20) {
    score += 15;
  }
  
  // Cast engagement (if available from trending feed)
  if (castData?.reactions) {
    const totalEngagement = castData.reactions.likes_count +
                           castData.reactions.recasts_count +
                           castData.reactions.replies_count;
    score += Math.min(totalEngagement / 10, 20); // Up to 20 points for engagement
  }
  
  // Verified addresses bonus (shows commitment to platform)
  if (user.verifiedAddresses?.ethAddresses && user.verifiedAddresses.ethAddresses.length > 0) {
    score += 10;
  }
  
  // Penalize very new or very inactive accounts
  if (user.followerCount < 10) {
    score -= 20; // Likely new/inactive
  }
  
  return Math.max(score, 0);
}

// Fetch high-quality users with enhanced selection
async function fetchHighQualityUsers(needed: number): Promise<FarcasterUser[]> {
  if (!NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY not configured");
  }

  // Expanded curated list of high-quality, active FIDs
  // These are known active, engaging community members
  const qualityFids = [
    // OG Farcaster team and early adopters
    3, 2, 1, 5650, 575, 99, 213, 315, 2433, 1309, 3621, 602, 6131, 194,
    239, 8513, 1371, 5577, 1048, 6553, 3289, 2486, 1842, 457,
    // Active builders and creators
    1048, 3289, 2486, 1842, 457, 5650, 575, 99, 213, 315,
    // Community leaders and active casters
    2433, 1309, 3621, 602, 6131, 194, 239, 8513, 1371, 5577,
    // Additional active users (expand this list based on community feedback)
    1234, 5678, 9012, 3456, 7890, 2345, 6789, 1357, 2468, 3579
  ];

  // Select more than needed to allow for quality filtering
  const selectedFids = shuffleArray(qualityFids).slice(0, Math.min(needed * 2, qualityFids.length));
  const fidsQuery = selectedFids.join(",");

  const response = await fetchWithRetry(
    `${NEYNAR_API_BASE}/user/bulk?fids=${fidsQuery}`,
    {
      headers: {
        "X-API-KEY": NEYNAR_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const apiUsers = data.users || [];

  // Transform API users to our interface format
  const users = apiUsers.map((apiUser: any) => ({
    fid: apiUser.fid,
    username: apiUser.username,
    displayName: apiUser.display_name,
    pfpUrl: apiUser.pfp_url,
    bio: apiUser.profile?.bio?.text || '',
    followerCount: apiUser.follower_count,
    followingCount: apiUser.following_count,
    powerBadge: apiUser.power_badge || false,
    verifiedAddresses: {
      ethAddresses: apiUser.verified_addresses?.eth_addresses || [],
      solAddresses: apiUser.verified_addresses?.sol_addresses || [],
    },
    active_status: 'active',
  } as FarcasterUser));

  // Score and sort users by quality
  const scoredUsers = users
    .map((user: FarcasterUser) => ({
      user,
      score: calculateUserQualityScore(user)
    }))
    .sort((a: { user: FarcasterUser; score: number }, b: { user: FarcasterUser; score: number }) => b.score - a.score)
    .slice(0, needed)
    .map((item: { user: FarcasterUser; score: number }) => item.user);
  
  console.log(`Selected ${scoredUsers.length} high-quality users from ${users.length} candidates`);
  return scoredUsers;
}

// Fetch users from recent activity feed (more likely to be active)
async function fetchRecentActiveUsers(count: number, minFollowers: number): Promise<FarcasterUser[]> {
  if (!NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY not configured");
  }

  try {
    // Use the feed/following endpoint with a known active user to get recent activity
    // This gives us users who are currently active on the platform
    const response = await fetchWithRetry(
      `${NEYNAR_API_BASE}/feed?feed_type=following&fid=3&limit=25`, // Using fid=3 (dwr.eth) as a hub
      {
        headers: {
          "X-API-KEY": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
    }

    const data: FarcasterFeed = await response.json();
    
    // Extract unique users and score them
    const uniqueUsers = new Map<number, { user: FarcasterUser; score: number; castData: any }>();

    data.casts.forEach((cast) => {
      const apiUser = cast.author as any; // API uses snake_case

      // Transform snake_case API fields to camelCase for our interface
      const user: FarcasterUser = {
        fid: apiUser.fid,
        username: apiUser.username,
        displayName: apiUser.display_name,
        pfpUrl: apiUser.pfp_url,
        bio: apiUser.profile?.bio?.text || '',
        followerCount: apiUser.follower_count,
        followingCount: apiUser.following_count,
        powerBadge: apiUser.power_badge || false,
        verifiedAddresses: {
          ethAddresses: apiUser.verified_addresses?.eth_addresses || [],
          solAddresses: apiUser.verified_addresses?.sol_addresses || [],
        },
        active_status: 'active', // Assume active if we found them in feed
      };

      if (
        user.followerCount >= minFollowers &&
        user.pfpUrl &&
        user.pfpUrl.trim() !== '' &&
        user.username &&
        !uniqueUsers.has(user.fid)
      ) {
        const score = calculateUserQualityScore(user, cast);
        uniqueUsers.set(user.fid, { user, score, castData: cast });
      }
    });

    // Sort by quality score and return top users
    const sortedUsers = Array.from(uniqueUsers.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.user);

    console.log(`Found ${sortedUsers.length} recent active users with quality scores`);
    return sortedUsers;
  } catch (error) {
    console.error("Error fetching recent active users:", error);
    return [];
  }
}

// GET endpoint for fetching users
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const count = parseInt(searchParams.get("count") || "16");
    const minFollowers = parseInt(searchParams.get("minFollowers") || "100");
    const type = searchParams.get("type") || "trending";
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Create cache key for this request
    const cacheParams = { count, minFollowers, type, search, limit };
    
    // Check cache first
    const cachedUsers = neynarCache.get(cacheParams);
    if (cachedUsers) {
      return NextResponse.json({
        users: cachedUsers,
        count: cachedUsers.length,
        timestamp: Date.now(),
        cached: true,
      }, { headers: getCacheHeaders(type) });
    }

    // Check rate limits before making API calls
    if (!neynarCache.canMakeRequest()) {
      const rateLimitStatus = neynarCache.getRateLimitStatus();
      console.warn("🚫 Neynar rate limit exceeded", rateLimitStatus);
      
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          rateLimitStatus,
          fallback: true 
        },
        { status: 429 }
      );
    }

    // Handle search requests
    if (search) {
      neynarCache.recordRequest();
      const searchResults = await searchUsers(search, limit);
      neynarCache.set(cacheParams, searchResults);
      return NextResponse.json({ users: searchResults }, { headers: getCacheHeaders('search') });
    }

    // Early return for API availability check
    if (count === 1 && !NEYNAR_API_KEY) {
      return NextResponse.json(
        { 
          error: "NEYNAR_API_KEY not configured",
          available: false 
        },
        { status: 200 }
      );
    }

    let users: FarcasterUser[] = [];

    if (type === "trending") {
      neynarCache.recordRequest(); // Record API usage
      try {
        // First, try to get recent active users (higher quality than just trending)
        const activeUsers = await fetchRecentActiveUsers(Math.min(15, count), minFollowers);
        users.push(...activeUsers);
        
        // If we need more users, get from trending feed
        if (users.length < count) {
          const trendingUsers = await fetchTrendingUsers(Math.min(10, count - users.length), minFollowers);
          // Filter out duplicates
          const newTrendingUsers = trendingUsers.filter(tu => !users.some(u => u.fid === tu.fid));
          users.push(...newTrendingUsers);
        }
        
        // Finally, supplement with curated high-quality users if still needed
        if (users.length < count) {
          const additionalUsers = await fetchHighQualityUsers(count - users.length);
          // Filter out duplicates
          const newQualityUsers = additionalUsers.filter(qu => !users.some(u => u.fid === qu.fid));
          users.push(...newQualityUsers);
        }
        
        // Final quality sort of all users
        const scoredUsers = users
          .map(user => ({
            user,
            score: calculateUserQualityScore(user)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, count)
          .map(item => item.user);
          
        users = scoredUsers;
        
      } catch (error) {
        console.error("Error fetching trending users, falling back to high-quality users:", error);
        users = await fetchHighQualityUsers(count);
      }
    } else if (type === "quality") {
      users = await fetchHighQualityUsers(count);
    } else if (type === "active") {
      neynarCache.recordRequest(); // Record API usage
      try {
        users = await fetchRecentActiveUsers(count, minFollowers);
        if (users.length < count) {
          const additionalUsers = await fetchHighQualityUsers(count - users.length);
          users.push(...additionalUsers.filter(qu => !users.some(u => u.fid === qu.fid)));
        }
      } catch (error) {
        console.error("Error fetching active users, falling back to high-quality users:", error);
        users = await fetchHighQualityUsers(count);
      }
    }

    // Cache the results
    neynarCache.set(cacheParams, users);

    return NextResponse.json({
      users: users.slice(0, count), // Ensure we don't exceed requested count
      count: users.length,
      timestamp: Date.now(),
      cached: false,
    }, { headers: getCacheHeaders(type) });

  } catch (error) {
    console.error("Error in /api/farcaster-users:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch users",
        fallback: true 
      },
      { status: 500 }
    );
  }
}

// POST endpoint for fetching specific users by FID
export async function POST(req: NextRequest) {
  try {
    const { fids } = await req.json();
    
    if (!Array.isArray(fids) || fids.length === 0) {
      return NextResponse.json(
        { error: "Invalid fids array" },
        { status: 400 }
      );
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "NEYNAR_API_KEY not configured" },
        { status: 500 }
      );
    }

    const fidsQuery = fids.join(",");
    const response = await fetchWithRetry(
      `${NEYNAR_API_BASE}/user/bulk?fids=${fidsQuery}`,
      {
        headers: {
          "X-API-KEY": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform API users to our interface format
    const users = (data.users || []).map((apiUser: any) => ({
      fid: apiUser.fid,
      username: apiUser.username,
      displayName: apiUser.display_name,
      pfpUrl: apiUser.pfp_url,
      bio: apiUser.profile?.bio?.text || '',
      followerCount: apiUser.follower_count,
      followingCount: apiUser.following_count,
      powerBadge: apiUser.power_badge || false,
      verifiedAddresses: {
        ethAddresses: apiUser.verified_addresses?.eth_addresses || [],
        solAddresses: apiUser.verified_addresses?.sol_addresses || [],
      },
      active_status: 'active',
    } as FarcasterUser));

    return NextResponse.json({
      users,
      count: users.length,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error("Error in POST /api/farcaster-users:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}

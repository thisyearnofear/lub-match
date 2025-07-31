import { NextRequest, NextResponse } from "next/server";
import { NEYNAR_API_KEY, NEYNAR_API_BASE } from "@/config";

export const runtime = "nodejs";

// Types for API responses
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
    const user = cast.author;
    if (
      user.follower_count >= minFollowers &&
      user.pfp_url &&
      user.pfp_url.trim() !== '' &&
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
  const users = data.result?.users || data.users || [];
  
  // Filter and validate users
  return users.filter((user: FarcasterUser) => 
    user.pfp_url && 
    user.pfp_url.trim() !== '' && 
    user.username
  );
}

// Fetch high-quality users as backup
async function fetchHighQualityUsers(needed: number): Promise<FarcasterUser[]> {
  if (!NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY not configured");
  }

  // Curated list of high-quality FIDs
  const qualityFids = [
    3, 2, 1, 5650, 575, 99, 213, 315, 2433, 1309, 3621, 602, 6131, 194,
    239, 8513, 1371, 5577, 1048, 6553, 3289, 2486, 1842, 457,
  ];

  const selectedFids = shuffleArray(qualityFids).slice(0, needed);
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
  return data.users || [];
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

    // Handle search requests
    if (search) {
      const searchResults = await searchUsers(search, limit);
      return NextResponse.json({ users: searchResults });
    }

    // Debug logging
    console.log("API Route Debug:", {
      hasApiKey: !!NEYNAR_API_KEY,
      apiKeyLength: NEYNAR_API_KEY?.length || 0,
      count,
      minFollowers,
      type
    });

    // Early return for API availability check
    if (count === 1 && !NEYNAR_API_KEY) {
      return NextResponse.json(
        { 
          error: "NEYNAR_API_KEY not configured",
          available: false 
        },
        { status: 200 } // Return 200 so the client can distinguish between network errors and config issues
      );
    }

    let users: FarcasterUser[] = [];

    if (type === "trending") {
      try {
        users = await fetchTrendingUsers(Math.min(10, count), minFollowers);
        
        // Always supplement with high-quality users since trending is limited to 10
        if (users.length < count) {
          const additionalUsers = await fetchHighQualityUsers(count - users.length);
          users.push(...additionalUsers);
        }
      } catch (error) {
        console.error("Error fetching trending users, falling back to high-quality users:", error);
        users = await fetchHighQualityUsers(count);
      }
    } else if (type === "quality") {
      users = await fetchHighQualityUsers(count);
    }

    return NextResponse.json({
      users: users.slice(0, count), // Ensure we don't exceed requested count
      count: users.length,
      timestamp: Date.now(),
    });

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
    
    return NextResponse.json({
      users: data.users || [],
      count: data.users?.length || 0,
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

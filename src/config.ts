// Environment Configuration
// Server-side only (secure)
export const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
export const PINATA_JWT = process.env.PINATA_JWT || "";

// Client-side accessible (public)
export const NEXT_PUBLIC_NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "";

// API Configuration
export const NEYNAR_API_BASE = "https://api.neynar.com/v2/farcaster";

// Cache Configuration
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// API Limits
export const MAX_TRENDING_LIMIT = 10;
export const DEFAULT_USER_COUNT = 16;
export const MIN_FOLLOWERS = 100;
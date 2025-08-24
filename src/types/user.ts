/**
 * Centralized User Types
 * Single source of truth for all user-related type definitions
 */

// Core Farcaster User interface - matches SDK context
export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  powerBadge?: boolean;
  verifiedAddresses?: {
    ethAddresses: string[];
    solAddresses: string[];
  };
}

// Extended Farcaster User with social data (for API responses)
export interface FarcasterUserExtended extends FarcasterUser {
  // All properties are already included from FarcasterUser
}

// Legacy support - maps old property names to new ones
export interface FarcasterUserLegacy {
  fid: number;
  username: string;
  display_name: string; // Legacy: use displayName instead
  pfp_url: string;      // Legacy: use pfpUrl instead
  bio?: string;
  follower_count: number;
  following_count: number;
  power_badge?: boolean; // Legacy: use powerBadge instead
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

// User identity state
export interface UserIdentity {
  isConnected: boolean;
  walletAddress?: string;
  farcasterUser?: FarcasterUser;
  displayName: string;
  avatarUrl?: string;
  hasUsername: boolean;
  isInFarcaster: boolean;
  isLoadingContext: boolean;
}

// Display configuration for user components
export interface UserDisplayConfig {
  showUsername: boolean;
  showAvatar: boolean;
  showBalance: boolean;
  format: 'compact' | 'full' | 'minimal';
  maxUsernameLength?: number;
}

// Helper function to normalize legacy user data
export function normalizeFarcasterUser(user: FarcasterUserLegacy): FarcasterUser {
  return {
    fid: user.fid,
    username: user.username,
    displayName: user.display_name,
    pfpUrl: user.pfp_url,
    bio: user.bio,
    followerCount: user.follower_count,
    followingCount: user.following_count,
    powerBadge: user.power_badge,
    verifiedAddresses: user.verified_addresses ? {
      ethAddresses: user.verified_addresses.eth_addresses,
      solAddresses: user.verified_addresses.sol_addresses
    } : undefined
  };
}

// Helper function to convert to extended format
export function toExtendedFarcasterUser(user: FarcasterUserLegacy): FarcasterUser {
  return normalizeFarcasterUser(user);
}

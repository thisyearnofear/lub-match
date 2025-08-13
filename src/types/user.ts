/**
 * Centralized User Types
 * Single source of truth for all user-related type definitions
 */

// Core Farcaster User interface - matches SDK context
export interface FarcasterUser {
  fid?: number; // Optional for compatibility with existing code
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
}

// Extended Farcaster User with social data (for API responses)
export interface FarcasterUserExtended extends FarcasterUser {
  follower_count: number;
  following_count: number;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
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
export function normalizeFarcasterUser(user: FarcasterUserLegacy | FarcasterUser): FarcasterUser {
  // If it's already normalized, return as-is
  if ('displayName' in user && 'pfpUrl' in user) {
    return user as FarcasterUser;
  }
  
  // Normalize legacy format
  const legacy = user as FarcasterUserLegacy;
  return {
    fid: legacy.fid,
    username: legacy.username,
    displayName: legacy.display_name,
    pfpUrl: legacy.pfp_url,
    bio: legacy.bio,
  };
}

// Helper function to convert to extended format
export function toExtendedFarcasterUser(user: FarcasterUserLegacy): FarcasterUserExtended {
  return {
    ...normalizeFarcasterUser(user),
    follower_count: user.follower_count,
    following_count: user.following_count,
    verified_addresses: user.verified_addresses,
  };
}

/**
 * Lens Protocol 2025 SDK Service
 * Provides GraphQL fragments, client configuration, and core actions for Lens integration
 */

import { PublicClient, graphql, FragmentOf } from '@lens-protocol/client';
import { fetchAccountsAvailable, fetchAccounts, fetchFollowers, fetchFollowing } from '@lens-protocol/client/actions';
import { testnet } from '@lens-protocol/client';
import { AccountsAvailableRequest, AccountsRequest, Account, AccountAvailable } from '@lens-protocol/client';
import { SocialUser } from '@/types/socialGames';
import { ResultAsync } from '@lens-protocol/client';
import { signMessageWith } from '@lens-protocol/client/viem';
import type { WalletClient } from 'viem';

// GraphQL Fragments for Lens SDK
const AccountStatsFragment = graphql(`
  fragment AccountStats on Account {
    stats {
      followers
      following
      posts
      comments
      mirrors
      reactions
    }
  }
`);

const AccountMetadataFragment = graphql(`
  fragment AccountMetadata on AccountMetadata {
    name
    bio
    picture
    coverPicture
  }
`);

const AccountFragment = graphql(`
  fragment AccountWithStats on Account {
    address
    username {
      value
      namespace
    }
    metadata {
      ...AccountMetadata
    }
    ...AccountStats
  }
`, [AccountMetadataFragment, AccountStatsFragment]);

// Custom type for Account with stats
interface AccountWithStats extends Account {
  stats?: {
    followers: number;
    following: number;
    posts: number;
    comments: number;
    mirrors: number;
    reactions: number;
  };
}

// Lens Client Configuration
export function createLensClient(): PublicClient {
  return PublicClient.create({
    environment: testnet, // or production for mainnet
    storage: typeof window !== 'undefined' ? window.localStorage : undefined, // Persist sessions in browser
    fragments: [AccountFragment],
  });
}

// Default client instance
export const lensClient = createLensClient();

// Test App address for Lens Testnet (from Lens documentation)
const LENS_TEST_APP_ADDRESS = '0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7';

// Authentication types
export interface LensAuthState {
  isAuthenticated: boolean;
  walletAddress?: string;
  profileId?: string;
  sessionClient?: any; // SessionClient type
}

export interface LensLoginOptions {
  walletClient: WalletClient;
  walletAddress: string;
}

// Types derived from Lens SDK
export interface LensAccount {
  address: string;
  score: number;
  metadata?: {
    name?: string;
    bio?: string;
    picture?: string;
    coverPicture?: string;
    attributes?: Array<{
      type: string;
      key: string;
      value: string;
    }>;
  };
  username?: {
    value: string;
    namespace: string;
  };
  operations?: {
    id: string;
    isFollowedByMe: boolean;
    isFollowingMe: boolean;
    isMutedByMe: boolean;
    isBlockedByMe: boolean;
    canFollow: boolean;
    canUnfollow: boolean;
    canBlock: boolean;
    canUnblock: boolean;
    canMute: boolean;
    canUnmute: boolean;
  };
  stats?: {
    followers: number;
    following: number;
    posts: number;
    comments: number;
    mirrors: number;
    quotes: number;
    reactions: number;
  };
}

// Account search and fetching actions
export interface AccountSearchOptions {
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface AccountsByAddressOptions {
  addresses: string[];
}

/**
 * Extract profile picture URL from Lens metadata
 * Handles different formats: URI objects, direct URLs, IPFS links, etc.
 */
function extractLensProfilePicture(metadata?: any): string {
  if (!metadata?.picture) return '';
  
  const picture = metadata.picture;
  
  // Handle URI object format
  if (picture.uri) return picture.uri;
  if (picture.original?.uri) return picture.original.uri;
  
  // Handle direct URL format
  if (typeof picture === 'string') return picture;
  
  // Handle IPFS format
  if (picture.image?.original?.uri) return picture.image.original.uri;
  if (picture.image?.uri) return picture.image.uri;
  
  return '';
}

// Utility functions to convert Lens data to SocialUser format
export function convertLensAccountToSocialUser(account: Account): SocialUser {
  const pfpUrl = extractLensProfilePicture(account.metadata);
  const accountWithStats = account as AccountWithStats;

  return {
    // Universal fields
    id: account.address,
    username: account.username?.value || account.address.slice(0, 10),
    displayName: account.metadata?.name || account.username?.value || 'Unknown',
    pfpUrl: pfpUrl,
    bio: account.metadata?.bio || undefined,
    followerCount: accountWithStats.stats?.followers || 0,
    followingCount: accountWithStats.stats?.following || 0,
    network: 'lens' as const,

    // Lens-specific fields
    ownedBy: account.address,
    lensHandle: account.username?.value ? `${account.username.value}.${account.username.namespace}` : undefined,
    lensProfileId: account.address, // Using address as profile ID for now
    totalPosts: accountWithStats.stats?.posts,
    totalCollects: accountWithStats.stats?.mirrors, // Mirrors are similar to collects in Lens
    totalMirrors: accountWithStats.stats?.mirrors,
    totalComments: accountWithStats.stats?.comments,
    totalReactions: accountWithStats.stats?.reactions,
  };
}

export function convertLensAccountAvailableToSocialUser(accountAvailable: AccountAvailable): SocialUser {
  const account = accountAvailable.account;
  const pfpUrl = extractLensProfilePicture(account.metadata);
  const accountWithStats = account as AccountWithStats;

  return {
    // Universal fields
    id: account.address,
    username: account.username?.value || account.address.slice(0, 10),
    displayName: account.metadata?.name || account.username?.value || 'Unknown',
    pfpUrl: pfpUrl,
    bio: account.metadata?.bio || undefined,
    followerCount: accountWithStats.stats?.followers || 0,
    followingCount: accountWithStats.stats?.following || 0,
    network: 'lens' as const,

    // Lens-specific fields
    ownedBy: account.address,
    lensHandle: account.username?.value ? `${account.username.value}.${account.username.namespace}` : undefined,
    lensProfileId: account.address, // Using address as profile ID for now
    totalPosts: accountWithStats.stats?.posts,
    totalCollects: accountWithStats.stats?.mirrors,
    totalMirrors: accountWithStats.stats?.mirrors,
    totalComments: accountWithStats.stats?.comments,
    totalReactions: accountWithStats.stats?.reactions,
  };
}

// Core Lens actions using the SDK
export class LensActions {
  constructor(private client: PublicClient) {}

  /**
   * Fetch accounts available for a wallet address
   */
  async fetchAccountsAvailable(walletAddress: string): Promise<SocialUser[]> {
    try {
      const request: AccountsAvailableRequest = {
        managedBy: walletAddress,
      };
      
      const result = await fetchAccountsAvailable(this.client, request);
      
      if (result.isErr()) {
        console.error('Error fetching accounts available:', result.error);
        return [];
      }
      
      const accounts = result.value.items || [];
      return accounts.map(convertLensAccountAvailableToSocialUser);
    } catch (error) {
      console.error('Error in fetchAccountsAvailable:', error);
      return [];
    }
  }

  /**
   * Search accounts (currently fetches all and filters client-side)
   */
  async searchAccounts(query: string): Promise<SocialUser[]> {
    try {
      const request: AccountsRequest = {
        // For now, we'll fetch accounts and filter client-side
        // TODO: Update when proper search filters are available in the SDK
      };
      
      const result = await fetchAccounts(this.client, request);
      
      if (result.isErr()) {
        console.error('Error searching accounts:', result.error);
        return [];
      }
      
      const accounts = result.value.items || [];
      const socialUsers = accounts.map(convertLensAccountToSocialUser);
      
      // Client-side filtering by username or display name
      const queryLower = query.toLowerCase();
      return socialUsers.filter(user => 
        user.username.toLowerCase().includes(queryLower) ||
        user.displayName.toLowerCase().includes(queryLower)
      );
    } catch (error) {
      console.error('Error in searchAccounts:', error);
      return [];
    }
  }

  /**
   * Fetch a single account by address
   */
  async fetchAccount(address: string): Promise<SocialUser | null> {
    try {
      const request: AccountsRequest = {
        // TODO: Add address filter when available
      };
      
      const result = await fetchAccounts(this.client, request);
      
      if (result.isErr()) {
        console.error('Error fetching account:', result.error);
        return null;
      }
      
      const accounts = result.value.items || [];
      const account = accounts.find(acc => acc.address === address);
      
      return account ? convertLensAccountToSocialUser(account) : null;
    } catch (error) {
      console.error('Error in fetchAccount:', error);
      return null;
    }
  }

  /**
   * Fetch multiple accounts by addresses (batch operation)
   * Efficiently fetches all accounts and filters by the provided addresses
   */
  async fetchAccountsByAddresses(addresses: string[]): Promise<SocialUser[]> {
    try {
      console.log(`🔍 Fetching ${addresses.length} Lens accounts...`);
      
      const request: AccountsRequest = {
        // Fetch all accounts and filter client-side since SDK doesn't have address filtering yet
      };
      
      const result = await fetchAccounts(this.client, request);
      
      if (result.isErr()) {
        console.error('Error fetching accounts:', result.error);
        return [];
      }
      
      const allAccounts = result.value.items || [];
      const addressSet = new Set(addresses.map(addr => addr.toLowerCase()));
      
      const matchedAccounts = allAccounts.filter(account => 
        addressSet.has(account.address.toLowerCase())
      );
      
      console.log(`✅ Found ${matchedAccounts.length} matching Lens accounts out of ${addresses.length} requested`);
      
      return matchedAccounts.map(convertLensAccountToSocialUser);
    } catch (error) {
      console.error('Error in fetchAccountsByAddresses:', error);
      return [];
    }
  }

  /**
   * Get all available accounts with pagination support
   * Useful for collecting a comprehensive user base
   */
  async fetchAllAccounts(limit: number = 1000): Promise<SocialUser[]> {
    try {
      console.log(`🌿 Fetching up to ${limit} Lens accounts...`);

      const request: AccountsRequest = {
        // SDK handles pagination internally
      };

      const result = await fetchAccounts(this.client, request);

      if (result.isErr()) {
        console.error('Error fetching all accounts:', result.error);
        return [];
      }

      const accounts = result.value.items || [];
      const limitedAccounts = accounts.slice(0, limit);

      console.log(`✅ Retrieved ${limitedAccounts.length} Lens accounts`);

      return limitedAccounts.map(convertLensAccountToSocialUser);
    } catch (error) {
      console.error('Error in fetchAllAccounts:', error);
      return [];
    }
  }

  /**
   * Fetch follower and following counts for a Lens account
   * Uses the proper Lens SDK follow APIs with pagination to get total counts
   */
  async fetchAccountStats(address: string): Promise<{ followers: number; following: number }> {
    try {
      let followersCount = 0;
      let followingCount = 0;
      let cursor: string | undefined;

      // Fetch all followers with pagination
      do {
        const followersResult = await fetchFollowers(this.client, {
          account: address as any,
          cursor: cursor as any
          // Using default pageSize
        });

        if (followersResult.isErr()) break;

        followersCount += followersResult.value.items.length;
        cursor = followersResult.value.pageInfo?.next as string | undefined;
      } while (cursor);

      // Reset cursor for following
      cursor = undefined;

      // Fetch all following with pagination
      do {
        const followingResult = await fetchFollowing(this.client, {
          account: address as any,
          cursor: cursor as any
          // Using default pageSize
        });

        if (followingResult.isErr()) break;

        followingCount += followingResult.value.items.length;
        cursor = followingResult.value.pageInfo?.next as string | undefined;
      } while (cursor);

      return {
        followers: followersCount,
        following: followingCount
      };
    } catch (error) {
      console.error(`Error fetching stats for ${address}:`, error);
      return { followers: 0, following: 0 };
    }
  }
}

// Lens Authentication Service
export class LensAuth {
  private authState: LensAuthState = {
    isAuthenticated: false,
  };
  private sessionClient: any = null;

  constructor(private client: PublicClient) {}

  /**
   * Login with wallet signing
   */
  async login(options: LensLoginOptions): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Starting Lens authentication...');
      
      const authenticated = await this.client.login({
        onboardingUser: {
          app: LENS_TEST_APP_ADDRESS,
          wallet: options.walletAddress,
        },
        signMessage: signMessageWith(options.walletClient),
      });

      if (authenticated.isErr()) {
        console.error('❌ Lens authentication failed:', authenticated.error);
        return { success: false, error: authenticated.error.message || 'Authentication failed' };
      }

      this.sessionClient = authenticated.value;
      this.authState = {
        isAuthenticated: true,
        walletAddress: options.walletAddress,
        sessionClient: this.sessionClient,
      };

      console.log('✅ Lens authentication successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Lens login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown authentication error' 
      };
    }
  }

  /**
   * Resume existing session from storage
   */
  async resumeSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const resumed = await this.client.resumeSession();
      
      if (resumed.isErr()) {
        console.log('📝 No existing Lens session found');
        return { success: false, error: 'No existing session' };
      }

      this.sessionClient = resumed.value;
      
      // Get wallet address from session
      const walletAddress = await this.sessionClient.authentication?.getWalletAddress?.();
      const profileId = await this.sessionClient.authentication?.getProfileId?.();
      
      this.authState = {
        isAuthenticated: true,
        walletAddress: walletAddress || undefined,
        profileId: profileId || undefined,
        sessionClient: this.sessionClient,
      };

      console.log('✅ Lens session resumed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error resuming Lens session:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Session resume failed' 
      };
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.sessionClient?.authentication?.logout) {
        await this.sessionClient.authentication.logout();
      }
    } catch (error) {
      console.error('❌ Error during Lens logout:', error);
    } finally {
      this.sessionClient = null;
      this.authState = {
        isAuthenticated: false,
      };
      console.log('📝 Lens session cleared');
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): LensAuthState {
    return { ...this.authState };
  }

  /**
   * Get authenticated session client
   */
  getSessionClient() {
    return this.sessionClient;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.sessionClient !== null;
  }
}

// Default actions instance
export const lensActions = new LensActions(lensClient);

// Default auth instance
export const lensAuth = new LensAuth(lensClient);
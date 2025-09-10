#!/usr/bin/env tsx
/**
 * Lens User Data Collection Script - Real SDK Integration
 * ENHANCEMENT FIRST: Uses official Lens Protocol SDK for authentic data
 * PERFORMANT: Combines reward data with real Lens profiles
 * CLEAN: No more placeholder/synthetic data
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// DRY: Reuse existing types and services
import { SocialUser } from '../src/types/socialGames';
import { lensActions, LensActions, createLensClient } from '../src/services/lensService';
import { UnifiedUtils } from '../src/utils/platformAdapter';

// Collection interfaces
interface LensRewardRecipient {
  recipient: string;
  amount: string;
  blockNumber: number;
  logIndex: number;
  txHash: string;
}

interface LensDistribution {
  distributionId: string;
  token: string;
  initialAmount: string;
  sentCount: number;
  sentAmount: string;
}

type CollectedLensUser = SocialUser & {
  // Enhanced fields for game optimization
  rewardAmount: string;
  distributionId: string;
  collectedAt: string;
  gameScore: number;
}

/**
 * MODULAR: Self-contained collection system
 * CLEAN: Single responsibility for data collection
 */
export class LensUserCollector {
  private readonly LENSCAN_API = 'https://lenscan.io/api/trpc';
  private readonly OUTPUT_PATH = join(process.cwd(), 'src/data/lensRewardsUsers.json');
  private readonly BATCH_SIZE = 25;
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_DELAY = 1500; // 1.5s between requests
  
  /**
   * PERFORMANT: Main collection orchestrator with progress tracking
   */
  async collectHighQualityUsers(): Promise<void> {
    console.log('🌿 Starting Lens rewards user collection...');
    const startTime = Date.now();
    
    try {
      // 1. Get active distributions (ENHANCEMENT of existing API patterns)
      const distributions = await this.fetchDistributions();
      console.log(`📊 Found ${distributions.length} distributions`);
      
      // 2. Select best distributions for user quality
      const activeDistributions = this.selectBestDistributions(distributions);
      console.log(`🎯 Selected ${activeDistributions.length} high-quality distributions`);
      
      // 3. Collect recipients from each distribution
      const allRecipients: (LensRewardRecipient & { distributionId: string })[] = [];
      for (const dist of activeDistributions) {
        console.log(`📥 Collecting recipients from distribution ${dist.distributionId} (${dist.sentCount} recipients)...`);
        const recipients = await this.fetchDistributionRecipients(dist.distributionId);
        allRecipients.push(...recipients.map(r => ({ ...r, distributionId: dist.distributionId })));

        // PERFORMANT: Rate limiting
        await this.sleep(this.RATE_LIMIT_DELAY);
      }

      console.log(`👥 Collected ${allRecipients.length} total recipients`);

      // 4. Enrich with Lens profile data (ENHANCEMENT of existing Lens integration)
      const enrichedUsers = await this.enrichWithLensProfiles(allRecipients);
      console.log(`✨ Enriched ${enrichedUsers.length} users with Lens profiles`);
      
      // 5. Calculate game suitability scores (ENHANCEMENT for game optimization)
      const scoredUsers = this.calculateGameScores(enrichedUsers);
      
      // 6. Select final high-quality set (CLEAN: single source of truth)
      const finalUsers = this.selectFinalUserSet(scoredUsers);
      
      // 7. Save to static file (DRY: reuse existing data patterns)
      this.saveCollectedUsers(finalUsers);
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Collection complete! ${finalUsers.length} users saved in ${duration.toFixed(1)}s`);
      
    } catch (error) {
      console.error('❌ Collection failed:', error);
      process.exit(1);
    }
  }
  
  /**
   * ENHANCEMENT: Builds on existing distribution fetching
   */
  private async fetchDistributions(): Promise<LensDistribution[]> {
    const input = this.buildTrpcInput({
      "0": { "json": null, "meta": { "values": ["undefined"] } },
      "1": { "json": { "limit": 20 } }
    });
    
    const url = `${this.LENSCAN_API}/rewards.overview,rewards.distributions?batch=1&input=${input}`;
    
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    // Parse tRPC batch response
    if (data.length > 1 && data[1]?.result?.data?.json) {
      return data[1].result.data.json as LensDistribution[];
    }
    
    return [];
  }
  
  /**
   * CLEAN: Core recipient fetching logic
   */
  private async fetchDistributionRecipients(
    distributionId: string, 
    limit: number = 500
  ): Promise<LensRewardRecipient[]> {
    const recipients: LensRewardRecipient[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && recipients.length < limit) {
      const batchLimit = Math.min(this.BATCH_SIZE, limit - recipients.length);
      
      const input = this.buildTrpcInput({
        "0": { "json": { "distributionId": distributionId } },
        "1": { 
          "json": {
            "distributionId": distributionId,
            "limit": batchLimit,
            "cursor": null,
            "page": page,
            "recipient": null,
            "fromBlock": null,
            "toBlock": null,
            "amountMin": null,
            "amountMax": null,
            "logicalBatch": null,
            "sortBy": "amount",
            "sortOrder": "desc"
          },
          "meta": {
            "values": {
              "cursor": ["undefined"],
              "recipient": ["undefined"],
              "fromBlock": ["undefined"],
              "toBlock": ["undefined"],
              "amountMin": ["undefined"],
              "amountMax": ["undefined"]
            }
          }
        }
      });
      
      const url = `${this.LENSCAN_API}/rewards.distributionLogicalBatches,rewards.transfersByDistribution?batch=1&input=${input}`;
      
      try {
        const response = await this.fetchWithRetry(url);
        const data = await response.json();
        
        // Parse transfer data from tRPC response
        if (data.length > 1 && data[1]?.result?.data?.json?.transfers) {
          const batch = data[1].result.data.json.transfers as LensRewardRecipient[];
          recipients.push(...batch);
          
          hasMore = batch.length === batchLimit;
          page++;
          
          console.log(`  📄 Page ${page - 1}: ${batch.length} recipients (${recipients.length} total)`);
        } else {
          hasMore = false;
        }
        
        // PERFORMANT: Rate limiting between pages
        if (hasMore) {
          await this.sleep(this.RATE_LIMIT_DELAY);
        }
        
      } catch (error) {
        console.error(`Failed to fetch page ${page} for distribution ${distributionId}:`, error);
        hasMore = false;
      }
    }
    
    return recipients;
  }
  
  /**
   * ENHANCEMENT: Fetch real Lens profiles using official SDK
   * AUTHENTIC: No synthetic data, only real Lens Protocol users
   */
  private async enrichWithLensProfiles(
    recipients: (LensRewardRecipient & { distributionId: string })[]
  ): Promise<CollectedLensUser[]> {
    const enrichedUsers: CollectedLensUser[] = [];
    
    console.log(`🌿 Fetching authentic Lens profiles using official SDK...`);
    console.log(`📋 Processing ${recipients.length} reward recipients...`);
    
    // Extract unique wallet addresses from recipients
    const walletAddresses = Array.from(new Set(recipients.map(r => r.recipient)));
    console.log(`🏠 Unique wallet addresses: ${walletAddresses.length}`);
    
    // Strategy 1: Try to find existing Lens accounts for these addresses
    const lensUsers = await this.fetchLensProfilesForAddresses(walletAddresses);
    console.log(`🎯 Found ${lensUsers.length} existing Lens accounts`);
    
    // Strategy 2: If we need more users, fetch high-quality Lens accounts from the broader ecosystem
    let allLensUsers = lensUsers;
    if (lensUsers.length < 200) {
      console.log(`📈 Fetching additional high-quality Lens accounts...`);
      const additionalUsers = await this.fetchHighQualityLensAccounts(300 - lensUsers.length);
      allLensUsers = [...lensUsers, ...additionalUsers];
      console.log(`✨ Total Lens accounts: ${allLensUsers.length}`);
    }
    
    // Combine with reward data
    const recipientMap = new Map(recipients.map(r => [r.recipient.toLowerCase(), r]));
    
    for (const lensUser of allLensUsers) {
      // Type guard to check if this is a Lens user and get appropriate identifier
      const ownedBy = lensUser.network === 'lens' && 'ownedBy' in lensUser ? (lensUser as any).ownedBy : undefined;
      const userId = lensUser.network === 'lens' && 'id' in lensUser ? (lensUser as any).id : (lensUser as any).fid?.toString();
      const rewardData = recipientMap.get(ownedBy?.toLowerCase() || userId?.toLowerCase());
      
      const enrichedUser: CollectedLensUser = {
        ...lensUser,
        rewardAmount: rewardData?.amount || '0',
        distributionId: rewardData?.distributionId || 'ecosystem',
        collectedAt: new Date().toISOString(),
        gameScore: 0 // Will be calculated later
      };
      
      enrichedUsers.push(enrichedUser);
    }
    
    console.log(`✅ Successfully enriched ${enrichedUsers.length} authentic Lens users`);
    return enrichedUsers;
  }
  
  /**
   * Fetch Lens profiles using Web3.bio API (better than Lens SDK for follower data)
   */
  private async fetchLensProfilesForAddresses(addresses: string[]): Promise<SocialUser[]> {
    const profiles: SocialUser[] = [];

    console.log(`🌐 Fetching profiles from Web3.bio API for ${addresses.length} addresses...`);

    // Process addresses in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);

      const batchPromises = batch.map(async (address) => {
        try {
          const response = await fetch(`https://api.web3.bio/profile/lens/${address}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'LubMatch/1.0'
            }
          });

          if (!response.ok) return null;

          const data = await response.json();

          // Only process if it's a valid Lens profile
          if (data && data.platform === 'lens' && data.identity) {
            return {
              id: data.address,
              username: `lens/${data.identity.replace('.lens', '')}`,
              displayName: data.displayName || data.identity.replace('.lens', ''),
              pfpUrl: data.avatar || '',
              bio: data.description || '',
              followerCount: data.social?.follower || 0,
              followingCount: data.social?.following || 0,
              network: 'lens' as const,
              lensHandle: data.identity,
              lensProfileId: data.address,
              ownedBy: data.address
            } as SocialUser & { ownedBy?: string; lensHandle?: string; lensProfileId?: string; };
          }

          return null;
        } catch (error) {
          // Silently handle individual address failures
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validProfiles = batchResults.filter(profile => profile !== null) as SocialUser[];
      profiles.push(...validProfiles);

      console.log(`  📄 Batch ${Math.floor(i/batchSize) + 1}: Found ${validProfiles.length} valid Lens profiles`);

      // Rate limiting
      if (i + batchSize < addresses.length) {
        await this.sleep(1000); // 1 second between batches
      }
    }

    console.log(`✅ Found ${profiles.length} valid Lens profiles out of ${addresses.length} addresses`);
    return profiles;
  }
  
  /**
   * Fetch high-quality Lens accounts from the broader ecosystem
   */
  private async fetchHighQualityLensAccounts(limit: number): Promise<SocialUser[]> {
    try {
      console.log(`🌟 Fetching ${limit} high-quality Lens ecosystem accounts...`);
      
      // Fetch from the general Lens ecosystem 
      const allAccounts = await lensActions.fetchAllAccounts(limit * 2); // Fetch more to filter for quality
      
      // Filter for accounts (relaxed criteria to find more users from rewards recipients)
      const qualityAccounts = allAccounts
        .filter(user => {
          // ESSENTIAL: Must have profile picture and username
          const hasBasicProfile = user.pfpUrl &&
                                  user.pfpUrl !== '' &&
                                  user.username;

          // BASIC: Must have a display name (allow "Temporary Name" for now)
          const hasDisplayName = user.displayName &&
                                user.displayName.length > 1;

          // BASIC: Username should not look like a test account
          const isNotTestAccount = !user.username.includes('qa-') &&
                                  !user.username.includes('test') &&
                                  !user.username.includes('newaccount') &&
                                  !user.username.includes('orb_');

          // RELAXED: Just require basic profile elements
          return hasBasicProfile && hasDisplayName && isNotTestAccount;
        })
        .slice(0, limit);

      // Fetch follower stats for quality accounts
      const accountsWithStats = await Promise.all(
        qualityAccounts.map(async (account) => {
          const accountId = account.network === 'lens' && 'id' in account ? (account as any).id : (account as any).fid?.toString();
          const stats = await lensActions.fetchAccountStats(accountId);
          return {
            ...account,
            followerCount: stats.followers,
            followingCount: stats.following
          };
        })
      );
      
      console.log(`🔍 Filtered to ${accountsWithStats.length} high-quality accounts with follower stats`);
      return accountsWithStats;
      
    } catch (error) {
      console.error('❌ Error fetching high-quality Lens accounts:', error);
      return [];
    }
  }
  
  /**
   * ENHANCEMENT: Game-specific scoring for authentic Lens profiles
   */
  private calculateGameScores(users: CollectedLensUser[]): CollectedLensUser[] {
    console.log(`🎦 Calculating game suitability scores for ${users.length} users...`);
    
    return users.map(user => {
      let score = 0;

      // Profile completeness (essential for visual games)
      if (user.pfpUrl && user.pfpUrl !== '') score += 25; // Profile image is crucial
      if (user.bio && user.bio.length > 20) score += 20; // Good bio content
      if (user.displayName && user.displayName !== user.username) score += 15; // Custom display name
      
      // Lens-specific properties (only for Lens users)
      if (user.network === 'lens') {
        const lensUser = user as any;
        if (lensUser.lensHandle && lensUser.lensHandle.includes('.')) score += 10; // Has proper Lens handle
        if (lensUser.totalPosts && lensUser.totalPosts > 0) {
          const postBonus = Math.min(Math.log10(lensUser.totalPosts + 1) * 5, 15);
          score += postBonus;
        }
      }

      // Social engagement (for whale classification in games) - IMPROVED
      if (user.followerCount > 0) {
        const followerBonus = Math.min(Math.log10(user.followerCount) * 10, 30);
        score += followerBonus;
      }

      // Following activity (shows real user engagement)
      if (user.followingCount > 0) {
        const followingBonus = Math.min(Math.log10(user.followingCount) * 5, 15);
        score += followingBonus;
      }

      // This is now handled above in the Lens-specific section

      // Reward activity (ecosystem engagement bonus)
      const rewardAmount = parseFloat(user.rewardAmount || '0');
      if (rewardAmount > 0) {
        const rewardBonus = Math.min(Math.log10(rewardAmount / 1e18) * 3, 10); // Convert from wei
        score += Math.max(rewardBonus, 0);
      }

      // Quality bonus for complete, authentic profiles - IMPROVED
      if (score > 60) score += 15; // Higher threshold for quality bonus
      if (user.followerCount > 100) score += 10; // Bonus for established accounts

      return { ...user, gameScore: Math.round(Math.max(score, 0)) };
    });
  }
  
  /**
   * CLEAN: Final user set selection with quality distribution
   */
  private selectFinalUserSet(users: CollectedLensUser[]): CollectedLensUser[] {
    // AGGRESSIVE CONSOLIDATION: Use unified deduplication utility
    const uniqueUsers = users.reduce((acc, user) => {
      const existing = acc.find(u => u.username === user.username);
      if (!existing) {
        acc.push(user);
      } else if (user.gameScore > existing.gameScore) {
        // Keep the version with higher game score
        const index = acc.findIndex(u => u.username === user.username);
        acc[index] = user;
      }
      return acc;
    }, [] as CollectedLensUser[]);
    
    console.log(`🧹 Deduplicated: ${users.length} → ${uniqueUsers.length} unique users`);
    
    // Sort by game score
    const sortedUsers = uniqueUsers.sort((a, b) => b.gameScore - a.gameScore);
    
    // ENHANCEMENT: Select diverse whale distribution for better games
    const targetTotal = 300; // Target collection size
    
    // Select users - RELAXED QUALITY THRESHOLD to include more reward recipients
    const topUsers = sortedUsers
      .filter(user => user.gameScore > 20) // Lower threshold to include more users
      .slice(0, targetTotal);
    
    console.log(`🎯 Selected ${topUsers.length} users for final set (avg score: ${(topUsers.reduce((sum, u) => sum + u.gameScore, 0) / topUsers.length).toFixed(1)})`);
    
    return topUsers;
  }
  
  /**
   * DRY: Save using existing data file patterns
   */
  private saveCollectedUsers(users: CollectedLensUser[]): void {
    const output = {
      collectedAt: new Date().toISOString(),
      version: '1.0.0',
      count: users.length,
      users: users
    };
    
    writeFileSync(this.OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`💾 Saved ${users.length} users to ${this.OUTPUT_PATH}`);
  }
  
  // Helper methods
  
  private selectBestDistributions(distributions: LensDistribution[]): LensDistribution[] {
    return distributions
      .filter(d => d.sentCount > 50) // At least 50 recipients
      .sort((a, b) => b.sentCount - a.sentCount)
      .slice(0, 3); // Top 3 most active
  }
  
  private buildTrpcInput(input: any): string {
    return encodeURIComponent(JSON.stringify(input));
  }
  
  private async fetchWithRetry(url: string, retries = this.MAX_RETRIES): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; LubMatch/1.0)',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.sleep(1000 * (i + 1)); // Exponential backoff
      }
    }
    throw new Error('All retries failed');
  }
  
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// MODULAR: CLI execution
if (require.main === module) {
  const collector = new LensUserCollector();
  collector.collectHighQualityUsers().catch(console.error);
}

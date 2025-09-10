import { FarcasterUser } from "@/types/socialGames";

interface CacheEntry {
  data: FarcasterUser[];
  timestamp: number;
  expiresAt: number;
}

interface ApiLimiter {
  requests: number;
  windowStart: number;
  isBlocked: boolean;
}

class NeynarCache {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly API_RATE_LIMIT = 100; // per hour
  private readonly RATE_WINDOW = 60 * 60 * 1000; // 1 hour
  private limiter: ApiLimiter = { requests: 0, windowStart: Date.now(), isBlocked: false };

  // Tiered TTL strategy based on content type
  private readonly CACHE_TTLS = {
    trending: 3 * 60 * 1000,    // 3 minutes for trending content
    active: 5 * 60 * 1000,      // 5 minutes for active users  
    quality: 15 * 60 * 1000,    // 15 minutes for curated quality users
    search: 2 * 60 * 1000,      // 2 minutes for search results
    default: 10 * 60 * 1000     // 10 minutes default
  };

  private generateKey(params: Record<string, any>): string {
    return JSON.stringify(params, Object.keys(params).sort());
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.limiter.windowStart > this.RATE_WINDOW) {
      this.limiter.requests = 0;
      this.limiter.windowStart = now;
      this.limiter.isBlocked = false;
    }

    // Check if we're at limit
    if (this.limiter.requests >= this.API_RATE_LIMIT) {
      this.limiter.isBlocked = true;
      return false;
    }

    return true;
  }

  private incrementRateLimit(): void {
    this.limiter.requests++;
  }

  get(params: Record<string, any>): FarcasterUser[] | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (entry && entry.expiresAt > Date.now()) {
      console.log(`🎯 Neynar cache hit for: ${key}`);
      return entry.data;
    }

    if (entry) {
      this.cache.delete(key); // Remove expired
    }

    return null;
  }

  set(params: Record<string, any>, data: FarcasterUser[]): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanExpiredEntries();
      
      // If still at capacity, remove oldest
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
    }

    const key = this.generateKey(params);
    const now = Date.now();
    
    // Determine TTL based on request type
    const requestType = params.type as keyof typeof this.CACHE_TTLS || 'default';
    const ttl = this.CACHE_TTLS[requestType] || this.CACHE_TTLS.default;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });

    console.log(`💾 Cached Neynar data for: ${key} (${data.length} users, TTL: ${ttl/1000/60}min)`);
  }

  canMakeRequest(): boolean {
    return this.checkRateLimit();
  }

  recordRequest(): void {
    this.incrementRateLimit();
  }

  getRateLimitStatus(): { requests: number; limit: number; resetIn: number; isBlocked: boolean } {
    const resetIn = this.RATE_WINDOW - (Date.now() - this.limiter.windowStart);
    return {
      requests: this.limiter.requests,
      limit: this.API_RATE_LIMIT,
      resetIn: Math.max(0, resetIn),
      isBlocked: this.limiter.isBlocked
    };
  }

  clear(): void {
    this.cache.clear();
    console.log('🧹 Neynar cache cleared');
  }

  // Cache invalidation - remove specific entries
  invalidate(params: Record<string, any>): void {
    const key = this.generateKey(params);
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache invalidated: ${key}`);
    }
  }

  // Cache invalidation by pattern (useful for clearing related entries)
  invalidateByType(type: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      try {
        const parsedKey = JSON.parse(key);
        if (parsedKey.type === type) {
          keysToDelete.push(key);
        }
      } catch {
        // Skip malformed keys
        continue;
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
    
    if (keysToDelete.length > 0) {
      console.log(`🗑️ Cache invalidated ${keysToDelete.length} entries for type: ${type}`);
    }
  }

  // Cache warming - pre-populate with frequently accessed data
  async warmUp(): Promise<void> {
    if (!this.canMakeRequest()) {
      console.warn('⚠️ Skipping cache warm-up due to rate limiting');
      return;
    }

    console.log('🔥 Starting cache warm-up...');
    
    try {
      // Warm up the most frequently requested data types
      const warmUpTasks = [
        this.preFetch({ type: 'trending', count: 20 }),
        this.preFetch({ type: 'active', count: 15 }),
        this.preFetch({ type: 'quality', count: 15 })
      ];

      await Promise.allSettled(warmUpTasks);
      console.log('✅ Cache warm-up completed');
    } catch (error) {
      console.error('❌ Cache warm-up failed:', error);
    }
  }

  // Pre-fetch data and store in cache
  private async preFetch(params: Record<string, any>): Promise<void> {
    try {
      // Build query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      const endpoint = `/api/farcaster-users?${queryString}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Pre-fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Store in cache using the same key generation as normal requests
      this.set(params, data);
      this.recordRequest(); // Track API usage
      
      console.log(`🎯 Pre-fetched and cached: ${JSON.stringify(params)} (${data.length} users)`);
      
    } catch (error) {
      console.error(`Failed to pre-fetch ${JSON.stringify(params)}:`, error);
    }
  }

  getStats(): { size: number; hits: number; rateLimit: any } {
    return {
      size: this.cache.size,
      hits: 0, // We could track this if needed
      rateLimit: this.getRateLimitStatus()
    };
  }
}

export const neynarCache = new NeynarCache();
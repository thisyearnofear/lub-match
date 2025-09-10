import { neynarCache } from './neynarCache';

/**
 * Cache Warming Utility
 * 
 * This utility provides functions to warm up the application cache
 * with frequently accessed data, improving performance for users.
 */

let isWarming = false;

/**
 * Initialize cache warming on application startup
 * Safe to call multiple times - includes guard against concurrent warming
 */
export async function initCacheWarmup(): Promise<void> {
  if (isWarming) {
    console.log('⏳ Cache warm-up already in progress, skipping...');
    return;
  }

  // Only warm up in production or when explicitly enabled
  const shouldWarmUp = process.env.NODE_ENV === 'production' || 
                      process.env.ENABLE_CACHE_WARMING === 'true';

  if (!shouldWarmUp) {
    console.log('🔄 Cache warm-up disabled for development');
    return;
  }

  try {
    isWarming = true;
    await neynarCache.warmUp();
  } catch (error) {
    console.error('❌ Cache warm-up initialization failed:', error);
  } finally {
    isWarming = false;
  }
}

/**
 * Manual cache refresh - useful for scheduled tasks or admin operations
 */
export async function refreshCache(): Promise<void> {
  console.log('🔄 Manual cache refresh triggered');
  
  try {
    // Clear existing cache
    neynarCache.clear();
    
    // Re-warm with fresh data
    await neynarCache.warmUp();
    
    console.log('✅ Manual cache refresh completed');
  } catch (error) {
    console.error('❌ Manual cache refresh failed:', error);
  }
}

/**
 * Get cache health status for monitoring
 */
export function getCacheHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  stats: any;
  recommendations?: string[];
} {
  const stats = neynarCache.getStats();
  const recommendations: string[] = [];
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Check cache size
  if (stats.size === 0) {
    status = 'unhealthy';
    recommendations.push('Cache is empty - consider running warm-up');
  } else if (stats.size < 3) {
    status = 'degraded';
    recommendations.push('Cache size is low - may need more frequent warming');
  }
  
  // Check rate limiting
  if (stats.rateLimit.isBlocked) {
    status = 'degraded';
    recommendations.push(`Rate limited - resets in ${Math.ceil(stats.rateLimit.resetIn / 1000 / 60)} minutes`);
  }
  
  return {
    status,
    stats,
    ...(recommendations.length > 0 && { recommendations })
  };
}

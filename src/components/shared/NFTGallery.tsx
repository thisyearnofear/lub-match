"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHeartNFT, HeartData, CollectionStats } from "@/hooks/useHeartNFT";
import { useAccount } from "wagmi";
import { ContractInfo } from "./ContractInfo";
import { SocialUser } from "@/types/socialGames";
import { calculateCollectionRarity, getPlatformStyling, getRarityStyling } from "@/utils/socialInfluenceCalculator";

// PERFORMANT: Use unified caching system
import { neynarCache } from "@/utils/neynarCache";

interface NFTItem {
  tokenId: bigint;
  heartData: HeartData;
  rarity?: string;
}

interface NFTGalleryProps {
  className?: string;
  onNFTClick?: (nft: NFTItem) => void;
  // ENHANCEMENT FIRST: Platform filtering and sorting
  showFilters?: boolean;
  defaultFilter?: 'all' | 'farcaster' | 'lens' | 'mixed';
  defaultSort?: 'date' | 'rarity' | 'influence';
}

export function NFTGallery({ 
  className = "", 
  onNFTClick, 
  showFilters = true,
  defaultFilter = 'all',
  defaultSort = 'date'
}: NFTGalleryProps) {
  const {
    getUserNFTCollection,
    nftBalance,
    getCollectionStats,
    getHeartRarity,
    getTotalSupply,
  } = useHeartNFT();
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectionStats, setCollectionStats] =
    useState<CollectionStats | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);
  
  // ENHANCEMENT FIRST: Filtering and sorting state
  const [activeFilter, setActiveFilter] = useState<'all' | 'farcaster' | 'lens' | 'mixed'>(defaultFilter);
  const [activeSort, setActiveSort] = useState<'date' | 'rarity' | 'influence'>(defaultSort);
  
  // Refs for cleanup and debouncing
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Create cache key for current user
  const cacheKey = useMemo(() => address ? `nft-${address}-${nftBalance?.toString()}` : null, [address, nftBalance]);

  // Optimized NFT loading with caching and debouncing
  const loadNFTs = useCallback(async (forceRefresh = false) => {
    if (!isConnected || nftBalance === BigInt(0) || !cacheKey) {
      setNfts([]);
      return;
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // PERFORMANT: Check unified cache first
    const cacheParams = { type: 'nft', address, balance: nftBalance?.toString() };
    const cached = neynarCache.get(cacheParams);
    
    if (!forceRefresh && cached) {
      console.log('🎯 Using cached NFT data');
      // Parse cached NFT data (stored as FarcasterUser[], adapt for NFTs)
      const cachedNFTs = (cached as any).nftData || [];
      setNfts(cachedNFTs);
      if ((cached as any).stats) setCollectionStats((cached as any).stats);
      if ((cached as any).totalSupply) setTotalSupply((cached as any).totalSupply);
      return;
    }

    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce loading indicator
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(true);
    }, 200);

    setError(null);

    try {
      const collection = await getUserNFTCollection();

      // Batch rarity fetching with error handling and limits
      const enhancedCollection = await Promise.allSettled(
        collection.slice(0, 20).map(async (nft) => { // Limit to 20 for performance
          try {
            const rarity = await getHeartRarity(nft.tokenId);
            
            // ENHANCEMENT FIRST: Calculate social influence if users data available
            let socialInfluence = null;
            let networkType: 'farcaster' | 'lens' | 'mixed' = 'farcaster';
            
            if (nft.heartData.usernames && nft.heartData.usernames.length > 0) {
              // Reconstruct social users from heart data (simplified)
              const socialUsers: SocialUser[] = nft.heartData.usernames.map((username, index) => ({
                fid: index + 1, // Add required fid for Farcaster users
                username,
                displayName: username,
                pfpUrl: nft.heartData.imageHashes?.[index] || '',
                bio: '',
                followerCount: nft.heartData.userFollowers?.[index] || 0,
                followingCount: 0,
                network: 'farcaster' as const
              } as SocialUser));
              
              socialInfluence = calculateCollectionRarity(socialUsers);
              
              // Determine network type based on data patterns
              const platforms = new Set(['farcaster']); // Simplified for now
              networkType = platforms.size > 1 ? 'mixed' : 'farcaster';
            }
            
            return { 
              ...nft, 
              rarity: rarity || undefined,
              socialInfluence,
              networkType
            };
          } catch (error) {
            // Gracefully handle rarity fetch failures
            return nft;
          }
        })
      );

      // Filter successful results
      const validNFTs = enhancedCollection
        .filter((result): result is PromiseFulfilledResult<NFTItem & { socialInfluence?: any; networkType?: string }> => result.status === 'fulfilled')
        .map(result => result.value);

      // PERFORMANT: Cache using unified system
      const cacheData = { 
        nftData: validNFTs,
        timestamp: Date.now()
      } as any;
      neynarCache.set(cacheParams, [cacheData]); // Adapt to FarcasterUser[] format

      setNfts(validNFTs);
      
      // Load stats in background without blocking UI
      Promise.allSettled([
        getCollectionStats().catch(() => null),
        getTotalSupply().catch(() => null),
      ]).then(([statsResult, supplyResult]) => {
        const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
        const supply = supplyResult.status === 'fulfilled' ? supplyResult.value : null;
        
        setCollectionStats(stats);
        setTotalSupply(supply);
        
        // PERFORMANT: Update unified cache with stats
        const existingCache = neynarCache.get(cacheParams);
        if (existingCache && existingCache[0]) {
          const updatedCacheData = {
            ...existingCache[0],
            stats,
            totalSupply: supply,
          };
          neynarCache.set(cacheParams, [updatedCacheData]);
        }
      });

    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.error("Error loading NFT collection:", err);
        setError("Failed to load NFT collection. Please try again.");
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setLoading(false);
    }
  }, [getUserNFTCollection, isConnected, nftBalance, getHeartRarity, cacheKey, getCollectionStats, getTotalSupply]);

  useEffect(() => {
    loadNFTs();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loadNFTs]);

  // Refresh function for manual refresh (e.g., pull-to-refresh)
  const refreshNFTs = useCallback(() => {
    loadNFTs(true);
  }, [loadNFTs]);
  
  // ENHANCEMENT FIRST: Filtered and sorted NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = [...nfts];
    
    // Apply platform filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(nft => {
        const networkType = (nft as any).networkType || 'farcaster';
        return networkType === activeFilter;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (activeSort) {
        case 'rarity':
          const aRarity = (a as any).socialInfluence?.score || 0;
          const bRarity = (b as any).socialInfluence?.score || 0;
          return bRarity - aRarity;
        case 'influence':
          const aInfluence = a.heartData.userFollowers?.reduce((sum, count) => sum + Number(count), 0) || 0;
          const bInfluence = b.heartData.userFollowers?.reduce((sum, count) => sum + Number(count), 0) || 0;
          return bInfluence - aInfluence;
        case 'date':
        default:
          return Number(b.heartData.completedAt) - Number(a.heartData.completedAt);
      }
    });
    
    return filtered;
  }, [nfts, activeFilter, activeSort]);

  if (!isConnected) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">🔗</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Connect Wallet
        </h3>
        <p className="text-gray-600 text-sm">
          Connect your wallet to view your NFT collection
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">⏳</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Loading Collection
        </h3>
        <p className="text-gray-600 text-sm">
          Fetching your NFTs from the blockchain...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-600 mb-2">
          Error Loading Collection
        </h3>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={refreshNFTs}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">💝</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Hearts Yet
        </h3>
        <p className="text-gray-600 text-sm">
          Complete a lub game and mint your first Heart NFT!
        </p>
      </div>
    );
  }

  return (
    <div className={`nft-gallery ${className}`}>
      {/* Collection Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Your Heart Collection
        </h3>
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <span>
            {filteredAndSortedNFTs.length} NFT{filteredAndSortedNFTs.length !== 1 ? "s" : ""} shown
          </span>
          <span>• {nfts.length} total owned</span>
          {totalSupply && <span>• {totalSupply.toString()} total minted</span>}
        </div>
        
        {/* ENHANCEMENT FIRST: Filters and Sorting */}
        {showFilters && (
          <div className="mt-3 space-y-3">
            {/* Platform Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-gray-700 mr-2">Filter:</span>
              {[
                { key: 'all', label: 'All', icon: '🌟' },
                { key: 'farcaster', label: 'Farcaster', icon: '🟣' },
                { key: 'lens', label: 'Lens', icon: '🌿' },
                { key: 'mixed', label: 'Cross-Platform', icon: '🌈' },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeFilter === key
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            
            {/* Sort Options */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-gray-700 mr-2">Sort:</span>
              {[
                { key: 'date', label: 'Latest', icon: '📅' },
                { key: 'rarity', label: 'Rarity', icon: '💎' },
                { key: 'influence', label: 'Influence', icon: '📈' },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveSort(key as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeSort === key
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collection Stats (if available) */}
        {collectionStats && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <div className="font-semibold text-purple-700">
                {collectionStats.totalCustomHearts.toString()}
              </div>
              <div className="text-purple-600">Custom</div>
            </div>
            <div className="bg-pink-50 rounded-lg p-2 text-center">
              <div className="font-semibold text-pink-700">
                {collectionStats.totalDemoHearts.toString()}
              </div>
              <div className="text-pink-600">Demo</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="font-semibold text-blue-700">
                {collectionStats.totalVerifiedHearts.toString()}
              </div>
              <div className="text-blue-600">Verified</div>
            </div>
          </div>
        )}
      </div>

      {/* Contract Info */}
      <div className="mb-4">
        <ContractInfo variant="minimal" />
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {filteredAndSortedNFTs.map((nft, index) => (
            <NFTCard
              key={nft.tokenId.toString()}
              nft={nft as any}
              index={index}
              onClick={() => onNFTClick?.(nft)}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* No Results Message */}
      {filteredAndSortedNFTs.length === 0 && nfts.length > 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No NFTs Match Filter
          </h3>
          <p className="text-gray-600 text-sm">
            Try adjusting your filter or sort options
          </p>
        </div>
      )}
    </div>
  );
}

interface NFTCardProps {
  nft: NFTItem & { socialInfluence?: any; networkType?: string };
  index: number;
  onClick?: () => void;
}

function NFTCard({ nft, index, onClick }: NFTCardProps) {
  const { heartData, rarity, socialInfluence, networkType } = nft;
  const isDemo = heartData.gameType === "demo";
  
  // ENHANCEMENT FIRST: Platform-specific styling
  const platformStyling = getPlatformStyling(networkType as any || 'farcaster');
  const rarityStyling = socialInfluence ? getRarityStyling(socialInfluence.tier) : null;

  // Calculate social metrics if available
  const totalFollowers =
    heartData.userFollowers?.reduce((sum, count) => sum + Number(count), 0) ||
    0;
  const verifiedCount = heartData.userVerified?.filter(Boolean).length || 0;
  const avgFollowers = heartData.userFollowers?.length
    ? Math.round(totalFollowers / heartData.userFollowers.length)
    : 0;

  // Rarity color mapping (legacy support)
  const getRarityColor = (rarity: string) => {
    if (rarity.includes("Legendary")) return "from-yellow-400 to-orange-500";
    if (rarity.includes("Ultra Rare")) return "from-purple-400 to-pink-500";
    if (rarity.includes("Rare")) return "from-blue-400 to-purple-500";
    if (rarity.includes("Uncommon")) return "from-green-400 to-blue-500";
    return "from-gray-400 to-gray-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-gradient-to-br ${platformStyling.backgroundColor} rounded-xl p-3 border ${platformStyling.borderColor} cursor-pointer hover:shadow-lg transition-all ${rarityStyling?.glow || ''}`}
      onClick={onClick}
    >
      {/* NFT Preview */}
      <div className={`aspect-square bg-gradient-to-br ${platformStyling.backgroundColor} rounded-lg mb-3 flex items-center justify-center relative overflow-hidden ${rarityStyling?.border || ''}`}>
        <div className="text-2xl">💝</div>
        {/* Heart shape overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${platformStyling.primaryColor}/20 rounded-lg`} />
        
        {/* Platform Badge */}
        <div className={`absolute top-1 left-1 w-6 h-6 bg-gradient-to-r ${platformStyling.primaryColor} rounded-full flex items-center justify-center text-xs text-white shadow-lg`}>
          {platformStyling.icon}
        </div>

        {/* Rarity badge */}
        {(rarity || socialInfluence) && (
          <div
            className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${
              socialInfluence ? 
                (socialInfluence.tier === 'Legendary' ? 'from-yellow-400 to-orange-500' :
                 socialInfluence.tier === 'Epic' ? 'from-purple-400 to-pink-500' :
                 socialInfluence.tier === 'Rare' ? 'from-blue-400 to-cyan-500' :
                 'from-green-400 to-emerald-500') :
                getRarityColor(rarity || '')
            }`}
          >
            {socialInfluence ? socialInfluence.tier.charAt(0) : rarity?.split(" ")[0]}
          </div>
        )}
        
        {/* Cross-platform indicator */}
        {networkType === 'mixed' && (
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-gradient-to-r from-purple-500 via-pink-500 to-green-500 rounded-full flex items-center justify-center text-xs text-white shadow-lg">
            🌈
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${platformStyling.textColor}`}>
            {networkType === 'mixed' ? 'Cross-Platform' : platformStyling.name} {isDemo ? "Demo" : "Custom"}
          </span>
          <span className="text-xs text-gray-500">
            #{nft.tokenId.toString()}
          </span>
        </div>
        
        {/* Social Influence Score */}
        {socialInfluence && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Influence:</span>
            <span className={`font-semibold ${rarityStyling?.text || 'text-gray-700'}`}>
              {socialInfluence.score} pts
            </span>
          </div>
        )}

        {/* Social Metrics (if available) */}
        {avgFollowers > 0 && (
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="bg-gray-50 rounded p-1 text-center">
              <div className="font-semibold text-gray-700">
                {avgFollowers.toLocaleString()}
              </div>
              <div className="text-gray-500 text-xs">Avg Followers</div>
            </div>
            <div className="bg-gray-50 rounded p-1 text-center">
              <div className="font-semibold text-gray-700">{verifiedCount}</div>
              <div className="text-gray-500 text-xs">Verified</div>
            </div>
          </div>
        )}

        {/* Featured Users (if available) */}
        {heartData.usernames && heartData.usernames.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Featured: </span>
            {heartData.usernames
              .slice(0, 2)
              .map((username) => `@${username}`)
              .join(", ")}
            {heartData.usernames.length > 2 &&
              ` +${heartData.usernames.length - 2}`}
          </div>
        )}

        {/* Message or Date */}
        {!isDemo && heartData.message ? (
          <p className="text-xs text-gray-600 truncate italic">
            "{heartData.message}"
          </p>
        ) : (
          <div className="text-xs text-gray-500">
            {new Date(
              Number(heartData.completedAt) * 1000
            ).toLocaleDateString()}
          </div>
        )}
        
        {/* Platform-specific achievements */}
        {socialInfluence?.factors.crossPlatform && (
          <div className="text-xs text-center">
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-green-500 text-white px-2 py-1 rounded-full font-medium">
              Cross-Platform Pioneer
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default NFTGallery;

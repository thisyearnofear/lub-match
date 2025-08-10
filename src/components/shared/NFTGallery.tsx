"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHeartNFT, HeartData, CollectionStats } from "@/hooks/useHeartNFT";
import { useAccount } from "wagmi";
import { ContractInfo } from "./ContractInfo";

// Cache for NFT data to prevent excessive API calls
const nftCache = new Map<string, {
  data: any;
  timestamp: number;
  stats?: CollectionStats | null;
  totalSupply?: bigint | null;
}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

interface NFTItem {
  tokenId: bigint;
  heartData: HeartData;
  rarity?: string;
}

interface NFTGalleryProps {
  className?: string;
  onNFTClick?: (nft: NFTItem) => void;
}

export function NFTGallery({ className = "", onNFTClick }: NFTGalleryProps) {
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

    // Check cache first
    const cached = nftCache.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cached && now - cached.timestamp < CACHE_DURATION) {
      console.log('🎯 Using cached NFT data');
      setNfts(cached.data);
      if (cached.stats !== undefined) setCollectionStats(cached.stats);
      if (cached.totalSupply !== undefined) setTotalSupply(cached.totalSupply);
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
            return { ...nft, rarity: rarity || undefined };
          } catch (error) {
            // Gracefully handle rarity fetch failures
            return nft;
          }
        })
      );

      // Filter successful results
      const validNFTs = enhancedCollection
        .filter((result): result is PromiseFulfilledResult<NFTItem> => result.status === 'fulfilled')
        .map(result => result.value);

      // Cache the results
      nftCache.set(cacheKey, {
        data: validNFTs,
        timestamp: now,
      });

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
        
        // Update cache with stats
        if (nftCache.has(cacheKey)) {
          const existing = nftCache.get(cacheKey)!;
          nftCache.set(cacheKey, {
            ...existing,
            stats,
            totalSupply: supply,
          });
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
            {nfts.length} NFT{nfts.length !== 1 ? "s" : ""} owned
          </span>
          {totalSupply && <span>• {totalSupply.toString()} total minted</span>}
        </div>

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
          {nfts.map((nft, index) => (
            <NFTCard
              key={nft.tokenId.toString()}
              nft={nft}
              index={index}
              onClick={() => onNFTClick?.(nft)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface NFTCardProps {
  nft: NFTItem;
  index: number;
  onClick?: () => void;
}

function NFTCard({ nft, index, onClick }: NFTCardProps) {
  const { heartData, rarity } = nft;
  const isDemo = heartData.gameType === "demo";

  // Calculate social metrics if available
  const totalFollowers =
    heartData.userFollowers?.reduce((sum, count) => sum + Number(count), 0) ||
    0;
  const verifiedCount = heartData.userVerified?.filter(Boolean).length || 0;
  const avgFollowers = heartData.userFollowers?.length
    ? Math.round(totalFollowers / heartData.userFollowers.length)
    : 0;

  // Rarity color mapping
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
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200 cursor-pointer hover:shadow-lg transition-all"
      onClick={onClick}
    >
      {/* NFT Preview */}
      <div className="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
        <div className="text-2xl">💝</div>
        {/* Heart shape overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-lg" />

        {/* Rarity badge */}
        {rarity && (
          <div
            className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getRarityColor(
              rarity
            )}`}
          >
            {rarity.split(" ")[0]}
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-purple-700">
            {isDemo ? "Demo Lub" : "Custom Lub"}
          </span>
          <span className="text-xs text-gray-500">
            #{nft.tokenId.toString()}
          </span>
        </div>

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
      </div>
    </motion.div>
  );
}

export default NFTGallery;

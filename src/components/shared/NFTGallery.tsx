"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHeartNFT, HeartData } from "@/hooks/useHeartNFT";
import { useAccount } from "wagmi";

interface NFTItem {
  tokenId: bigint;
  heartData: HeartData;
}

interface NFTGalleryProps {
  className?: string;
  onNFTClick?: (nft: NFTItem) => void;
}

export function NFTGallery({ className = "", onNFTClick }: NFTGalleryProps) {
  const { getUserNFTCollection, nftBalance } = useHeartNFT();
  const { isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || nftBalance === BigInt(0)) {
      setNfts([]);
      return;
    }

    const loadNFTs = async () => {
      setLoading(true);
      setError(null);
      try {
        const collection = await getUserNFTCollection();
        setNfts(collection);
      } catch (err) {
        console.error("Error loading NFT collection:", err);
        setError("Failed to load NFT collection");
      } finally {
        setLoading(false);
      }
    };

    loadNFTs();
  }, [getUserNFTCollection, isConnected, nftBalance]);

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
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">🖼️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No NFTs Yet
        </h3>
        <p className="text-gray-600 text-sm">
          Complete games and mint your first Heart NFT!
        </p>
      </div>
    );
  }

  return (
    <div className={`nft-gallery ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Your Heart Collection
        </h3>
        <p className="text-sm text-gray-600">
          {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} collected
        </p>
      </div>

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
  const { heartData } = nft;
  const isDemo = heartData.gameType === "demo";
  
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
        
        {!isDemo && heartData.message && (
          <p className="text-xs text-gray-600 truncate">
            "{heartData.message}"
          </p>
        )}
        
        <div className="text-xs text-gray-500">
          {new Date(Number(heartData.completedAt) * 1000).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
}

export default NFTGallery;
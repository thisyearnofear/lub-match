"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { AnimationPresets } from "@/utils/animations";

interface NFTPreviewProps {
  images: string[];
  message: string;
  users?: any[];
  gameStats?: {
    completionTime: number;
    accuracy: number;
    socialDiscoveries: number;
  };
  tokenId?: string;
  compact?: boolean;
  showSocialContext?: boolean;
  className?: string;
}

export default function NFTPreview({
  images,
  message,
  users = [],
  gameStats,
  tokenId,
  compact = false,
  showSocialContext = true,
  className = "",
}: NFTPreviewProps) {
  const displayImages = images.slice(0, 8); // Heart layout uses 8 images
  const featuredUsers = users.slice(0, 4); // Show up to 4 featured users

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100 ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-6xl mb-3"
        >
          💝
        </motion.div>
        <h3 className="text-xl font-bold text-gray-800 mb-2 font-playfair">
          Your Heart NFT
        </h3>
        {tokenId && (
          <p className="text-sm text-purple-600 font-medium">
            Token #{tokenId}
          </p>
        )}
      </div>

      {/* Heart Layout Preview */}
      <div className="mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
          <div className="grid grid-cols-4 gap-2 max-w-64 mx-auto">
            {displayImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.3,
                  ease: "easeOut",
                }}
                className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100"
              >
                <img
                  src={image}
                  alt={`Heart image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && !compact && (
        <div className="mb-6">
          <div className="bg-white rounded-xl p-4 border border-pink-100">
            <p className="text-gray-700 italic text-center font-medium">
              "{message}"
            </p>
          </div>
        </div>
      )}

      {/* Social Context */}
      {showSocialContext && featuredUsers.length > 0 && !compact && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            Featured Farcaster Users
          </h4>
          <div className="flex justify-center gap-2 flex-wrap">
            {featuredUsers.map((user, index) => (
              <motion.div
                key={user.fid || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-purple-100 shadow-sm"
              >
                {user.pfp_url && (
                  <img
                    src={user.pfp_url}
                    alt={user.username}
                    className="w-5 h-5 rounded-full object-cover"
                    loading="lazy"
                  />
                )}
                <span className="text-xs font-medium text-gray-700">
                  @{user.username}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Game Stats */}
      {gameStats && !compact && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-pink-600">
              {gameStats.completionTime}s
            </div>
            <div className="text-xs text-gray-600">Completion Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {gameStats.accuracy}%
            </div>
            <div className="text-xs text-gray-600">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {gameStats.socialDiscoveries}
            </div>
            <div className="text-xs text-gray-600">Users Discovered</div>
          </div>
        </div>
      )}

      {/* Compact Stats */}
      {compact && (
        <div className="text-center">
          <div className="text-sm text-gray-600">
            {images.length} photos • {users.length} users featured
          </div>
        </div>
      )}
    </motion.div>
  );
}

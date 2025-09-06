"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SocialUser } from "@/types/socialGames";

interface NFTPreviewProps {
  images: string[];
  message: string;
  users?: SocialUser[];
  gameStats?: {
    completionTime: number;
    accuracy: number;
    socialDiscoveries: number;
  };
  tokenId?: string;
  showSocialGraph?: boolean;
  onUserClick?: (user: SocialUser) => void;
}

export default function NFTPreview({
  images,
  message,
  users = [],
  gameStats,
  tokenId,
  showSocialGraph = true,
  onUserClick,
}: NFTPreviewProps) {
  const [activeView, setActiveView] = useState<"heart" | "social" | "stats">(
    "heart"
  );
  const [hoveredUser, setHoveredUser] = useState<number | null>(null);

  const displayImages = Array.from(new Set(images)).slice(0, 8);
  // For matching games, we might have duplicate users, so we need to deduplicate them
  const uniqueUsers = Array.from(new Set(users.map(u => u.fid || u.id))).map(fidOrId => 
    users.find(u => (u.fid || u.id) === fidOrId)
  ).filter(Boolean) as SocialUser[];
  
  const featuredUsers = uniqueUsers.slice(0, 8);
  const verifiedUsers = uniqueUsers.filter(
    (u) => u.verifiedAddresses?.ethAddresses && u.verifiedAddresses.ethAddresses.length > 0
  );
  const totalFollowers = uniqueUsers.reduce((sum, u) => sum + u.followerCount, 0);

  return (
    <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-3xl p-6 border border-pink-200 shadow-xl">
      {/* Header with View Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-full p-1 shadow-lg">
          {[
            { key: "heart", icon: "💝", label: "Heart" },
            { key: "social", icon: "👥", label: "Social" },
            { key: "stats", icon: "📊", label: "Stats" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeView === key
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <span className="mr-1">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        {activeView === "heart" && (
          <motion.div
            key="heart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Heart Layout with Enhanced Animations */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
                <div className="grid grid-cols-4 gap-3 max-w-80 mx-auto">
                  {displayImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 shadow-md"
                    >
                      <img
                        src={image}
                        alt={`Heart image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating Hearts Animation */}
              <div className="absolute -top-2 -right-2">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-2xl"
                >
                  💖
                </motion.div>
              </div>
            </div>

            {/* Message with Typography Enhancement */}
            {message && (
              <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-lg">
                <div className="text-center">
                  <div className="text-3xl mb-3">💌</div>
                  <p className="text-gray-700 italic text-lg font-medium leading-relaxed">
                    "{message}"
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeView === "social" && (
          <motion.div
            key="social"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Social Network Visualization */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
              <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
                Featured Farcaster Community
              </h3>

              {/* User Grid with Enhanced Interactions */}
              <div className="grid grid-cols-4 gap-3">
                {featuredUsers.map((user, index) => (
                  <motion.div
                    key={user.fid || user.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    onHoverStart={() => setHoveredUser(user.fid || parseInt(user.id))}
                    onHoverEnd={() => setHoveredUser(null)}
                    onClick={() => onUserClick?.(user)}
                    className="relative cursor-pointer"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-white shadow-md">
                      <img
                        src={user.pfpUrl}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Verified Address Indicator */}
                    {user.verifiedAddresses?.ethAddresses && user.verifiedAddresses.ethAddresses.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs shadow-lg">
                        ✓
                      </div>
                    )}

                    {/* Hover Info */}
                    <AnimatePresence>
                      {hoveredUser === user.fid && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10"
                        >
                          @{user.username}
                          <div className="text-gray-300">
                            {user.followerCount.toLocaleString()} followers
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Community Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{verifiedUsers.length}</div>
                <div className="text-sm opacity-90">Verified Users</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">
                  {(totalFollowers / 1000).toFixed(0)}K
                </div>
                <div className="text-sm opacity-90">Total Reach</div>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === "stats" && gameStats && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
              <h3 className="text-lg font-bold text-center mb-6 text-gray-800">
                Game Performance
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl font-bold">⏱️</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {gameStats.completionTime}s
                  </div>
                  <div className="text-sm text-gray-600">Completion Time</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl font-bold">🎯</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {gameStats.accuracy}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl font-bold">🔍</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {gameStats.socialDiscoveries}
                  </div>
                  <div className="text-sm text-gray-600">New Discoveries</div>
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
              <h4 className="font-semibold text-gray-800 mb-3 text-center">
                Achievements
              </h4>
              <div className="flex justify-center gap-2 flex-wrap">
                {gameStats.completionTime < 30 && (
                  <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium">
                    ⚡ Speed Demon
                  </div>
                )}
                {gameStats.accuracy >= 90 && (
                  <div className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-xs font-medium">
                    🎯 Perfect Match
                  </div>
                )}
                {gameStats.socialDiscoveries >= 5 && (
                  <div className="bg-purple-400 text-purple-900 px-3 py-1 rounded-full text-xs font-medium">
                    🔍 Social Explorer
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token ID Footer */}
      {tokenId && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-600">Token ID:</span>
            <span className="text-sm font-bold text-purple-600">
              #{tokenId}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

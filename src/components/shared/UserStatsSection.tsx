"use client";

import { motion } from "framer-motion";
import { useUserProgression } from "@/utils/userProgression";
import { formatLubAmount } from "@/utils/pricingEngine";

interface UserStatsSectionProps {
  className?: string;
  showTierProgress?: boolean;
  onNFTClick?: () => void;
}

export function UserStatsSection({ 
  className = "", 
  showTierProgress = true,
  onNFTClick
}: UserStatsSectionProps) {
  const { progress } = useUserProgression();

  const stats = [
    {
      label: "Games Completed",
      value: progress.gamesCompleted,
      icon: "🎮"
    },
    {
      label: "LUB Balance",
      value: formatLubAmount(progress.lubBalance),
      icon: "💎"
    },
    {
      label: "NFTs Minted",
      value: progress.nftsMinted,
      icon: "🖼️",
      clickable: true,
      onClick: onNFTClick
    },
    {
      label: "LUBs Created",
      value: progress.farcasterLubsCreated + progress.romanceLubsCreated,
      icon: "💝"
    }
  ];

  const tierNames = {
    newcomer: "Newcomer",
    engaged: "Engaged Player",
    "web3-ready": "Web3 Ready",
    "power-user": "Power User"
  };

  return (
    <div className={`user-stats-section ${className}`}>
      {/* Current Tier */}
      {showTierProgress && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
            <span className="text-sm font-medium text-purple-700">
              {tierNames[progress.tier]}
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const isClickable = stat.clickable && stat.onClick && stat.value > 0;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gray-50 rounded-lg p-3 text-center ${
                isClickable 
                  ? 'cursor-pointer hover:bg-purple-50 hover:border-purple-200 border-2 border-transparent transition-all duration-200' 
                  : ''
              }`}
              onClick={isClickable ? stat.onClick : undefined}
            >
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className={`text-lg font-bold ${
                isClickable ? 'text-purple-700' : 'text-gray-800'
              }`}>
                {stat.value}
              </div>
              <div className={`text-xs ${
                isClickable ? 'text-purple-600' : 'text-gray-600'
              }`}>
                {stat.label}
                {isClickable && <span className="ml-1">👆</span>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tier Progress */}
      {showTierProgress && progress.tier !== "power-user" && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">
            Progress to Next Tier
          </div>
          <div className="text-xs text-blue-600">
            {getNextTierRequirement(progress.tier)}
          </div>
        </div>
      )}
    </div>
  );
}

function getNextTierRequirement(currentTier: string): string {
  switch (currentTier) {
    case "newcomer":
      return "Complete your first game to become an Engaged Player";
    case "engaged":
      return "Connect a wallet to become Web3 Ready";
    case "web3-ready":
      return "Create 5 LUBs to become a Power User";
    default:
      return "You've reached the highest tier!";
  }
}
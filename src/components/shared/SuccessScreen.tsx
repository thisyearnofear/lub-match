"use client";

import { ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";
import ActionButton, { ButtonVariant } from "./ActionButton";
import Confetti from "../Confetti";
// Removed enhanced rewards (AGGRESSIVE CONSOLIDATION)
// NEW: Challenge and viral sharing imports (ENHANCEMENT FIRST)
import { Challenge } from "@/services/challengeEngine";
import { ViralDetection } from "@/services/viralDetectionService";
import { getWhaleEmoji } from "@/hooks/useFarcasterUsers";
import { SocialUser } from "@/types/socialGames";
import { calculateCollectionRarity, getPlatformStyling } from "@/utils/socialInfluenceCalculator";

export interface SuccessAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
}

interface SuccessScreenProps {
  title: string;
  message: string;
  celebrationIcon?: string;
  actions: SuccessAction[];
  additionalContent?: ReactNode;
  layout?: "single-column" | "two-column" | "grid";
  className?: string;
  showConfetti?: boolean;
  celebrationLevel?: "standard" | "epic" | "viral"; // NEW: Viral celebration level
  nftPreview?: ReactNode;
  sessionRewards?: Array<{ amount: bigint; description: string; type: string }>; // Optional earnings summary
  // NEW: Challenge completion context (ENHANCEMENT FIRST)
  challengeResult?: {
    challenge: Challenge;
    success: boolean;
    viralDetected?: boolean;
    totalReward: number;
    bonuses: { whale: number; viral: number; speed: number };
  };
  // NEW: Viral detection context
  viralDetection?: ViralDetection;
  // ENHANCEMENT FIRST: Social platform context for celebrations
  socialUsers?: SocialUser[];
  platformSpecific?: {
    network: 'farcaster' | 'lens' | 'mixed';
    achievements?: string[];
    crossPlatformBonus?: boolean;
  };
}

export default function SuccessScreen({
  title,
  message,
  celebrationIcon = "🎉",
  actions,
  additionalContent,
  layout = "single-column",
  className = "",
  showConfetti = false,
  celebrationLevel = "standard",
  nftPreview,
  sessionRewards,
  challengeResult,
  viralDetection,
  socialUsers,
  platformSpecific,
}: SuccessScreenProps) {
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    if (showConfetti || challengeResult?.success || viralDetection) {
      // Trigger confetti after a short delay for better visual impact
      const timer = setTimeout(() => {
        setTriggerConfetti(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showConfetti, challengeResult, viralDetection]);

  // ENHANCEMENT FIRST: Platform-aware celebration configuration
  const platformStyling = platformSpecific ? getPlatformStyling(platformSpecific.network) : null;
  const collectionRarity = socialUsers ? calculateCollectionRarity(socialUsers) : null;
  
  // NEW: Enhanced celebration logic for challenges and viral detection
  const getCelebrationConfig = () => {
    if (viralDetection) {
      return {
        icon: "🚀",
        level: "viral" as const,
        title: "Viral Success!",
        message: `Your content went viral! Earned ${viralDetection.reward} LUB`
      };
    }

    if (challengeResult) {
      const { challenge, success, viralDetected, totalReward, bonuses } = challengeResult;
      const whaleEmoji = getWhaleEmoji(challenge.targetUser.followerCount >= 50000 ? 'mega_whale' :
                                      challenge.targetUser.followerCount >= 10000 ? 'whale' :
                                      challenge.targetUser.followerCount >= 5000 ? 'shark' :
                                      challenge.targetUser.followerCount >= 1000 ? 'fish' : 'minnow');

      if (success && viralDetected) {
        return {
          icon: "🎯🚀",
          level: "viral" as const,
          title: "Epic Challenge Victory!",
          message: `Challenge completed AND went viral! ${whaleEmoji} ${totalReward} LUB earned`
        };
      } else if (success && bonuses.whale > 0) {
        return {
          icon: `🎯${whaleEmoji}`,
          level: "epic" as const,
          title: "Whale Harpooned!",
          message: `Successfully challenged a whale! ${totalReward} LUB earned`
        };
      } else if (success) {
        return {
          icon: "🎯",
          level: "standard" as const,
          title: "Challenge Complete!",
          message: `Well done! ${totalReward} LUB earned`
        };
      } else {
        return {
          icon: "💪",
          level: "standard" as const,
          title: "Good Effort!",
          message: "Challenge not completed, but you tried! Keep going!"
        };
      }
    }

    // Platform-specific celebration enhancement
    if (platformSpecific && !challengeResult && !viralDetection) {
      const styling = getPlatformStyling(platformSpecific.network);
      const rarityBonus = collectionRarity?.tier === 'Legendary' ? ' 🏆' : 
                         collectionRarity?.tier === 'Epic' ? ' ⭐' : '';
      
      if (platformSpecific.network === 'mixed') {
        return {
          icon: "🌈💎",
          level: "epic" as const,
          title: `Cross-Platform ${title}${rarityBonus}`,
          message: `${message} This ${collectionRarity?.tier || 'unique'} collection bridges Farcaster and Lens communities!`
        };
      } else {
        return {
          icon: `${styling.icon}${celebrationIcon}${rarityBonus}`,
          level: platformSpecific.crossPlatformBonus ? "epic" as const : celebrationLevel,
          title: `${styling.name} ${title}${rarityBonus}`,
          message: `${message} ${collectionRarity ? `This ${collectionRarity.tier} rarity NFT` : 'Your NFT'} celebrates the ${styling.name} community!`
        };
      }
    }
    
    return {
      icon: celebrationIcon,
      level: celebrationLevel,
      title,
      message
    };
  };

  const celebrationConfig = getCelebrationConfig();
  const getGridClasses = () => {
    switch (layout) {
      case "two-column":
        return "grid grid-cols-1 sm:grid-cols-2 gap-3";
      case "grid":
        return actions.length <= 2
          ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
          : "grid grid-cols-1 sm:grid-cols-2 gap-3";
      default:
        return "grid grid-cols-1 gap-3";
    }
  };

  return (
    <>
      {/* Enhanced Confetti Effect */}
      {(showConfetti || challengeResult?.success || viralDetection) && (
        <Confetti trigger={triggerConfetti} />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          duration: celebrationLevel === "epic" ? 0.5 : 0.3,
          ease: "easeOut",
        }}
        className={`text-center ${className}`}
      >
        {/* Enhanced Celebration Header */}
        <div className="mb-6">
          <motion.div
            className="text-6xl mb-4 relative"
            animate={
              celebrationConfig.level === "viral"
                ? {
                    scale: [1, 1.4, 1.2, 1],
                    rotate: [0, 15, -15, 10, 0],
                    y: [0, -15, 0],
                  }
                : celebrationConfig.level === "epic"
                ? {
                    scale: [1, 1.3, 1.1, 1],
                    rotate: [0, 10, -10, 5, 0],
                    y: [0, -10, 0],
                  }
                : {
                    scale: [1, 1.1, 1],
                  }
            }
            transition={
              celebrationConfig.level === "viral"
                ? {
                    duration: 1.5,
                    ease: "easeOut",
                  }
                : celebrationConfig.level === "epic"
                ? {
                    duration: 1.2,
                    ease: "easeOut",
                  }
                : {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            {celebrationConfig.icon}
            {(celebrationConfig.level === "epic" || celebrationConfig.level === "viral") && (
              <motion.div
                className="absolute inset-0 text-6xl"
                animate={{
                  scale: [1, celebrationConfig.level === "viral" ? 2 : 1.5, 0],
                  opacity: [0.5, 0.8, 0],
                }}
                transition={{
                  duration: celebrationConfig.level === "viral" ? 1.5 : 1,
                  ease: "easeOut",
                }}
              >
                {celebrationConfig.icon}
              </motion.div>
            )}
          </motion.div>
          <motion.h2
            className="text-3xl font-bold text-gray-800 mb-4 font-playfair"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {celebrationConfig.title}
          </motion.h2>
          <motion.p
            className="text-gray-600 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {celebrationConfig.message}
          </motion.p>
        </div>

        {/* NFT Preview (Priority Content) with Platform Enhancement */}
        {nftPreview && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {/* Platform-specific frame enhancement */}
            {platformStyling && (
              <div className={`p-1 rounded-3xl bg-gradient-to-r ${platformStyling.primaryColor} mb-4`}>
                <div className="bg-white rounded-3xl p-2">
                  {nftPreview}
                </div>
              </div>
            )}
            {!platformStyling && nftPreview}
            
            {/* Collection Rarity Badge */}
            {collectionRarity && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="flex justify-center mt-4"
              >
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${collectionRarity.tier === 'Legendary' ? 'from-yellow-400 to-orange-500' : collectionRarity.tier === 'Epic' ? 'from-purple-400 to-pink-500' : 'from-blue-400 to-cyan-500'} text-white font-semibold shadow-lg`}>
                  <span className="text-lg">
                    {collectionRarity.tier === 'Legendary' ? '🏆' : 
                     collectionRarity.tier === 'Epic' ? '⭐' : 
                     collectionRarity.tier === 'Rare' ? '💎' : '✨'}
                  </span>
                  <span>{collectionRarity.tier} Rarity</span>
                  <span className="text-sm opacity-90">({collectionRarity.score} pts)</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Challenge Result Details */}
        {challengeResult && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: nftPreview ? 0.5 : 0.4, duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={challengeResult.challenge.targetUser.pfpUrl}
                  alt={challengeResult.challenge.targetUser.displayName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">
                    @{challengeResult.challenge.targetUser.username}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {challengeResult.challenge.targetUser.followerCount.toLocaleString()} followers
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-bold text-purple-600">
                    {challengeResult.totalReward} LUB
                  </div>
                  {challengeResult.bonuses.whale > 0 && (
                    <div className="text-xs text-purple-500">
                      +{challengeResult.bonuses.whale} whale bonus
                    </div>
                  )}
                  {challengeResult.bonuses.viral > 0 && (
                    <div className="text-xs text-pink-500">
                      +{challengeResult.bonuses.viral} viral bonus
                    </div>
                  )}
                </div>
              </div>

              {challengeResult.viralDetected && (
                <div className="bg-pink-100 rounded-lg p-3 border border-pink-200">
                  <div className="flex items-center gap-2 text-pink-700">
                    <span className="text-lg">🚀</span>
                    <span className="font-semibold">Viral Detection!</span>
                  </div>
                  <p className="text-sm text-pink-600 mt-1">
                    Target mentioned $LUB - viral bonus applied!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Viral Detection Details */}
        {viralDetection && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: challengeResult ? 0.6 : nftPreview ? 0.5 : 0.4, duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-4 border border-pink-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Viral Content Detected!</h4>
                  <p className="text-sm text-gray-600">
                    {viralDetection.confidence}% confidence • {viralDetection.detectionType.replace('_', ' ')}
                  </p>
                </div>
                <div className="ml-auto text-lg font-bold text-pink-600">
                  {viralDetection.reward} LUB
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-pink-100">
                <p className="text-sm text-gray-700 italic">
                  "{viralDetection.castContent.substring(0, 120)}
                  {viralDetection.castContent.length > 120 ? '...' : ''}"
                </p>
              </div>

              {(viralDetection.bonuses.whale > 0 || viralDetection.bonuses.engagement > 0) && (
                <div className="mt-3 flex gap-2 text-xs">
                  {viralDetection.bonuses.whale > 0 && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      🐋 +{viralDetection.bonuses.whale} whale bonus
                    </span>
                  )}
                  {viralDetection.bonuses.engagement > 0 && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      💬 +{viralDetection.bonuses.engagement} engagement bonus
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Session Rewards Summary */}
        {sessionRewards && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: viralDetection ? 0.7 : challengeResult ? 0.6 : nftPreview ? 0.5 : 0.4,
              duration: 0.3
            }}
          >
            {/* Removed RewardsSummaryContent (AGGRESSIVE CONSOLIDATION) */}
          </motion.div>
        )}

        {/* Platform-Specific Achievements */}
        {platformSpecific?.achievements && platformSpecific.achievements.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: viralDetection ? 0.7 : challengeResult ? 0.6 : nftPreview ? 0.5 : 0.4, duration: 0.3 }}
          >
            <div className={`bg-gradient-to-r ${platformStyling?.backgroundColor || 'from-gray-50 to-gray-100'} rounded-xl p-4 border ${platformStyling?.borderColor || 'border-gray-200'}`}>
              <h4 className="font-semibold text-gray-800 mb-3 text-center flex items-center justify-center gap-2">
                {platformStyling?.icon} Platform Achievements
              </h4>
              <div className="flex justify-center gap-2 flex-wrap">
                {platformSpecific.achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.2 }}
                    className={`bg-gradient-to-r ${platformStyling?.primaryColor || 'from-gray-400 to-gray-500'} text-white px-3 py-1 rounded-full text-xs font-medium`}
                  >
                    {achievement}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Additional Content */}
        {additionalContent && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sessionRewards ? 0.6 : nftPreview ? 0.6 : 0.4, duration: 0.3 }}
          >
            {additionalContent}
          </motion.div>
        )}

        {/* Action Buttons */}
        {actions.length > 0 && (
          <motion.div
            className={`${getGridClasses()} mb-6`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: nftPreview ? 0.7 : 0.5, duration: 0.3 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: (nftPreview ? 0.8 : 0.6) + index * 0.1,
                  duration: 0.2,
                }}
              >
                <ActionButton
                  variant={action.variant || "primary"}
                  onClick={action.onClick}
                  loading={action.loading}
                  fullWidth
                  icon={action.icon}
                >
                  {action.label}
                </ActionButton>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

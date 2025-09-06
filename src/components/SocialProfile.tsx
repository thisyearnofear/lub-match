"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { FarcasterUser } from "@/types/user";
import { SocialUser } from "@/types/socialGames";
import { socialInteractionService } from "@/services/socialInteractionService";
import { classifyUserByFollowers, getWhaleEmoji } from "@/hooks/useFarcasterUsers";

// Updated to use modern SocialUser interface
interface SocialProfileProps {
  user: SocialUser;
  variant?: "full" | "compact" | "minimal" | "challenge";
  gameCreator?: boolean;
  onFollow?: (fid: number) => void;
  onCast?: (text: string) => void;
  onChallengeTarget?: (user: SocialUser) => void;
  showWhaleStatus?: boolean;
  showFollowerCount?: boolean;
  showChallengeActions?: boolean;
  showReportAction?: boolean;
  onReport?: (user: SocialUser) => void;
  className?: string;
}

// ENHANCED: Single component handling all profile variants (ENHANCEMENT FIRST)
export default function SocialProfile({
  user,
  variant = "full",
  gameCreator = false,
  onFollow,
  onCast,
  onChallengeTarget,
  showWhaleStatus = false,
  showFollowerCount = true,
  showChallengeActions = false,
  showReportAction = false,
  onReport,
  className = "",
}: SocialProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // NEW: Whale classification for enhanced social targeting
  const whaleType = classifyUserByFollowers(user.followerCount);
  const whaleEmoji = getWhaleEmoji(whaleType);

  // ENHANCED: Consolidated interaction handlers using socialInteractionService
  const handleFollow = async () => {
    if (!onFollow || isLoading) return;

    setIsLoading(true);
    try {
      // Check if fid exists before calling the service
      if (user.fid) {
        const result = await socialInteractionService.followUser(user.fid);
        if (result.success) {
          await onFollow(user.fid);
          setIsFollowing(!isFollowing);
        }
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCast = async () => {
    if (!onCast) return;

    const message = `Hey @${user.username}! 👋`;
    // Check if fid exists before calling the service
    if (user.fid) {
      const result = await socialInteractionService.castToUser(user.fid, message);
      if (result.success && onCast) {
        onCast(message);
      }
    }
  };

  // NEW: Challenge targeting handler
  const handleChallengeTarget = () => {
    if (onChallengeTarget) {
      onChallengeTarget(user);
    }
  };

  // NEW: Report handler
  const handleReport = () => {
    if (onReport) {
      onReport(user);
    }
  };

  const handleCastAbout = () => {
    if (!onCast) return;

    const castText = gameCreator
      ? `Just played @${user.username}'s Valentine memory game! 💝 So cute! Create your own at [app-url]`
      : `Playing this adorable Valentine memory game featuring @${user.username} and other Farcaster friends! 💕 [app-url]`;

    onCast(castText);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // ENHANCED: Variant-based styling (CLEAN separation of concerns)
  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return {
          container: "flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2",
          avatar: "w-8 h-8",
          content: "flex-1 min-w-0",
          actions: "flex gap-1"
        };
      case "minimal":
        return {
          container: "flex items-center gap-2 bg-purple-800/20 backdrop-blur-sm rounded-lg p-2 border border-purple-600/30",
          avatar: "w-6 h-6",
          content: "flex-1 min-w-0",
          actions: "flex gap-1"
        };
      case "challenge":
        return {
          container: "bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl shadow-lg p-4 border border-purple-200",
          avatar: "w-12 h-12",
          content: "flex-1",
          actions: "flex gap-2"
        };
      default: // "full"
        return {
          container: "bg-white rounded-xl shadow-lg p-4",
          avatar: "w-12 h-12",
          content: "flex-1",
          actions: "flex gap-2"
        };
    }
  };

  const styles = getVariantStyles();

  // ENHANCED: Render different layouts based on variant
  if (variant === "compact" || variant === "minimal") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`${styles.container} ${className}`}
      >
        {user.pfpUrl ? (
          <Image
            src={user.pfpUrl}
            alt={user.displayName}
            width={variant === "compact" ? 32 : 24}
            height={variant === "compact" ? 32 : 24}
            className="rounded-full object-cover"
          />
        ) : (
          <div className={`${styles.avatar} bg-gray-200 rounded-full flex items-center justify-center`}>
            <span className="text-gray-400 text-sm">👤</span>
          </div>
        )}

        <div className={styles.content}>
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-900 truncate">
              {user.displayName}
            </span>
            {showWhaleStatus && whaleType !== 'minnow' && (
              <span className="text-sm">{whaleEmoji}</span>
            )}
            {gameCreator && <span className="text-xs">💝</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>@{user.username}</span>
            {showFollowerCount && (
              <span>{formatCount(user.followerCount)} followers</span>
            )}
          </div>
        </div>

        {(onFollow || showChallengeActions || showReportAction) && (
          <div className={styles.actions}>
            {onFollow && (
              <button
                onClick={handleFollow}
                disabled={isLoading}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </button>
            )}
            {showChallengeActions && onChallengeTarget && (
              <button
                onClick={handleChallengeTarget}
                className="px-2 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600"
              >
                🎯
              </button>
            )}
            {showReportAction && onReport && (
              <button
                onClick={handleReport}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                title="Report user"
              >
                🚨
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // Full and challenge variants (ENHANCED layout)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${styles.container} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          {user.pfpUrl ? (
            <Image
              src={user.pfpUrl}
              alt={`${user.displayName}'s profile`}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-lg">👤</span>
            </div>
          )}
          {gameCreator && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">💝</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {user.displayName}
            </h3>
            {user.verifiedAddresses?.ethAddresses &&
              user.verifiedAddresses.ethAddresses.length > 0 && (
                <span className="text-blue-500 text-sm">✓</span>
              )}
          </div>
          <p className="text-sm text-gray-600">@{user.username}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onFollow && (
            <motion.button
              onClick={handleFollow}
              disabled={isLoading}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isFollowing
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-pink-500 text-white hover:bg-pink-600"
              } disabled:opacity-50`}
            >
              {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </motion.button>
          )}

          {onCast && (
            <motion.button
              onClick={handleCastAbout}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
              title="Cast about this"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l6.55 5.728L17.502 5H4.511z" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>
          <strong className="text-gray-900">
            {formatCount(user.followerCount)}
          </strong>{" "}
          followers
        </span>
        <span>
          <strong className="text-gray-900">
            {formatCount(user.followingCount)}
          </strong>{" "}
          following
        </span>
        {gameCreator && (
          <span className="text-pink-600 font-medium">💝 Game Creator</span>
        )}
      </div>

      {/* Farcaster Link */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <a
          href={`https://warpcast.com/${user.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          <span>View on Farcaster</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
            <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z" />
          </svg>
        </a>
      </div>
    </motion.div>
  );
}

// ENHANCED: Grid layout with variant support (ENHANCEMENT FIRST)
export function SocialProfileGrid({
  users,
  gameCreatorFid,
  onFollow,
  onCast,
  onChallengeTarget,
  variant = "full",
  showWhaleStatus = false,
  showChallengeActions = false,
  className = "",
}: {
  users: SocialUser[];
  gameCreatorFid?: number;
  onFollow?: (fid: number) => void;
  onCast?: (text: string) => void;
  onChallengeTarget?: (user: SocialUser) => void; // NEW
  variant?: "full" | "compact" | "minimal" | "challenge"; // NEW
  showWhaleStatus?: boolean; // NEW
  showChallengeActions?: boolean; // NEW
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {users.slice(0, 4).map((user) => (
        <SocialProfile
          key={user.fid || user.id}
          user={user}
          variant={variant}
          gameCreator={user.fid === gameCreatorFid}
          onFollow={onFollow}
          onCast={onCast}
          onChallengeTarget={onChallengeTarget}
          showWhaleStatus={showWhaleStatus}
          showChallengeActions={showChallengeActions}
        />
      ))}
    </div>
  );
}

// ENHANCED: Convenience components for common use cases (DRY)
export function ChallengeSocialProfile(props: Omit<SocialProfileProps, 'variant' | 'showWhaleStatus' | 'showChallengeActions'>) {
  return <SocialProfile {...props} variant="challenge" showWhaleStatus={true} showChallengeActions={true} />;
}

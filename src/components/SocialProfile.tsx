"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

interface SocialProfileProps {
  user: FarcasterUser;
  gameCreator?: boolean;
  onFollow?: (fid: number) => void;
  onCast?: (text: string) => void;
  className?: string;
}

export default function SocialProfile({
  user,
  gameCreator = false,
  onFollow,
  onCast,
  className = "",
}: SocialProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (!onFollow || isLoading) return;

    setIsLoading(true);
    try {
      await onFollow(user.fid);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-lg p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <Image
            src={user.pfp_url}
            alt={`${user.display_name}'s profile`}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          {gameCreator && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">💝</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {user.display_name}
            </h3>
            {user.verified_addresses?.eth_addresses &&
              user.verified_addresses.eth_addresses.length > 0 && (
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
            {formatCount(user.follower_count)}
          </strong>{" "}
          followers
        </span>
        <span>
          <strong className="text-gray-900">
            {formatCount(user.following_count)}
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

// Compact version for game completion
export function CompactSocialProfile({
  user,
  gameCreator = false,
  onFollow,
  className = "",
}: {
  user: FarcasterUser;
  gameCreator?: boolean;
  onFollow?: (fid: number) => void;
  className?: string;
}) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    if (!onFollow) return;
    try {
      await onFollow(user.fid);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Follow action failed:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 ${className}`}
    >
      <Image
        src={user.pfp_url}
        alt={user.display_name}
        width={32}
        height={32}
        className="rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.display_name}
        </p>
        <p className="text-xs text-gray-600">@{user.username}</p>
      </div>
      {gameCreator && (
        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
          Creator
        </span>
      )}
      {onFollow && (
        <button
          onClick={handleFollow}
          className={`px-2 py-1 text-xs rounded-full transition-colors ${
            isFollowing
              ? "bg-gray-200 text-gray-700"
              : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          {isFollowing ? "✓" : "+"}
        </button>
      )}
    </motion.div>
  );
}

// Grid layout for multiple users
export function SocialProfileGrid({
  users,
  gameCreatorFid,
  onFollow,
  onCast,
  className = "",
}: {
  users: FarcasterUser[];
  gameCreatorFid?: number;
  onFollow?: (fid: number) => void;
  onCast?: (text: string) => void;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {users.slice(0, 4).map((user) => (
        <SocialProfile
          key={user.fid}
          user={user}
          gameCreator={user.fid === gameCreatorFid}
          onFollow={onFollow}
          onCast={onCast}
        />
      ))}
    </div>
  );
}

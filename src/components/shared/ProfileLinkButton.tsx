"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FarcasterUser } from "@/types/socialGames";

interface ProfileLinkButtonProps {
  user: FarcasterUser;
  variant?: "primary" | "secondary" | "minimal";
  size?: "sm" | "md" | "lg";
  showUsername?: boolean;
  showFollowerCount?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  primary:
    "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white",
  secondary: "bg-purple-700 hover:bg-purple-600 text-white",
  minimal:
    "bg-purple-800 bg-opacity-50 hover:bg-opacity-70 text-purple-200 hover:text-white border border-purple-600",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export default function ProfileLinkButton({
  user,
  variant = "primary",
  size = "md",
  showUsername = true,
  showFollowerCount = false,
  className = "",
  onClick,
}: ProfileLinkButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick?.();

    // Open Farcaster profile in new tab
    const farcasterUrl = `https://warpcast.com/${user.username}`;
    window.open(farcasterUrl, "_blank", "noopener,noreferrer");

    // Reset clicked state after animation
    setTimeout(() => setIsClicked(false), 200);
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        font-medium transition-all duration-200
        flex items-center gap-2 justify-center
        ${isClicked ? "scale-95" : "hover:scale-105"}
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-lg">👤</span>
      <div className="flex flex-col items-start">
        {showUsername && (
          <span className="font-semibold">@{user.username}</span>
        )}
        {showFollowerCount && (
          <span className="text-xs opacity-80">
            {formatFollowerCount(user.followerCount)} followers
          </span>
        )}
      </div>
      <span className="text-sm opacity-80">↗</span>
    </motion.button>
  );
}

// Specialized variant for social game results
export function SocialGameProfileLink({
  user,
  isCorrectAnswer = false,
  className = "",
}: {
  user: FarcasterUser;
  isCorrectAnswer?: boolean;
  className?: string;
}) {
  return (
    <ProfileLinkButton
      user={user}
      variant={isCorrectAnswer ? "primary" : "minimal"}
      size="sm"
      showUsername={true}
      showFollowerCount={false}
      className={`${className} ${
        isCorrectAnswer ? "ring-2 ring-green-400 ring-opacity-50" : ""
      }`}
    />
  );
}

// Minimal variant for match notifications
export function MatchProfileLink({
  user,
  className = "",
}: {
  user: FarcasterUser;
  className?: string;
}) {
  return (
    <ProfileLinkButton
      user={user}
      variant="minimal"
      size="sm"
      showUsername={true}
      showFollowerCount={true}
      className={`${className} backdrop-blur-sm`}
    />
  );
}

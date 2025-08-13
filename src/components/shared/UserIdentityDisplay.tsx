"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUserIdentity } from "@/contexts/UserContext";
import { UserDisplayFormatter } from "@/utils/userDisplay";

interface UserIdentityDisplayProps {
  variant?: "floating" | "header" | "compact" | "full";
  showConnectionStatus?: boolean;
  showLoadingState?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Unified User Identity Display Component
 * Provides consistent user display across the app with proper loading states
 * and connection feedback
 */
export default function UserIdentityDisplay({
  variant = "compact",
  showConnectionStatus = true,
  showLoadingState = true,
  className = "",
  onClick,
}: UserIdentityDisplayProps) {
  const {
    farcasterUser,
    avatarUrl,
    displayName,
    hasUsername,
    isInFarcaster,
    isConnected,
    isLoadingContext,
  } = useUserIdentity();

  // Loading state
  if (showLoadingState && isLoadingContext) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2 ${className}`}
      >
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex flex-col gap-1">
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
          {variant !== "compact" && (
            <div className="w-16 h-2 bg-gray-100 rounded animate-pulse" />
          )}
        </div>
      </motion.div>
    );
  }

  // Get display configuration based on variant
  const getVariantConfig = () => {
    switch (variant) {
      case "floating":
        return {
          showAvatar: true,
          showStatus: true,
          size: "md",
          layout: "horizontal",
        };
      case "header":
        return {
          showAvatar: true,
          showStatus: false,
          size: "lg",
          layout: "horizontal",
        };
      case "compact":
        return {
          showAvatar: false,
          showStatus: false,
          size: "sm",
          layout: "horizontal",
        };
      case "full":
        return {
          showAvatar: true,
          showStatus: true,
          size: "lg",
          layout: "vertical",
        };
      default:
        return {
          showAvatar: true,
          showStatus: true,
          size: "md",
          layout: "horizontal",
        };
    }
  };

  const config = getVariantConfig();

  // Connection status indicator
  const ConnectionStatus = () => {
    if (!showConnectionStatus || !config.showStatus) return null;

    return (
      <div className="flex items-center gap-1">
        {/* Farcaster indicator */}
        {isInFarcaster && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 bg-purple-500 rounded-full"
            title="Farcaster Mini App"
          />
        )}

        {/* Wallet connection indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
          }`}
          title={isConnected ? "Wallet Connected" : "Wallet Not Connected"}
        />
      </div>
    );
  };

  // Avatar component
  const Avatar = () => {
    if (!config.showAvatar) return null;

    const sizeClasses: Record<string, string> = {
      sm: "w-6 h-6",
      md: "w-8 h-8",
      lg: "w-12 h-12",
    };

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`${
          sizeClasses[config.size]
        } rounded-full overflow-hidden border border-gray-200`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {farcasterUser?.username?.[0]?.toUpperCase() ||
                farcasterUser?.displayName?.[0]?.toUpperCase() ||
                "U"}
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  // User info component
  const UserInfo = () => {
    const textSizes: Record<string, string> = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    };

    return (
      <div
        className={`flex flex-col ${
          config.layout === "vertical"
            ? "items-center text-center"
            : "items-start"
        }`}
      >
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${textSizes[config.size]} font-medium text-gray-900`}
        >
          {hasUsername && farcasterUser?.username
            ? `@${farcasterUser.username}`
            : displayName}
        </motion.span>

        {config.showStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mt-1"
          >
            <span className="text-xs text-gray-500">
              {isInFarcaster ? "Farcaster" : "Web"}
              {isConnected && " • Connected"}
            </span>
            <ConnectionStatus />
          </motion.div>
        )}
      </div>
    );
  };

  // Main component
  const Component = onClick ? motion.button : motion.div;

  return (
    <AnimatePresence>
      <Component
        onClick={onClick}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={onClick ? { scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        className={`
          flex items-center gap-3
          ${config.layout === "vertical" ? "flex-col" : "flex-row"}
          ${
            onClick
              ? "cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              : ""
          }
          ${className}
        `}
      >
        <Avatar />
        <UserInfo />
      </Component>
    </AnimatePresence>
  );
}

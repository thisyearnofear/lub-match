"use client";

import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, Users, Wifi, AlertCircle, Heart, Trophy } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {icon && (
        <motion.div
          className="mb-4 text-purple-400"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {icon}
        </motion.div>
      )}
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-purple-300 mb-6 max-w-md leading-relaxed">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <motion.button
            onClick={action.onClick}
            disabled={action.loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-700 disabled:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 min-w-[140px]"
            whileHover={{ scale: action.loading ? 1 : 1.02 }}
            whileTap={{ scale: action.loading ? 1 : 0.98 }}
          >
            {action.loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : null}
            {action.label}
          </motion.button>
        )}
        
        {secondaryAction && (
          <motion.button
            onClick={secondaryAction.onClick}
            className="px-6 py-3 bg-purple-800 bg-opacity-50 hover:bg-opacity-70 text-purple-200 hover:text-white font-medium rounded-xl transition-all duration-200 border border-purple-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {secondaryAction.label}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// Specific empty state components
export function NoUsersFound({
  onRetry,
  onGoHome,
  isRetrying = false,
}: {
  onRetry?: () => void;
  onGoHome?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <EmptyState
      icon={<Users className="w-16 h-16" />}
      title="No Users Found"
      description="We couldn't find any users to display in your matching game. This might be due to network filters or temporary issues."
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              loading: isRetrying,
            }
          : undefined
      }
      secondaryAction={
        onGoHome
          ? {
              label: "Go Home",
              onClick: onGoHome,
            }
          : undefined
      }
    />
  );
}

export function NetworkError({
  onRetry,
  onGoHome,
  isRetrying = false,
}: {
  onRetry?: () => void;
  onGoHome?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <EmptyState
      icon={<Wifi className="w-16 h-16" />}
      title="Connection Problem"
      description="We're having trouble connecting to our servers. Please check your internet connection and try again."
      action={
        onRetry
          ? {
              label: "Retry Connection",
              onClick: onRetry,
              loading: isRetrying,
            }
          : undefined
      }
      secondaryAction={
        onGoHome
          ? {
              label: "Go Home",
              onClick: onGoHome,
            }
          : undefined
      }
    />
  );
}

export function LoadingError({
  error,
  onRetry,
  onGoHome,
  isRetrying = false,
}: {
  error?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <EmptyState
      icon={<AlertCircle className="w-16 h-16" />}
      title="Something Went Wrong"
      description={
        error ||
        "We encountered an unexpected error while loading your content. Please try again."
      }
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              loading: isRetrying,
            }
          : undefined
      }
      secondaryAction={
        onGoHome
          ? {
              label: "Go Home",
              onClick: onGoHome,
            }
          : undefined
      }
    />
  );
}

export function GameComplete({
  stats,
  onPlayAgain,
  onShare,
  onGoHome,
}: {
  stats?: {
    completionTime: number;
    accuracy: number;
    totalMatches: number;
  };
  onPlayAgain?: () => void;
  onShare?: () => void;
  onGoHome?: () => void;
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <EmptyState
      icon={<Trophy className="w-16 h-16 text-yellow-400" />}
      title="Congratulations! 🎉"
      description={
        stats
          ? `You completed the game in ${formatTime(stats.completionTime)} with ${stats.accuracy}% accuracy and ${stats.totalMatches} perfect matches!`
          : "You've successfully completed the matching game! Great job finding all the pairs."
      }
      action={
        onPlayAgain
          ? {
              label: "Play Again",
              onClick: onPlayAgain,
            }
          : undefined
      }
      secondaryAction={
        onShare
          ? {
              label: "Share Results",
              onClick: onShare,
            }
          : onGoHome
          ? {
              label: "Go Home",
              onClick: onGoHome,
            }
          : undefined
      }
      className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-600/30"
    />
  );
}

export function NoMatches({
  onTryAgain,
  onGoHome,
}: {
  onTryAgain?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <EmptyState
      icon={<Heart className="w-16 h-16" />}
      title="No Matches Yet"
      description="Keep trying! The perfect matches are waiting to be discovered. Sometimes the best connections take a little patience."
      action={
        onTryAgain
          ? {
              label: "Keep Playing",
              onClick: onTryAgain,
            }
          : undefined
      }
      secondaryAction={
        onGoHome
          ? {
              label: "Take a Break",
              onClick: onGoHome,
            }
          : undefined
      }
    />
  );
}

// Loading state component
export function LoadingState({
  message = "Loading...",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <RefreshCw className="w-8 h-8 text-purple-400" />
      </motion.div>
      <p className="text-purple-300">{message}</p>
    </motion.div>
  );
}
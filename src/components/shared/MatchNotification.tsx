"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialUser } from "@/types/socialGames";
import { MatchProfileLink } from "./ProfileLinkButton";

interface MatchNotificationProps {
  user: SocialUser;
  isVisible: boolean;
  onClose?: () => void;
  autoCloseDelay?: number;
  position?: "center" | "bottom" | "top";
  className?: string;
}

export default function MatchNotification({
  user,
  isVisible,
  onClose,
  autoCloseDelay = 3000,
  position = "center",
  className = "",
}: MatchNotificationProps) {
  // Auto-close after delay
  React.useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay, onClose]);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "bottom":
        return "bottom-20 left-1/2 transform -translate-x-1/2"; // More space from bottom
      case "center":
      default:
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            fixed z-50 ${getPositionClasses()}
            ${className}
          `}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.3,
          }}
        >
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl shadow-2xl border border-purple-600 p-4 sm:p-6 max-w-xs sm:max-w-sm mx-4">
            {/* Header */}
            <div className="text-center mb-3 sm:mb-4">
              <motion.div
                className="text-3xl sm:text-4xl mb-2"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: 1,
                  delay: 0.2,
                }}
              >
                💝
              </motion.div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                Perfect Match!
              </h3>
              <p className="text-purple-200 text-xs sm:text-sm">
                You found a {user.network === "lens" ? "Lens" : "Farcaster"}{" "}
                user
              </p>
            </div>

            {/* User Profile Link */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <MatchProfileLink user={user} className="w-full justify-center" />
            </div>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-purple-300 hover:text-white transition-colors text-lg"
                aria-label="Close notification"
              >
                ✕
              </button>
            )}

            {/* Progress indicator for auto-close */}
            {autoCloseDelay > 0 && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-b-2xl"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Specialized variant for multiple matches
export function MultiMatchNotification({
  users,
  isVisible,
  onClose,
  className = "",
}: {
  users: SocialUser[];
  isVisible: boolean;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
            ${className}
          `}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl shadow-2xl border border-purple-600 p-6 max-w-md mx-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Amazing Matches!
              </h3>
              <p className="text-purple-200 text-sm">
                You discovered {Math.min(users.length, 8)} social users
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {users.map((user, index) => (
                <motion.div
                  key={user.username}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MatchProfileLink user={user} />
                </motion.div>
              ))}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded-xl font-medium transition-colors"
              >
                Continue Playing
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

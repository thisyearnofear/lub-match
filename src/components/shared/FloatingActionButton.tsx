"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLubToken } from "@/hooks/useLubToken";
import { useUserProgression } from "@/utils/userProgression";
import { useUserIdentity } from "@/contexts/UserContext";
import { UserDisplayFormatter } from "@/utils/userDisplay";
import { useState } from "react";

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export default function FloatingActionButton({
  onClick,
  className = "",
}: FloatingActionButtonProps) {
  const { balanceFormatted } = useLubToken();
  const { progress } = useUserProgression();
  const { isConnected } = useAccount();
  const { farcasterUser, avatarUrl } = useUserIdentity();
  const [showConnectOption, setShowConnectOption] = useState(false);

  // Show notification dot for new achievements or milestones
  const hasNotification = progress.gamesCompleted > 0 && !isConnected;

  // Get display name for connected users
  const displayName = UserDisplayFormatter.getDisplayName(
    farcasterUser,
    undefined,
    undefined,
    "compact"
  );

  // If disconnected and showing connect option, render the connect button
  if (!isConnected && showConnectOption) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center gap-2"
        style={{
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Connect Wallet Button */}
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <motion.button
              onClick={openConnectModal}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group px-4 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Connect wallet"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🔗</span>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium opacity-90">
                    Connect
                  </span>
                  <span className="text-sm font-bold leading-none">
                    Wallet
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          )}
        </ConnectButton.Custom>

        {/* Main Button */}
        <motion.button
          onClick={() => {
            setShowConnectOption(false);
            onClick();
          }}
          className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group ${className}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open wallet"
        >
          {/* Notification Badge */}
          {hasNotification && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
            />
          )}

          {/* Button Content */}
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-lg">💎</span>
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium opacity-90">LUB</span>
              <span className="text-sm font-bold leading-none">
                {balanceFormatted}
              </span>
            </div>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={() => {
        if (!isConnected) {
          // Toggle connect option for disconnected users
          setShowConnectOption(!showConnectOption);
        } else {
          // Open wallet drawer for connected users
          onClick();
        }
      }}
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      style={{
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
      }}
      aria-label={isConnected ? "Open wallet" : "Connect wallet or view balance"}
    >
      {/* Notification Badge */}
      {hasNotification && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
        />
      )}

      {/* Connect Hint for Disconnected Users */}
      {!isConnected && !showConnectOption && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
        >
          <span className="text-xs">🔗</span>
        </motion.div>
      )}

      {/* Button Content */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Show avatar if connected and available */}
        {isConnected && avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-6 h-6 rounded-full border border-white/20"
          />
        ) : (
          <span className="text-lg">💎</span>
        )}

        <div className="flex flex-col items-start">
          {/* Show username if connected, otherwise show LUB label */}
          <span className="text-xs font-medium opacity-90">
            {isConnected && farcasterUser?.username ? displayName : "LUB"}
          </span>
          <span className="text-sm font-bold leading-none">
            {balanceFormatted}
          </span>
        </div>

        {/* Connect indicator for disconnected users */}
        {!isConnected && (
          <div className="ml-1 flex flex-col items-center">
            <span className="text-xs opacity-75">Tap</span>
            <span className="text-xs opacity-75">↑</span>
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.button>
  );
}

"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useLubToken } from "@/hooks/useLubToken";
import { useUserProgression } from "@/utils/userProgression";

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export default function FloatingActionButton({ onClick, className = "" }: FloatingActionButtonProps) {
  const { balanceFormatted } = useLubToken();
  const { progress } = useUserProgression();
  const { isConnected } = useAccount();

  // Show notification dot for new achievements or milestones
  const hasNotification = progress.gamesCompleted > 0 && !isConnected;

  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-30 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      style={{
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))'
      }}
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
          <span className="text-sm font-bold leading-none">{balanceFormatted}</span>
        </div>
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.button>
  );
}
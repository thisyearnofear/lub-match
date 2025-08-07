"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLubToken } from "@/hooks/useLubToken";
import { useUserProgression } from "@/utils/userProgression";
import { useAccount } from "wagmi";
import { formatLubAmount } from "@/utils/pricingEngine";
import WalletModal from "./WalletModal";
import OnboardingTooltip from "./shared/OnboardingTooltip";
import { UserDisplayFormatter } from "@/utils/userDisplay";
import { useOptimizedAnimation } from "@/utils/animations";
import { useUserIdentity } from "@/contexts/UserContext";
import { PulseIndicator } from "./shared/AnimatedTile";

export default function LubBalanceWidget() {
  const { balanceFormatted, enabled, history } = useLubToken();
  const { progress } = useUserProgression();
  const { isConnected } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [recentEarning, setRecentEarning] = useState<{
    amount: number;
    timestamp: number;
  } | null>(null);
  const [showPortfolioSummary, setShowPortfolioSummary] = useState(false);

  // NEW: Get user identity for personalized display
  const { farcasterUser, displayName, avatarUrl } = useUserIdentity();

  // NEW: Get display configuration
  const diamondDisplay = UserDisplayFormatter.getDiamondDisplay(
    farcasterUser,
    balanceFormatted,
    {
      showUsername: true,
      showAvatar: true,
      showBalance: true,
      format: "compact",
    }
  );

  // NEW: Optimized animations
  const breatheAnimation = useOptimizedAnimation("breathe", isConnected);
  const balanceAnimation = useOptimizedAnimation(
    "balanceUpdate",
    !!recentEarning
  );

  // Progressive disclosure - only show when user is ready
  if (!enabled || progress.tier === "newcomer") return null;

  // Track recent earnings for animation
  useEffect(() => {
    if (history && history.length > 0) {
      const latest = history[0];
      if (latest.amount > 0) {
        const earningTime = new Date(latest.timestamp).getTime();
        const now = Date.now();

        // Show animation for earnings within last 10 seconds
        if (now - earningTime < 10000) {
          setRecentEarning({ amount: latest.amount, timestamp: earningTime });
          setTimeout(() => setRecentEarning(null), 3000);
        }
      }
    }
  }, [history]);

  const getTooltipMessage = () => {
    if (isConnected) {
      return "💎 Your LUB portfolio! Tap to view detailed stats, activity, and portfolio overview.";
    }

    switch (progress.tier) {
      case "engaged":
        return "💎 LUB is your in-game social token! Complete games and connect your wallet to start earning.";
      case "web3-ready":
        return "💎 You're earning LUB! Use it for creative unlocks, NFT discounts, and more features.";
      case "power-user":
        return "💎 Master the LUB economy! Create, share, and earn in the full token ecosystem.";
      default:
        return "💎 LUB is your in-game social token! Earn it by playing, sharing, and inviting friends.";
    }
  };

  const getPortfolioSummary = () => {
    const totalEarned = Number(progress.totalLubEarned) / 1e18;
    const gamesCompleted = progress.gamesCompleted;
    const nftsMinted = progress.nftsMinted;

    return {
      totalEarned: totalEarned.toFixed(2),
      gamesCompleted,
      nftsMinted,
      tier: progress.tier,
    };
  };

  return (
    <>
      <OnboardingTooltip
        message={getTooltipMessage()}
        placement="left"
        localStorageKey={`lub_balance_tooltip_${progress.tier}`}
      >
        <PulseIndicator isActive={isConnected}>
          <motion.button
            className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform relative touch-manipulation"
            onClick={() => setShowModal(true)}
            onMouseEnter={() => isConnected && setShowPortfolioSummary(true)}
            onMouseLeave={() => setShowPortfolioSummary(false)}
            aria-label={isConnected ? "View LUB Portfolio" : "View LUB Wallet"}
            animate={breatheAnimation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* NEW: Show avatar if available */}
            {diamondDisplay.shouldShowAvatar && (
              <motion.img
                src={diamondDisplay.avatar}
                alt={diamondDisplay.displayName || "User avatar"}
                className="w-6 h-6 rounded-full border border-white/20"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { scale: 0, opacity: 0 },
                  visible: { scale: 1, opacity: 1 },
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}

            <span className="text-lg">💎</span>

            {/* NEW: Enhanced display with username */}
            <div className="flex flex-col items-start">
              {diamondDisplay.shouldShowUsername &&
                diamondDisplay.title !== "Connected" && (
                  <span className="text-xs opacity-80 leading-none">
                    {diamondDisplay.title}
                  </span>
                )}
              <motion.span
                className="font-bold leading-none"
                animate={balanceAnimation}
              >
                {diamondDisplay.subtitle || `${balanceFormatted} LUB`}
              </motion.span>
            </div>
          </motion.button>
        </PulseIndicator>
      </OnboardingTooltip>

      {/* Portfolio Summary Hover */}
      {isConnected && (
        <div className="relative">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>

          {/* Recent earning notification */}
          <AnimatePresence>
            {recentEarning && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                animate={{ opacity: 1, y: -30, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.8 }}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg"
              >
                +{recentEarning.amount}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Portfolio Summary Tooltip (Desktop) */}
          <AnimatePresence>
            {showPortfolioSummary && isConnected && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                className="absolute top-0 right-full mr-3 bg-white rounded-lg shadow-xl p-3 border border-gray-200 min-w-[200px] hidden md:block"
              >
                <div className="text-xs text-gray-600 mb-2 font-medium">
                  Portfolio Summary
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earned:</span>
                    <span className="font-bold text-purple-600">
                      {getPortfolioSummary().totalEarned} LUB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Games:</span>
                    <span className="font-bold text-blue-600">
                      {getPortfolioSummary().gamesCompleted}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">NFTs:</span>
                    <span className="font-bold text-green-600">
                      {getPortfolioSummary().nftsMinted}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tier:</span>
                    <span className="font-bold text-orange-600 capitalize">
                      {getPortfolioSummary().tier}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Click to view details
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showModal && <WalletModal onClose={() => setShowModal(false)} />}
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUnifiedStats } from "@/hooks/useUnifiedStats";

interface ConnectionIncentiveProps {
  tier: string;
  className?: string;
  onConnect?: () => void;
  context?: "modal" | "widget" | "game-complete" | "nft-mint";
  compact?: boolean;
}

export function ConnectionIncentive({
  tier,
  className = "",
  onConnect,
  context = "modal",
  compact = false,
}: ConnectionIncentiveProps) {
  const { isConnected } = useAccount();
  const { gamesCompleted, lubsCreated, recordEvent } = useUnifiedStats();

  // Don't show if already connected
  if (isConnected) return null;

  // Get contextual incentives based on user progress and context
  const getContextualIncentives = () => {
    const baseIncentives = {
      engaged: {
        title: "🎁 Unlock Rewards",
        benefits: [
          "Track your LUB earnings",
          "Mint NFT keepsakes",
          "Access premium features",
        ],
        cta: "Connect Wallet",
        urgency: "Start earning now!",
      },
      "web3-ready": {
        title: "💰 Maximize Earnings",
        benefits: [
          "Earn LUB tokens",
          "Get referral bonuses",
          "Access exclusive features",
        ],
        cta: "Connect & Earn",
        urgency: "Don't miss out on rewards!",
      },
      "power-user": {
        title: "🚀 Full Access",
        benefits: [
          "Complete token economy",
          "Advanced features",
          "Portfolio tracking",
        ],
        cta: "Connect Wallet",
        urgency: "Unlock everything!",
      },
    };

    // Context-specific modifications
    const contextModifications: Partial<
      Record<
        typeof context,
        Partial<{ title: string; urgency: string; cta: string }>
      >
    > = {
      "game-complete": {
        title: "🎉 Game Complete! Connect to Earn",
        urgency: "Secure your LUB rewards!",
        cta: "Claim Rewards",
      },
      "nft-mint": {
        title: "🖼️ Ready to Mint?",
        urgency: "Connect for discounted minting!",
        cta: "Connect & Save",
      },
      widget: {
        urgency: compact ? "Connect now!" : "Start earning today!",
      },
      modal: {}, // Default case for modal context
    };

    const base = baseIncentives[tier as keyof typeof baseIncentives];
    const contextMod = contextModifications[context] || {};

    if (!base) return null;

    return {
      ...base,
      ...contextMod,
      benefits: compact ? base.benefits.slice(0, 2) : base.benefits,
    };
  };

  const incentive = getContextualIncentives();

  if (!incentive) return null;

  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    }
    recordEvent({
      type: "wallet_connected",
    });
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`connection-incentive-compact ${className}`}
      >
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-800 mb-1">
                {incentive.title}
              </p>
              <p className="text-xs text-purple-600">{incentive.urgency}</p>
            </div>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={() => {
                    handleConnect();
                    openConnectModal?.();
                  }}
                  className="ml-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95"
                >
                  {incentive.cta}
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`connection-incentive ${className}`}
    >
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <div className="text-center mb-3">
          <h3
            className={`font-bold text-purple-800 mb-1 ${
              context === "game-complete" ? "text-xl" : "text-lg"
            }`}
          >
            {incentive.title}
          </h3>
          <p className="text-sm text-purple-600">{incentive.urgency}</p>
        </div>

        <ul className="space-y-2 mb-4">
          {incentive.benefits.map((benefit: string, index: number) => (
            <motion.li
              key={benefit}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-sm text-purple-700"
            >
              <span className="text-green-500">✓</span>
              {benefit}
            </motion.li>
          ))}
        </ul>

        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={() => {
                handleConnect();
                openConnectModal?.();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              {incentive.cta}
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    </motion.div>
  );
}

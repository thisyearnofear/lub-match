"use client";

import { motion } from "framer-motion";
import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import { useNFTPricing } from "@/hooks/useNFTPricing";
import {
  pricingEngine,
  LubMode,
  formatLubAmount,
  formatEthAmount,
} from "@/utils/pricingEngine";
import { WEB3_CONFIG } from "@/config";

interface PricingDisplayProps {
  mode: LubMode | "nft";
  className?: string;
  showEarningHints?: boolean;
  onGetLub?: () => void;
  onConnectWallet?: () => void;
  useDiscount?: boolean; // If true and discount available, highlight discount pricing
}

export function PricingDisplay({
  mode,
  className = "",
  showEarningHints = true,
  onGetLub,
  onConnectWallet,
  useDiscount = false,
}: PricingDisplayProps) {
  const { stats, tier, gamesCompleted } = useUnifiedStats();
  const nftPricing = useNFTPricing();

  // Create pricing state for pricing engine
  const pricingState = {
    lubBalance: stats.lubBalance,
    farcasterLubsCreated: stats.farcasterLubsCreated,
    romanceLubsCreated: stats.romanceLubsCreated,
    totalLubsCreated: stats.lubsCreated,
    hasConnectedWallet: stats.lubTransactionCount > 0,
  };

  // Show pricing for web3-ready users or NFT mode
  if (tier === "newcomer" && mode !== "nft") {
    return null;
  }

  // Get pricing information based on mode
  const getPricingInfo = () => {
    if (mode === "nft") {
      // Use new unified pricing hook for accurate contract data
      if (nftPricing.isLoading) {
        return {
          type: "nft" as const,
          regular: {
            cost: BigInt(0),
            costFormatted: "Loading...",
            canAfford: false,
            message: "Loading pricing...",
          },
          discount: null,
        };
      }

      return {
        type: "nft" as const,
        regular: {
          cost: nftPricing.regularPrice.ethCost,
          costFormatted: nftPricing.regularPrice.totalCostFormatted,
          canAfford: true, // We'll assume they can afford ETH for now
          message: "Mint your completed heart as an NFT",
        },
        discount: nftPricing.canAffordDiscount
          ? {
              cost: nftPricing.discountedPrice.ethCost,
              lubCost: nftPricing.discountedPrice.lubCost,
              costFormatted: nftPricing.discountedPrice.totalCostFormatted,
              savings: nftPricing.discountedPrice.savingsFormatted,
              canAfford: true,
              message: `Save ${nftPricing.discountedPrice.discountPercentage}% with LUB tokens!`,
            }
          : null,
      };
    } else {
      const pricing = pricingEngine.getLubPricing(mode, pricingState);
      const needsLub = pricingEngine.needsLubAcquisition(mode, pricingState);

      return {
        type: mode,
        pricing,
        needsLub,
      };
    }
  };

  const pricingInfo = getPricingInfo();

  if (pricingInfo.type === "nft") {
    const discountAvailable = !!pricingInfo.discount;
    const highlightDiscount = useDiscount && discountAvailable;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200 ${className}`}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            💎 Mint as NFT
          </h3>

          {/* Regular pricing */}
          <div
            className={`rounded-lg p-4 border ${
              highlightDiscount
                ? "bg-white border-gray-200 opacity-70"
                : "bg-white border-gray-200 ring-2 ring-pink-300"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Regular Price</span>
              <span className="font-semibold text-gray-800">
                {pricingInfo.regular.costFormatted}
              </span>
            </div>
          </div>

          {/* Discount pricing */}
          {pricingInfo.discount && (
            <div
              className={`rounded-lg p-4 border ${
                highlightDiscount
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ring-2 ring-green-300"
                  : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-700 font-medium flex items-center gap-2">
                  With LUB Discount
                  {highlightDiscount && (
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </span>
                <span className="font-semibold text-green-800">
                  {pricingInfo.discount.costFormatted}
                </span>
              </div>
              <div className="text-sm text-green-600">
                {pricingInfo.discount.savings}
              </div>
            </div>
          )}

          {/* No discount available */}
          {!pricingInfo.discount && tier !== "newcomer" && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">
                Need{" "}
                {formatLubAmount(WEB3_CONFIG.pricing.farcasterHoldRequirement)}{" "}
                LUB for discount
              </div>
              {onGetLub && (
                <button
                  onClick={onGetLub}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Get LUB tokens →
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Lub creation pricing
  const { pricing, needsLub } = pricingInfo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200 ${className}`}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {mode === "farcaster" ? "🎮 Farcaster Lub" : "💝 Romance Lub"}
        </h3>

        {/* Pricing info */}
        <div
          className={`rounded-lg p-4 border ${
            pricing.canAfford
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">
              {pricing.isFirstFree
                ? "First Lub"
                : pricing.requiresHolding
                ? "Hold Requirement"
                : "Cost"}
            </span>
            <span
              className={`font-semibold ${
                pricing.canAfford ? "text-green-800" : "text-red-800"
              }`}
            >
              {pricing.costFormatted}
            </span>
          </div>

          <div
            className={`text-sm ${
              pricing.canAfford ? "text-green-700" : "text-red-700"
            }`}
          >
            {pricing.message}
          </div>

          {pricing.requiresHolding && pricing.canAfford && (
            <div className="text-xs text-green-600 mt-1">
              ✅ Tokens stay in your wallet
            </div>
          )}
        </div>

        {/* Need LUB section */}
        {needsLub.needsLub && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-2">
              Need {formatLubAmount(needsLub.suggestedAmount)} more LUB
            </div>

            {showEarningHints && (
              <div className="space-y-1">
                <div className="text-xs text-blue-700 font-medium">
                  Ways to get LUB:
                </div>
                {needsLub.acquisitionMethods.map((method, index) => (
                  <div key={index} className="text-xs text-blue-600">
                    {method}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {onGetLub && (
                <button
                  onClick={onGetLub}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Get LUB
                </button>
              )}

              {stats.lubTransactionCount === 0 && onConnectWallet && (
                <button
                  onClick={onConnectWallet}
                  className="text-sm bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}

        {/* Current balance display */}
        {stats.lubTransactionCount > 0 && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Your LUB Balance</span>
              <span className="font-medium text-gray-800">
                {formatLubAmount(stats.lubBalance)}
              </span>
            </div>

            {stats.totalLubEarned > BigInt(0) && (
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>Total Earned</span>
                <span>{formatLubAmount(stats.totalLubEarned)}</span>
              </div>
            )}
          </div>
        )}

        {/* Tier-specific hints */}
        {tier === "newcomer" && (
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-sm text-yellow-800">
              💡 Complete your first game to start earning LUB tokens!
            </div>
          </div>
        )}

        {tier === "engaged" && stats.lubTransactionCount === 0 && (
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-sm text-purple-800">
              🚀 Connect a wallet to unlock LUB earning and spending features!
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

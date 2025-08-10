"use client";

import { motion } from "framer-motion";
import { useNFTPricing } from "@/hooks/useNFTPricing";
import { InfoTooltip } from "./InfoTooltip";

interface NFTPricingDisplayProps {
  useDiscount: boolean;
  onToggleDiscount: (enabled: boolean) => void;
  canUseDiscount: boolean;
  useFullLub?: boolean;
  onToggleFullLub?: (enabled: boolean) => void;
  canUseFullLub?: boolean;
  className?: string;
}

export function NFTPricingDisplay({
  useDiscount,
  onToggleDiscount,
  canUseDiscount,
  useFullLub = false,
  onToggleFullLub,
  canUseFullLub = false,
  className = "",
}: NFTPricingDisplayProps) {
  const pricing = useNFTPricing();

  if (pricing.isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white/10 rounded-lg p-4">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-6 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (pricing.error) {
    return (
      <div
        className={`bg-red-500/20 border border-red-500/30 rounded-lg p-4 ${className}`}
      >
        <p className="text-red-300 text-sm">
          ⚠️ Unable to load pricing: {pricing.error}
        </p>
      </div>
    );
  }

  const currentPrice = useFullLub
    ? pricing.fullLubPrice
    : useDiscount
    ? pricing.discountedPrice
    : pricing.regularPrice;
  const isDiscountMode =
    (useDiscount && canUseDiscount) || (useFullLub && canUseFullLub);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Pricing Display */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Mint Price</h3>
          <InfoTooltip content="Pricing is fetched directly from smart contracts for accuracy">
            <span className="text-white/60 text-sm">ⓘ Live Pricing</span>
          </InfoTooltip>
        </div>

        <motion.div
          key={useDiscount ? "discount" : "regular"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="text-2xl font-bold text-white">
            {currentPrice.totalCostFormatted}
          </div>

          {isDiscountMode && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <span>💰</span>
                <span>You save {pricing.discountedPrice.savingsFormatted}</span>
                <span className="bg-green-500/20 px-2 py-1 rounded-full text-xs">
                  {pricing.discountedPrice.discountPercentage}% OFF
                </span>
              </div>
              <div className="text-white/60 text-xs">
                Regular price: {pricing.regularPrice.totalCostFormatted}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Discount Toggle */}
      {canUseDiscount && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🪙</span>
                <span className="font-medium text-white">Use LUB Discount</span>
              </div>
              <p className="text-white/70 text-sm">
                Save {pricing.discountedPrice.discountPercentage}% by spending{" "}
                {pricing.discountedPrice.lubCostFormatted}
              </p>
            </div>
            <motion.button
              onClick={() => {
                onToggleDiscount(!useDiscount);
                // If enabling discount, disable full LUB
                if (!useDiscount && useFullLub && onToggleFullLub) {
                  onToggleFullLub(false);
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                useDiscount ? "bg-green-500" : "bg-white/20"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                animate={{ x: useDiscount ? 26 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        </div>
      )}

      {/* Full LUB Toggle */}
      {canUseFullLub && onToggleFullLub && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔥</span>
                <span className="font-medium text-white">Full LUB Payment</span>
                <span className="bg-yellow-500/20 px-2 py-1 rounded-full text-xs text-yellow-300">
                  100% OFF ETH!
                </span>
              </div>
              <p className="text-white/70 text-sm">
                Pay only {pricing.fullLubPrice.lubCostFormatted} - no ETH
                required!
              </p>
            </div>
            <motion.button
              onClick={() => {
                onToggleFullLub(!useFullLub);
                // If enabling full LUB, disable discount
                if (!useFullLub && useDiscount) {
                  onToggleDiscount(false);
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                useFullLub ? "bg-yellow-500" : "bg-white/20"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                animate={{ x: useFullLub ? 26 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        </div>
      )}

      {/* Exchange Rate Info */}
      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Exchange Rate:</span>
          <span className="text-white font-mono">
            {pricing.exchangeRateFormatted}
          </span>
        </div>
      </div>

      {/* Insufficient Balance Warning */}
      {useDiscount && !pricing.canAffordDiscount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-yellow-300">
            <span>⚠️</span>
            <span className="font-medium">Insufficient LUB Balance</span>
          </div>
          <p className="text-yellow-200/80 text-sm mt-1">
            You need {pricing.discountedPrice.lubCostFormatted} to use the
            discount. Participate in social games to earn more LUB!
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default NFTPricingDisplay;

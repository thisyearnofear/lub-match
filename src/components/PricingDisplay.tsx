"use client";

import { motion } from "framer-motion";
import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import { PaymentMethodSelector, PaymentMethod } from "@/components/shared/PaymentMethodSelector";
import {
  pricingEngine,
  LubMode,
  formatLubAmount,
} from "@/utils/pricingEngine";
import { WEB3_CONFIG } from "@/config";
import React from "react";

interface PricingDisplayProps {
  mode: LubMode | "nft";
  className?: string;
  showEarningHints?: boolean;
  onGetLub?: () => void;
  onConnectWallet?: () => void;
  // NFT-specific props (for external control of PaymentMethodSelector)
  selectedPaymentMethod?: PaymentMethod;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
}

export function PricingDisplay({
  mode,
  className = "",
  showEarningHints = true,
  onGetLub,
  onConnectWallet,
  selectedPaymentMethod,
  onPaymentMethodChange,
}: PricingDisplayProps) {
  const { stats, tier, gamesCompleted } = useUnifiedStats();

  // Internal state for NFT payment method if not controlled externally
  const [internalPaymentMethod, setInternalPaymentMethod] = React.useState<PaymentMethod>("eth");

  // Use external or internal payment method state
  const paymentMethod = selectedPaymentMethod || internalPaymentMethod;
  const setPaymentMethod = onPaymentMethodChange || setInternalPaymentMethod;

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

  // NFT mode - delegate to PaymentMethodSelector (single responsibility)
  if (mode === "nft") {
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

          {/* Use the new PaymentMethodSelector for better UX */}
          <div className="bg-white rounded-lg p-4">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />
          </div>

          {/* Help text for earning LUB */}
          {onGetLub && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700 mb-2">
                💡 Earn LUB tokens to unlock discounts and payment options
              </div>
              <button
                onClick={onGetLub}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Learn how to earn LUB →
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Lub creation pricing
  const pricing = pricingEngine.getLubPricing(mode, pricingState);
  const needsLub = pricingEngine.needsLubAcquisition(mode, pricingState);

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

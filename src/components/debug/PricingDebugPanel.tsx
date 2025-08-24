"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNFTPricing } from "@/hooks/useNFTPricing";
import { useLubToken } from "@/hooks/useLubToken";
import { useHeartNFT } from "@/hooks/useHeartNFT";
import {
  pricingEngine,
  formatEthAmount,
  formatLubAmount,
} from "@/utils/pricingEngine";

export function PricingDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // New unified pricing
  const nftPricing = useNFTPricing();

  // LUB token data
  const lubToken = useLubToken();

  // Heart NFT data
  const heartNFT = useHeartNFT();

  // Legacy pricing removed - now using unified useNFTPricing hook

  if (process.env.NODE_ENV === "production") {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🔍 Pricing Debug
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-96 max-h-96 overflow-y-auto bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 p-4"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Pricing Debug Panel</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Contract Addresses */}
              <div className="bg-gray-800 rounded p-3">
                <h4 className="font-semibold mb-2">📄 Contract Addresses</h4>
                <div className="text-xs space-y-1 font-mono">
                  <div>
                    Heart NFT: {process.env.NEXT_PUBLIC_HEART_NFT_ADDRESS}
                  </div>
                  <div>
                    LUB Token: {process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS}
                  </div>
                </div>
              </div>

              {/* New Unified Pricing */}
              <div className="bg-green-900/30 rounded p-3">
                <h4 className="font-semibold mb-2">✅ New Unified Pricing</h4>
                {nftPricing.isLoading ? (
                  <div className="text-yellow-400">Loading...</div>
                ) : nftPricing.error ? (
                  <div className="text-red-400">Error: {nftPricing.error}</div>
                ) : (
                  <div className="text-xs space-y-1">
                    <div>Base Price: {nftPricing.basePriceFormatted}</div>
                    <div>
                      Regular: {nftPricing.regularPrice.totalCostFormatted}
                    </div>
                    <div>
                      Discount: {nftPricing.discountedPrice.totalCostFormatted}
                    </div>
                    <div>
                      Savings: {nftPricing.discountedPrice.savingsFormatted} (
                      {nftPricing.discountedPrice.discountPercentage}%)
                    </div>
                    <div>Exchange Rate: {nftPricing.exchangeRateFormatted}</div>
                    <div>
                      Can Afford: {nftPricing.canAffordDiscount ? "✅" : "❌"}
                    </div>
                  </div>
                )}
              </div>

              {/* Legacy Pricing Engine - DEPRECATED */}
              <div className="bg-red-900/30 rounded p-3">
                <h4 className="font-semibold mb-2">
                  ❌ Legacy Pricing Engine (DEPRECATED)
                </h4>
                <div className="text-xs text-red-300">
                  Legacy pricing has been removed. Use the unified pricing
                  system above.
                </div>
              </div>

              {/* Heart NFT Hook Data */}
              <div className="bg-blue-900/30 rounded p-3">
                <h4 className="font-semibold mb-2">💎 Heart NFT Hook</h4>
                <div className="text-xs space-y-1">
                  <div>Pending: {heartNFT.isPending ? "✅" : "❌"}</div>
                  <div>Enabled: {heartNFT.enabled ? "✅" : "❌"}</div>
                  <div>
                    NFT Balance: {heartNFT.nftBalance?.toString() || "0"}
                  </div>
                </div>
              </div>

              {/* LUB Token Data */}
              <div className="bg-purple-900/30 rounded p-3">
                <h4 className="font-semibold mb-2">🪙 LUB Token</h4>
                <div className="text-xs space-y-1">
                  <div>Balance: {formatLubAmount(lubToken.balance)}</div>
                  <div>
                    Exchange Rate:{" "}
                    {lubToken.exchangeRate?.toString() || "Loading..."} LUB/ETH
                  </div>
                  <div>
                    Hold Requirement:{" "}
                    {formatLubAmount(lubToken.holdRequirement)}
                  </div>
                  <div>
                    Can Create Game:{" "}
                    {lubToken.canCreateFarcasterLub() ? "✅" : "❌"}
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-gray-800 rounded p-3">
                <h4 className="font-semibold mb-2">🔍 System Status</h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Pricing Loaded:</span>
                    <span
                      className={
                        !nftPricing.isLoading && !nftPricing.error
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {!nftPricing.isLoading && !nftPricing.error ? "✅" : "❌"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>LUB Token:</span>
                    <span
                      className={
                        lubToken.balance > 0
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {lubToken.balance > 0 ? "✅" : "⚠️"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heart NFT:</span>
                    <span
                      className={
                        !heartNFT.isPending
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {!heartNFT.isPending ? "✅" : "⏳"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-orange-900/30 rounded p-3">
                <h4 className="font-semibold mb-2">💡 Recommendations</h4>
                <div className="text-xs space-y-1">
                  <div>• Use useNFTPricing() for all pricing displays</div>
                  <div>• Legacy pricingEngine is fallback only</div>
                  <div>• All prices should match across hooks</div>
                  <div>• Exchange rate should be fetched from contract</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PricingDebugPanel;

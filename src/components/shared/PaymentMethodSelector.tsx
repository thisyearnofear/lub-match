"use client";

import React from "react";
import { motion } from "framer-motion";
import { useNFTPricing } from "@/hooks/useNFTPricing";
import { InfoTooltip } from "./InfoTooltip";

export type PaymentMethod = "eth" | "eth-lub-discount" | "full-lub";

interface PaymentMethodOption {
  id: PaymentMethod;
  title: string;
  description: string;
  icon: string;
  available: boolean;
  price: {
    primary: string;
    secondary?: string;
    savings?: string;
  };
  badge?: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  className = "",
}: PaymentMethodSelectorProps) {
  const pricing = useNFTPricing();

  if (pricing.isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-white/20 rounded w-32"></div>
            <div className="h-4 bg-white/20 rounded-full w-4"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-4 h-20 border border-white/10"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pricing.error) {
    return (
      <div className={`bg-red-500/20 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <p className="text-red-300 text-sm">
          ⚠️ Unable to load payment options: {pricing.error}
        </p>
      </div>
    );
  }

  const paymentOptions: PaymentMethodOption[] = [
    {
      id: "eth",
      title: "Pay with ETH",
      description: "Standard payment using Ethereum",
      icon: "💎",
      available: true,
      price: {
        primary: pricing.regularPrice.ethCostFormatted,
      },
    },
    {
      id: "eth-lub-discount",
      title: "ETH + LUB Discount",
      description: "Save 50% by spending LUB tokens",
      icon: "💰",
      available: pricing.canAffordDiscount,
      price: {
        primary: pricing.discountedPrice.ethCostFormatted,
        secondary: `+ ${pricing.discountedPrice.lubCostFormatted}`,
        savings: pricing.discountedPrice.savingsFormatted,
      },
      badge: "50% OFF",
    },
    {
      id: "full-lub",
      title: "Pay with LUB Only",
      description: "Use only LUB tokens, no ETH required",
      icon: "🪙",
      available: pricing.canAffordFullLub,
      price: {
        primary: pricing.fullLubPrice.lubCostFormatted,
        secondary: "No ETH required",
      },
      badge: "LUB ONLY",
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Payment Method</h3>
        <InfoTooltip content="Choose how you'd like to pay for your NFT. LUB tokens provide discounts and can be earned through gameplay.">
          <span className="text-white/60 text-sm">ⓘ</span>
        </InfoTooltip>
      </div>

      <div className="space-y-3">
        {paymentOptions.map((option) => (
          <motion.div
            key={option.id}
            whileHover={option.available ? { scale: 1.02 } : undefined}
            whileTap={option.available ? { scale: 0.98 } : undefined}
            className={`
              relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-300
              ${
                selectedMethod === option.id
                  ? "border-purple-400 bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20"
                  : option.available
                  ? "border-white/20 bg-white/5 hover:border-purple-400/60 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10"
                  : "border-white/10 bg-white/5 opacity-50 cursor-not-allowed"
              }
            `}
            onClick={() => option.available && onMethodChange(option.id)}
          >
            {/* Selection indicator */}
            <div className="absolute top-3 right-3">
              {selectedMethod === option.id ? (
                <motion.div
                  className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-white/40 hover:border-purple-400/60 transition-colors"></div>
              )}
            </div>

            {/* Badge */}
            {option.badge && option.available && (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                {option.badge}
              </div>
            )}

            <div className="flex items-start gap-3 pr-8">
              <div className="text-2xl">{option.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold ${option.available ? "text-white" : "text-white/50"}`}>
                    {option.title}
                  </h4>
                </div>
                <p className={`text-sm mb-2 ${option.available ? "text-white/70" : "text-white/40"}`}>
                  {option.description}
                </p>
                
                <div className="space-y-1">
                  <div className={`font-bold ${option.available ? "text-white" : "text-white/50"}`}>
                    {option.price.primary}
                    {option.price.secondary && (
                      <span className="font-normal text-sm ml-2 opacity-80">
                        {option.price.secondary}
                      </span>
                    )}
                  </div>
                  {option.price.savings && option.available && (
                    <motion.div
                      className="text-green-400 text-sm flex items-center gap-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.span
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        💰
                      </motion.span>
                      Save {option.price.savings}
                    </motion.div>
                  )}
                </div>

                {!option.available && (
                  <div className="text-yellow-400 text-xs mt-2">
                    {option.id === "eth-lub-discount" 
                      ? `Need ${pricing.discountedPrice.lubCostFormatted} LUB`
                      : `Need ${pricing.fullLubPrice.lubCostFormatted} LUB`
                    }
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Help text */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-3 backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <span className="text-blue-300">💡</span>
          <div className="text-blue-200 text-sm">
            <p className="font-medium mb-1">How to earn LUB tokens:</p>
            <ul className="text-xs space-y-1 text-blue-200/80">
              <li>• Complete social discovery games</li>
              <li>• Get included in other players' games</li>
              <li>• Participate in community activities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodSelector;

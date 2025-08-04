"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InfoTooltipProps {
  content: React.ReactNode;
  title?: string;
  placement?: "top" | "bottom" | "left" | "right";
  maxWidth?: string;
  children?: React.ReactNode;
}

export function InfoTooltip({
  content,
  title,
  placement = "top",
  maxWidth = "280px",
  children,
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPlacementClasses = () => {
    switch (placement) {
      case "top":
        return "bottom-full mb-2 left-1/2 -translate-x-1/2";
      case "bottom":
        return "top-full mt-2 left-1/2 -translate-x-1/2";
      case "left":
        return "right-full mr-2 top-1/2 -translate-y-1/2";
      case "right":
        return "left-full ml-2 top-1/2 -translate-y-1/2";
      default:
        return "bottom-full mb-2 left-1/2 -translate-x-1/2";
    }
  };

  const getArrowClasses = () => {
    switch (placement) {
      case "top":
        return "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800";
      case "bottom":
        return "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800";
      case "right":
        return "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800";
      default:
        return "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800";
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="cursor-help"
      >
        {children || (
          <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-blue-600 transition-colors">
            i
          </div>
        )}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${getPlacementClasses()}`}
            style={{ maxWidth }}
          >
            <div className="bg-gray-800 text-white text-sm rounded-lg shadow-xl p-3 border border-gray-700">
              {title && (
                <div className="font-semibold text-blue-300 mb-2">{title}</div>
              )}
              <div className="leading-relaxed">{content}</div>
            </div>
            {/* Arrow */}
            <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Predefined tooltip components for common Web3 concepts
export const Web3Tooltips = {
  Wallet: ({ children }: { children?: React.ReactNode }) => (
    <InfoTooltip
      title="What's a Wallet?"
      content={
        <div>
          <p className="mb-2">
            A digital wallet is like your online bank account for crypto.
          </p>
          <p className="mb-2">It lets you:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Store digital assets safely</li>
            <li>Sign transactions securely</li>
            <li>Interact with apps like this one</li>
          </ul>
          <p className="mt-2 text-blue-300">
            Popular wallets: MetaMask, Coinbase Wallet
          </p>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  ),

  Minting: ({ children }: { children?: React.ReactNode }) => (
    <InfoTooltip
      title="What's Minting?"
      content={
        <div>
          <p className="mb-2">
            Minting creates a unique digital collectible of your game.
          </p>
          <p className="mb-2">Think of it like:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>A digital trophy you own forever</li>
            <li>Proof you completed this heart game</li>
            <li>A collectible you can share or trade</li>
          </ul>
          <p className="mt-2 text-green-300">
            It's stored permanently on the blockchain!
          </p>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  ),

  Arbitrum: ({ children }: { children?: React.ReactNode }) => (
    <InfoTooltip
      title="What's Arbitrum?"
      content={
        <div>
          <p className="mb-2">
            Arbitrum is a fast, low-cost blockchain network.
          </p>
          <p className="mb-2">Benefits:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Cheaper than Ethereum mainnet</li>
            <li>Fast transactions (seconds, not minutes)</li>
            <li>Same security as Ethereum</li>
          </ul>
          <p className="mt-2 text-purple-300">Perfect for gaming and NFTs!</p>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  ),

  NFT: ({ children }: { children?: React.ReactNode }) => (
    <InfoTooltip
      title="What's an NFT?"
      content={
        <div>
          <p className="mb-2">NFT = Non-Fungible Token (unique digital item)</p>
          <p className="mb-2">Your heart game NFT includes:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>The images you matched</li>
            <li>Your completion time</li>
            <li>A unique certificate of ownership</li>
          </ul>
          <p className="mt-2 text-pink-300">
            It's yours forever, stored on the blockchain!
          </p>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  ),
};

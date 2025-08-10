"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InfoTooltip } from "./InfoTooltip";

interface ContractInfoProps {
  className?: string;
  variant?: "minimal" | "detailed";
}

export function ContractInfo({ className = "", variant = "minimal" }: ContractInfoProps) {
  const [copied, setCopied] = useState(false);
  
  const heartNFTAddress = process.env.NEXT_PUBLIC_HEART_NFT_ADDRESS;
  const lubTokenAddress = process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS;
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getArbiscanUrl = (address: string) => 
    `https://arbiscan.io/address/${address}`;

  const formatAddress = (address: string) => 
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (variant === "minimal") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <InfoTooltip content="View contract on Arbiscan">
          <a
            href={getArbiscanUrl(heartNFTAddress || "")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1"
          >
            <span>📄</span>
            <span>Contract</span>
            <span className="text-xs">↗</span>
          </a>
        </InfoTooltip>
      </div>
    );
  }

  return (
    <div className={`contract-info ${className}`}>
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔗</span>
          <h3 className="font-semibold text-gray-800">Smart Contracts</h3>
          <InfoTooltip content="Deployed on Arbitrum Mainnet for low fees and fast transactions">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Arbitrum
            </span>
          </InfoTooltip>
        </div>

        <div className="space-y-3">
          {/* Heart NFT Contract */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-purple-700">💝 Heart NFT</span>
                <InfoTooltip content="ERC721 contract for minting and managing Heart NFTs with social features">
                  <span className="text-xs text-purple-600">ⓘ</span>
                </InfoTooltip>
              </div>
              <div className="text-xs text-gray-600 font-mono">
                {heartNFTAddress ? formatAddress(heartNFTAddress) : "Not configured"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(heartNFTAddress || "", "Heart NFT")}
                className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                title="Copy address"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="text-green-600"
                    >
                      ✓
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      📋
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <a
                href={getArbiscanUrl(heartNFTAddress || "")}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                title="View on Arbiscan"
              >
                ↗
              </a>
            </div>
          </div>

          {/* LUB Token Contract */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-yellow-700">🪙 LUB Token</span>
                <InfoTooltip content="ERC20 utility token for discounts and rewards">
                  <span className="text-xs text-yellow-600">ⓘ</span>
                </InfoTooltip>
              </div>
              <div className="text-xs text-gray-600 font-mono">
                {lubTokenAddress ? formatAddress(lubTokenAddress) : "Not configured"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(lubTokenAddress || "", "LUB Token")}
                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                title="Copy address"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="text-green-600"
                    >
                      ✓
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      📋
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <a
                href={getArbiscanUrl(lubTokenAddress || "")}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                title="View on Arbiscan"
              >
                ↗
              </a>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Verified & Open Source</span>
            <a
              href="https://github.com/thisyearnofear/valentines-game"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-600 transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractInfo;

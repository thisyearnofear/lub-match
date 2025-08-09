"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import EnhancedNFTPreview from "@/components/shared/EnhancedNFTPreview";
import { PricingDisplay } from "@/components/PricingDisplay";
import MiniAppWalletConnect from "@/components/MiniAppWalletConnect";
import ActionButton from "@/components/shared/ActionButton";
import { useAccount, useChainId } from "wagmi";
import { useHeartNFT } from "@/hooks/useHeartNFT";
import { formatEthAmount, formatLubAmount, pricingEngine } from "@/utils/pricingEngine";
import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import { trackNFTMinted } from "@/utils/analytics";
import { useOnboardingContext } from "@/components/onboarding/OnboardingProvider";

type GameType = "custom" | "demo";

type GameStats = {
  completionTime: number;
  accuracy: number;
  socialDiscoveries: number;
};

export type HeartNFTMinterProps = {
  gameImages: string[];
  gameLayout: number[];
  message: string;
  gameType: GameType;
  creator: `0x${string}` | string;
  onClose: () => void;
  onMinted?: (tokenId: string) => void;
  onViewCollection?: () => void;
  users?: any[];
  gameStats?: GameStats;
};

export default function HeartNFTMinter({
  gameImages,
  gameLayout,
  message,
  gameType,
  creator,
  onClose,
  onMinted,
  onViewCollection,
  users,
  gameStats,
}: HeartNFTMinterProps) {
  const [isMinting, setIsMinting] = React.useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { showToast } = useOnboardingContext();
  const { stats } = useUnifiedStats();
  const {
    mintPrices,
    discountedMintPrices,
    mintCompletedHeartWithMetadata,
    waitForMintReceiptAndTokenId,
    isPending,
  } = useHeartNFT();

  const [useDiscount, setUseDiscount] = React.useState(false);

  // Determine discount eligibility using pricing engine + unified stats
  const discountInfo = pricingEngine.getNFTMintPrice(true, stats.lubBalance);
  const discountAvailable = !!discountedMintPrices; // indicates contract returned discount price
  const canUseDiscount = isConnected && discountAvailable && discountInfo.canAffordDiscount;

  const handleMint = async () => {
    try {
      setIsMinting(true);

      // Prepare heart data for metadata/mint
      const completedAt = BigInt(Math.floor(Date.now() / 1000));
      const completer = (address as `0x${string}`) || ("0x0000000000000000000000000000000000000000" as const);

      const heartData = {
        imageHashes: gameImages,
        layout: gameLayout,
        message,
        completedAt,
        creator: creator as `0x${string}`,
        completer,
        gameType,
        users,
        gameStats,
      } as const;

      const tx = await mintCompletedHeartWithMetadata(heartData, useDiscount);

      // Surface transaction submitted toast immediately
      const explorerBase = chainId === 42161
        ? "https://arbiscan.io/tx/"
        : chainId === 421614
        ? "https://sepolia.arbiscan.io/tx/" // Arbitrum Sepolia uses Arbiscan testnet domain
        : "https://arbiscan.io/tx/";
      const txHash = tx as `0x${string}`;
      showToast(
        "Transaction Submitted",
        "Waiting for confirmation...",
        {
          icon: "⏳",
          duration: 6000,
          actionButton: {
            text: "View on Explorer",
            onClick: () => window.open(`${explorerBase}${txHash}`, "_blank"),
          },
        }
      );

      // Wait for receipt and decode tokenId from on-chain event
      const { tokenId } = await waitForMintReceiptAndTokenId(tx as `0x${string}`);

      // Show success toast with a CTA to view collection
      showToast(
        "💎 NFT Minted!",
        tokenId
          ? `Your NFT #${tokenId.toString()} has been minted successfully.`
          : "Your NFT has been minted successfully.",
        {
          icon: "🎉",
          duration: 6000,
          actionButton: onViewCollection
            ? { text: "View Collection", onClick: onViewCollection }
            : undefined,
        }
      );

      if (tokenId) {
        onMinted?.(tokenId.toString());
      }

      // Analytics
      const priceEth = useDiscount
        ? discountedMintPrices?.eth ?? BigInt(0)
        : mintPrices?.eth ?? BigInt(0);
      trackNFTMinted(tokenId ? tokenId.toString() : "", formatEthAmount(priceEth), useDiscount);
    } catch (e) {
      console.error("Mint failed:", e);
      showToast(
        "Mint Failed",
        e instanceof Error ? e.message : "Please try again.",
        { icon: "⚠️", duration: 6000 }
      );
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md mx-4 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10 shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className="p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Mint Your Heart NFT</h3>
            <p className="text-xs text-gray-400 mt-1">
              Celebrate this moment by minting a commemorative NFT on-chain.
            </p>
          </div>

          <div className="p-5 space-y-4">
            <EnhancedNFTPreview
              images={gameImages}
              message={message}
              users={users}
              gameStats={gameStats}
            />

            <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
              <div className="text-sm text-white/80 flex items-center gap-2">
                <span>Use LUB Discount</span>
                {!canUseDiscount && (
                  <span className="text-xs text-white/60">
                    {isConnected
                      ? `Need ${formatLubAmount(discountInfo.lubCost)} LUB`
                      : "Connect Wallet"}
                  </span>
                )}
              </div>
              <label className={`inline-flex items-center ${canUseDiscount ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useDiscount && canUseDiscount}
                  onChange={(e) => canUseDiscount && setUseDiscount(e.target.checked)}
                  disabled={!canUseDiscount}
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  useDiscount && canUseDiscount ? "bg-pink-500" : "bg-white/20"
                }`} />
              </label>
            </div>

            <PricingDisplay mode="nft" useDiscount={useDiscount} />

            {!isConnected && (
              <div className="rounded-lg bg-white/5 p-3">
                <MiniAppWalletConnect />
              </div>
            )}
          </div>

          <div className="p-5 flex gap-2 border-t border-white/10">
            {onViewCollection && (
              <ActionButton variant="ghost" size="sm" onClick={onViewCollection}>
                View Collection
              </ActionButton>
            )}
            <div className="flex-1" />
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isMinting || isPending}
            >
              Close
            </ActionButton>
            <ActionButton
              variant="gradient-pink"
              size="sm"
              onClick={handleMint}
              disabled={isMinting || isPending || !isConnected}
            >
              {isMinting || isPending ? "Minting..." : isConnected ? "Mint NFT" : "Connect Wallet"}
            </ActionButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

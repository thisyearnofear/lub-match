"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import NFTPreview from "@/components/shared/NFTPreview";
import { PricingDisplay } from "@/components/PricingDisplay";
import MiniAppWalletConnect from "@/components/MiniAppWalletConnect";
import ActionButton from "@/components/shared/ActionButton";
import { useAccount, useChainId } from "wagmi";
import { useHeartNFT } from "@/hooks/useHeartNFT";
import { useNFTPricing } from "@/hooks/useNFTPricing";
import { useLubToken } from "@/hooks/useLubToken";
import { NFTPricingDisplay } from "@/components/shared/NFTPricingDisplay";
import {
  formatEthAmount,
  formatLubAmount,
  pricingEngine,
} from "@/utils/pricingEngine";
import { useUnifiedStats } from "@/hooks/useUnifiedStats";
import { trackNFTMinted } from "@/utils/analytics";
import { useOnboardingContext } from "@/components/onboarding/OnboardingProvider";
import { useWeb3ErrorHandler } from "@/hooks/useWeb3ErrorHandler";

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
    mintCompletedHeartWithMetadata,
    mintCompletedHeartWithLub,
    waitForMintReceiptAndTokenId,
    isPending,
  } = useHeartNFT();
  
  const { refetchBalance } = useLubToken();

  // Web3 error handling
  const { handleError: handleWeb3Error, ToastComponent: Web3ErrorToast } = useWeb3ErrorHandler();

  // Use the new unified pricing hook for accurate contract data
  const nftPricing = useNFTPricing();

  const [useDiscount, setUseDiscount] = React.useState(false);
  const [useFullLub, setUseFullLub] = React.useState(false);

  // Determine payment options eligibility using real contract data
  const canUseDiscount =
    isConnected && nftPricing.canAffordDiscount && !nftPricing.isLoading;
  const canUseFullLub =
    isConnected && nftPricing.canAffordFullLub && !nftPricing.isLoading;

  const handleMint = async () => {
    try {
      setIsMinting(true);

      // Refresh LUB balance to ensure we have the latest data
      await refetchBalance();

      // Prepare heart data for metadata/mint
      const completedAt = BigInt(Math.floor(Date.now() / 1000));
      const completer =
        (address as `0x${string}`) ||
        ("0x0000000000000000000000000000000000000000" as const);

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

      const tx = await mintCompletedHeartWithMetadata(
        heartData,
        useDiscount,
        undefined,
        useFullLub
      );

      // Surface transaction submitted toast immediately
      const explorerBase =
        chainId === 42161
          ? "https://arbiscan.io/tx/"
          : chainId === 421614
          ? "https://sepolia.arbiscan.io/tx/" // Arbitrum Sepolia uses Arbiscan testnet domain
          : "https://arbiscan.io/tx/";
      const txHash = tx as `0x${string}`;
      showToast("Transaction Submitted", "Waiting for confirmation...", {
        icon: "⏳",
        duration: 6000,
        actionButton: {
          text: "View on Explorer",
          onClick: () => window.open(`${explorerBase}${txHash}`, "_blank"),
        },
      });

      // Wait for receipt and decode tokenId from on-chain event
      const { tokenId } = await waitForMintReceiptAndTokenId(
        tx as `0x`
      );

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
        ? nftPricing.discountedPrice.ethCost
        : nftPricing.regularPrice.ethCost;
      trackNFTMinted(
        tokenId ? tokenId.toString() : "",
        formatEthAmount(priceEth),
        useDiscount
      );
    } catch (e: any) {
      console.error("Mint failed:", e);

      // Use the new Web3 error handler for better UX
      await handleWeb3Error(e);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <>
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md mx-4 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className="p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">
              Mint Your Heart NFT
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Celebrate this moment by minting a commemorative NFT on-chain.
            </p>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <NFTPreview
              images={gameImages}
              message={message}
              users={users}
              gameStats={gameStats}
            />

            <NFTPricingDisplay
              useDiscount={useDiscount}
              onToggleDiscount={setUseDiscount}
              canUseDiscount={canUseDiscount}
              useFullLub={useFullLub}
              onToggleFullLub={setUseFullLub}
              canUseFullLub={canUseFullLub}
            />

            {!isConnected && (
              <div className="rounded-lg bg-white/5 p-3">
                <MiniAppWalletConnect />
              </div>
            )}
          </div>

          <div className="p-5 flex gap-2 border-t border-white/10 flex-shrink-0">
            {onViewCollection && (
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={onViewCollection}
              >
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
              {isMinting || isPending
                ? "Minting..."
                : isConnected
                ? "Mint NFT"
                : "Connect Wallet"}
            </ActionButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    
    {/* Web3 Error Toast */}
    <Web3ErrorToast />
  </>
  );
}

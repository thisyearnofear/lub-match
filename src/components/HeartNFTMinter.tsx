"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import NFTPreview from "@/components/shared/NFTPreview";
import MiniAppWalletConnect from "@/components/MiniAppWalletConnect";
import ActionButton from "@/components/shared/ActionButton";
import { useAccount, useChainId } from "wagmi";
import { useHeartNFT } from "@/hooks/useHeartNFT";
import { useNFTPricing } from "@/hooks/useNFTPricing";
import { useLubToken } from "@/hooks/useLubToken";
import { PaymentMethodSelector, PaymentMethod } from "@/components/shared/PaymentMethodSelector";
import { formatEthAmount } from "@/utils/pricingEngine";
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

  // Payment method state - default to ETH if no LUB options available
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(() => {
    if (nftPricing.canAffordFullLub) return "full-lub";
    if (nftPricing.canAffordDiscount) return "eth-lub-discount";
    return "eth";
  });

  // Update payment method when pricing data changes
  React.useEffect(() => {
    if (!nftPricing.isLoading) {
      // If current method is not available, switch to best available option
      if (paymentMethod === "full-lub" && !nftPricing.canAffordFullLub) {
        setPaymentMethod(nftPricing.canAffordDiscount ? "eth-lub-discount" : "eth");
      } else if (paymentMethod === "eth-lub-discount" && !nftPricing.canAffordDiscount) {
        setPaymentMethod("eth");
      }
    }
  }, [nftPricing.canAffordDiscount, nftPricing.canAffordFullLub, nftPricing.isLoading, paymentMethod]);

  // Derive legacy flags for existing mint logic
  const useDiscount = paymentMethod === "eth-lub-discount";
  const useFullLub = paymentMethod === "full-lub";

  // Payment method validation
  const validatePaymentMethod = () => {
    switch (paymentMethod) {
      case "eth":
        return { isValid: true, message: "" };

      case "eth-lub-discount":
        if (!nftPricing.canAffordDiscount) {
          return {
            isValid: false,
            message: `You need ${nftPricing.discountedPrice.lubCostFormatted} LUB tokens to use the discount option.`
          };
        }
        return { isValid: true, message: "" };

      case "full-lub":
        if (!nftPricing.canAffordFullLub) {
          return {
            isValid: false,
            message: `You need ${nftPricing.fullLubPrice.lubCostFormatted} LUB tokens to pay with LUB only.`
          };
        }
        return { isValid: true, message: "" };

      default:
        return { isValid: false, message: "Invalid payment method selected." };
    }
  };

  // Helper function for display names
  const getPaymentMethodDisplayName = (method: PaymentMethod) => {
    switch (method) {
      case "eth": return "ETH";
      case "eth-lub-discount": return "ETH + LUB discount";
      case "full-lub": return "LUB tokens only";
      default: return "Unknown method";
    }
  };

  const handleMint = async () => {
    try {
      setIsMinting(true);

      // Refresh LUB balance to ensure we have the latest data
      await refetchBalance();

      // Validate payment method before proceeding
      const validationResult = validatePaymentMethod();
      if (!validationResult.isValid) {
        showToast(
          "❌ Payment Method Error",
          validationResult.message,
          { icon: "⚠️", duration: 5000 }
        );
        return;
      }

      // Show payment method confirmation
      showToast(
        "🔄 Processing Payment",
        `Minting NFT using ${getPaymentMethodDisplayName(paymentMethod)}...`,
        { icon: "💳", duration: 3000 }
      );

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

      // Get LUB costs for approval handling (mutually exclusive payment methods)
      const totalLubCost = useFullLub 
        ? nftPricing.fullLubPrice.lubCost 
        : useDiscount 
          ? nftPricing.discountedPrice.lubCost 
          : BigInt(0);
      
      console.log('💰 Minting with payment method:', {
        paymentMethod,
        useDiscount,
        useFullLub,
        totalLubCost: totalLubCost.toString(),
        ethCost: paymentMethod === "full-lub" ? "0" :
                 paymentMethod === "eth-lub-discount" ? nftPricing.discountedPrice.ethCost.toString() :
                 nftPricing.regularPrice.ethCost.toString(),
      });

      const tx = await mintCompletedHeartWithMetadata(
        heartData,
        useDiscount,
        undefined,
        useFullLub,
        totalLubCost
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

      // Show success toast with payment method info
      const paymentMethodText = paymentMethod === "eth" ? "ETH" :
                               paymentMethod === "full-lub" ? "LUB tokens" :
                               "ETH + LUB discount";

      showToast(
        "💎 NFT Minted!",
        tokenId
          ? `Your NFT #${tokenId.toString()} has been minted successfully using ${paymentMethodText}.`
          : `Your NFT has been minted successfully using ${paymentMethodText}.`,
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

      // Enhanced error handling with payment method context
      let errorMessage = "An error occurred while minting your NFT.";

      if (e.message?.includes("insufficient")) {
        if (paymentMethod === "eth") {
          errorMessage = "Insufficient ETH balance to complete the mint.";
        } else if (paymentMethod === "eth-lub-discount") {
          errorMessage = "Insufficient balance for ETH + LUB discount payment.";
        } else if (paymentMethod === "full-lub") {
          errorMessage = "Insufficient LUB tokens to complete the mint.";
        }
      } else if (e.message?.includes("rejected")) {
        errorMessage = `Transaction rejected. Your ${getPaymentMethodDisplayName(paymentMethod)} payment was not processed.`;
      }

      showToast(
        "❌ Mint Failed",
        errorMessage,
        { icon: "⚠️", duration: 6000 }
      );

      // Use the new Web3 error handler for additional context
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

            {isConnected ? (
              <>
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onMethodChange={setPaymentMethod}
                />

                {/* Show validation warning if current method is invalid */}
                {!validatePaymentMethod().isValid && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-300 mb-2">
                      <span>⚠️</span>
                      <span className="font-medium">Payment Method Unavailable</span>
                    </div>
                    <p className="text-yellow-200/80 text-sm">
                      {validatePaymentMethod().message}
                    </p>
                    <div className="mt-3 text-xs text-yellow-200/60">
                      💡 Tip: Play social discovery games to earn more LUB tokens!
                    </div>
                  </div>
                )}
              </>
            ) : (
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
              disabled={isMinting || isPending || !isConnected || !validatePaymentMethod().isValid}
            >
              {isMinting || isPending
                ? "Minting..."
                : !isConnected
                ? "Connect Wallet"
                : !validatePaymentMethod().isValid
                ? "Insufficient Balance"
                : `Mint with ${getPaymentMethodDisplayName(paymentMethod)}`}
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

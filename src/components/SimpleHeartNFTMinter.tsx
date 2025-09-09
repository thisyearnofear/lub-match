"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useHeartNFT } from "@/hooks/useHeartNFT";
import { useSimpleLubPayment } from "@/hooks/useSimpleLubPayment";
import MiniAppWalletConnect from "@/components/MiniAppWalletConnect";

interface SimpleHeartNFTMinterProps {
  gameImages: string[];
  gameLayout: number[];
  message: string;
  gameType: "custom" | "demo";
  creator: string;
  onClose: () => void;
  onMinted?: (tokenId: string) => void;
  users?: any[];
  gameStats?: {
    completionTime: number;
    accuracy: number;
    socialDiscoveries: number;
  };
}

export default function SimpleHeartNFTMinter({
  gameImages,
  gameLayout,
  message,
  gameType,
  creator,
  onClose,
  onMinted,
  users,
  gameStats,
}: SimpleHeartNFTMinterProps) {
  const { address, isConnected } = useAccount();
  const { mintCompletedHeartWithMetadata, waitForMintReceiptAndTokenId, isPending } = useHeartNFT();
  const { paymentOptions, preparePayment } = useSimpleLubPayment();
  
  const [selectedOption, setSelectedOption] = React.useState(0);
  const [isMinting, setIsMinting] = React.useState(false);

  const currentOption = paymentOptions[selectedOption];

  const handleMint = async () => {
    if (!address || !currentOption) return;

    try {
      setIsMinting(true);
      console.log(`🚀 Starting mint with ${currentOption.displayText}...`);

      // Prepare payment (handle approvals)
      const paymentData = await preparePayment(currentOption);
      
      // Prepare heart data
      const heartData = {
        imageHashes: gameImages.slice(0, 8), // Ensure max 8 images
        layout: gameLayout,
        message,
        completedAt: BigInt(Math.floor(Date.now() / 1000)),
        creator: creator as `0x${string}`,
        completer: address,
        gameType,
        users,
        gameStats,
      };

      // Mint NFT
      const tx = await mintCompletedHeartWithMetadata(
        heartData,
        paymentData.useLubDiscount,
        undefined, // userApiKey
        paymentData.useFullLub,
        paymentData.lubCost
      );

      console.log(`✅ Mint transaction submitted: ${tx}`);

      // Wait for confirmation
      const { tokenId } = await waitForMintReceiptAndTokenId(tx as `0x`);
      
      console.log(`🎉 NFT minted successfully! Token ID: ${tokenId}`);
      
      if (tokenId) {
        onMinted?.(tokenId.toString());
      }

      onClose();
    } catch (error) {
      console.error("❌ Mint failed:", error);
      
      let errorMessage = "Failed to mint NFT";
      if (error instanceof Error) {
        if (error.message.includes("insufficient")) {
          errorMessage = `Insufficient ${currentOption.type.includes('lub') ? 'LUB tokens' : 'ETH'}`;
        } else if (error.message.includes("rejected")) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("approval")) {
          errorMessage = "LUB approval failed";
        }
      }
      
      alert(errorMessage); // Simple error handling
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-1 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">💝 Mint Heart NFT</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-6">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">💝</div>
                <p className="text-sm text-gray-600">Your completed heart puzzle</p>
                <p className="text-xs text-gray-500 mt-1">"{message}"</p>
              </div>
            </div>

            {isConnected ? (
              <>
                {/* Payment Options */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Payment Method</h3>
                  <div className="space-y-2">
                    {paymentOptions.map((option, index) => (
                      <button
                        key={option.type}
                        onClick={() => setSelectedOption(index)}
                        disabled={!option.canAfford}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                          selectedOption === index
                            ? "border-purple-500 bg-purple-50"
                            : option.canAfford
                            ? "border-gray-200 hover:border-gray-300"
                            : "border-gray-100 bg-gray-50 opacity-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-800">{option.displayText}</div>
                            <div className="text-sm text-gray-600">
                              {option.ethCost > 0 && `${formatEther(option.ethCost)} ETH`}
                              {option.ethCost > 0 && option.lubCost > 0 && " + "}
                              {option.lubCost > 0 && `${formatEther(option.lubCost)} LUB`}
                            </div>
                          </div>
                          <div className="text-right">
                            {option.canAfford ? (
                              <span className="text-green-600 text-sm">✓ Available</span>
                            ) : (
                              <span className="text-red-500 text-sm">Insufficient balance</span>
                            )}
                            {option.needsApproval && option.canAfford && (
                              <div className="text-xs text-orange-600">Needs approval</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mint Button */}
                <button
                  onClick={handleMint}
                  disabled={isMinting || isPending || !currentOption?.canAfford}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMinting || isPending
                    ? "Minting..."
                    : !currentOption?.canAfford
                    ? "Insufficient Balance"
                    : `Mint with ${currentOption?.displayText}`}
                </button>
              </>
            ) : (
              <MiniAppWalletConnect />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

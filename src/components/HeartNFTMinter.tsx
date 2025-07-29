"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useHeartNFT, HeartData } from "@/hooks/useHeartNFT";
import { useLubToken } from "@/hooks/useLubToken";
import { convertHeartLayoutToContractFormat } from "@/utils/gameHash";

interface HeartNFTMinterProps {
  gameImages: string[];
  gameLayout: number[];
  message: string;
  gameType: "custom" | "demo";
  creator: `0x${string}`;
  onClose: () => void;
  onMinted?: (tokenId: string) => void;
}

export default function HeartNFTMinter({
  gameImages,
  gameLayout,
  message,
  gameType,
  creator,
  onClose,
  onMinted,
}: HeartNFTMinterProps) {
  const { address, isConnected } = useAccount();
  const {
    mintCompletedHeartWithMetadata,
    generateGameHash,
    canMintGame,
    mintPrices,
    discountedMintPrices,
    isPending: isMinting,
    enabled: nftEnabled,
  } = useHeartNFT();

  const {
    balance: lubBalance,
    balanceFormatted: lubBalanceFormatted,
    enabled: lubEnabled,
  } = useLubToken();

  const [useLubDiscount, setUseLubDiscount] = useState(false);
  const [gameHash, setGameHash] = useState<string>("");
  const [canMint, setCanMint] = useState(false);
  const [isCheckingMintability, setIsCheckingMintability] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate game hash and check mintability
  useEffect(() => {
    if (address && gameImages.length > 0) {
      // Use the unified game hash generation with proper layout
      const hash = generateGameHash(
        gameImages,
        convertHeartLayoutToContractFormat(),
        message,
        creator,
        gameType
      );
      setGameHash(hash);

      // Check if this game can be minted
      canMintGame(hash)
        .then((canMint) => {
          setCanMint(canMint);
          setIsCheckingMintability(false);
          if (!canMint) {
            setError("This game has already been minted as an NFT");
          }
        })
        .catch(() => {
          setIsCheckingMintability(false);
          setError("Error checking mint eligibility");
        });
    }
  }, [
    address,
    gameImages,
    message,
    creator,
    gameType,
    generateGameHash,
    canMintGame,
  ]);

  // Check if user can afford LUB discount
  const canAffordLubDiscount =
    lubEnabled &&
    discountedMintPrices &&
    lubBalance >= discountedMintPrices.lub;

  const handleMint = async () => {
    if (!address || !isConnected) {
      setError("Please connect your wallet");
      return;
    }

    if (!canMint) {
      setError("This game cannot be minted");
      return;
    }

    try {
      setError(null);

      // Use enhanced minting with automatic metadata upload
      const heartData: Omit<HeartData, "metadataURI"> = {
        imageHashes: gameImages,
        layout: convertHeartLayoutToContractFormat(),
        message,
        completedAt: BigInt(Math.floor(Date.now() / 1000)),
        creator,
        completer: address,
        gameType,
      };

      const txHash = await mintCompletedHeartWithMetadata(
        heartData,
        useLubDiscount
      );

      if (onMinted) {
        onMinted(txHash);
      }

      // Close modal after successful mint
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Minting error:", err);
      setError(err.message || "Failed to mint NFT");
    }
  };

  if (!nftEnabled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            NFT Minting Unavailable
          </h2>
          <p className="text-gray-600 mb-6">
            NFT minting is not configured. Please check your environment
            settings.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">💎 Mint Your Heart</h2>
            <button
              onClick={onClose}
              className="text-purple-200 hover:text-white text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-100 text-sm mt-2">
            Immortalize your completed heart on Arbitrum
          </p>
        </div>

        <div className="p-6">
          {/* Connection Status */}
          {!isConnected && (
            <div className="mb-6 text-center">
              <p className="text-gray-600 mb-4">Connect your wallet to mint</p>
              <ConnectButton />
            </div>
          )}

          {/* Loading State */}
          {isConnected && isCheckingMintability && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking mint eligibility...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Mint Interface */}
          {isConnected && !isCheckingMintability && canMint && (
            <>
              {/* Game Preview */}
              <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Your Completed Heart
                </h3>
                <div className="grid grid-cols-4 gap-1 mb-3">
                  {gameImages.slice(0, 8).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Heart image ${index + 1}`}
                      className="w-full aspect-square object-cover rounded"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 italic">"{message}"</p>
                <p className="text-xs text-gray-500 mt-1">Type: {gameType}</p>
              </div>

              {/* Pricing Options */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Choose Payment Method
                </h3>

                {/* ETH Option */}
                <div
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all mb-3 ${
                    !useLubDiscount
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setUseLubDiscount(false)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={!useLubDiscount}
                          onChange={() => setUseLubDiscount(false)}
                          className="text-purple-600"
                        />
                        <span className="font-medium">Pay with ETH</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">
                        {mintPrices ? formatEther(mintPrices.eth) : "0.001"} ETH
                      </p>
                    </div>
                  </div>
                </div>

                {/* LUB Discount Option */}
                {lubEnabled && discountedMintPrices && (
                  <div
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      useLubDiscount
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${!canAffordLubDiscount ? "opacity-50" : ""}`}
                    onClick={() =>
                      canAffordLubDiscount && setUseLubDiscount(true)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={useLubDiscount}
                            onChange={() => setUseLubDiscount(true)}
                            disabled={!canAffordLubDiscount}
                            className="text-purple-600"
                          />
                          <span className="font-medium">
                            Pay with LUB + ETH
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            50% OFF
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                          {formatEther(discountedMintPrices.lub)} LUB +{" "}
                          {formatEther(discountedMintPrices.eth)} ETH
                        </p>
                        {!canAffordLubDiscount && (
                          <p className="text-xs text-red-600 ml-6">
                            Insufficient LUB (have {lubBalanceFormatted})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={
                  isMinting ||
                  (!useLubDiscount && !mintPrices) ||
                  (useLubDiscount && !canAffordLubDiscount)
                }
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                  isMinting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02]"
                }`}
              >
                {isMinting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Minting...
                  </div>
                ) : (
                  `💎 Mint Heart NFT`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Your NFT will be minted on Arbitrum Sepolia testnet
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

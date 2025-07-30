"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useHeartNFT, HeartData } from "@/hooks/useHeartNFT";
import { useLubToken } from "@/hooks/useLubToken";
import { convertHeartLayoutToContractFormat } from "@/utils/gameHash";
import SuccessScreen from "./shared/SuccessScreen";
import ActionButton from "./shared/ActionButton";
import { useSuccessActions } from "@/hooks/useSuccessActions";

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
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  
  // Use shared success actions hook
  const { getNFTMintSuccessActions } = useSuccessActions();

  // Generate game hash and check mintability
  useEffect(() => {
    if (address && gameImages.length > 0) {
      const hash = generateGameHash(
        gameImages,
        convertHeartLayoutToContractFormat(),
        message,
        creator,
        gameType
      );
      setGameHash(hash);

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

      setMintedTokenId(txHash);
      setShowSuccessActions(true);
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
            NFT minting is not configured. Please check your environment settings.
          </p>
          <ActionButton onClick={onClose} fullWidth variant="secondary">
            Close
          </ActionButton>
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
            <h2 className="text-2xl font-bold">Mint Your Heart</h2>
            <button
              onClick={onClose}
              className="text-purple-200 hover:text-white text-2xl transition-colors"
            >
              ×
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

          {/* Success Screen */}
          {showSuccessActions && mintedTokenId && (
            <SuccessScreen
              title="NFT Minted Successfully!"
              message="Your heart has been immortalized on the blockchain"
              actions={getNFTMintSuccessActions(
                mintedTokenId,
                { cid: gameHash, type: 'heart' },
                onClose
              )}
              additionalContent={
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-700">
                    <strong>Transaction Hash:</strong>
                  </p>
                  <p className="text-xs text-green-600 font-mono break-all">
                    {mintedTokenId}
                  </p>
                </div>
              }
              layout="single-column"
            />
          )}

          {/* Mint Interface */}
          {isConnected && !isCheckingMintability && canMint && !showSuccessActions && (
        <>
          {/* Skip Button for modal UX */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-700 text-2xl bg-white bg-opacity-80 rounded-full w-10 h-10 flex items-center justify-center shadow"
            type="button"
            aria-label="Skip NFT Minting"
          >
            ×
          </button>
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
              <ActionButton
                onClick={handleMint}
                disabled={
                  isMinting ||
                  (!useLubDiscount && !mintPrices) ||
                  (useLubDiscount && !canAffordLubDiscount)
                }
                loading={isMinting}
                fullWidth
                variant="gradient-purple"
                size="lg"
              >
                Mint Heart NFT
              </ActionButton>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            type="button"
          >
            Skip
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
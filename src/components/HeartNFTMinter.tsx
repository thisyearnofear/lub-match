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
import { InfoTooltip } from "./shared/InfoTooltip";
import { ConnectionIncentive } from "./shared/ConnectionIncentive";
import { useUserProgression } from "@/utils/userProgression";

interface HeartNFTMinterProps {
  gameImages: string[];
  gameLayout: number[];
  message: string;
  gameType: "custom" | "demo";
  creator: `0x${string}`;
  onClose: () => void;
  onMinted?: (tokenId: string) => void;
  onViewCollection?: () => void;
  users?: any[]; // Farcaster user data for enhanced collectability
  gameStats?: {
    completionTime: number; // seconds
    accuracy: number; // percentage
    socialDiscoveries: number; // new profiles discovered
  };
}

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
  const { address, isConnected } = useAccount();
  const { progress } = useUserProgression();
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

      const heartData = {
        imageHashes: gameImages,
        layout: convertHeartLayoutToContractFormat(),
        message,
        completedAt: BigInt(Math.floor(Date.now() / 1000)),
        creator,
        completer: address,
        gameType,
        users,
        gameStats,
      } as any;

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

      // Handle user rejection more gracefully
      if (
        err.message?.includes("User rejected") ||
        err.message?.includes("user rejected")
      ) {
        setError(
          "Transaction cancelled. No worries - you can try again anytime!"
        );
      } else if (err.message?.includes("insufficient funds")) {
        setError(
          "Insufficient funds. Please add more ETH to your wallet and try again."
        );
      } else if (err.message?.includes("network")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "Failed to mint NFT. Please try again.");
      }
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
          <ActionButton onClick={onClose} fullWidth variant="secondary">
            Continue Without Minting
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
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Mint Your Heart</h2>
              <InfoTooltip
                title="NFT"
                content="A unique digital collectible of your completed game that you own forever"
                placement="bottom"
                maxWidth="200px"
              >
                <div className="w-5 h-5 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-opacity-30 transition-colors cursor-help">
                  ?
                </div>
              </InfoTooltip>
            </div>
            <button
              onClick={onClose}
              className="text-purple-200 hover:text-white text-2xl transition-colors"
              aria-label="Skip NFT Minting"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-purple-100 text-sm">
              Immortalize your completed heart on Arbitrum
            </p>
            <InfoTooltip
              title="Arbitrum"
              content="Fast, low-cost blockchain network on Ethereum"
              placement="bottom"
              maxWidth="180px"
            >
              <div className="w-4 h-4 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-opacity-30 transition-colors cursor-help">
                i
              </div>
            </InfoTooltip>
          </div>
        </div>

        <div className="p-6">
          {/* Connection Status */}
          {!isConnected && (
            <div className="mb-6">
              <ConnectionIncentive 
                tier={progress.tier} 
                context="nft-mint" 
                compact={false}
              />
              
              {/* Skip button for non-connected users */}
              <div className="mt-4">
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  type="button"
                >
                  Skip for Now
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  You can always mint later by connecting your wallet
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isConnected && isCheckingMintability && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking mint eligibility...</p>

              {/* Skip button during loading */}
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  type="button"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>

              {/* Skip button for error states */}
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                type="button"
              >
                Continue Without Minting
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                You can still enjoy your completed heart game
              </p>
            </div>
          )}

          {/* Success Screen */}
          {showSuccessActions && mintedTokenId && (
            <SuccessScreen
              title="NFT Minted Successfully!"
              message="Your heart has been immortalized on the blockchain"
              actions={getNFTMintSuccessActions(
                mintedTokenId,
                { cid: gameHash, type: "heart" },
                onClose,
                onViewCollection
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

          {/* Cannot Mint State */}
          {isConnected &&
            !isCheckingMintability &&
            !canMint &&
            !error &&
            !showSuccessActions && (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    This heart cannot be minted
                  </p>
                  <p className="text-sm text-gray-500">
                    It may have already been minted as an NFT
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  type="button"
                >
                  Continue Without Minting
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Your heart game is still complete and beautiful!
                </p>
              </div>
            )}

          {/* Mint Interface */}
          {isConnected &&
            !isCheckingMintability &&
            canMint &&
            !showSuccessActions && (
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
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-gray-800">
                      Choose Payment Method
                    </h3>
                    <InfoTooltip
                      title="Payment Options"
                      content={
                        <div>
                          <p className="mb-2">
                            You can pay for minting in two ways:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>
                              <strong>ETH:</strong> Standard blockchain currency
                            </li>
                            <li>
                              <strong>LUB + ETH:</strong> Use game tokens for
                              50% discount
                            </li>
                          </ul>
                          <p className="mt-2 text-blue-300">
                            LUB tokens are earned by playing games!
                          </p>
                        </div>
                      }
                    />
                  </div>

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
                          <InfoTooltip
                            content="ETH is the native currency of Ethereum and Arbitrum networks"
                            placement="top"
                          />
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                          {mintPrices ? formatEther(mintPrices.eth) : "0.001"}{" "}
                          ETH
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
                            <InfoTooltip
                              content="LUB tokens are earned by playing games. Use them to get a 50% discount on minting!"
                              placement="top"
                            />
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
                  <div className="flex items-center justify-center gap-2">
                    <span>Mint Heart NFT</span>
                    <InfoTooltip
                      title="Minting"
                      content="Creates your unique digital trophy stored permanently on blockchain"
                      placement="left"
                      maxWidth="160px"
                    >
                      <div className="w-4 h-4 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-opacity-30 transition-colors cursor-help">
                        ?
                      </div>
                    </InfoTooltip>
                  </div>
                </ActionButton>

                <button
                  onClick={onClose}
                  className="w-full mt-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  type="button"
                >
                  Skip for Now
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

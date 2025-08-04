"use client";

import { useWriteContract, useReadContract, useAccount, useConfig } from "wagmi";
import { parseAbi, parseEther } from "viem";
import { readContract } from "viem/actions";
import { getClient } from "@wagmi/core";
import { arbitrum } from "viem/chains";
import { WEB3_CONFIG } from "@/config";
import { generateGameHash, GameHashData, convertHeartLayoutToContractFormat } from "@/utils/gameHash";
import { uploadNFTMetadata, createNFTMetadataPreview } from "@/utils/nftMetadata";

const HEART_NFT_ADDRESS = WEB3_CONFIG.contracts.heartNFT;

const HEART_NFT_ABI = parseAbi([
  "function mintCompletedHeart((string[] imageHashes, uint8[] layout, string message, uint256 completedAt, address creator, address completer, string gameType, string metadataURI) heartData, string gameHash, bool useLubDiscount) payable returns (uint256)",
  "function getMintPrice(bool useLubDiscount) view returns (uint256 ethPrice, uint256 lubCost)",
  "function canMintGame(string gameHash) view returns (bool)",
  "function getHeartData(uint256 tokenId) view returns ((string[] imageHashes, uint8[] layout, string message, uint256 completedAt, address creator, address completer, string gameType, string metadataURI))",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "event HeartMinted(uint256 indexed tokenId, address indexed creator, address indexed completer, string gameType, uint256 pricePaid, bool usedLubDiscount)"
] as const);

export interface HeartData {
  imageHashes: string[];
  layout: number[];
  message: string;
  completedAt: bigint;
  creator: `0x${string}`;
  completer: `0x${string}`;
  gameType: "custom" | "demo";
  metadataURI: string;
}

export function useHeartNFT() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const config = useConfig();
  
  const enabled = !!HEART_NFT_ADDRESS;

  // Read mint prices
  const { data: mintPrices } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getMintPrice",
    args: [false], // Without LUB discount
    query: { enabled }
  });

  const { data: discountedMintPrices } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getMintPrice",
    args: [true], // With LUB discount
    query: { enabled }
  });

  // Read user's NFT balance
  const { data: nftBalance = BigInt(0) } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address }
  });

  // Check if a game can be minted
  const canMintGame = async (gameHash: string): Promise<boolean> => {
    if (!HEART_NFT_ADDRESS || !enabled) return false;

    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");

      const result = await readContract(client, {
        address: HEART_NFT_ADDRESS,
        abi: HEART_NFT_ABI,
        functionName: "canMintGame",
        args: [gameHash]
      });
      return result as boolean;
    } catch (error) {
      console.error("Error checking if game can be minted:", error);
      return false;
    }
  };

  // Mint a completed heart NFT
  const mintCompletedHeart = async (
    heartData: HeartData,
    gameHash: string,
    useLubDiscount: boolean = false
  ) => {
    if (!HEART_NFT_ADDRESS) throw new Error("Heart NFT address not configured");
    
    const mintPrice = useLubDiscount 
      ? discountedMintPrices?.[0] || parseEther("0.001")
      : mintPrices?.[0] || parseEther("0.001");

    return writeContractAsync({
      address: HEART_NFT_ADDRESS,
      abi: HEART_NFT_ABI,
      functionName: "mintCompletedHeart",
      args: [heartData, gameHash, useLubDiscount] as any,
      value: mintPrice,
      chainId: arbitrum.id
    });
  };

  // Use unified game hash generation
  const generateGameHashForNFT = (
    imageHashes: string[],
    layout: number[],
    message: string,
    creator: string,
    gameType: "custom" | "demo"
  ): string => {
    const hashData: GameHashData = {
      imageHashes,
      layout,
      message,
      creator,
      gameType
    };
    return generateGameHash(hashData);
  };

  // Create metadata for IPFS using unified system
  const createHeartMetadata = (
    heartData: Omit<HeartData, "metadataURI">,
    gameImages: string[]
  ) => {
    return createNFTMetadataPreview({
      imageHashes: heartData.imageHashes,
      layout: heartData.layout,
      message: heartData.message,
      completedAt: heartData.completedAt,
      creator: heartData.creator,
      completer: heartData.completer,
      gameType: heartData.gameType
    });
  };

  // Upload metadata to IPFS
  const uploadHeartMetadata = async (
    heartData: Omit<HeartData, "metadataURI"> & {
      users?: any[];
      gameStats?: {
        completionTime: number;
        accuracy: number;
        socialDiscoveries: number;
      };
    },
    userApiKey?: string
  ) => {
    return uploadNFTMetadata({
      imageHashes: heartData.imageHashes,
      layout: heartData.layout,
      message: heartData.message,
      completedAt: heartData.completedAt,
      creator: heartData.creator,
      completer: heartData.completer,
      gameType: heartData.gameType,
      users: heartData.users,
      gameStats: heartData.gameStats
    }, userApiKey);
  };

  // Enhanced mint function with proper metadata upload
  const mintCompletedHeartWithMetadata = async (
    heartData: Omit<HeartData, "metadataURI"> & {
      users?: any[];
      gameStats?: {
        completionTime: number;
        accuracy: number;
        socialDiscoveries: number;
      };
    },
    useLubDiscount: boolean = false,
    userApiKey?: string
  ) => {
    if (!HEART_NFT_ADDRESS) throw new Error("Heart NFT address not configured");

    // Generate game hash for uniqueness check
    const gameHash = generateGameHashForNFT(
      heartData.imageHashes,
      heartData.layout,
      heartData.message,
      heartData.creator,
      heartData.gameType
    );

    // Upload metadata to IPFS
    const metadataResult = await uploadHeartMetadata(heartData, userApiKey);
    if (!metadataResult.success) {
      throw new Error(`Failed to upload metadata: ${metadataResult.error}`);
    }

    // Create complete heart data with metadata URI
    const completeHeartData: HeartData = {
      ...heartData,
      metadataURI: metadataResult.metadataURI
    };

    // Mint the NFT
    return mintCompletedHeart(completeHeartData, gameHash, useLubDiscount);
  };

  // Legacy metadata creation (keeping for backward compatibility)
  const createLegacyHeartMetadata = (
    heartData: Omit<HeartData, "metadataURI">,
    gameImages: string[]
  ) => {
    return {
      name: `Lub Match #${Date.now()}`,
      description: `A completed lub ${heartData.gameType === 'demo' ? 'demo' : `with message: "${heartData.message}"`}`,
      image: gameImages[0], // Use first image as preview
      attributes: [
        {
          trait_type: "Lub Type",
          value: heartData.gameType === 'demo' ? 'Demo Lub' : 'Custom Lub'
        },
        {
          trait_type: "Featured Users",
          value: heartData.imageHashes.length
        },
        {
          trait_type: "Lub Sent",
          value: new Date(Number(heartData.completedAt) * 1000).toISOString()
        },
        {
          trait_type: "Lub Creator",
          value: heartData.creator
        }
      ],
      properties: {
        images: heartData.imageHashes,
        layout: heartData.layout,
        message: heartData.message,
        gameType: heartData.gameType
      }
    };
  };

  return {
    // Contract state
    enabled,
    nftBalance,
    mintPrices: mintPrices ? { eth: mintPrices[0], lub: mintPrices[1] } : null,
    discountedMintPrices: discountedMintPrices ? { eth: discountedMintPrices[0], lub: discountedMintPrices[1] } : null,

    // Actions
    mintCompletedHeart,
    mintCompletedHeartWithMetadata,
    canMintGame,
    generateGameHash: generateGameHashForNFT,
    createHeartMetadata,
    uploadHeartMetadata,

    // Loading state
    isPending
  };
}


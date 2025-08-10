"use client";

import { useCallback } from "react";

import { useWriteContract, useReadContract, useAccount, useConfig } from "wagmi";
import { parseAbi, parseEther, parseEventLogs } from "viem";
import { readContract, waitForTransactionReceipt, getLogs } from "viem/actions";
import { getClient } from "@wagmi/core";
import { arbitrum } from "viem/chains";
import { WEB3_CONFIG } from "@/config";
import { generateGameHash, GameHashData, convertHeartLayoutToContractFormat } from "@/utils/gameHash";
import { uploadNFTMetadata, createNFTMetadataPreview } from "@/utils/nftMetadata";

const HEART_NFT_ADDRESS = WEB3_CONFIG.contracts.heartNFT;

// Heart NFT V3 ABI - Enhanced with full LUB minting support
const HEART_NFT_ABI = parseAbi([
  "function mintCompletedHeart((string[] imageHashes, uint8[] layout, string message, uint256 completedAt, address creator, address completer, string gameType, string metadataURI, string[] usernames, uint256[] userFollowers, bool[] userVerified) heartData, string gameHash, bool useLubDiscount) payable returns (uint256)",
  "function mintCompletedHeartWithLub((string[] imageHashes, uint8[] layout, string message, uint256 completedAt, address creator, address completer, string gameType, string metadataURI, string[] usernames, uint256[] userFollowers, bool[] userVerified) heartData, string gameHash) returns (uint256)",
  "function getMintPrice(bool useLubDiscount) view returns (uint256 ethPrice, uint256 lubCost)",
  "function getFullLubMintPrice() view returns (uint256 lubCost)",
  "function canMintGame(string gameHash) view returns (bool)",
  "function getHeartData(uint256 tokenId) view returns ((string[] imageHashes, uint8[] layout, string message, uint256 completedAt, address creator, address completer, string gameType, string metadataURI, string[] usernames, uint256[] userFollowers, bool[] userVerified))",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function getUserTokens(address user) view returns (uint256[])",
  "function getTokensByGameType(string gameType) view returns (uint256[])",
  "function getHeartRarity(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function collectionStats() view returns (uint256 totalCustomHearts, uint256 totalDemoHearts, uint256 totalVerifiedHearts, uint256 totalHighInfluencerHearts, uint256 totalCommunityHearts)",
  "event HeartMinted(uint256 indexed tokenId, address indexed creator, address indexed completer, string gameType, uint256 pricePaid, bool usedLubDiscount, uint256 totalFollowers, uint256 verifiedCount)",
  "event CollectionMilestone(string milestone, uint256 tokenId, uint256 totalSupply)"
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
  usernames: string[];
  userFollowers: bigint[];
  userVerified: boolean[];
}

export interface CollectionStats {
  totalCustomHearts: bigint;
  totalDemoHearts: bigint;
  totalVerifiedHearts: bigint;
  totalHighInfluencerHearts: bigint;
  totalCommunityHearts: bigint;
}

export function useHeartNFT() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const config = useConfig();
  
  const enabled = !!HEART_NFT_ADDRESS;

  const { data: nftBalance = BigInt(0) } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address }
  });

  const getUserNFTCollection = useCallback(async (): Promise<{ tokenId: bigint; heartData: HeartData }[]> => {
    if (!HEART_NFT_ADDRESS || !enabled || !address || nftBalance === BigInt(0)) {
      return [];
    }

    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");

      try {
        const tokenIds = await readContract(client, {
          address: HEART_NFT_ADDRESS,
          abi: HEART_NFT_ABI,
          functionName: "getUserTokens",
          args: [address]
        }) as bigint[];

        console.log(`Found  tokens using getUserTokens method`);

        const collection: { tokenId: bigint; heartData: HeartData }[] = [];
        for (const tokenId of tokenIds) {
          try {
            const heartData = await readContract(client, {
              address: HEART_NFT_ADDRESS,
              abi: HEART_NFT_ABI,
              functionName: "getHeartData",
              args: [tokenId]
            }) as HeartData;

            collection.push({ tokenId, heartData });
          } catch (error) {
            console.error(`Error fetching heart data for token :`, error);
          }
        }

        return collection;
      } catch (error) {
        console.warn("getUserTokens method failed, falling back to tokenOfOwnerByIndex:", error);
      }

      const collection: { tokenId: bigint; heartData: HeartData }[] = [];
      const balance = Number(nftBalance);

      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await readContract(client, {
            address: HEART_NFT_ADDRESS,
            abi: HEART_NFT_ABI,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)]
          }) as bigint;

          const heartData = await readContract(client, {
            address: HEART_NFT_ADDRESS,
            abi: HEART_NFT_ABI,
            functionName: "getHeartData",
            args: [tokenId]
          }) as HeartData;

          collection.push({ tokenId, heartData });
        } catch (error: any) {
          if (error?.name === 'ContractFunctionRevertedError' ||
              error?.message?.includes('tokenOfOwnerByIndex') ||
              error?.message?.includes('reverted')) {
            console.warn(`tokenOfOwnerByIndex reverted at index , trying event logs fallback...`);
            return await getUserNFTCollectionViaEvents();
          } else {
            console.error(`Error fetching NFT at index :`, error);
          }
        }
      }

      return collection;
    } catch (error) {
      console.error("Error fetching NFT collection:", error);
      if (nftBalance > BigInt(0)) {
        console.warn("Attempting fallback method via event logs...");
        return await getUserNFTCollectionViaEvents();
      }
      return [];
    }
  }, [config, address, nftBalance, enabled]);

  const getUserNFTCollectionViaEvents = useCallback(async (): Promise<{ tokenId: bigint; heartData: HeartData }[]> => {
    if (!HEART_NFT_ADDRESS || !enabled || !address) {
      return [];
    }

    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");

      const logs = await getLogs(client, {
        address: HEART_NFT_ADDRESS,
        event: parseAbi([
          'event HeartMinted(uint256 indexed tokenId, address indexed creator, address indexed completer, string gameType, uint256 pricePaid, bool usedLubDiscount)'
        ])[0],
        args: { completer: address },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      const collection: { tokenId: bigint; heartData: HeartData }[] = [];
      for (const log of logs) {
        try {
          const tokenId = log.args.tokenId as bigint;
          const currentOwner = await readContract(client, {
            address: HEART_NFT_ADDRESS,
            abi: parseAbi(["function ownerOf(uint256 tokenId) view returns (address)"]),
            functionName: "ownerOf",
            args: [tokenId]
          }) as `0x`;

          if (currentOwner.toLowerCase() === address.toLowerCase()) {
            const heartData = await readContract(client, {
              address: HEART_NFT_ADDRESS,
              abi: HEART_NFT_ABI,
              functionName: "getHeartData",
              args: [tokenId]
            }) as HeartData;

            collection.push({ tokenId, heartData });
          }
        } catch (error) {
          console.error(`Error processing NFT from event log:`, error);
        }
      }

      return collection;
    } catch (error) {
      console.error("Error fetching NFT collection via events:", error);
      return [];
    }
  }, [config, address, enabled]);

  const getNFTData = useCallback(async (tokenId: bigint): Promise<{ tokenId: bigint; heartData: HeartData } | null> => {
    if (!HEART_NFT_ADDRESS || !enabled) return null;
    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");
      const heartData = await readContract(client, {
        address: HEART_NFT_ADDRESS,
        abi: HEART_NFT_ABI,
        functionName: "getHeartData",
        args: [tokenId]
      }) as HeartData;
      return { tokenId, heartData };
    } catch (error) {
      console.error("Error fetching NFT data:", error);
      return null;
    }
  }, [config, enabled]);

  const canMintGame = useCallback(async (gameHash: string): Promise<boolean> => {
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
  }, [config, enabled]);

  const mintCompletedHeart = useCallback(async (
    heartData: HeartData,
    gameHash: string,
    useLubDiscount: boolean = false
  ) => {
    if (!HEART_NFT_ADDRESS) throw new Error("Heart NFT address not configured");
    const mintPrice = parseEther("0.001");
    return writeContractAsync({
      address: HEART_NFT_ADDRESS,
      abi: HEART_NFT_ABI,
      functionName: "mintCompletedHeart",
      args: [heartData, gameHash, useLubDiscount] as any,
      value: mintPrice,
      chainId: arbitrum.id
    });
  }, [writeContractAsync]);

  const mintCompletedHeartWithLub = useCallback(async (
    heartData: HeartData,
    gameHash: string
  ) => {
    if (!HEART_NFT_ADDRESS) throw new Error("Heart NFT address not configured");
    return writeContractAsync({
      address: HEART_NFT_ADDRESS,
      abi: HEART_NFT_ABI,
      functionName: "mintCompletedHeartWithLub",
      args: [heartData, gameHash] as any,
      chainId: arbitrum.id
    });
  }, [writeContractAsync]);

  const generateGameHashForNFT = (
    imageHashes: string[],
    layout: number[],
    message: string,
    creator: string,
    gameType: "custom" | "demo"
  ): string => {
    const hashData: GameHashData = { imageHashes, layout, message, creator, gameType };
    return generateGameHash(hashData);
  };

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

  const uploadHeartMetadata = async (
    heartData: {
      imageHashes: string[];
      layout: number[];
      message: string;
      completedAt: bigint;
      creator: `0x${string}`;
      completer: `0x${string}`;
      gameType: "custom" | "demo";
      users?: any[];
      gameStats?: { completionTime: number; accuracy: number; socialDiscoveries: number };
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

  const mintCompletedHeartWithMetadata = useCallback(async (
    heartData: Omit<HeartData, "metadataURI" | "usernames" | "userFollowers" | "userVerified"> & {
      users?: any[];
      gameStats?: { completionTime: number; accuracy: number; socialDiscoveries: number };
    },
    useLubDiscount: boolean = false,
    userApiKey?: string,
    useFullLub: boolean = false
  ) => {
    if (!HEART_NFT_ADDRESS) throw new Error("Heart NFT address not configured");

    // Normalize image hashes to 8 unique entries before processing
    const uniqueHashes = Array.from(new Set(heartData.imageHashes)).slice(0, 8);
    
    const usernames: string[] = [];
    const userFollowers: bigint[] = [];
    const userVerified: boolean[] = [];

    if (heartData.users && heartData.users.length > 0) {
      for (let i = 0; i < Math.min(heartData.users.length, 8); i++) {
        const user = heartData.users[i];
        usernames.push(user?.username || `user${i + 1}`);
        userFollowers.push(BigInt(user?.follower_count || 0));
        userVerified.push(user?.verified_addresses?.eth_addresses?.length > 0 || false);
      }
    } else {
      // Fill with placeholder data for 8 users
      for (let i = 0; i < 8; i++) {
        usernames.push(`user${i + 1}`);
        userFollowers.push(BigInt(0));
        userVerified.push(false);
      }
    }

    const gameHash = generateGameHashForNFT(
      uniqueHashes, heartData.layout, heartData.message, heartData.creator, heartData.gameType
    );

    // Use normalized data for metadata upload
    const normalizedHeartData = {
      ...heartData,
      imageHashes: uniqueHashes,
      users: heartData.users,
      gameStats: heartData.gameStats
    };

    const metadataResult = await uploadHeartMetadata(normalizedHeartData, userApiKey);
    if (!metadataResult.success) {
      throw new Error(`Failed to upload metadata: ${metadataResult.error}`);
    }

    const completeHeartData: HeartData = {
      ...heartData,
      imageHashes: uniqueHashes, // Use normalized hashes
      metadataURI: metadataResult.metadataURI,
      usernames,
      userFollowers,
      userVerified
    };

    if (useFullLub) {
      return mintCompletedHeartWithLub(completeHeartData, gameHash);
    } else {
      return mintCompletedHeart(completeHeartData, gameHash, useLubDiscount);
    }
  }, [uploadHeartMetadata, mintCompletedHeartWithLub, mintCompletedHeart]);

  const waitForMintReceiptAndTokenId = useCallback(async (txHash: `0x`) => {
    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");

      const receipt = await waitForTransactionReceipt(client, { hash: txHash });
      const logs = parseEventLogs({
        abi: HEART_NFT_ABI,
        logs: receipt.logs,
        eventName: "HeartMinted",
      });

      const event = logs.find((l: any) => l.eventName === "HeartMinted");
      const tokenId = event?.args?.tokenId as bigint | undefined;
      return { tokenId: tokenId ?? null, receipt } as const;
    } catch (err) {
      console.error("Failed to fetch receipt or parse event:", err);
      return { tokenId: null, receipt: null } as const;
    }
  }, [config]);

  const getCollectionStats = useCallback(async (): Promise<CollectionStats | null> => {
    if (!HEART_NFT_ADDRESS || !enabled) return null;
    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");
      const stats = await readContract(client, {
        address: HEART_NFT_ADDRESS,
        abi: HEART_NFT_ABI,
        functionName: "collectionStats"
      }) as readonly [bigint, bigint, bigint, bigint, bigint];
      
      return {
        totalCustomHearts: stats[0],
        totalDemoHearts: stats[1],
        totalVerifiedHearts: stats[2],
        totalHighInfluencerHearts: stats[3],
        totalCommunityHearts: stats[4]
      };
    } catch (error) {
      console.warn("Error fetching collection stats:", error);
      return null;
    }
  }, [config, enabled]);

  const getHeartRarity = useCallback(async (tokenId: bigint): Promise<string | null> => {
    if (!HEART_NFT_ADDRESS || !enabled) return null;
    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");
      const rarity = await readContract(client, {
        address: HEART_NFT_ADDRESS,
        abi: HEART_NFT_ABI,
        functionName: "getHeartRarity",
        args: [tokenId]
      }) as string;
      return rarity;
    } catch (error) {
      console.error("Error fetching heart rarity:", error);
      return null;
    }
  }, [config, enabled]);

  const getTotalSupply = useCallback(async (): Promise<bigint | null> => {
    if (!HEART_NFT_ADDRESS || !enabled) return null;
    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");
      const totalSupply = await readContract(client, {
        address: HEART_NFT_ADDRESS,
        abi: HEART_NFT_ABI,
        functionName: "totalSupply"
      }) as bigint;
      return totalSupply;
    } catch (error) {
      console.warn("Error fetching total supply:", error);
      return null;
    }
  }, [config, enabled]);

  const getTokensByGameType = useCallback(async (gameType: "custom" | "demo"): Promise<bigint[]> => {
    if (!HEART_NFT_ADDRESS || !enabled) return [];
    try {
      const client = getClient(config);
      if (!client) throw new Error("No client available");
      const tokens = await readContract(client, {
        address: HEART_NFT_ADDRESS,
        abi: HEART_NFT_ABI,
        functionName: "getTokensByGameType",
        args: [gameType]
      }) as bigint[];
      return tokens;
    } catch (error) {
      console.error("Error fetching tokens by game type:", error);
      return [];
    }
  }, [config, enabled]);

  return {
    enabled,
    nftBalance,

    mintCompletedHeart,
    mintCompletedHeartWithLub,
    mintCompletedHeartWithMetadata,
    waitForMintReceiptAndTokenId,
    canMintGame,
    generateGameHash: generateGameHashForNFT,
    createHeartMetadata,
    uploadHeartMetadata,

    getUserNFTCollection,
    getUserNFTCollectionViaEvents,
    getNFTData,

    getCollectionStats,
    getHeartRarity,
    getTotalSupply,
    getTokensByGameType,

    isPending
  };

}


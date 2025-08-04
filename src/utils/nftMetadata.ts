// Unified NFT metadata system for Heart NFTs
// Uses server-side API route to maintain clean architecture

import { IPFS_CONFIG } from "@/config";
import { generateGameHash, GameHashData } from "./gameHash";
import { FarcasterUser } from "@/types/socialGames";

export interface HeartNFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    imageHashes: string[];
    layout: number[];
    message: string;
    completedAt: string;
    creator: string;
    completer: string;
    gameType: "custom" | "demo";
    gameHash: string;
  };
}

export interface NFTUploadResult {
  metadataURI: string;
  imageURI?: string;
  success: boolean;
  error?: string;
}

/**
 * Upload NFT metadata to IPFS using server-side API route
 * Maintains clean architecture by keeping API keys server-side
 */
export async function uploadNFTMetadata(
  gameData: {
    imageHashes: string[];
    layout: number[];
    message: string;
    completedAt: bigint;
    creator: string;
    completer: string;
    gameType: "custom" | "demo";
    users?: FarcasterUser[]; // Rich user data for enhanced collectability
    gameStats?: {
      completionTime: number; // seconds
      accuracy: number; // percentage
      socialDiscoveries: number; // new profiles discovered
    };
  },
  userApiKey?: string // Currently unused, but kept for API compatibility
): Promise<NFTUploadResult> {
  try {
    // Convert bigint to ISO string for API
    const requestData = {
      imageHashes: gameData.imageHashes,
      layout: gameData.layout,
      message: gameData.message,
      completedAt: new Date(Number(gameData.completedAt) * 1000).toISOString(),
      creator: gameData.creator,
      completer: gameData.completer,
      gameType: gameData.gameType,
      users: gameData.users || [],
      gameStats: gameData.gameStats
    };

    // Use server-side API route (maintains clean architecture)
    const response = await fetch('/api/uploadNFTMetadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    return {
      metadataURI: result.metadataURI,
      success: result.success
    };

  } catch (error) {
    console.error("Failed to upload NFT metadata:", error);
    return {
      metadataURI: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Removed generateHeartImage - now handled server-side in API route

/**
 * Retrieve NFT metadata from IPFS
 */
export async function fetchNFTMetadata(metadataURI: string): Promise<HeartNFTMetadata | null> {
  try {
    // Extract CID from URI
    const cid = metadataURI.replace('ipfs://', '');
    
    // Try multiple gateways for reliability
    const gateways = [
      IPFS_CONFIG.gateways.primary,
      ...IPFS_CONFIG.gateways.fallbacks
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(`${gateway}/ipfs/${cid}`, {
          signal: AbortSignal.timeout(IPFS_CONFIG.upload.timeout)
        });
        
        if (response.ok) {
          const metadata = await response.json();
          return metadata as HeartNFTMetadata;
        }
      } catch (error) {
        console.warn(`Failed to fetch from gateway ${gateway}:`, error);
        continue;
      }
    }

    throw new Error("Failed to fetch metadata from all gateways");

  } catch (error) {
    console.error("Failed to fetch NFT metadata:", error);
    return null;
  }
}

/**
 * Validate NFT metadata structure
 */
export function validateNFTMetadata(metadata: any): metadata is HeartNFTMetadata {
  return (
    metadata &&
    typeof metadata.name === 'string' &&
    typeof metadata.description === 'string' &&
    typeof metadata.image === 'string' &&
    Array.isArray(metadata.attributes) &&
    metadata.properties &&
    Array.isArray(metadata.properties.imageHashes) &&
    Array.isArray(metadata.properties.layout) &&
    typeof metadata.properties.message === 'string' &&
    typeof metadata.properties.gameHash === 'string'
  );
}

/**
 * Create a preview of the NFT metadata without uploading
 * Useful for showing users what will be minted
 */
export function createNFTMetadataPreview(
  gameData: {
    imageHashes: string[];
    layout: number[];
    message: string;
    completedAt: bigint;
    creator: string;
    completer: string;
    gameType: "custom" | "demo";
  }
): HeartNFTMetadata {
  const hashData: GameHashData = {
    imageHashes: gameData.imageHashes,
    layout: gameData.layout,
    message: gameData.message,
    creator: gameData.creator,
    gameType: gameData.gameType
  };
  const gameHash = generateGameHash(hashData);

  return {
    name: `Lub Match #${gameHash.substring(0, 8)}`,
    description: `lub sent with ${gameData.imageHashes.length} trending Farcaster users. ${gameData.gameType === 'demo' ? 'Demo lub completed!' : `Lub message: "${gameData.message}"`}`,
    image: `ipfs://placeholder-lub-composite-${gameHash.substring(0, 8)}`,
    attributes: [
      { trait_type: "Lub Type", value: gameData.gameType === 'demo' ? 'Demo Lub' : 'Custom Lub' },
      { trait_type: "Featured Users", value: gameData.imageHashes.length },
      { trait_type: "Lub Length", value: gameData.message.length },
      { trait_type: "Lub Sent", value: new Date(Number(gameData.completedAt) * 1000).toISOString().split('T')[0] },
      { trait_type: "Lub Creator", value: gameData.creator },
      { trait_type: "Lub Receiver", value: gameData.completer },
      { trait_type: "Self Lub", value: gameData.creator === gameData.completer ? "Yes" : "No" }
    ],
    properties: {
      imageHashes: gameData.imageHashes,
      layout: gameData.layout,
      message: gameData.message,
      completedAt: gameData.completedAt.toString(),
      creator: gameData.creator,
      completer: gameData.completer,
      gameType: gameData.gameType,
      gameHash
    }
  };
}

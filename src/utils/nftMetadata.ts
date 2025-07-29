// Unified NFT metadata system for Heart NFTs
// Integrates with existing IPFS infrastructure and game data

import { PinataSDK } from "pinata";
import { PINATA_JWT, IPFS_CONFIG } from "../config";
import { createNFTMetadata } from "./ipfs";
import { generateGameHash, GameHashData } from "./gameHash";

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
 * Upload NFT metadata to IPFS using existing Pinata infrastructure
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
  },
  userApiKey?: string
): Promise<NFTUploadResult> {
  try {
    // Generate game hash for uniqueness
    const hashData: GameHashData = {
      imageHashes: gameData.imageHashes,
      layout: gameData.layout,
      message: gameData.message,
      creator: gameData.creator,
      gameType: gameData.gameType
    };
    const gameHash = generateGameHash(hashData);

    // Create comprehensive metadata
    const metadata: HeartNFTMetadata = {
      name: `Heart Memory Game #${gameHash.substring(0, 8)}`,
      description: `A completed heart-shaped memory game with ${gameData.imageHashes.length} unique images. Message: "${gameData.message}"`,
      image: await generateHeartImage(gameData.imageHashes, gameHash),
      attributes: [
        { trait_type: "Game Type", value: gameData.gameType },
        { trait_type: "Images Count", value: gameData.imageHashes.length },
        { trait_type: "Message Length", value: gameData.message.length },
        { trait_type: "Completion Date", value: new Date(Number(gameData.completedAt) * 1000).toISOString().split('T')[0] },
        { trait_type: "Creator", value: gameData.creator },
        { trait_type: "Completer", value: gameData.completer },
        { trait_type: "Same Player", value: gameData.creator === gameData.completer ? "Yes" : "No" }
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

    // Upload to IPFS
    const apiKey = userApiKey || PINATA_JWT;
    if (!apiKey) {
      throw new Error("No Pinata API key available for metadata upload");
    }

    const pinata = new PinataSDK({
      pinataJwt: apiKey,
      pinataGateway: IPFS_CONFIG.gateways.primary.replace('https://', '')
    });

    // Create metadata file
    const metadataFile = new File(
      [JSON.stringify(metadata, null, 2)],
      `heart-nft-${gameHash.substring(0, 8)}.json`,
      { type: "application/json" }
    );

    // Upload metadata
    const upload = await pinata.upload.public
      .file(metadataFile)
      .name(`Heart NFT Metadata - ${gameHash.substring(0, 8)}`)
      .keyvalues({
        type: "heart-nft-metadata",
        gameHash,
        gameType: gameData.gameType,
        creator: gameData.creator,
        completer: gameData.completer,
        createdAt: new Date().toISOString()
      });

    const metadataURI = `ipfs://${upload.cid}`;

    return {
      metadataURI,
      success: true
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

/**
 * Generate a heart-shaped composite image from the game images
 * For now, returns a placeholder. In production, this would create an actual composite
 */
async function generateHeartImage(imageHashes: string[], gameHash: string): Promise<string> {
  // Placeholder implementation
  // In production, this would:
  // 1. Fetch all images from IPFS
  // 2. Create a heart-shaped composite using Canvas API or similar
  // 3. Upload the composite image to IPFS
  // 4. Return the IPFS URI
  
  return `ipfs://placeholder-heart-composite-${gameHash.substring(0, 8)}`;
}

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
          timeout: IPFS_CONFIG.upload.timeout
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
    name: `Heart Memory Game #${gameHash.substring(0, 8)}`,
    description: `A completed heart-shaped memory game with ${gameData.imageHashes.length} unique images. Message: "${gameData.message}"`,
    image: `ipfs://placeholder-heart-composite-${gameHash.substring(0, 8)}`,
    attributes: [
      { trait_type: "Game Type", value: gameData.gameType },
      { trait_type: "Images Count", value: gameData.imageHashes.length },
      { trait_type: "Message Length", value: gameData.message.length },
      { trait_type: "Completion Date", value: new Date(Number(gameData.completedAt) * 1000).toISOString().split('T')[0] },
      { trait_type: "Creator", value: gameData.creator },
      { trait_type: "Completer", value: gameData.completer },
      { trait_type: "Same Player", value: gameData.creator === gameData.completer ? "Yes" : "No" }
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

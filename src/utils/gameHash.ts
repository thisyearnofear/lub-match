// Unified game hashing system for preventing duplicates and ensuring consistency
// Used across IPFS storage, NFT minting, and game identification

import { createHash } from 'crypto';

export interface GameHashData {
  imageHashes: string[];
  layout: number[];
  message: string;
  creator: string;
  gameType: "custom" | "demo";
  // Note: We exclude timestamp to allow legitimate re-mints of the same game
}

/**
 * Generate a deterministic hash for a game configuration
 * This prevents duplicate NFT mints while allowing legitimate re-plays
 */
export function generateGameHash(data: GameHashData): string {
  // Sort image hashes to ensure consistent ordering
  const sortedImageHashes = [...data.imageHashes].sort();
  
  // Create a deterministic string representation
  const hashInput = JSON.stringify({
    imageHashes: sortedImageHashes,
    layout: data.layout,
    message: data.message.trim().toLowerCase(), // Normalize message
    creator: data.creator.toLowerCase(),
    gameType: data.gameType
  });
  
  // Generate SHA-256 hash
  return createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Generate a game hash from IPFS CID and metadata
 * Used when we have a CID but need to create a consistent hash
 */
export function generateGameHashFromCID(
  cid: string,
  message: string,
  creator: string,
  gameType: "custom" | "demo" = "custom"
): string {
  // For CID-based games, use the CID as the primary identifier
  const hashInput = JSON.stringify({
    cid: cid.toLowerCase(),
    message: message.trim().toLowerCase(),
    creator: creator.toLowerCase(),
    gameType
  });
  
  return createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Generate a short game ID for display purposes
 * Takes first 8 characters of the hash for readability
 */
export function generateShortGameId(gameHash: string): string {
  return gameHash.substring(0, 8);
}

/**
 * Validate that a game hash matches the expected format
 */
export function isValidGameHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Extract image hashes from IPFS metadata
 * Used to convert IPFS game data to NFT-compatible format
 */
export function extractImageHashesFromMetadata(metadata: any): string[] {
  if (!metadata || !metadata.pairs) {
    throw new Error("Invalid metadata: missing pairs");
  }
  
  // Convert file names to IPFS hashes (placeholder for now)
  // In production, these would be actual IPFS hashes of individual images
  return metadata.pairs.map((filename: string, index: number) => 
    `ipfs://placeholder-${filename}-${index}`
  );
}

/**
 * Convert heart layout to the format expected by smart contracts
 * The heart layout is a 2D array, but contracts expect a flat array
 */
export function convertHeartLayoutToContractFormat(): number[] {
  // Standard heart layout positions (16 cards in heart shape)
  const heartLayout = [
    [null, 0, 1, null, 2, 3, null],
    [4, 5, 6, 7, 8, 9, 10],
    [null, 11, 12, 13, 14, 15, null],
    [null, null, "deco", "deco", "deco", null, null],
    [null, null, null, "deco", null, null, null],
    [null, null, null, null, null, null, null],
  ];
  
  // Extract only the numbered positions (0-15)
  const positions: number[] = [];
  heartLayout.flat().forEach(cell => {
    if (typeof cell === 'number') {
      positions.push(cell);
    }
  });
  
  return positions.sort((a, b) => a - b); // Ensure consistent ordering
}

/**
 * Create a complete game identifier object
 * Used for consistent game tracking across the application
 */
export interface GameIdentifier {
  hash: string;
  shortId: string;
  cid?: string;
  gameType: "custom" | "demo";
  creator: string;
  message: string;
}

export function createGameIdentifier(
  data: GameHashData,
  cid?: string
): GameIdentifier {
  const hash = generateGameHash(data);
  
  return {
    hash,
    shortId: generateShortGameId(hash),
    cid,
    gameType: data.gameType,
    creator: data.creator,
    message: data.message
  };
}

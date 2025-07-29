import { PINATA_JWT } from "@/config";
import { PinataSDK } from "pinata";

// Modern, clean approach using the official Pinata SDK
// This resolves the "More than one file and/or directory" error definitively

// Dual-mode storage architecture for Valentine's Memory Game
// Mode 1: Quick Share (App-controlled Pinata)
// Mode 2: Private Control (User's own API key)

// Helper functions for clean, DRY code
export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || 'unknown';
}

// Unified metadata creation for both game storage and NFT metadata
export function createGameMetadata(
  message: string,
  pairs: File[],
  reveal: File[] | undefined,
  storageMode: "quick" | "private",
  additionalData?: Record<string, any>
): string {
  return JSON.stringify({
    message,
    // Match the actual file structure (files are at root level, not in subdirectories)
    pairs: pairs.map((f, i) => `pair-${i}.${getFileExtension(f.name)}`),
    reveal: reveal?.map((f, i) => `reveal-${i}.${getFileExtension(f.name)}`) || [],
    createdAt: new Date().toISOString(),
    storageMode,
    ...additionalData,
  });
}

// Unified NFT metadata creation for Heart NFTs
export function createNFTMetadata(
  gameData: {
    message: string;
    imageHashes: string[];
    layout: number[];
    completedAt: bigint;
    creator: string;
    completer: string;
    gameType: "custom" | "demo";
  },
  additionalAttributes?: Array<{ trait_type: string; value: string | number }>
): string {
  return JSON.stringify({
    name: `Heart Memory Game - ${gameData.gameType === "custom" ? "Custom" : "Demo"}`,
    description: `A completed heart-shaped memory game with the message: "${gameData.message}"`,
    image: `ipfs://placeholder-heart-${Date.now()}`, // Will be replaced with actual heart image
    attributes: [
      { trait_type: "Game Type", value: gameData.gameType },
      { trait_type: "Message", value: gameData.message },
      { trait_type: "Images Count", value: gameData.imageHashes.length },
      { trait_type: "Completed At", value: Number(gameData.completedAt) },
      { trait_type: "Creator", value: gameData.creator },
      { trait_type: "Completer", value: gameData.completer },
      ...(additionalAttributes || [])
    ],
    properties: {
      imageHashes: gameData.imageHashes,
      layout: gameData.layout,
      message: gameData.message,
      completedAt: gameData.completedAt.toString(),
      creator: gameData.creator,
      completer: gameData.completer,
      gameType: gameData.gameType
    }
  });
}



interface StorageConfig {
  mode: "quick" | "private";
  apiKey?: string; // For private mode
}

interface UploadResult {
  cid: string;
  deletable: boolean;
  storageMode: "quick" | "private";
}

interface UploadOptions {
  onProgress?: (progress: number) => void;
  maxFileSize?: number; // in MB
}

// Quick Share Mode - App-controlled Pinata using modern SDK
async function uploadToAppPinata(
  pairs: File[],
  reveal: File[] | undefined,
  message: string,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const appPinataKey = PINATA_JWT;

  if (!appPinataKey) {
    console.log("No PINATA_JWT provided, using mock CID");
    return {
      cid: "mock-quick-" + Date.now(),
      deletable: false,
      storageMode: "quick",
    };
  }

  try {
    console.log(
      "Starting Quick Share upload with",
      pairs.length,
      "pairs and",
      reveal?.length || 0,
      "reveal images",
    );

    // Check file sizes for mobile optimization
    const maxSize = (options.maxFileSize || 5) * 1024 * 1024;
    const oversizedFiles = [...pairs, ...(reveal || [])].filter(
      (file) => file.size > maxSize,
    );

    if (oversizedFiles.length > 0) {
      console.error("Oversized files detected:", oversizedFiles.map((f) => ({ name: f.name, size: f.size })));
      throw new Error(
        `Some files are too large. Please use images under ${options.maxFileSize || 5}MB for best mobile performance.`,
      );
    }

    options.onProgress?.(10);

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: appPinataKey,
      pinataGateway: "gateway.pinata.cloud", // Default gateway
    });

    options.onProgress?.(20);

    // Create file array for directory upload
    const allFiles: File[] = [];

    // Add pairs with proper naming
    pairs.forEach((file, index) => {
      const fileName = `pair-${index}.${getFileExtension(file.name)}`;
      const renamedFile = new File([file], fileName, { type: file.type });
      allFiles.push(renamedFile);
    });

    options.onProgress?.(40);

    // Add reveal images
    reveal?.forEach((file, index) => {
      const fileName = `reveal-${index}.${getFileExtension(file.name)}`;
      const renamedFile = new File([file], fileName, { type: file.type });
      allFiles.push(renamedFile);
    });

    options.onProgress?.(60);

    // Add metadata file
    const metadata = createGameMetadata(message, pairs, reveal, "quick");
    const metadataFile = new File([metadata], "metadata.json", { type: "application/json" });
    allFiles.push(metadataFile);

    options.onProgress?.(80);

    // Upload using the modern SDK fileArray method
    const upload = await pinata.upload.public
      .fileArray(allFiles)
      .name(`Valentine Game - ${Date.now()}`)
      .keyvalues({
        gameType: "valentine-memory",
        createdAt: new Date().toISOString(),
        deletable: "false",
      });

    options.onProgress?.(100);

    console.log("Pinata upload successful:", upload.cid);

    return {
      cid: upload.cid,
      deletable: false,
      storageMode: "quick",
    };
  } catch (error) {
    console.error("App Pinata upload failed:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    throw new Error(
      `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Private Control Mode - User's own Pinata using modern SDK
async function uploadToUserPinata(
  pairs: File[],
  reveal: File[] | undefined,
  message: string,
  userApiKey: string,
  options: UploadOptions = {},
): Promise<UploadResult> {
  try {
    console.log(
      "Starting Private Pinata upload with",
      pairs.length,
      "pairs and",
      reveal?.length || 0,
      "reveal images",
    );

    // Check file sizes for mobile optimization
    const maxSize = (options.maxFileSize || 5) * 1024 * 1024;
    const oversizedFiles = [...pairs, ...(reveal || [])].filter(
      (file) => file.size > maxSize,
    );

    if (oversizedFiles.length > 0) {
      console.error("Oversized files detected:", oversizedFiles.map((f) => ({ name: f.name, size: f.size })));
      throw new Error(
        `Some files are too large. Please use images under ${options.maxFileSize || 5}MB for best mobile performance.`,
      );
    }

    options.onProgress?.(10);

    // Initialize Pinata SDK with user's key
    const pinata = new PinataSDK({
      pinataJwt: userApiKey,
      pinataGateway: "gateway.pinata.cloud",
    });

    options.onProgress?.(30);

    // Create file array for directory upload
    const allFiles: File[] = [];

    // Add pairs with proper naming
    pairs.forEach((file, index) => {
      const fileName = `pair-${index}.${getFileExtension(file.name)}`;
      const renamedFile = new File([file], fileName, { type: file.type });
      allFiles.push(renamedFile);
    });

    options.onProgress?.(50);

    // Add reveal images
    reveal?.forEach((file, index) => {
      const fileName = `reveal-${index}.${getFileExtension(file.name)}`;
      const renamedFile = new File([file], fileName, { type: file.type });
      allFiles.push(renamedFile);
    });

    options.onProgress?.(70);

    // Add metadata file
    const metadata = createGameMetadata(message, pairs, reveal, "private");
    const metadataFile = new File([metadata], "metadata.json", { type: "application/json" });
    allFiles.push(metadataFile);

    options.onProgress?.(90);

    // Upload using the modern SDK
    const upload = await pinata.upload.public
      .fileArray(allFiles)
      .name(`Private Valentine Game - ${Date.now()}`)
      .keyvalues({
        gameType: "valentine-memory-private",
        createdAt: new Date().toISOString(),
        deletable: "true",
      });

    options.onProgress?.(100);

    console.log("Private Pinata upload successful:", upload.cid);
    
    return {
      cid: upload.cid,
      deletable: true,
      storageMode: "private",
    };
  } catch (error) {
    console.error("Private Pinata upload failed:", error);
    throw error;
  }
}

// Main upload function
export async function uploadGame(
  pairs: File[],
  reveal: File[] | undefined,
  message: string,
  config: StorageConfig = { mode: "quick" },
  options: UploadOptions = {},
): Promise<UploadResult> {
  if (config.mode === "private" && config.apiKey) {
    return uploadToUserPinata(pairs, reveal, message, config.apiKey, options);
  } else {
    return uploadToAppPinata(pairs, reveal, message, options);
  }
}

// Delete function for private mode
export async function deleteGame(
  cid: string,
  apiKey: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.pinata.cloud/pinning/unpin/${cid}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    return response.ok;
  } catch (error) {
    console.error("Delete failed:", error);
    return false;
  }
}

// Gateway URLs with multiple fallbacks for better reliability
export const gatewayUrl = (cid: string, filename: string) => {
  // Try Pinata gateway first (faster), but may have SSL issues in dev
  return `https://gateway.pinata.cloud/ipfs/${cid}/${filename}`;
};

// Multiple fallback gateways for redundancy
export const fallbackGatewayUrl = (cid: string, filename: string) =>
  `https://ipfs.io/ipfs/${cid}/${filename}`;

export const secondaryFallbackGatewayUrl = (cid: string, filename: string) =>
  `https://cloudflare-ipfs.com/ipfs/${cid}/${filename}`;

export const tertiaryFallbackGatewayUrl = (cid: string, filename: string) =>
  `https://${cid}.ipfs.dweb.link/${filename}`;

// Development-friendly gateway (often more reliable for local dev)
export const devGatewayUrl = (cid: string, filename: string) =>
  `https://ipfs.io/ipfs/${cid}/${filename}`;

// Get all available gateways in order of preference
export const getAllGateways = (cid: string, filename: string) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // In development, prioritize more reliable gateways first
    return [
      devGatewayUrl(cid, filename),
      secondaryFallbackGatewayUrl(cid, filename),
      tertiaryFallbackGatewayUrl(cid, filename),
      gatewayUrl(cid, filename), // Pinata last in dev due to SSL issues
    ];
  }
  
  // In production, use Pinata first (faster)
  return [
    gatewayUrl(cid, filename),
    fallbackGatewayUrl(cid, filename),
    secondaryFallbackGatewayUrl(cid, filename),
    tertiaryFallbackGatewayUrl(cid, filename),
  ];
};

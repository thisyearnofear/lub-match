import { PINATA_JWT } from "../config";

// Dual-mode storage architecture for Valentine's Memory Game
// Mode 1: Quick Share (App-controlled Pinata)
// Mode 2: Private Control (User's own API key)

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

// Quick Share Mode - App-controlled Pinata
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

    // Check file sizes for mobile optimization (max 5MB per file)
    const maxSize = (options.maxFileSize || 5) * 1024 * 1024;
    const oversizedFiles = [...pairs, ...(reveal || [])].filter(
      (file) => file.size > maxSize,
    );

    if (oversizedFiles.length > 0) {
      console.error(
        "Oversized files detected:",
        oversizedFiles.map((f) => ({ name: f.name, size: f.size })),
      );
      throw new Error(
        `Some files are too large. Please use images under ${options.maxFileSize || 5}MB for best mobile performance.`,
      );
    }

    options.onProgress?.(10);

    const formData = new FormData();

    // Add all files to form data with progress tracking
    options.onProgress?.(20);

    pairs.forEach((file, index) => {
      formData.append("file", file, `pair-${index}-${file.name}`);
    });

    options.onProgress?.(40);

    reveal?.forEach((file, index) => {
      formData.append("file", file, `reveal-${index}-${file.name}`);
    });

    options.onProgress?.(60);

    // Add metadata
    const metadata = new Blob(
      [
        JSON.stringify({
          message,
          pairs: pairs.map((f, i) => `pair-${i}-${f.name}`),
          reveal: reveal?.map((f, i) => `reveal-${i}-${f.name}`) || [],
          createdAt: new Date().toISOString(),
          storageMode: "quick",
        }),
      ],
      { type: "application/json" },
    );

    formData.append("file", metadata, "metadata.json");

    const pinataMetadata = JSON.stringify({
      name: `Valentine Game - ${Date.now()}`,
      keyvalues: {
        gameType: "valentine-memory",
        createdAt: new Date().toISOString(),
        deletable: "false",
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    options.onProgress?.(80);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${appPinataKey}`,
        },
        body: formData,
      },
    );

    options.onProgress?.(95);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Pinata API error:",
        response.status,
        response.statusText,
        errorText,
      );
      throw new Error(
        `Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log("Pinata upload successful:", result.IpfsHash);
    options.onProgress?.(100);

    return {
      cid: result.IpfsHash,
      deletable: false,
      storageMode: "quick",
    };
  } catch (error) {
    console.error("App Pinata upload failed:", error);
    // Don't return error CID in production, throw the error instead
    throw new Error(
      `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Private Control Mode - User's own Pinata
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
      console.error(
        "Oversized files detected:",
        oversizedFiles.map((f) => ({ name: f.name, size: f.size })),
      );
      throw new Error(
        `Some files are too large. Please use images under ${options.maxFileSize || 5}MB for best mobile performance.`,
      );
    }

    options.onProgress?.(10);

    const formData = new FormData();

    // Add all files to form data
    pairs.forEach((file, index) => {
      formData.append("file", file, `pair-${index}-${file.name}`);
    });

    reveal?.forEach((file, index) => {
      formData.append("file", file, `reveal-${index}-${file.name}`);
    });

    // Add metadata
    const metadata = new Blob(
      [
        JSON.stringify({
          message,
          pairs: pairs.map((f, i) => `pair-${i}-${f.name}`),
          reveal: reveal?.map((f, i) => `reveal-${i}-${f.name}`) || [],
          createdAt: new Date().toISOString(),
          storageMode: "private",
        }),
      ],
      { type: "application/json" },
    );

    formData.append("file", metadata, "metadata.json");

    const pinataMetadata = JSON.stringify({
      name: `Private Valentine Game - ${Date.now()}`,
      keyvalues: {
        gameType: "valentine-memory-private",
        createdAt: new Date().toISOString(),
        deletable: "true",
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userApiKey}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Private Pinata API error:",
        response.status,
        response.statusText,
        errorText,
      );
      throw new Error(
        `Private Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log("Private Pinata upload successful:", result.IpfsHash);
    return {
      cid: result.IpfsHash,
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

// Gateway URL with multiple fallbacks
export const gatewayUrl = (cid: string, filename: string) => {
  // Try Pinata gateway first (faster), fallback to IPFS.io
  return `https://gateway.pinata.cloud/ipfs/${cid}/${filename}`;
};

// Alternative gateway for redundancy
export const fallbackGatewayUrl = (cid: string, filename: string) =>
  `https://ipfs.io/ipfs/${cid}/${filename}`;

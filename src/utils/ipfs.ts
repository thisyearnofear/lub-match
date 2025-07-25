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

// Quick Share Mode - App-controlled Pinata
async function uploadToAppPinata(
  pairs: File[],
  reveal: File[] | undefined,
  message: string,
): Promise<UploadResult> {
  const appPinataKey = process.env.PINATA_JWT;

  if (!appPinataKey) {
    console.log("No PINATA_JWT provided, using mock CID");
    return {
      cid: "mock-quick-" + Date.now(),
      deletable: false,
      storageMode: "quick",
    };
  }

  try {
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

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      cid: result.IpfsHash,
      deletable: false,
      storageMode: "quick",
    };
  } catch (error) {
    console.error("App Pinata upload failed:", error);
    return {
      cid: "error-quick-" + Date.now(),
      deletable: false,
      storageMode: "quick",
    };
  }
}

// Private Control Mode - User's own Pinata
async function uploadToUserPinata(
  pairs: File[],
  reveal: File[] | undefined,
  message: string,
  userApiKey: string,
): Promise<UploadResult> {
  try {
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
      throw new Error(`Private Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
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
): Promise<UploadResult> {
  if (config.mode === "private" && config.apiKey) {
    return uploadToUserPinata(pairs, reveal, message, config.apiKey);
  } else {
    return uploadToAppPinata(pairs, reveal, message);
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

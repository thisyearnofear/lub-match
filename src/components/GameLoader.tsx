"use client";

import { useState, useEffect, useCallback } from "react";
import GameContent from "./GameContent";
import GameLoadingStates from "./GameLoadingStates";
import { storage } from "@/utils/decentralizedStorage";
import { imageLoader } from "@/utils/reliableImageLoader";

interface GameLoaderProps {
  cid: string;
  justCreated: boolean;
}

async function fetchMetadata(cid: string): Promise<{ metadata: Record<string, unknown>; workingGateway: string } | null> {
  try {
    // Use the reliable gateway system
    const workingGateway = await storage.testGatewayHealth(cid);
    const metadataUrl = `${workingGateway}/ipfs/${cid}/metadata.json`;
    
    console.log(`✅ Using working gateway: ${workingGateway}`);
    
    const response = await fetch(metadataUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    const metadata = await response.json();
    console.log(`✅ Metadata loaded successfully from ${workingGateway}`);
    
    return { metadata, workingGateway };
  } catch (error) {
    console.error(`❌ Failed to load metadata for CID: ${cid}`, error);
    return null;
  }
}

export default function GameLoader({ cid, justCreated }: GameLoaderProps) {
  const [gameData, setGameData] = useState<{ metadata: Record<string, unknown>; workingGateway: string } | null>(null);
  const [imageUrls, setImageUrls] = useState<{ pairs: string[]; reveal: string[] }>({ pairs: [], reveal: [] });
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const loadGame = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchMetadata(cid);
      if (result) {
        setGameData(result);
        
        // Generate reliable image URLs
        const { metadata } = result;
        const pairUrls = await Promise.all(
          (metadata.pairs as string[]).map((filename: string) => 
            imageLoader.getWorkingImageUrl(cid, filename)
          )
        );
        
        const revealFiles = (metadata.reveal as string[] | undefined)?.length ? (metadata.reveal as string[]) : (metadata.pairs as string[]);
        const revealUrls = await Promise.all(
          revealFiles.map((filename: string) => 
            imageLoader.getWorkingImageUrl(cid, filename)
          )
        );

        setImageUrls({ pairs: pairUrls, reveal: revealUrls });
        
        // Debug logging
        console.log("GameLoader - Generated image URLs:");
        console.log("Pair URLs:", pairUrls);
        console.log("Reveal URLs:", revealUrls);
        
        // Preload images for better UX
        await imageLoader.preloadImages(cid, [...(metadata.pairs as string[]), ...(revealFiles as string[])]);
      }
    } catch (error) {
      console.error("Failed to load game:", error);
      setGameData(null);
    } finally {
      setLoading(false);
    }
  }, [cid, setImageUrls]);

  useEffect(() => {
    loadGame();
  }, [cid, retryCount, loadGame]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setGameData(null);
    setImageUrls({ pairs: [], reveal: [] });
  };

  if (
    loading ||
    !gameData ||
    !gameData.metadata ||
    !gameData.metadata.pairs ||
    !Array.isArray(gameData.metadata.pairs) ||
    imageUrls.pairs.length === 0
  ) {
    return <GameLoadingStates cid={cid} onRetry={handleRetry} />;
  }

  const { metadata } = gameData;

  return (
    <main className="flex items-center justify-center min-h-screen bg-black relative px-10">
      <GameContent
        pairUrls={imageUrls.pairs}
        revealUrls={imageUrls.reveal}
        message={metadata.message as string}
        justCreated={justCreated}
      />
    </main>
  );
}

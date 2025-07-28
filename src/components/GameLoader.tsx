'use client';

import { useState, useEffect } from 'react';
import GameContent from './GameContent';
import GameLoadingStates from './GameLoadingStates';
import { gatewayUrl, fallbackGatewayUrl } from '@/utils/ipfs';

interface GameLoaderProps {
  cid: string;
  justCreated: boolean;
}

async function fetchMetadata(cid: string, maxRetries = 5) {
  // Try primary gateway first, then fallback
  const gateways = [
    () => gatewayUrl(cid, "metadata.json"),
    () => fallbackGatewayUrl(cid, "metadata.json"),
  ];
  
  for (const getUrl of gateways) {
    const url = getUrl();
    console.log(`Trying gateway: ${url}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, { 
          cache: "no-store",
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (res.ok) {
          const metadata = await res.json();
          console.log(`Metadata fetched successfully from ${url} on attempt ${attempt}`);
          return metadata;
        }
        
        console.warn(`${url} attempt ${attempt}/${maxRetries} failed: ${res.status} ${res.statusText}`);
        
        // If it's a 404, the content might not be propagated yet - retry
        if (res.status === 404 && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // Exponential backoff, max 8s
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors on this gateway, try next gateway
        break;
        
      } catch (error) {
        console.warn(`${url} attempt ${attempt}/${maxRetries} error:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Try next gateway
        break;
      }
    }
  }
  
  console.error(`All gateways failed for CID: ${cid}`);
  return null;
}

export default function GameLoader({ cid, justCreated }: GameLoaderProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const loadGame = async () => {
    setLoading(true);
    try {
      const result = await fetchMetadata(cid);
      setMetadata(result);
    } catch (error) {
      console.error('Failed to load game:', error);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGame();
  }, [cid, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setMetadata(null); // Reset metadata to trigger loading state
  };

  if (loading || !metadata || !metadata.pairs || !Array.isArray(metadata.pairs)) {
    return <GameLoadingStates cid={cid} onRetry={handleRetry} />;
  }

  const pairUrls: string[] = metadata.pairs.map((name: string) =>
    gatewayUrl(cid, name),
  );
  const revealUrls: string[] = (
    metadata.reveal?.length ? metadata.reveal : metadata.pairs
  ).map((name: string) => gatewayUrl(cid, name));

  return (
    <main className="flex items-center justify-center min-h-screen bg-black relative px-10">
      <GameContent
        pairUrls={pairUrls}
        revealUrls={revealUrls}
        message={metadata.message}
        justCreated={justCreated}
      />
    </main>
  );
}

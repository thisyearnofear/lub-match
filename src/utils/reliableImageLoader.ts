// Reliable image loading with automatic gateway failover
// Maintains decentralization while ensuring images actually load

export interface ImageLoadConfig {
  timeout: number;
  retries: number;
  preferredGateway: string;
  fallbackGateways: string[];
}

const DEFAULT_IMAGE_CONFIG: ImageLoadConfig = {
  timeout: 8000,
  retries: 2,
  preferredGateway: 'https://dweb.link',
  fallbackGateways: []
};

class ReliableImageLoader {
  private config: ImageLoadConfig;
  private gatewayHealth: Map<string, { working: boolean; lastChecked: number }> = new Map();
  private readonly HEALTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(config: Partial<ImageLoadConfig> = {}) {
    this.config = { ...DEFAULT_IMAGE_CONFIG, ...config };
  }

  async getWorkingImageUrl(cid: string, filename: string): Promise<string> {
    const allGateways = [this.config.preferredGateway, ...this.config.fallbackGateways];
    
    for (const gateway of allGateways) {
      if (await this.isGatewayHealthy(gateway, cid)) {
        return `${gateway}/ipfs/${cid}/${filename}`;
      }
    }

    // If all gateways fail health check, return preferred anyway
    // (sometimes health checks fail but images still load)
    console.warn('All gateways failed health check, using preferred gateway');
    return `${this.config.preferredGateway}/ipfs/${cid}/${filename}`;
  }

  private async isGatewayHealthy(gateway: string, cid: string): Promise<boolean> {
    const healthKey = `${gateway}-${cid}`;
    const cached = this.gatewayHealth.get(healthKey);
    
    // Use cached result if recent
    if (cached && Date.now() - cached.lastChecked < this.HEALTH_CACHE_DURATION) {
      return cached.working;
    }

    try {
      const testUrl = `${gateway}/ipfs/${cid}/metadata.json`;
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(this.config.timeout)
      });

      const isWorking = response.ok;
      this.gatewayHealth.set(healthKey, {
        working: isWorking,
        lastChecked: Date.now()
      });

      return isWorking;
    } catch {
      this.gatewayHealth.set(healthKey, {
        working: false,
        lastChecked: Date.now()
      });
      return false;
    }
  }

  // Preload images to warm up gateways
  async preloadImages(cid: string, filenames: string[]): Promise<void> {
    const workingGateway = await this.findWorkingGateway(cid);
    
    if (workingGateway) {
      // Preload a few images to warm up the gateway
      const preloadPromises = filenames.slice(0, 3).map(filename => {
        const url = `${workingGateway}/ipfs/${cid}/${filename}`;
        return fetch(url, { method: 'HEAD' }).catch(() => {});
      });
      
      await Promise.allSettled(preloadPromises);
    }
  }

  private async findWorkingGateway(cid: string): Promise<string | null> {
    const allGateways = [this.config.preferredGateway, ...this.config.fallbackGateways];
    
    for (const gateway of allGateways) {
      if (await this.isGatewayHealthy(gateway, cid)) {
        return gateway;
      }
    }
    
    return null;
  }
}

// Singleton instance
export const imageLoader = new ReliableImageLoader();

// Hook for React components
import { useState, useEffect } from 'react';

export function useReliableImages(cid: string, filenames: string[]) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      setLoading(true);
      
      try {
        // Preload to find working gateway
        await imageLoader.preloadImages(cid, filenames);
        
        // Generate URLs using working gateway
        const urls = await Promise.all(
          filenames.map(filename => imageLoader.getWorkingImageUrl(cid, filename))
        );
        
        setImageUrls(urls);
      } catch (error) {
        console.error('Failed to load reliable image URLs:', error);
        // Fallback to basic URLs
        setImageUrls(filenames.map(filename => 
          `${DEFAULT_IMAGE_CONFIG.preferredGateway}/ipfs/${cid}/${filename}`
        ));
      } finally {
        setLoading(false);
      }
    }

    if (cid && filenames.length > 0) {
      loadImages();
    }
  }, [cid, filenames]);

  return { imageUrls, loading };
}
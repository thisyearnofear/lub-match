// Clean, decentralized storage architecture
// Maintains IPFS benefits while solving reliability issues

export interface DecentralizedConfig {
  preferredGateway: string;
  fallbackGateways: string[];
  timeout: number;
  retries: number;
}

export interface StorageResult {
  cid: string;
  urls: {
    preferred: string;
    fallbacks: string[];
  };
  deletable: boolean;
}

// Default configuration - easily customizable
const DEFAULT_CONFIG: DecentralizedConfig = {
  preferredGateway: 'https://dweb.link',
  fallbackGateways: [],
  timeout: 10000,
  retries: 2
};

class DecentralizedStorage {
  private config: DecentralizedConfig;
  private pinataJWT: string;

  constructor(config: Partial<DecentralizedConfig> = {}, pinataJWT?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pinataJWT = pinataJWT || process.env.PINATA_JWT || '';
  }

  async uploadGame(
    pairs: File[],
    reveal: File[] | undefined,
    message: string,
    userApiKey?: string
  ): Promise<StorageResult> {
    const files = this.prepareFiles(pairs, reveal, message);
    const cid = await this.uploadToIPFS(files, userApiKey);
    
    return {
      cid,
      urls: this.generateUrls(cid),
      deletable: !!userApiKey
    };
  }

  private prepareFiles(pairs: File[], reveal: File[] | undefined, message: string): File[] {
    const files: File[] = [];

    // Add pairs with consistent naming
    pairs.forEach((file, index) => {
      const fileName = `pair-${index}.${this.getFileExtension(file.name)}`;
      files.push(new File([file], fileName, { type: file.type }));
    });

    // Add reveal images
    reveal?.forEach((file, index) => {
      const fileName = `reveal-${index}.${this.getFileExtension(file.name)}`;
      files.push(new File([file], fileName, { type: file.type }));
    });

    // Add metadata
    const metadata = this.createMetadata(message, pairs, reveal);
    files.push(new File([metadata], 'metadata.json', { type: 'application/json' }));

    return files;
  }

  private createMetadata(message: string, pairs: File[], reveal: File[] | undefined): string {
    return JSON.stringify({
      message,
      pairs: pairs.map((f, i) => `pair-${i}.${this.getFileExtension(f.name)}`),
      reveal: reveal?.map((f, i) => `reveal-${i}.${this.getFileExtension(f.name)}`) || [],
      createdAt: new Date().toISOString(),
      version: '1.0'
    });
  }

  private async uploadToIPFS(files: File[], userApiKey?: string): Promise<string> {
    const apiKey = userApiKey || this.pinataJWT;
    
    if (!apiKey) {
      throw new Error('No API key provided for IPFS upload');
    }

    // Use Pinata SDK for reliable uploads
    const { PinataSDK } = await import('pinata');
    const pinata = new PinataSDK({
      pinataJwt: apiKey,
      pinataGateway: this.config.preferredGateway.replace('https://', '')
    });

    // Use the correct API for Pinata SDK v2.4.9
    const upload = await pinata.upload.public
      .fileArray(files)
      .name(`Valentine Game - ${Date.now()}`)
      .keyvalues({
        gameType: 'valentine-memory',
        createdAt: new Date().toISOString()
      });

    return upload.cid;
  }

  private generateUrls(cid: string): { preferred: string; fallbacks: string[] } {
    return {
      preferred: `${this.config.preferredGateway}/ipfs/${cid}`,
      fallbacks: this.config.fallbackGateways.map(gateway => `${gateway}/ipfs/${cid}`)
    };
  }

  getImageUrl(cid: string, filename: string): string {
    return `${this.config.preferredGateway}/ipfs/${cid}/${filename}`;
  }

  async testGatewayHealth(cid: string): Promise<string> {
    const testUrl = `${this.config.preferredGateway}/ipfs/${cid}/metadata.json`;
    
    try {
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(this.config.timeout)
      });
      
      if (response.ok) {
        return this.config.preferredGateway;
      }
    } catch (error) {
      console.warn(`Preferred gateway failed: ${error}`);
    }

    // Test fallback gateways
    for (const gateway of this.config.fallbackGateways) {
      try {
        const testUrl = `${gateway}/ipfs/${cid}/metadata.json`;
        const response = await fetch(testUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(this.config.timeout)
        });
        
        if (response.ok) {
          return gateway;
        }
      } catch (error) {
        console.warn(`Gateway ${gateway} failed: ${error}`);
      }
    }

    throw new Error('All gateways are unavailable');
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || 'unknown';
  }
}

// Singleton instance for clean usage throughout the app
export const storage = new DecentralizedStorage();

// Export for custom configurations
export { DecentralizedStorage };
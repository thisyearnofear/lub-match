// Environment Configuration
// Server-side only (secure)
export const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
export const PINATA_JWT = process.env.PINATA_JWT || "";

// Feature flags (derived from server-side config)
export const NEYNAR_FEATURES_ENABLED = !!process.env.NEYNAR_API_KEY;

// API Configuration
export const NEYNAR_API_BASE = "https://api.neynar.com/v2/farcaster";

// Cache Configuration
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// API Limits
export const MAX_TRENDING_LIMIT = 10;
export const DEFAULT_USER_COUNT = 16;
export const MIN_FOLLOWERS = 100;

// Web3 Configuration
export const WEB3_CONFIG = {
  // Contract Addresses - V3 Release (January 2025)
  contracts: {
    lubToken: process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS as `0x${string}` | undefined, // LUB Token V2
    heartNFT: process.env.NEXT_PUBLIC_HEART_NFT_ADDRESS as `0x${string}` | undefined, // Heart NFT V3
    registry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}` | undefined,
  },

  // Feature Flags
  features: {
    onchainEnabled: process.env.NEXT_PUBLIC_ENABLE_ONCHAIN === "true",
    nftMintingEnabled: !!process.env.NEXT_PUBLIC_HEART_NFT_ADDRESS,
    lubTokenEnabled: !!process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS,
    tokenEconomics: process.env.NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS === "true",
    socialEarning: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_EARNING === "true",
  },

  // Network Configuration
  networks: {
    arbitrum: {
      chainId: 42161,
      name: "Arbitrum One",
      rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC || "https://arb-mainnet.g.alchemy.com/v2/oVv496K7Ex-vGv5pvulFuDj3RuKBCGFc",
    },
    arbitrumSepolia: {
      chainId: 421614,
      name: "Arbitrum Sepolia",
      rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
    },
    baseSepolia: {
      chainId: 84532,
      name: "Base Sepolia",
      rpcUrl: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    }
  },

  // Pricing Configuration
  pricing: {
    // Farcaster lubs (holding requirement)
    farcasterHoldRequirement: BigInt("50000000000000000000"), // 50 LUB

    // Romance lubs (spending requirement)
    romanceBaseCost: BigInt("10000000000000000000"), // 10 LUB
    romanceCostMultiplier: 2, // Each subsequent lub costs 2x more
    firstLubFree: true,

    // NFT minting
    nftMintPrice: "0.001", // ETH
    lubDiscount: 0.5, // 50% discount with LUB

    // Legacy
    gameCreationCost: "100", // LUB (for backward compatibility)
  },

  // Earning Configuration
  earning: {
    photoInclusion: BigInt("10000000000000000000"), // 10 LUB when photos used
    gameCompletion: BigInt("5000000000000000000"), // 5 LUB for completing games
    referralBonus: BigInt("25000000000000000000"), // 25 LUB for referrals
    socialGameWin: BigInt("3000000000000000000"), // 3 LUB for social game wins
  },

  // Token Supply
  token: {
    totalSupply: BigInt("10000000000000000000000000000"), // 10 billion LUB
    decimals: 18,
    symbol: "LUB",
    name: "Lub Token"
  }
} as const;

// IPFS Configuration
export const IPFS_CONFIG = {
  gateways: {
    primary: "https://gateway.pinata.cloud",
    fallbacks: [
      "https://dweb.link",
      "https://ipfs.io",
      "https://cloudflare-ipfs.com"
    ]
  },

  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    timeout: 30000, // 30 seconds
    retries: 3
  }
} as const;
// LUB Token Reward Configuration
// Defines reward amounts for different on-chain events

import { parseEther, formatEther, isAddress } from "ethers";

// Event-to-reward mapping (in LUB tokens, 18 decimals)
export const EVENT_REWARDS = {
  // HeartNFT Contract Events
  "HeartMinted": parseEther("25"), // 25 LUB for minting NFT
  "CollectionMilestone": parseEther("100"), // 100 LUB for collection milestones

  // LubToken Contract Events
  "GameCreated": parseEther("10"), // 10 LUB bonus for creating games (they already spent LUB)

  // PhotoPairLeaderboard Contract Events (when deployed)
  "ScoreSubmitted": parseEther("15"), // 15 LUB for leaderboard participation
  "AchievementUnlocked": parseEther("50"), // 50 LUB for achievements
  "TournamentJoined": parseEther("30"), // 30 LUB for tournament participation

  // MemoryGameRegistry Contract Events (when deployed)
  "GamePublished": parseEther("20"), // 20 LUB for publishing games
} as const;

// Contract addresses configuration
export const CONTRACT_ADDRESSES = {
  lubToken: "0x5eb4dAF1637620aEC4244D6F95AA8FF65fc2B5F0",
  heartNFT: "0x1db663b601aAfb926fAE305B236E4444E51f488d",
  // These will be added when contracts are deployed
  photoPairLeaderboard: process.env.NEXT_PUBLIC_PHOTO_PAIR_LEADERBOARD_ADDRESS,
  memoryGameRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS,
} as const;

// Reward distribution settings
export const DISTRIBUTION_CONFIG = {
  // Arbitrum network settings
  arbitrum: {
    chainId: 42161,
    blocksPerSecond: 4, // Approximate blocks per second on Arbitrum
    confirmationBlocks: 1, // Number of blocks to wait for confirmation
  },
  
  // Time periods
  scanPeriod: {
    days: 7, // Scan last 7 days
    maxBlocks: 2419200, // Maximum blocks to scan (7 days * 24 hours * 60 minutes * 60 seconds * 4 blocks/second)
  },
  
  // Distribution limits
  limits: {
    maxRecipientsPerBatch: 100, // Maximum recipients per distribution
    maxRewardPerUser: parseEther("1000"), // Maximum LUB per user per week
    minRewardThreshold: parseEther("1"), // Minimum reward to qualify for distribution
  },
  
  // Gas optimization
  gas: {
    delayBetweenTransfers: 1000, // Milliseconds between transfers
    maxGasPrice: parseEther("0.00000005"), // Maximum gas price to pay (50 gwei)
  },
} as const;

// Event descriptions for logging and UI
export const EVENT_DESCRIPTIONS = {
  "HeartMinted": "Minted a Heart NFT",
  "CollectionMilestone": "Achieved collection milestone",
  "GameCreated": "Created a new game",
  "ScoreSubmitted": "Submitted leaderboard score",
  "AchievementUnlocked": "Unlocked achievement",
  "TournamentJoined": "Joined tournament",
  "GamePublished": "Published a game",
} as const;

// Reward categories for analytics
export const REWARD_CATEGORIES = {
  "HeartMinted": "NFT Activity",
  "CollectionMilestone": "NFT Activity",
  "GameCreated": "Game Activity",
  "ScoreSubmitted": "Competition",
  "AchievementUnlocked": "Achievement",
  "TournamentJoined": "Competition",
  "GamePublished": "Game Activity",
} as const;

// Helper functions
export function getRewardAmount(eventName: keyof typeof EVENT_REWARDS): bigint {
  return EVENT_REWARDS[eventName];
}

export function getEventDescription(eventName: keyof typeof EVENT_DESCRIPTIONS): string {
  return EVENT_DESCRIPTIONS[eventName];
}

export function getRewardCategory(eventName: keyof typeof REWARD_CATEGORIES): string {
  return REWARD_CATEGORIES[eventName];
}

export function formatReward(amount: bigint): string {
  return `${formatEther(amount)} LUB`;
}

// Validation functions
export function isValidEventName(eventName: string): eventName is keyof typeof EVENT_REWARDS {
  return eventName in EVENT_REWARDS;
}

export function validateRewardAmount(amount: bigint): boolean {
  return amount > 0 && amount <= DISTRIBUTION_CONFIG.limits.maxRewardPerUser;
}

export function validateAddress(address: string): boolean {
  return isAddress(address);
}

// Export types for TypeScript
export type EventName = keyof typeof EVENT_REWARDS;
export type ContractName = keyof typeof CONTRACT_ADDRESSES;
export type RewardCategory = typeof REWARD_CATEGORIES[EventName];

// Weekly distribution schedule
export const DISTRIBUTION_SCHEDULE = {
  // Run every Sunday at 23:00 UTC (scan events)
  scanTime: {
    dayOfWeek: 0, // Sunday
    hour: 23,
    minute: 0,
  },
  
  // Run every Monday at 09:00 UTC (distribute rewards)
  distributeTime: {
    dayOfWeek: 1, // Monday
    hour: 9,
    minute: 0,
  },
} as const;

// Export default configuration
const defaultConfig = {
  EVENT_REWARDS,
  CONTRACT_ADDRESSES,
  DISTRIBUTION_CONFIG,
  EVENT_DESCRIPTIONS,
  REWARD_CATEGORIES,
  DISTRIBUTION_SCHEDULE,
};

// CommonJS exports
module.exports = {
  EVENT_REWARDS,
  CONTRACT_ADDRESSES,
  DISTRIBUTION_CONFIG,
  EVENT_DESCRIPTIONS,
  REWARD_CATEGORIES,
  DISTRIBUTION_SCHEDULE,
  getRewardAmount,
  getEventDescription,
  getRewardCategory,
  formatReward,
  isValidEventName,
  validateRewardAmount,
  validateAddress,
  default: defaultConfig
};

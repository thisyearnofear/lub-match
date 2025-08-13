// Weekly Event Scanner for LUB Token Rewards
// Scans all contract events from the past week and calculates rewards
// Run with: npx hardhat run scripts/scanWeeklyEvents.ts --network arbitrum

import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const { ethers } = hre;

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration (centralized to avoid import issues)
const EVENT_REWARDS = {
  "HeartMinted": ethers.parseEther("25"),
  "CollectionMilestone": ethers.parseEther("100"),
  "GameCreated": ethers.parseEther("10"),
  "ScoreSubmitted": ethers.parseEther("15"),
  "AchievementUnlocked": ethers.parseEther("50"),
  "TournamentJoined": ethers.parseEther("30"),
  "GamePublished": ethers.parseEther("20"),
} as const;

const CONTRACTS = {
  lubToken: "0x5eb4dAF1637620aEC4244D6F95AA8FF65fc2B5F0",
  heartNFT: "0x1db663b601aAfb926fAE305B236E4444E51f488d",
  photoPairLeaderboard: process.env.NEXT_PUBLIC_PHOTO_PAIR_LEADERBOARD_ADDRESS,
  memoryGameRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS,
} as const;

interface EventData {
  contract: string;
  eventName: string;
  user: string;
  blockNumber: number;
  transactionHash: string;
  reward: bigint;
  timestamp?: number;
}

interface WeeklyRewards {
  [address: string]: {
    totalReward: bigint;
    events: EventData[];
  };
}

interface DistributionSummary {
  scanPeriod: {
    fromBlock: number;
    toBlock: number;
    fromDate: string;
    toDate: string;
  };
  totalUsers: number;
  totalRewards: string; // formatted as ether
  totalEvents: number;
  eventBreakdown: { [eventType: string]: number };
  recipients: Array<{
    address: string;
    amount: string; // formatted as ether
    eventCount: number;
    events: Array<{
      type: string;
      reward: string;
      txHash: string;
      blockNumber: number;
    }>;
  }>;
}

async function main() {
  console.log("🔍 Starting Weekly Event Scan for LUB Rewards...");
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  if (network.chainId !== 42161n) {
    console.warn("⚠️  Warning: Not connected to Arbitrum Mainnet");
  }

  // Calculate scan period (last 7 days)
  const currentBlock = await ethers.provider.getBlockNumber();
  const currentBlockData = await ethers.provider.getBlock(currentBlock);
  const currentTimestamp = currentBlockData!.timestamp;
  
  // Calculate blocks for last 7 days (Arbitrum ~4 blocks per second)
  const SECONDS_IN_WEEK = 7 * 24 * 60 * 60;
  const ARBITRUM_BLOCKS_PER_SECOND = 4;
  const blocksInWeek = SECONDS_IN_WEEK * ARBITRUM_BLOCKS_PER_SECOND;

  // Use conservative block range to avoid RPC limitations
  // Most RPC providers allow 100-500 blocks, we'll use 100 for reliability
  const MAX_BLOCKS_PER_SCAN = 100;
  const maxBlocks = Math.min(blocksInWeek, MAX_BLOCKS_PER_SCAN);
  const fromBlock = Math.max(1, currentBlock - maxBlocks);
  const toBlock = currentBlock;
  
  console.log(`\n📅 Scan Period:`);
  console.log(`From Block: ${fromBlock}`);
  console.log(`To Block: ${toBlock}`);
  console.log(`Blocks Scanned: ${toBlock - fromBlock}`);
  console.log(`From Date: ${new Date((currentTimestamp - SECONDS_IN_WEEK) * 1000).toISOString()}`);
  console.log(`To Date: ${new Date(currentTimestamp * 1000).toISOString()}`);

  if (maxBlocks < blocksInWeek) {
    console.log(`⚠️  Note: Scanning ${maxBlocks} blocks instead of full week (${blocksInWeek} blocks) due to RPC limitations`);
    console.log(`   For full week scanning, consider using multiple smaller scans or a different RPC provider`);
  }

  const weeklyRewards: WeeklyRewards = {};
  const eventBreakdown: { [eventType: string]: number } = {};
  let totalEvents = 0;

  // Scan HeartNFT events
  if (CONTRACTS.heartNFT) {
    console.log("\n🎨 Scanning HeartNFT events...");
    await scanHeartNFTEvents(fromBlock, toBlock, weeklyRewards, eventBreakdown);
  }

  // Scan LubToken events  
  if (CONTRACTS.lubToken) {
    console.log("\n💰 Scanning LubToken events...");
    await scanLubTokenEvents(fromBlock, toBlock, weeklyRewards, eventBreakdown);
  }

  // Scan PhotoPairLeaderboard events (if deployed)
  if (CONTRACTS.photoPairLeaderboard) {
    console.log("\n🏆 Scanning PhotoPairLeaderboard events...");
    await scanLeaderboardEvents(fromBlock, toBlock, weeklyRewards, eventBreakdown);
  }

  // Scan MemoryGameRegistry events (if deployed)
  if (CONTRACTS.memoryGameRegistry) {
    console.log("\n🎮 Scanning MemoryGameRegistry events...");
    await scanRegistryEvents(fromBlock, toBlock, weeklyRewards, eventBreakdown);
  }

  // Calculate totals
  totalEvents = Object.values(eventBreakdown).reduce((sum, count) => sum + count, 0);
  const totalRewards = Object.values(weeklyRewards).reduce(
    (sum, user) => sum + user.totalReward, 
    BigInt(0)
  );

  // Generate distribution summary
  const distributionSummary: DistributionSummary = {
    scanPeriod: {
      fromBlock,
      toBlock,
      fromDate: new Date((currentTimestamp - SECONDS_IN_WEEK) * 1000).toISOString(),
      toDate: new Date(currentTimestamp * 1000).toISOString(),
    },
    totalUsers: Object.keys(weeklyRewards).length,
    totalRewards: ethers.formatEther(totalRewards),
    totalEvents,
    eventBreakdown,
    recipients: Object.entries(weeklyRewards).map(([address, data]) => ({
      address,
      amount: ethers.formatEther(data.totalReward),
      eventCount: data.events.length,
      events: data.events.map(event => ({
        type: event.eventName,
        reward: ethers.formatEther(event.reward),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
      })),
    })),
  };

  // Print summary
  console.log("\n📊 Weekly Rewards Summary:");
  console.log("=" .repeat(50));
  console.log(`Total Users: ${distributionSummary.totalUsers}`);
  console.log(`Total Events: ${totalEvents}`);
  console.log(`Total Rewards: ${distributionSummary.totalRewards} LUB`);
  console.log(`Average per User: ${distributionSummary.totalUsers > 0 ? 
    (Number(distributionSummary.totalRewards) / distributionSummary.totalUsers).toFixed(2) : 0} LUB`);

  console.log("\n📈 Event Breakdown:");
  Object.entries(eventBreakdown).forEach(([event, count]) => {
    const rewardPerEvent = EVENT_REWARDS[event as keyof typeof EVENT_REWARDS];
    const totalForEvent = BigInt(count) * rewardPerEvent;
    console.log(`  ${event}: ${count} events (${ethers.formatEther(totalForEvent)} LUB)`);
  });

  // Save distribution file
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const outputDir = path.join(__dirname, '../distributions');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const distributionFile = path.join(outputDir, `weekly-distribution-${timestamp}.json`);
  fs.writeFileSync(distributionFile, JSON.stringify(distributionSummary, null, 2));

  console.log(`\n💾 Distribution file saved: ${distributionFile}`);
  console.log("\n🚀 Ready for distribution! Run:");
  console.log(`npx hardhat run scripts/distributeWeeklyRewards.ts --network arbitrum`);

  return distributionSummary;
}

// Helper function to add reward to user
function addReward(
  weeklyRewards: WeeklyRewards,
  eventBreakdown: { [eventType: string]: number },
  eventData: EventData
) {
  const { user, eventName, reward } = eventData;

  if (!weeklyRewards[user]) {
    weeklyRewards[user] = {
      totalReward: BigInt(0),
      events: [],
    };
  }

  weeklyRewards[user].totalReward += reward;
  weeklyRewards[user].events.push(eventData);

  eventBreakdown[eventName] = (eventBreakdown[eventName] || 0) + 1;
}

// Scan HeartNFT contract events
async function scanHeartNFTEvents(
  fromBlock: number,
  toBlock: number,
  weeklyRewards: WeeklyRewards,
  eventBreakdown: { [eventType: string]: number }
) {
  try {
    const HeartNFT = await ethers.getContractFactory("HeartNFT");
    const heartNFT = HeartNFT.attach(CONTRACTS.heartNFT);

    // Scan HeartMinted events with error handling for RPC limitations
    let heartMintedEvents;
    try {
      heartMintedEvents = await heartNFT.queryFilter(
        heartNFT.filters.HeartMinted(),
        fromBlock,
        toBlock
      );
    } catch (error: any) {
      if (error.message?.includes("block range")) {
        console.log(`    ⚠️  RPC block range error, trying smaller range...`);
        const smallerRange = Math.min(50, toBlock - fromBlock);
        const adjustedFromBlock = toBlock - smallerRange;
        heartMintedEvents = await heartNFT.queryFilter(
          heartNFT.filters.HeartMinted(),
          adjustedFromBlock,
          toBlock
        );
        console.log(`    ✅ Successfully scanned ${smallerRange} blocks instead`);
      } else {
        throw error;
      }
    }

    console.log(`  Found ${heartMintedEvents.length} HeartMinted events`);

    for (const event of heartMintedEvents) {
      const args = event.args;
      if (!args) continue;

      // Reward both creator and completer
      const creator = args.creator;
      const completer = args.completer;

      // Reward creator
      addReward(weeklyRewards, eventBreakdown, {
        contract: "HeartNFT",
        eventName: "HeartMinted",
        user: creator,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        reward: EVENT_REWARDS.HeartMinted,
      });

      // Reward completer (if different from creator)
      if (creator.toLowerCase() !== completer.toLowerCase()) {
        addReward(weeklyRewards, eventBreakdown, {
          contract: "HeartNFT",
          eventName: "HeartMinted",
          user: completer,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          reward: EVENT_REWARDS.HeartMinted,
        });
      }
    }

    // Scan CollectionMilestone events
    const milestoneEvents = await heartNFT.queryFilter(
      heartNFT.filters.CollectionMilestone(),
      fromBlock,
      toBlock
    );

    console.log(`  Found ${milestoneEvents.length} CollectionMilestone events`);

    for (const event of milestoneEvents) {
      // For milestones, we could reward the token owner or the milestone achiever
      // For now, we'll skip these as they don't have a clear user to reward
      // Could be enhanced later to reward the token owner of the milestone tokenId
    }

  } catch (error) {
    console.error("Error scanning HeartNFT events:", error);
  }
}

// Scan LubToken contract events
async function scanLubTokenEvents(
  fromBlock: number,
  toBlock: number,
  weeklyRewards: WeeklyRewards,
  eventBreakdown: { [eventType: string]: number }
) {
  try {
    const LubToken = await ethers.getContractFactory("LubToken");
    const lubToken = LubToken.attach(CONTRACTS.lubToken);

    // Scan GameCreated events (users spending LUB to create games)
    let gameCreatedEvents;
    try {
      gameCreatedEvents = await lubToken.queryFilter(
        lubToken.filters.GameCreated(),
        fromBlock,
        toBlock
      );
    } catch (error: any) {
      if (error.message?.includes("block range")) {
        console.log(`    ⚠️  RPC block range error, trying smaller range...`);
        const smallerRange = Math.min(50, toBlock - fromBlock);
        const adjustedFromBlock = toBlock - smallerRange;
        gameCreatedEvents = await lubToken.queryFilter(
          lubToken.filters.GameCreated(),
          adjustedFromBlock,
          toBlock
        );
        console.log(`    ✅ Successfully scanned ${smallerRange} blocks instead`);
      } else {
        throw error;
      }
    }

    console.log(`  Found ${gameCreatedEvents.length} GameCreated events`);

    for (const event of gameCreatedEvents) {
      const args = event.args;
      if (!args) continue;

      addReward(weeklyRewards, eventBreakdown, {
        contract: "LubToken",
        eventName: "GameCreated",
        user: args.creator,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        reward: EVENT_REWARDS.GameCreated,
      });
    }

    // Note: We don't reward InclusionReward or MintDiscount events
    // as these are already reward distributions or spending events

  } catch (error) {
    console.error("Error scanning LubToken events:", error);
  }
}

// Scan PhotoPairLeaderboard contract events (when deployed)
async function scanLeaderboardEvents(
  fromBlock: number,
  toBlock: number,
  weeklyRewards: WeeklyRewards,
  eventBreakdown: { [eventType: string]: number }
) {
  try {
    const PhotoPairLeaderboard = await ethers.getContractFactory("PhotoPairLeaderboard");
    const leaderboard = PhotoPairLeaderboard.attach(CONTRACTS.photoPairLeaderboard!);

    // Scan ScoreSubmitted events
    const scoreEvents = await leaderboard.queryFilter(
      leaderboard.filters.ScoreSubmitted(),
      fromBlock,
      toBlock
    );

    console.log(`  Found ${scoreEvents.length} ScoreSubmitted events`);

    for (const event of scoreEvents) {
      const args = event.args;
      if (!args) continue;

      addReward(weeklyRewards, eventBreakdown, {
        contract: "PhotoPairLeaderboard",
        eventName: "ScoreSubmitted",
        user: args.player,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        reward: EVENT_REWARDS.ScoreSubmitted,
      });
    }

    // Scan AchievementUnlocked events
    const achievementEvents = await leaderboard.queryFilter(
      leaderboard.filters.AchievementUnlocked(),
      fromBlock,
      toBlock
    );

    console.log(`  Found ${achievementEvents.length} AchievementUnlocked events`);

    for (const event of achievementEvents) {
      const args = event.args;
      if (!args) continue;

      addReward(weeklyRewards, eventBreakdown, {
        contract: "PhotoPairLeaderboard",
        eventName: "AchievementUnlocked",
        user: args.player,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        reward: EVENT_REWARDS.AchievementUnlocked,
      });
    }

    // Scan TournamentJoined events
    const tournamentEvents = await leaderboard.queryFilter(
      leaderboard.filters.TournamentJoined(),
      fromBlock,
      toBlock
    );

    console.log(`  Found ${tournamentEvents.length} TournamentJoined events`);

    for (const event of tournamentEvents) {
      const args = event.args;
      if (!args) continue;

      addReward(weeklyRewards, eventBreakdown, {
        contract: "PhotoPairLeaderboard",
        eventName: "TournamentJoined",
        user: args.player,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        reward: EVENT_REWARDS.TournamentJoined,
      });
    }

  } catch (error) {
    console.error("Error scanning PhotoPairLeaderboard events:", error);
  }
}

// Scan MemoryGameRegistry contract events (when deployed)
async function scanRegistryEvents(
  fromBlock: number,
  toBlock: number,
  weeklyRewards: WeeklyRewards,
  eventBreakdown: { [eventType: string]: number }
) {
  try {
    const MemoryGameRegistry = await ethers.getContractFactory("MemoryGameRegistry");
    const registry = MemoryGameRegistry.attach(CONTRACTS.memoryGameRegistry!);

    // Scan GamePublished events
    const gameEvents = await registry.queryFilter(
      registry.filters.GamePublished(),
      fromBlock,
      toBlock
    );

    console.log(`  Found ${gameEvents.length} GamePublished events`);

    for (const event of gameEvents) {
      const args = event.args;
      if (!args) continue;

      addReward(weeklyRewards, eventBreakdown, {
        contract: "MemoryGameRegistry",
        eventName: "GamePublished",
        user: args.creator,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        reward: EVENT_REWARDS.GamePublished,
      });
    }

  } catch (error) {
    console.error("Error scanning MemoryGameRegistry events:", error);
  }
}

// Handle execution
main()
  .then((result) => {
    console.log("\n✅ Weekly event scan completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Weekly event scan failed:");
    console.error(error);
    process.exit(1);
  });

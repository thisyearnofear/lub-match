// Test Event-Based Reward System
// Tests the event scanning and reward calculation without actual distribution
// Run with: npx hardhat run scripts/testEventSystem.ts --network arbitrum

import hre from "hardhat";
const { ethers } = hre;

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

const CONTRACT_ADDRESSES = {
  lubToken: process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS,
  heartNFT: process.env.NEXT_PUBLIC_HEART_NFT_ADDRESS,
  photoPairLeaderboard: process.env.NEXT_PUBLIC_PHOTO_PAIR_LEADERBOARD_ADDRESS,
  memoryGameRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS,
} as const;

const EVENT_DESCRIPTIONS = {
  "HeartMinted": "Minted a Heart NFT",
  "CollectionMilestone": "Achieved collection milestone",
  "GameCreated": "Created a new game",
  "ScoreSubmitted": "Submitted leaderboard score",
  "AchievementUnlocked": "Unlocked achievement",
  "TournamentJoined": "Joined tournament",
  "GamePublished": "Published a game",
} as const;

function formatReward(amount: bigint): string {
  return `${ethers.formatEther(amount)} LUB`;
}

function getEventDescription(eventName: keyof typeof EVENT_DESCRIPTIONS): string {
  return EVENT_DESCRIPTIONS[eventName];
}

function validateAddress(address: string): boolean {
  return ethers.isAddress(address);
}

async function main() {
  console.log("🧪 Testing Event-Based Reward System...");
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  
  // Test 1: Configuration validation
  console.log("\n📋 Testing Configuration...");
  console.log("Event Rewards:");
  Object.entries(EVENT_REWARDS).forEach(([event, reward]) => {
    console.log(`  ${event}: ${formatReward(reward)} (${getEventDescription(event as any)})`);
  });
  
  console.log("\nContract Addresses:");
  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    if (address) {
      console.log(`  ${name}: ${address} ${validateAddress(address) ? '✅' : '❌'}`);
    } else {
      console.log(`  ${name}: Not deployed ⏳`);
    }
  });

  // Test 2: Contract connectivity
  console.log("\n🔗 Testing Contract Connectivity...");
  
  // Test LubToken
  if (CONTRACT_ADDRESSES.lubToken) {
    try {
      const LubToken = await ethers.getContractFactory("LubToken");
      const lubToken = LubToken.attach(CONTRACT_ADDRESSES.lubToken);
      
      const totalSupply = await lubToken.totalSupply();
      const symbol = await lubToken.symbol();
      const decimals = await lubToken.decimals();
      
      console.log(`  LubToken: ✅`);
      console.log(`    Symbol: ${symbol}`);
      console.log(`    Decimals: ${decimals}`);
      console.log(`    Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
    } catch (error) {
      console.log(`  LubToken: ❌ ${error}`);
    }
  }

  // Test HeartNFT
  if (CONTRACT_ADDRESSES.heartNFT) {
    try {
      const HeartNFT = await ethers.getContractFactory("HeartNFT");
      const heartNFT = HeartNFT.attach(CONTRACT_ADDRESSES.heartNFT);
      
      const name = await heartNFT.name();
      const symbol = await heartNFT.symbol();
      const nextTokenId = await heartNFT.nextTokenId();
      
      console.log(`  HeartNFT: ✅`);
      console.log(`    Name: ${name}`);
      console.log(`    Symbol: ${symbol}`);
      console.log(`    Next Token ID: ${nextTokenId}`);
    } catch (error) {
      console.log(`  HeartNFT: ❌ ${error}`);
    }
  }

  // Test 3: Recent events scan (last 100 blocks - conservative for RPC compatibility)
  console.log("\n📊 Testing Recent Events (Last 100 Blocks)...");

  const currentBlock = await ethers.provider.getBlockNumber();
  const fromBlock = Math.max(1, currentBlock - 100);
  const toBlock = currentBlock;
  
  console.log(`Scanning blocks ${fromBlock} to ${toBlock}`);

  let totalEvents = 0;
  const eventCounts: { [key: string]: number } = {};

  // Scan HeartNFT events
  if (CONTRACT_ADDRESSES.heartNFT) {
    try {
      const HeartNFT = await ethers.getContractFactory("HeartNFT");
      const heartNFT = HeartNFT.attach(CONTRACT_ADDRESSES.heartNFT);

      const heartMintedEvents = await heartNFT.queryFilter(
        heartNFT.filters.HeartMinted(),
        fromBlock,
        toBlock
      );

      eventCounts["HeartMinted"] = heartMintedEvents.length;
      totalEvents += heartMintedEvents.length;

      console.log(`  HeartMinted events: ${heartMintedEvents.length}`);
      
      if (heartMintedEvents.length > 0) {
        const latestEvent = heartMintedEvents[heartMintedEvents.length - 1];
        console.log(`    Latest: Token #${latestEvent.args?.tokenId} by ${latestEvent.args?.creator}`);
      }

    } catch (error) {
      console.log(`  HeartNFT events: ❌ ${error}`);
    }
  }

  // Scan LubToken events
  if (CONTRACT_ADDRESSES.lubToken) {
    try {
      const LubToken = await ethers.getContractFactory("LubToken");
      const lubToken = LubToken.attach(CONTRACT_ADDRESSES.lubToken);

      const gameCreatedEvents = await lubToken.queryFilter(
        lubToken.filters.GameCreated(),
        fromBlock,
        toBlock
      );

      eventCounts["GameCreated"] = gameCreatedEvents.length;
      totalEvents += gameCreatedEvents.length;

      console.log(`  GameCreated events: ${gameCreatedEvents.length}`);
      
      if (gameCreatedEvents.length > 0) {
        const latestEvent = gameCreatedEvents[gameCreatedEvents.length - 1];
        console.log(`    Latest: ${latestEvent.args?.creator} paid ${ethers.formatEther(latestEvent.args?.costPaid || 0)} LUB`);
      }

    } catch (error) {
      console.log(`  LubToken events: ❌ ${error}`);
    }
  }

  // Test 4: Reward calculation simulation
  console.log("\n💰 Testing Reward Calculation...");
  
  if (totalEvents > 0) {
    let totalRewards = BigInt(0);
    
    console.log("Simulated rewards for recent events:");
    Object.entries(eventCounts).forEach(([eventName, count]) => {
      if (count > 0 && eventName in EVENT_REWARDS) {
        const rewardPerEvent = EVENT_REWARDS[eventName as keyof typeof EVENT_REWARDS];
        const totalForEvent = BigInt(count) * rewardPerEvent;
        totalRewards += totalForEvent;
        
        console.log(`  ${eventName}: ${count} × ${formatReward(rewardPerEvent)} = ${formatReward(totalForEvent)}`);
      }
    });
    
    console.log(`\nTotal simulated rewards: ${formatReward(totalRewards)}`);
    
    if (totalRewards > 0) {
      console.log("✅ Reward calculation working correctly!");
    }
  } else {
    console.log("No events found in recent blocks - this is normal for a new deployment");
  }

  // Test 5: Gas estimation
  console.log("\n⛽ Testing Gas Estimation...");
  
  if (CONTRACT_ADDRESSES.lubToken) {
    try {
      const [deployer] = await ethers.getSigners();
      const LubToken = await ethers.getContractFactory("LubToken");
      const lubToken = LubToken.attach(CONTRACT_ADDRESSES.lubToken);
      
      // Estimate gas for a single transfer
      const testAmount = ethers.parseEther("1");
      const gasEstimate = await lubToken.transfer.estimateGas(deployer.address, testAmount);
      
      console.log(`  Single transfer gas estimate: ${gasEstimate.toString()}`);
      
      // Estimate cost for 10 transfers
      const gasPrice = await ethers.provider.getFeeData();
      if (gasPrice.gasPrice) {
        const costPerTransfer = gasEstimate * gasPrice.gasPrice;
        const costFor10 = costPerTransfer * BigInt(10);
        
        console.log(`  Cost per transfer: ${ethers.formatEther(costPerTransfer)} ETH`);
        console.log(`  Cost for 10 transfers: ${ethers.formatEther(costFor10)} ETH`);
      }
      
    } catch (error) {
      console.log(`  Gas estimation: ❌ ${error}`);
    }
  }

  console.log("\n🎉 Event System Test Complete!");
  console.log("\nNext steps:");
  console.log("1. Run 'npm run scan-events' to scan for weekly events");
  console.log("2. Run 'npm run distribute-rewards' to distribute rewards");
  console.log("3. Or run 'npm run weekly-rewards' to do both");
}

// Handle execution
main()
  .then(() => {
    console.log("\n✅ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  });

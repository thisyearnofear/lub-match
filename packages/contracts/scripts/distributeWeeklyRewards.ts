// Weekly Reward Distribution Script
// Distributes LUB tokens based on weekly event scan results
// Run with: npx hardhat run scripts/distributeWeeklyRewards.ts --network arbitrum

import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const { ethers } = hre;

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract addresses
const LUB_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS;

interface DistributionSummary {
  scanPeriod: {
    fromBlock: number;
    toBlock: number;
    fromDate: string;
    toDate: string;
  };
  totalUsers: number;
  totalRewards: string;
  totalEvents: number;
  eventBreakdown: { [eventType: string]: number };
  recipients: Array<{
    address: string;
    amount: string;
    eventCount: number;
    events: Array<{
      type: string;
      reward: string;
      txHash: string;
      blockNumber: number;
    }>;
  }>;
}

interface DistributionResult {
  distributionId: string;
  totalRecipients: number;
  totalAmountDistributed: string;
  successfulTransfers: number;
  failedTransfers: number;
  gasUsed: string;
  results: Array<{
    recipient: string;
    amount: string;
    success: boolean;
    txHash?: string;
    error?: string;
  }>;
}

async function main() {
  console.log("💸 Starting Weekly LUB Reward Distribution...");

  const [deployer] = await ethers.getSigners();
  console.log("Distributing from account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  if (network.chainId !== 42161n) {
    console.warn("⚠️  Warning: Not connected to Arbitrum Mainnet");
  }

  // Find the latest distribution file
  const distributionsDir = path.join(__dirname, '../distributions');
  if (!fs.existsSync(distributionsDir)) {
    throw new Error("No distributions directory found. Run scanWeeklyEvents.ts first.");
  }

  const files = fs.readdirSync(distributionsDir)
    .filter(file => file.startsWith('weekly-distribution-') && file.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first

  if (files.length === 0) {
    throw new Error("No distribution files found. Run scanWeeklyEvents.ts first.");
  }

  const latestFile = files[0];
  const distributionPath = path.join(distributionsDir, latestFile);
  
  console.log(`📄 Loading distribution file: ${latestFile}`);

  // Load distribution data
  const distributionData: DistributionSummary = JSON.parse(
    fs.readFileSync(distributionPath, 'utf8')
  );

  console.log("\n📊 Distribution Summary:");
  console.log("=" .repeat(50));
  console.log(`Scan Period: ${distributionData.scanPeriod.fromDate} to ${distributionData.scanPeriod.toDate}`);
  console.log(`Total Recipients: ${distributionData.totalUsers}`);
  console.log(`Total Rewards: ${distributionData.totalRewards} LUB`);
  console.log(`Total Events: ${distributionData.totalEvents}`);

  if (distributionData.recipients.length === 0) {
    console.log("🎉 No rewards to distribute this week!");
    return;
  }

  // Get LUB token contract
  const LubToken = await ethers.getContractFactory("LubToken");
  const lubToken = LubToken.attach(LUB_TOKEN_ADDRESS);

  // Check deployer's balance
  const deployerBalance = await lubToken.balanceOf(deployer.address);
  const totalNeeded = ethers.parseEther(distributionData.totalRewards);
  
  console.log(`\n💰 Balance Check:`);
  console.log(`Deployer Balance: ${ethers.formatEther(deployerBalance)} LUB`);
  console.log(`Total Needed: ${distributionData.totalRewards} LUB`);

  if (deployerBalance < totalNeeded) {
    throw new Error(
      `Insufficient LUB balance. Need ${distributionData.totalRewards} LUB, have ${ethers.formatEther(deployerBalance)} LUB`
    );
  }

  // Confirm distribution
  console.log("\n🚨 DISTRIBUTION CONFIRMATION:");
  console.log(`About to distribute ${distributionData.totalRewards} LUB to ${distributionData.totalUsers} recipients`);
  console.log("Event breakdown:");
  Object.entries(distributionData.eventBreakdown).forEach(([event, count]) => {
    console.log(`  ${event}: ${count} events`);
  });

  // In a production environment, you might want to add a confirmation prompt here
  console.log("\n⏳ Starting distribution in 3 seconds...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Execute distribution
  const results: DistributionResult = {
    distributionId: latestFile.replace('weekly-distribution-', '').replace('.json', ''),
    totalRecipients: distributionData.recipients.length,
    totalAmountDistributed: "0",
    successfulTransfers: 0,
    failedTransfers: 0,
    gasUsed: "0",
    results: [],
  };

  let totalGasUsed = BigInt(0);
  let totalDistributed = BigInt(0);

  console.log("\n💸 Executing transfers...");
  console.log("=" .repeat(50));

  for (let i = 0; i < distributionData.recipients.length; i++) {
    const recipient = distributionData.recipients[i];
    const amount = ethers.parseEther(recipient.amount);
    
    console.log(`\n[${i + 1}/${distributionData.recipients.length}] ${recipient.address}`);
    console.log(`  Amount: ${recipient.amount} LUB`);
    console.log(`  Events: ${recipient.eventCount}`);

    try {
      // Check recipient's current balance
      const recipientBalanceBefore = await lubToken.balanceOf(recipient.address);
      console.log(`  Balance Before: ${ethers.formatEther(recipientBalanceBefore)} LUB`);

      // Execute transfer
      console.log("  ⏳ Sending tokens...");
      const tx = await lubToken.transfer(recipient.address, amount);
      console.log(`  Transaction: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`  ✅ Confirmed in block: ${receipt!.blockNumber}`);

      // Verify transfer
      const recipientBalanceAfter = await lubToken.balanceOf(recipient.address);
      const transferred = recipientBalanceAfter - recipientBalanceBefore;
      
      if (transferred === amount) {
        console.log(`  ✅ Transfer verified: ${ethers.formatEther(transferred)} LUB`);
        results.successfulTransfers++;
        totalDistributed += amount;
        totalGasUsed += receipt!.gasUsed;

        results.results.push({
          recipient: recipient.address,
          amount: recipient.amount,
          success: true,
          txHash: tx.hash,
        });
      } else {
        throw new Error(`Transfer amount mismatch: expected ${ethers.formatEther(amount)}, got ${ethers.formatEther(transferred)}`);
      }

    } catch (error) {
      console.log(`  ❌ Transfer failed: ${error}`);
      results.failedTransfers++;
      
      results.results.push({
        recipient: recipient.address,
        amount: recipient.amount,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Small delay between transfers to avoid rate limiting
    if (i < distributionData.recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Final summary
  results.totalAmountDistributed = ethers.formatEther(totalDistributed);
  results.gasUsed = totalGasUsed.toString();

  console.log("\n🎉 Distribution Complete!");
  console.log("=" .repeat(50));
  console.log(`Successful Transfers: ${results.successfulTransfers}/${results.totalRecipients}`);
  console.log(`Failed Transfers: ${results.failedTransfers}`);
  console.log(`Total Distributed: ${results.totalAmountDistributed} LUB`);
  console.log(`Total Gas Used: ${totalGasUsed.toString()}`);

  // Save distribution results
  const resultsFile = path.join(distributionsDir, `distribution-results-${results.distributionId}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved: ${resultsFile}`);

  // Check final deployer balance
  const finalBalance = await lubToken.balanceOf(deployer.address);
  console.log(`\nFinal Deployer Balance: ${ethers.formatEther(finalBalance)} LUB`);

  if (results.failedTransfers > 0) {
    console.log("\n⚠️  Some transfers failed. Check the results file for details.");
    process.exit(1);
  }

  return results;
}

// Handle execution
main()
  .then((result) => {
    console.log("\n✅ Weekly reward distribution completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Weekly reward distribution failed:");
    console.error(error);
    process.exit(1);
  });

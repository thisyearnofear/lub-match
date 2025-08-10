// Deploy PhotoPairLeaderboard with LUB token integration
// Run with: npx hardhat run scripts/deployPhotoPairLeaderboard.ts --network arbitrum

import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🏆 Deploying PhotoPairLeaderboard with Tournament System...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.002")) {
    throw new Error("Insufficient ETH balance for deployment. Need at least 0.002 ETH for gas.");
  }
  
  // Get LUB token address from environment or use deployed address
  const lubTokenAddress = process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS;
  if (!lubTokenAddress) {
    throw new Error("LUB_TOKEN_ADDRESS environment variable not set");
  }
  
  console.log("Using LUB Token at:", lubTokenAddress);
  
  // Deploy PhotoPairLeaderboard
  console.log("\n📊 Deploying PhotoPairLeaderboard...");
  const PhotoPairLeaderboard = await ethers.getContractFactory("PhotoPairLeaderboard");
  const leaderboard = await PhotoPairLeaderboard.deploy(lubTokenAddress);
  
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  
  console.log("✅ PhotoPairLeaderboard deployed to:", leaderboardAddress);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  try {
    // Check if contract is properly initialized
    const lubToken = await leaderboard.lubToken();
    console.log("LUB Token address in contract:", lubToken);
    
    const submissionFee = await leaderboard.SUBMISSION_FEE();
    console.log("Submission fee:", ethers.formatEther(submissionFee), "LUB");
    
    const achievementReward = await leaderboard.ACHIEVEMENT_REWARD();
    console.log("Achievement reward:", ethers.formatEther(achievementReward), "LUB");
    
    const minInterval = await leaderboard.MIN_SUBMISSION_INTERVAL();
    console.log("Min submission interval:", Number(minInterval) / 3600, "hours");
    
    // Check if submissions are allowed
    const submissionAllowed = await leaderboard.isSubmissionAllowed();
    console.log("Submissions allowed:", submissionAllowed);
    
    // Get global stats (should be all zeros initially)
    const globalStats = await leaderboard.getGlobalStats();
    console.log("Initial global stats:", {
      totalPlayers: Number(globalStats.totalPlayers),
      totalSubmissions: Number(globalStats.totalSubs),
      totalLubDistributed: ethers.formatEther(globalStats.totalDistributed),
      activePlayers: Number(globalStats.activePlayers)
    });
    
    console.log("✅ Contract verification successful!");
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
    throw error;
  }
  
  // Set up LUB token authorization (if needed)
  console.log("\n🔗 Setting up LUB token integration...");
  
  try {
    // Connect to LUB token contract
    const LubToken = await ethers.getContractFactory("LubToken");
    const lubToken = LubToken.attach(lubTokenAddress);
    
    // Check if leaderboard is authorized to mint rewards
    const isAuthorizedMinter = await lubToken.authorizedMinters(leaderboardAddress);
    
    if (!isAuthorizedMinter) {
      console.log("Authorizing leaderboard contract to mint LUB rewards...");
      const authorizeTx = await lubToken.setAuthorizedMinter(leaderboardAddress, true);
      await authorizeTx.wait();
      console.log("✅ Leaderboard authorized to mint LUB rewards");
    } else {
      console.log("✅ Leaderboard already authorized to mint LUB rewards");
    }
    
  } catch (error) {
    console.warn("⚠️  Could not set up LUB token authorization:", error.message);
    console.log("You may need to manually authorize the leaderboard contract to mint LUB rewards");
  }
  
  // Create initial tournament (optional)
  console.log("\n🏆 Creating initial tournament...");
  
  try {
    const tournamentName = "Launch Week Championship";
    const duration = 7 * 24 * 60 * 60; // 7 days
    const entryFee = ethers.parseEther("50"); // 50 LUB
    const maxParticipants = 100;
    
    const createTournamentTx = await leaderboard.createTournament(
      tournamentName,
      duration,
      entryFee,
      maxParticipants
    );
    
    await createTournamentTx.wait();
    console.log("✅ Initial tournament created:", tournamentName);
    
    // Get tournament details
    const tournament = await leaderboard.getTournament(1);
    console.log("Tournament details:", {
      id: Number(tournament.id),
      name: tournament.name,
      startTime: new Date(Number(tournament.startTime) * 1000).toISOString(),
      endTime: new Date(Number(tournament.endTime) * 1000).toISOString(),
      entryFee: ethers.formatEther(tournament.entryFee) + " LUB",
      maxParticipants: Number(tournament.maxParticipants)
    });
    
  } catch (error) {
    console.warn("⚠️  Could not create initial tournament:", error.message);
    console.log("You can create tournaments manually later using the createTournament function");
  }
  
  // Summary
  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("PhotoPairLeaderboard:", leaderboardAddress);
  console.log("LUB Token:", lubTokenAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("Gas used: ~0.002 ETH");
  
  console.log("\n🔧 Next Steps:");
  console.log("1. Update .env.local with:");
  console.log(`   NEXT_PUBLIC_PHOTO_PAIR_LEADERBOARD_ADDRESS=${leaderboardAddress}`);
  console.log("2. Verify contract on Arbiscan:");
  console.log(`   npx hardhat verify --network arbitrum ${leaderboardAddress} "${lubTokenAddress}"`);
  console.log("3. Test leaderboard functionality in the app");
  console.log("4. Create additional tournaments as needed");
  
  console.log("\n💡 Features Available:");
  console.log("- Global score submissions (10 LUB fee)");
  console.log("- Achievement system (25 LUB rewards)");
  console.log("- Tournament system with prize pools");
  console.log("- Rate limiting (1 hour between submissions)");
  console.log("- Abuse prevention and quality thresholds");
  
  console.log("\n🎉 PhotoPairLeaderboard deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

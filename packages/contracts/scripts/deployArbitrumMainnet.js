// Deploy LUB Token and Heart NFT contracts to Arbitrum Mainnet
// Run with: npx hardhat run scripts/deployArbitrumMainnet.js --network arbitrum

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying to Arbitrum Mainnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.002")) {
    throw new Error(
      "Insufficient ETH balance for deployment. Need at least 0.002 ETH for gas on Arbitrum."
    );
  }

  // Deploy LUB Token first
  console.log("\n📄 Deploying LUB Token...");
  const LubToken = await ethers.getContractFactory("LubToken");

  // LubToken has fixed initial supply in constructor
  const lubToken = await LubToken.deploy();
  await lubToken.waitForDeployment();

  const lubTokenAddress = await lubToken.getAddress();
  console.log("✅ LUB Token deployed to:", lubTokenAddress);

  // Verify initial supply
  const totalSupply = await lubToken.totalSupply();
  console.log("Total LUB supply:", ethers.formatEther(totalSupply));

  // Deploy Heart NFT contract
  console.log("\n💎 Deploying Heart NFT...");
  const HeartNFT = await ethers.getContractFactory("HeartNFT");

  // Constructor parameters for Heart NFT
  const heartNFT = await HeartNFT.deploy(lubTokenAddress);
  await heartNFT.waitForDeployment();

  const heartNFTAddress = await heartNFT.getAddress();
  console.log("✅ Heart NFT deployed to:", heartNFTAddress);

  // Set up initial configuration
  console.log("\n⚙️ Setting up initial configuration...");

  // Set NFT mint price (0.001 ETH)
  const mintPrice = ethers.parseEther("0.001");
  await heartNFT.setMintPrice(mintPrice);
  console.log(
    "✅ NFT mint price set to:",
    ethers.formatEther(mintPrice),
    "ETH"
  );

  // LUB discount logic is built into the contracts
  console.log("✅ LUB discount logic is built into the contracts");

  // Transfer some LUB to deployer for testing
  const testAmount = ethers.parseEther("1000"); // 1000 LUB for testing
  await lubToken.transfer(deployer.address, testAmount);
  console.log(
    "✅ Transferred",
    ethers.formatEther(testAmount),
    "LUB to deployer for testing"
  );

  // Display deployment summary
  console.log("\n🎉 Deployment Complete!");
  console.log("=====================================");
  console.log("Network: Arbitrum Mainnet");
  console.log("LUB Token:", lubTokenAddress);
  console.log("Heart NFT:", heartNFTAddress);
  console.log("Deployer:", deployer.address);
  console.log("=====================================");

  // Environment variables for frontend
  console.log("\n📝 Add these to your .env.local:");
  console.log(`NEXT_PUBLIC_LUB_TOKEN_ADDRESS=${lubTokenAddress}`);
  console.log(`NEXT_PUBLIC_HEART_NFT_ADDRESS=${heartNFTAddress}`);
  console.log(`NEXT_PUBLIC_ENABLE_ONCHAIN=true`);
  console.log(`NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS=true`);
  console.log(`NEXT_PUBLIC_ENABLE_NFT_MINTING=true`);
  console.log(`NEXT_PUBLIC_ENABLE_SOCIAL_EARNING=true`);

  // Verification commands
  console.log("\n🔍 Verify contracts with:");
  console.log(`npx hardhat verify --network arbitrum ${lubTokenAddress}`);
  console.log(
    `npx hardhat verify --network arbitrum ${heartNFTAddress} "${lubTokenAddress}"`
  );

  // Next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Add the environment variables above to .env.local");
  console.log("2. Verify the contracts on Arbiscan");
  console.log("3. Test the integration on your frontend");
  console.log("4. Consider setting up a multisig for contract ownership");

  return {
    lubToken: lubTokenAddress,
    heartNFT: heartNFTAddress,
    deployer: deployer.address,
  };
}

// Handle deployment
main()
  .then((result) => {
    console.log("\n✅ Deployment successful!");
    console.log("Contract addresses:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

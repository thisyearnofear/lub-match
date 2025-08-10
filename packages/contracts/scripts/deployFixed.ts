// Deploy Fixed LUB Token and Heart NFT contracts
// Run with: npx hardhat run scripts/deployFixed.ts --network arbitrum

import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🔧 Deploying Fixed LUB Token and Heart NFT contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.002")) {
    throw new Error("Insufficient ETH balance for deployment. Need at least 0.002 ETH for gas.");
  }
  
  // Deploy Fixed LUB Token
  console.log("\n🪙 Deploying Fixed LUB Token...");
  const LubToken = await ethers.getContractFactory("LubToken");
  const lubToken = await LubToken.deploy();
  await lubToken.waitForDeployment();
  
  const lubTokenAddress = await lubToken.getAddress();
  console.log("✅ Fixed LUB Token deployed to:", lubTokenAddress);
  
  // Deploy Fixed Heart NFT
  console.log("\n💎 Deploying Fixed Heart NFT...");
  const HeartNFT = await ethers.getContractFactory("HeartNFT");
  const heartNFT = await HeartNFT.deploy(lubTokenAddress);
  await heartNFT.waitForDeployment();
  
  const heartNFTAddress = await heartNFT.getAddress();
  console.log("✅ Fixed Heart NFT deployed to:", heartNFTAddress);
  
  // Set NFT mint price (0.001 ETH)
  const mintPrice = ethers.parseEther("0.001");
  await heartNFT.setMintPrice(mintPrice);
  console.log("✅ NFT mint price set to:", ethers.formatEther(mintPrice), "ETH");
  
  // Authorize Heart NFT in LUB Token
  console.log("\n🔐 Setting up LUB Token authorizations...");
  
  const tx1 = await lubToken.setAuthorizedSpender(heartNFTAddress, true);
  await tx1.wait();
  console.log("✅ Heart NFT authorized as LUB spender");
  
  const tx2 = await lubToken.setAuthorizedMinter(heartNFTAddress, true);
  await tx2.wait();
  console.log("✅ Heart NFT authorized as LUB minter");
  
  // Test all pricing options
  console.log("\n💰 Testing All Pricing Options...");
  
  // Regular pricing
  const regularPrice = await heartNFT.mintPriceETH();
  console.log("Regular Price:", ethers.formatEther(regularPrice), "ETH");
  
  // Discount pricing
  const [discountEthPrice, discountLubCost] = await heartNFT.getMintPrice(true);
  console.log("Discount Price:", ethers.formatEther(discountEthPrice), "ETH +", ethers.formatEther(discountLubCost), "LUB");
  
  // Full LUB pricing
  const fullLubCost = await heartNFT.getFullLubMintPrice();
  console.log("Full LUB Price:", ethers.formatEther(fullLubCost), "LUB");
  
  // Verify exchange rate
  const exchangeRate = await lubToken.getLubPerEthRate();
  console.log("LUB/ETH Exchange Rate:", exchangeRate.toString(), "LUB per ETH");
  
  // Calculate savings
  const discountSavings = regularPrice - discountEthPrice;
  const fullLubSavings = regularPrice;
  
  console.log("\n📊 Savings Analysis:");
  console.log("50% Discount Savings:", ethers.formatEther(discountSavings), "ETH");
  console.log("Full LUB Savings:", ethers.formatEther(fullLubSavings), "ETH (100% off!)");
  
  console.log("\n🎉 Fixed Contracts Deployment Complete!");
  console.log("=====================================");
  console.log("Network: Arbitrum Mainnet");
  console.log("Fixed LUB Token:", lubTokenAddress);
  console.log("Fixed Heart NFT:", heartNFTAddress);
  console.log("=====================================");
  
  console.log("\n💰 Pricing Options:");
  console.log("1. Regular:", ethers.formatEther(regularPrice), "ETH");
  console.log("2. 50% Discount:", ethers.formatEther(discountEthPrice), "ETH +", ethers.formatEther(discountLubCost), "LUB");
  console.log("3. Full LUB:", ethers.formatEther(fullLubCost), "LUB (0 ETH!)");
  
  console.log("\n📝 Update these in your .env.local:");
  console.log(`NEXT_PUBLIC_LUB_TOKEN_ADDRESS=${lubTokenAddress}`);
  console.log(`NEXT_PUBLIC_HEART_NFT_ADDRESS=${heartNFTAddress}`);
  
  console.log("\n🔍 Verify contracts with:");
  console.log(`npx hardhat verify --network arbitrum ${lubTokenAddress}`);
  console.log(`npx hardhat verify --network arbitrum ${heartNFTAddress} "${lubTokenAddress}"`);
  
  console.log("\n✨ Bug Fixes in this deployment:");
  console.log("• Fixed spendForMintDiscount to check user balance instead of contract balance");
  console.log("• Heart NFT now passes user address to LUB token for proper balance checks");
  console.log("• LUB token burns from user's balance, not contract's balance");
  console.log("• Approval system now works correctly with user's LUB tokens");
  
  return {
    lubToken: lubTokenAddress,
    heartNFT: heartNFTAddress,
    regularPrice: ethers.formatEther(regularPrice),
    discountPrice: `${ethers.formatEther(discountEthPrice)} ETH + ${ethers.formatEther(discountLubCost)} LUB`,
    fullLubPrice: `${ethers.formatEther(fullLubCost)} LUB`,
    exchangeRate: exchangeRate.toString(),
  };
}

// Handle execution
main()
  .then((result) => {
    console.log("\n✅ Fixed contracts deployment successful!");
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fixed contracts deployment failed:");
    console.error(error);
    process.exit(1);
  });

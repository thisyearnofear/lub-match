// Deploy Heart NFT V3 with full LUB minting support
// Run with: npx hardhat run scripts/deployHeartNFTV3.ts --network arbitrum

import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("💎 Deploying Heart NFT V3 with Full LUB Minting...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.002")) {
    throw new Error("Insufficient ETH balance for deployment. Need at least 0.002 ETH for gas.");
  }
  
  // Contract addresses
  const lubTokenV2Address = "0xEC3Fd6325E2E05dBed1a3bF17FDDB20414446083";
  
  console.log("Using LUB Token V2:", lubTokenV2Address);
  
  // Deploy Heart NFT V3
  console.log("\n💎 Deploying Heart NFT V3...");
  const HeartNFT = await ethers.getContractFactory("HeartNFT");
  const heartNFT = await HeartNFT.deploy(lubTokenV2Address);
  await heartNFT.waitForDeployment();
  
  const heartNFTAddress = await heartNFT.getAddress();
  console.log("✅ Heart NFT V3 deployed to:", heartNFTAddress);
  
  // Set NFT mint price (0.001 ETH)
  const mintPrice = ethers.parseEther("0.001");
  await heartNFT.setMintPrice(mintPrice);
  console.log("✅ NFT mint price set to:", ethers.formatEther(mintPrice), "ETH");
  
  // Authorize Heart NFT V3 in LUB Token V2
  console.log("\n🔐 Setting up LUB Token V2 authorizations...");
  const LubToken = await ethers.getContractFactory("LubToken");
  const lubToken = LubToken.attach(lubTokenV2Address);
  
  const tx1 = await lubToken.setAuthorizedSpender(heartNFTAddress, true);
  await tx1.wait();
  console.log("✅ Heart NFT V3 authorized as LUB spender");
  
  const tx2 = await lubToken.setAuthorizedMinter(heartNFTAddress, true);
  await tx2.wait();
  console.log("✅ Heart NFT V3 authorized as LUB minter");
  
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
  
  console.log("\n🎉 Heart NFT V3 Deployment Complete!");
  console.log("=====================================");
  console.log("Network: Arbitrum Mainnet");
  console.log("LUB Token V2:", lubTokenV2Address);
  console.log("Heart NFT V3:", heartNFTAddress);
  console.log("=====================================");
  
  console.log("\n💰 Pricing Options:");
  console.log("1. Regular:", ethers.formatEther(regularPrice), "ETH");
  console.log("2. 50% Discount:", ethers.formatEther(discountEthPrice), "ETH +", ethers.formatEther(discountLubCost), "LUB");
  console.log("3. Full LUB:", ethers.formatEther(fullLubCost), "LUB (0 ETH!)");
  
  console.log("\n📝 Update these in your .env.local:");
  console.log(`NEXT_PUBLIC_HEART_NFT_ADDRESS=${heartNFTAddress}`);
  
  console.log("\n🔍 Verify contracts with:");
  console.log(`npx hardhat verify --network arbitrum ${heartNFTAddress} "${lubTokenV2Address}"`);
  
  console.log("\n✨ New Features in V3:");
  console.log("• Full LUB minting (0 ETH required!)");
  console.log("• 50% ETH + LUB discount option");
  console.log("• Regular ETH-only option");
  console.log("• Enhanced error handling");
  console.log("• Fixed user counting issues");
  
  return {
    heartNFTV3: heartNFTAddress,
    lubTokenV2: lubTokenV2Address,
    regularPrice: ethers.formatEther(regularPrice),
    discountPrice: `${ethers.formatEther(discountEthPrice)} ETH + ${ethers.formatEther(discountLubCost)} LUB`,
    fullLubPrice: `${ethers.formatEther(fullLubCost)} LUB`,
    exchangeRate: exchangeRate.toString(),
  };
}

// Handle execution
main()
  .then((result) => {
    console.log("\n✅ Heart NFT V3 deployment successful!");
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Heart NFT V3 deployment failed:");
    console.error(error);
    process.exit(1);
  });

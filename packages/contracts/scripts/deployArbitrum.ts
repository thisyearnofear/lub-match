// npx hardhat run scripts/deployArbitrum.ts --network arbitrumSepolia

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Lub Token and Heart NFT contracts to Arbitrum Sepolia...");

  // Deploy LUB Token first
  console.log("📝 Deploying LUB Token...");
  const LubToken = await ethers.getContractFactory("LubToken");
  const lubToken = await LubToken.deploy();
  await lubToken.deployed();
  console.log("✅ LUB Token deployed to:", lubToken.address);

  // Deploy Heart NFT with LUB Token address
  console.log("💎 Deploying Heart NFT...");
  const HeartNFT = await ethers.getContractFactory("HeartNFT");
  const heartNFT = await HeartNFT.deploy(lubToken.address);
  await heartNFT.deployed();
  console.log("✅ Heart NFT deployed to:", heartNFT.address);

  // Set up permissions
  console.log("🔧 Setting up permissions...");
  
  // Allow Heart NFT contract to spend LUB for discounts
  await lubToken.setAuthorizedSpender(heartNFT.address, true);
  console.log("✅ Heart NFT authorized to spend LUB for discounts");

  // For demo purposes, mint some LUB to deployer
  const [deployer] = await ethers.getSigners();
  console.log("🎁 Minting demo LUB tokens to deployer:", deployer.address);
  
  // The constructor already mints 1M LUB to deployer, so we're good

  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("LUB Token:", lubToken.address);
  console.log("Heart NFT:", heartNFT.address);
  console.log("Deployer:", deployer.address);
  console.log("\n📋 Environment Variables to add:");
  console.log(`NEXT_PUBLIC_LUB_TOKEN_ADDRESS=${lubToken.address}`);
  console.log(`NEXT_PUBLIC_HEART_NFT_ADDRESS=${heartNFT.address}`);
  
  console.log("\n🔗 Verify contracts with:");
  console.log(`npx hardhat verify --network arbitrumSepolia ${lubToken.address}`);
  console.log(`npx hardhat verify --network arbitrumSepolia ${heartNFT.address} ${lubToken.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
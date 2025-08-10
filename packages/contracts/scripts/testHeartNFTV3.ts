// Test Heart NFT V3 contract functions
// Run with: npx hardhat run scripts/testHeartNFTV3.ts --network arbitrum

import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🔍 Testing Heart NFT V3 Contract...");
  
  const heartNFTAddress = "0x5b8fbC567089a3C5424bFFa8911AFa00C6a87836";
  
  console.log("Heart NFT V3 Address:", heartNFTAddress);
  
  // Get contract instance
  const HeartNFT = await ethers.getContractFactory("HeartNFT");
  const heartNFT = HeartNFT.attach(heartNFTAddress);
  
  try {
    // Test basic functions
    console.log("\n📊 Testing Basic Functions:");
    
    // Test totalSupply (from ERC721Enumerable)
    try {
      const totalSupply = await heartNFT.totalSupply();
      console.log("✅ Total Supply:", totalSupply.toString());
    } catch (e) {
      console.log("❌ Total Supply Error:", e.message);
    }
    
    // Test collectionStats (public variable)
    try {
      const stats = await heartNFT.collectionStats();
      console.log("✅ Collection Stats:", {
        totalCustomHearts: stats[0].toString(),
        totalDemoHearts: stats[1].toString(),
        totalVerifiedHearts: stats[2].toString(),
        totalHighInfluencerHearts: stats[3].toString(),
        totalCommunityHearts: stats[4].toString(),
      });
    } catch (e) {
      console.log("❌ Collection Stats Error:", e.message);
    }
    
    // Test pricing functions
    console.log("\n💰 Testing Pricing Functions:");
    
    try {
      const [ethPrice, lubCost] = await heartNFT.getMintPrice(false);
      console.log("✅ Regular Price:", ethers.formatEther(ethPrice), "ETH");
    } catch (e) {
      console.log("❌ Regular Price Error:", e.message);
    }
    
    try {
      const [discountEthPrice, discountLubCost] = await heartNFT.getMintPrice(true);
      console.log("✅ Discount Price:", ethers.formatEther(discountEthPrice), "ETH +", ethers.formatEther(discountLubCost), "LUB");
    } catch (e) {
      console.log("❌ Discount Price Error:", e.message);
    }
    
    try {
      const fullLubCost = await heartNFT.getFullLubMintPrice();
      console.log("✅ Full LUB Price:", ethers.formatEther(fullLubCost), "LUB");
    } catch (e) {
      console.log("❌ Full LUB Price Error:", e.message);
    }
    
    // Test view functions
    console.log("\n🔍 Testing View Functions:");
    
    try {
      const canMint = await heartNFT.canMintGame("test-hash-123");
      console.log("✅ Can Mint Test Game:", canMint);
    } catch (e) {
      console.log("❌ Can Mint Error:", e.message);
    }
    
    // Test contract info
    console.log("\n📋 Contract Information:");
    
    try {
      const name = await heartNFT.name();
      console.log("✅ Contract Name:", name);
    } catch (e) {
      console.log("❌ Name Error:", e.message);
    }
    
    try {
      const symbol = await heartNFT.symbol();
      console.log("✅ Contract Symbol:", symbol);
    } catch (e) {
      console.log("❌ Symbol Error:", e.message);
    }
    
    try {
      const owner = await heartNFT.owner();
      console.log("✅ Contract Owner:", owner);
    } catch (e) {
      console.log("❌ Owner Error:", e.message);
    }
    
  } catch (error) {
    console.error("❌ Contract Test Failed:", error);
  }
  
  console.log("\n🎉 Heart NFT V3 Contract Test Complete!");
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

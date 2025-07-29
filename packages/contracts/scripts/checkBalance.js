// Check deployer balance and network connectivity
// Run with: npx hardhat run scripts/checkBalance.js --network arbitrum

const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking deployment readiness...");

  // Check if we have environment variables
  console.log("PRIVATE_KEY set:", !!process.env.PRIVATE_KEY);
  console.log("ARBITRUM_RPC set:", !!process.env.ARBITRUM_RPC);

  const signers = await ethers.getSigners();
  console.log("Number of signers:", signers.length);

  if (signers.length === 0) {
    throw new Error(
      "No signers available. Please check your PRIVATE_KEY in .env.local"
    );
  }

  const [deployer] = signers;
  console.log("Deployer address:", deployer.address);

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  if (network.chainId !== 42161n) {
    console.warn(
      "⚠️  Warning: Not connected to Arbitrum Mainnet (Chain ID: 42161)"
    );
    console.log("Current Chain ID:", network.chainId);
  } else {
    console.log("✅ Connected to Arbitrum Mainnet");
  }

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceEth = ethers.formatEther(balance);
  console.log("ETH Balance:", balanceEth);

  // Check if sufficient for deployment (Arbitrum has very low gas costs)
  const minRequired = ethers.parseEther("0.002");
  if (balance < minRequired) {
    console.error("❌ Insufficient ETH balance for deployment");
    console.log("Required:", ethers.formatEther(minRequired), "ETH");
    console.log("Current:", balanceEth, "ETH");
    console.log(
      "Needed:",
      ethers.formatEther(minRequired - balance),
      "ETH more"
    );
    process.exit(1);
  } else {
    console.log("✅ Sufficient ETH balance for deployment");
  }

  // Estimate gas costs
  console.log("\n💰 Estimated deployment costs:");
  console.log("LUB Token deployment: ~0.003 ETH");
  console.log("Heart NFT deployment: ~0.004 ETH");
  console.log("Configuration setup: ~0.001 ETH");
  console.log("Total estimated: ~0.008 ETH");
  console.log("Your balance:", balanceEth, "ETH");

  // Check gas price
  const gasPrice = await ethers.provider.getFeeData();
  console.log("\n⛽ Current gas prices:");
  if (gasPrice.gasPrice) {
    console.log(
      "Gas Price:",
      ethers.formatUnits(gasPrice.gasPrice, "gwei"),
      "gwei"
    );
  }
  if (gasPrice.maxFeePerGas) {
    console.log(
      "Max Fee:",
      ethers.formatUnits(gasPrice.maxFeePerGas, "gwei"),
      "gwei"
    );
  }

  console.log("\n🚀 Ready for deployment!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

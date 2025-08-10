// Send LUB tokens to specified address
// Run with: npx hardhat run scripts/sendLub.ts --network arbitrum

import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("💸 Sending LUB Tokens...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Sending from account:", deployer.address);
  
  // Contract address and recipient
  const lubTokenAddress = "0x5eb4dAF1637620aEC4244D6F95AA8FF65fc2B5F0";
  const recipientAddress = "0x55A5705453Ee82c742274154136Fce8149597058";
  const amountToSend = ethers.parseEther("1000"); // 1000 LUB
  
  console.log("LUB Token Address:", lubTokenAddress);
  console.log("Recipient Address:", recipientAddress);
  console.log("Amount to Send:", ethers.formatEther(amountToSend), "LUB");
  
  // Get contract instance
  const LubToken = await ethers.getContractFactory("LubToken");
  const lubToken = LubToken.attach(lubTokenAddress);
  
  // Check deployer's balance
  const deployerBalance = await lubToken.balanceOf(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(deployerBalance), "LUB");
  
  if (deployerBalance < amountToSend) {
    throw new Error(`Insufficient balance. Need ${ethers.formatEther(amountToSend)} LUB, have ${ethers.formatEther(deployerBalance)} LUB`);
  }
  
  // Check recipient's current balance
  const recipientBalanceBefore = await lubToken.balanceOf(recipientAddress);
  console.log("Recipient Balance Before:", ethers.formatEther(recipientBalanceBefore), "LUB");
  
  // Send the tokens
  console.log("\n💸 Sending tokens...");
  const tx = await lubToken.transfer(recipientAddress, amountToSend);
  console.log("Transaction hash:", tx.hash);
  
  // Wait for confirmation
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  
  // Check balances after transfer
  const deployerBalanceAfter = await lubToken.balanceOf(deployer.address);
  const recipientBalanceAfter = await lubToken.balanceOf(recipientAddress);
  
  console.log("\n📊 Final Balances:");
  console.log("Deployer Balance After:", ethers.formatEther(deployerBalanceAfter), "LUB");
  console.log("Recipient Balance After:", ethers.formatEther(recipientBalanceAfter), "LUB");
  
  // Verify the transfer
  const transferAmount = recipientBalanceAfter - recipientBalanceBefore;
  console.log("Transfer Amount Verified:", ethers.formatEther(transferAmount), "LUB");
  
  if (transferAmount === amountToSend) {
    console.log("✅ Transfer successful!");
  } else {
    console.log("❌ Transfer amount mismatch!");
  }
  
  console.log("\n🎉 LUB Token Transfer Complete!");
  console.log("=====================================");
  console.log("From:", deployer.address);
  console.log("To:", recipientAddress);
  console.log("Amount:", ethers.formatEther(amountToSend), "LUB");
  console.log("Transaction:", `https://arbiscan.io/tx/${tx.hash}`);
  console.log("=====================================");
  
  return {
    from: deployer.address,
    to: recipientAddress,
    amount: ethers.formatEther(amountToSend),
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    deployerBalanceAfter: ethers.formatEther(deployerBalanceAfter),
    recipientBalanceAfter: ethers.formatEther(recipientBalanceAfter),
  };
}

// Handle execution
main()
  .then((result) => {
    console.log("\n✅ LUB token transfer successful!");
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ LUB token transfer failed:");
    console.error(error);
    process.exit(1);
  });

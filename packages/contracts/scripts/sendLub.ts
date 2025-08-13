// Send LUB tokens to specified address
// Run with: npx hardhat run scripts/sendLub.ts --network arbitrum

import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("💸 Sending LUB Tokens...");

  const [deployer] = await ethers.getSigners();
  console.log("Sending from account:", deployer.address);

  // Contract address and recipients
  const lubTokenAddress = "0x5eb4dAF1637620aEC4244D6F95AA8FF65fc2B5F0";
  const recipients = [
    "0xc0401272C353200Da1C6EEf2D100a108FDa06025",
    "0x5499247Ff3157A1ab95ad3cD23150edCf44350d0"
  ];
  const amountToSend = ethers.parseEther("1000"); // 1000 LUB per recipient

  console.log("LUB Token Address:", lubTokenAddress);
  console.log("Recipients:", recipients);
  console.log("Amount to Send per recipient:", ethers.formatEther(amountToSend), "LUB");
  console.log("Total Amount:", ethers.formatEther(amountToSend * BigInt(recipients.length)), "LUB");

  // Get contract instance
  const LubToken = await ethers.getContractFactory("LubToken");
  const lubToken = LubToken.attach(lubTokenAddress);

  // Check deployer's balance
  const deployerBalance = await lubToken.balanceOf(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(deployerBalance), "LUB");

  const totalNeeded = amountToSend * BigInt(recipients.length);
  if (deployerBalance < totalNeeded) {
    throw new Error(`Insufficient balance. Need ${ethers.formatEther(totalNeeded)} LUB, have ${ethers.formatEther(deployerBalance)} LUB`);
  }

  const results = [];

  // Send to each recipient
  for (let i = 0; i < recipients.length; i++) {
    const recipientAddress = recipients[i];
    console.log(`\n💸 Sending to recipient ${i + 1}/${recipients.length}: ${recipientAddress}`);

    // Check recipient's current balance
    const recipientBalanceBefore = await lubToken.balanceOf(recipientAddress);
    console.log("Recipient Balance Before:", ethers.formatEther(recipientBalanceBefore), "LUB");

    // Send the tokens
    console.log("⏳ Sending tokens...");
    const tx = await lubToken.transfer(recipientAddress, amountToSend);
    console.log("Transaction hash:", tx.hash);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Check balances after transfer
    const recipientBalanceAfter = await lubToken.balanceOf(recipientAddress);
    console.log("Recipient Balance After:", ethers.formatEther(recipientBalanceAfter), "LUB");

    results.push({
      recipient: recipientAddress,
      amount: ethers.formatEther(amountToSend),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      balanceBefore: ethers.formatEther(recipientBalanceBefore),
      balanceAfter: ethers.formatEther(recipientBalanceAfter),
    });
  }

  // Final deployer balance
  const deployerBalanceAfter = await lubToken.balanceOf(deployer.address);
  
  console.log("\n📊 Final Balances:");
  console.log("Deployer Balance After:", ethers.formatEther(deployerBalanceAfter), "LUB");
  
  // Verify the transfer
  const transferAmount = recipientBalanceAfter - recipientBalanceBefore;
  console.log("Transfer Amount Verified:", ethers.formatEther(transferAmount), "LUB");
  
  if (transferAmount === amountToSend) {
    console.log("✅ Transfer successful!");
  } else {
    console.log("❌ Transfer amount mismatch!");
  }

  console.log("\n🎉 LUB Token Transfers Complete!");
  console.log("=====================================");
  console.log("From:", deployer.address);
  console.log("Total Recipients:", recipients.length);
  console.log("Amount per recipient:", ethers.formatEther(amountToSend), "LUB");
  console.log("Total Amount Sent:", ethers.formatEther(amountToSend * BigInt(recipients.length)), "LUB");
  console.log("Deployer Balance After:", ethers.formatEther(deployerBalanceAfter), "LUB");
  console.log("=====================================");

  results.forEach((result, index) => {
    console.log(`\nRecipient ${index + 1}:`);
    console.log("  Address:", result.recipient);
    console.log("  Amount:", result.amount, "LUB");
    console.log("  Transaction:", `https://arbiscan.io/tx/${result.txHash}`);
    console.log("  Balance Before:", result.balanceBefore, "LUB");
    console.log("  Balance After:", result.balanceAfter, "LUB");
  });

  return {
    from: deployer.address,
    totalRecipients: recipients.length,
    amountPerRecipient: ethers.formatEther(amountToSend),
    totalAmountSent: ethers.formatEther(amountToSend * BigInt(recipients.length)),
    deployerBalanceAfter: ethers.formatEther(deployerBalanceAfter),
    results
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

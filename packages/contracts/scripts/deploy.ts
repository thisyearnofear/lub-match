// npx hardhat run scripts/deploy.ts --network baseSepolia

import { ethers } from "hardhat";

async function main() {
  const Registry = await ethers.getContractFactory("MemoryGameRegistry");
  const registry = await Registry.deploy();
  await registry.deployed();
  console.log("MemoryGameRegistry deployed to:", registry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
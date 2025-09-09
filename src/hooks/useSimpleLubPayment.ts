"use client";

import { useCallback } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseAbi, parseEther, formatEther } from "viem";
import { arbitrum } from "viem/chains";
import { WEB3_CONFIG } from "@/config";

const HEART_NFT_ADDRESS = WEB3_CONFIG.contracts.heartNFT;
const LUB_TOKEN_ADDRESS = WEB3_CONFIG.contracts.lubToken;

const HEART_NFT_ABI = parseAbi([
  "function getMintPrice(bool useLubDiscount) view returns (uint256 ethPrice, uint256 lubCost)",
  "function getFullLubMintPrice() view returns (uint256 lubCost)",
]);

const LUB_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export interface LubPaymentOption {
  type: "eth" | "eth-lub" | "full-lub";
  ethCost: bigint;
  lubCost: bigint;
  canAfford: boolean;
  needsApproval: boolean;
  displayText: string;
}

export function useSimpleLubPayment() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Get LUB balance
  const { data: lubBalance = BigInt(0) } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Get current LUB allowance
  const { data: lubAllowance = BigInt(0) } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_ABI,
    functionName: "allowance",
    args: address && HEART_NFT_ADDRESS ? [address, HEART_NFT_ADDRESS] : undefined,
  });

  // Get ETH-only price
  const { data: ethOnlyPrice } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getMintPrice",
    args: [false],
  });

  // Get ETH+LUB discount price
  const { data: discountPrice } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getMintPrice",
    args: [true],
  });

  // Get full LUB price
  const { data: fullLubPrice } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getFullLubMintPrice",
  });

  // Calculate payment options
  const paymentOptions: LubPaymentOption[] = [
    // ETH only
    {
      type: "eth",
      ethCost: ethOnlyPrice?.[0] || parseEther("0.001"),
      lubCost: BigInt(0),
      canAfford: true, // Assume user has ETH (wallet connected)
      needsApproval: false,
      displayText: "ETH only",
    },
    // ETH + LUB discount
    {
      type: "eth-lub",
      ethCost: discountPrice?.[0] || parseEther("0.0005"),
      lubCost: discountPrice?.[1] || parseEther("500"),
      canAfford: lubBalance >= (discountPrice?.[1] || parseEther("500")),
      needsApproval: lubAllowance < (discountPrice?.[1] || parseEther("500")),
      displayText: "ETH + LUB (discount)",
    },
    // Full LUB
    {
      type: "full-lub",
      ethCost: BigInt(0),
      lubCost: fullLubPrice || parseEther("1000"),
      canAfford: lubBalance >= (fullLubPrice || parseEther("1000")),
      needsApproval: lubAllowance < (fullLubPrice || parseEther("1000")),
      displayText: "LUB only",
    },
  ];

  // Approve LUB spending
  const approveLub = useCallback(async (amount: bigint) => {
    if (!LUB_TOKEN_ADDRESS || !HEART_NFT_ADDRESS) {
      throw new Error("Contract addresses not configured");
    }

    console.log(`🔐 Approving ${formatEther(amount)} LUB for spending...`);
    
    const tx = await writeContractAsync({
      address: LUB_TOKEN_ADDRESS,
      abi: LUB_ABI,
      functionName: "approve",
      args: [HEART_NFT_ADDRESS, amount],
    });

    console.log(`✅ LUB approval transaction: ${tx}`);
    return tx;
  }, [writeContractAsync]);

  // Prepare payment (handle approval if needed)
  const preparePayment = useCallback(async (option: LubPaymentOption) => {
    if (!option.canAfford) {
      throw new Error(`Insufficient ${option.type.includes('lub') ? 'LUB' : 'ETH'} balance`);
    }

    if (option.needsApproval && option.lubCost > 0) {
      console.log(`💰 Preparing LUB payment: ${formatEther(option.lubCost)} LUB`);
      await approveLub(option.lubCost);
      console.log(`✅ LUB approved for ${option.displayText}`);
    }

    return {
      ethValue: option.ethCost,
      lubCost: option.lubCost,
      useLubDiscount: option.type === "eth-lub",
      useFullLub: option.type === "full-lub",
    };
  }, [approveLub]);

  return {
    paymentOptions,
    lubBalance,
    lubAllowance,
    preparePayment,
    approveLub,
  };
}

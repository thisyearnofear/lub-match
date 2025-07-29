"use client";

import React from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseAbi, formatEther } from "viem";
import { arbitrum } from "viem/chains";
import { WEB3_CONFIG } from "@/config";
import { useUserProgression } from "@/utils/userProgression";
import { pricingEngine, LubMode, EarningAction } from "@/utils/pricingEngine";

const LUB_TOKEN_ADDRESS = WEB3_CONFIG.contracts.lubToken;

const LUB_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function getCurrentGameCreationCost() view returns (uint256)",
  "function getDiscountedMintPrice(uint256 ethPrice) view returns (uint256 lubCost, uint256 discountedEthPrice)",
  "function spendForGameCreation()",
  "function spendForMintDiscount(uint256 lubAmount)",
  "function totalGamesCreated() view returns (uint256)",
  "event GameCreated(address indexed creator, uint256 costPaid)",
  "event MintDiscount(address indexed user, uint256 lubSpent, uint256 ethSaved)"
]);

export function useLubToken() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { progress, updateLubBalance, recordEvent } = useUserProgression();

  const enabled = !!LUB_TOKEN_ADDRESS && WEB3_CONFIG.features.lubTokenEnabled;

  // Read user's LUB balance with error handling
  const { data: balance = BigInt(0), error: balanceError } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address,
      retry: 3,
      retryDelay: 1000,
    }
  });

  // Log balance errors for debugging
  React.useEffect(() => {
    if (balanceError) {
      console.warn("LUB balance fetch error:", balanceError);
    }
  }, [balanceError]);

  // Update user progression when balance changes
  React.useEffect(() => {
    if (balance && balance !== progress.lubBalance) {
      updateLubBalance(balance);
    }
  }, [balance, progress.lubBalance, updateLubBalance]);

  // Pricing functions using our unified pricing engine
  const canCreateFarcasterLub = () => {
    const pricingState = {
      lubBalance: balance,
      farcasterLubsCreated: progress.farcasterLubsCreated,
      romanceLubsCreated: progress.romanceLubsCreated,
      totalLubsCreated: progress.totalLubsCreated,
      hasConnectedWallet: progress.hasConnectedWallet
    };
    return pricingEngine.canCreateFarcasterLub(pricingState);
  };

  const getRomanceLubCost = () => {
    const pricingState = {
      lubBalance: balance,
      farcasterLubsCreated: progress.farcasterLubsCreated,
      romanceLubsCreated: progress.romanceLubsCreated,
      totalLubsCreated: progress.totalLubsCreated,
      hasConnectedWallet: progress.hasConnectedWallet
    };
    return pricingEngine.getRomanceLubCost(pricingState);
  };

  const getNFTMintPricing = (useLubDiscount: boolean = false) => {
    return pricingEngine.getNFTMintPrice(useLubDiscount, balance);
  };

  // Spend LUB for game creation
  const spendForGameCreation = async () => {
    if (!LUB_TOKEN_ADDRESS) throw new Error("LUB token address not configured");

    return writeContractAsync({
      address: LUB_TOKEN_ADDRESS,
      abi: LUB_ABI,
      functionName: "spendForGameCreation",
      chainId: arbitrum.id
    });
  };

  // Spend LUB for mint discount
  const spendForMintDiscount = async (lubAmount: bigint) => {
    if (!LUB_TOKEN_ADDRESS) throw new Error("LUB token address not configured");

    return writeContractAsync({
      address: LUB_TOKEN_ADDRESS,
      abi: LUB_ABI,
      functionName: "spendForMintDiscount",
      args: [lubAmount],
      chainId: arbitrum.id
    });
  };

  // Earn LUB tokens for various actions
  const earnLub = async (action: EarningAction, amount?: bigint) => {
    try {
      const earning = pricingEngine.calculateEarning(action);
      const earnAmount = amount || earning.amount;

      // Record the earning event
      recordEvent({
        type: 'lub_earned',
        timestamp: new Date().toISOString(),
        data: { action, amount: earnAmount.toString() }
      });

      console.log(`Earned ${earning.amountFormatted} for ${earning.description}`);
      return earnAmount;
    } catch (error) {
      console.error("Error earning LUB:", error);
      throw error;
    }
  };

  // Helper functions
  const balanceFormatted = formatEther(balance);
  const holdRequirement = WEB3_CONFIG.pricing.farcasterHoldRequirement;
  const holdRequirementFormatted = formatEther(holdRequirement);

  return {
    // Contract state
    enabled,
    balance,
    balanceFormatted,
    holdRequirement,
    holdRequirementFormatted,

    // Pricing functions
    canCreateFarcasterLub,
    getRomanceLubCost,
    getNFTMintPricing,

    // Actions
    spendForGameCreation,
    spendForMintDiscount,
    earnLub,

    // User progression
    progress,

    // Loading state
    isPending
  };
}
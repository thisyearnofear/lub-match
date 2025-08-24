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
  "function getLubPerEthRate() view returns (uint256)",
  "function spendForGameCreation()",
  "function spendForMintDiscount(address user, uint256 lubAmount)",
  "function totalGamesCreated() view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event GameCreated(address indexed creator, uint256 costPaid)",
  "event MintDiscount(address indexed user, uint256 lubSpent, uint256 ethSaved)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]);

// LUB transaction history type
export interface LubHistoryItem {
  reason: string;
  amount: number; // positive for earn, negative for spend
  timestamp: string;
}

// Portfolio data interface
export interface PortfolioData {
  totalValue: bigint;
  totalEarned: bigint;
  totalSpent: bigint;
  gamesCreated: number;
  nftsMinted: number;
  referralEarnings: bigint;
  streakBonus: bigint;
  tier: string;
  nextTierProgress: number;
}

export function useLubToken() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { progress, updateLubBalance, recordEvent } = useUserProgression();

  const enabled = !!LUB_TOKEN_ADDRESS && WEB3_CONFIG.features.lubTokenEnabled;

  // --- LUB Transaction History (localStorage-backed) ---
  const [history, setHistory] = React.useState<LubHistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("lub_history");
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const addHistory = React.useCallback((item: LubHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 20); // keep last 20
      if (typeof window !== "undefined") {
        localStorage.setItem("lub_history", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // Read user's LUB balance with error handling
  const { data: balance = BigInt(0), error: balanceError, refetch: refetchBalance } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address,
      retry: 2, // Reduced retries
      retryDelay: 1000,
      staleTime: 30_000, // Cache for 30 seconds
      gcTime: 120_000, // Keep in cache for 2 minutes
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

  // NFT pricing is now handled by useNFTPricing hook for real-time contract data

  // Note: Exchange rate is now handled by useNFTPricing hook to avoid duplicate calls

  // Spend LUB for game creation
  const spendForGameCreation = async () => {
    if (!LUB_TOKEN_ADDRESS) throw new Error("LUB token address not configured");
    const tx = await writeContractAsync({
      address: LUB_TOKEN_ADDRESS,
      abi: LUB_ABI,
      functionName: "spendForGameCreation",
      chainId: arbitrum.id
    });
    addHistory({
      reason: "Game creation",
      amount: -1, // or actual amount spent if available
      timestamp: new Date().toISOString(),
    });
    return tx;
  };

  // Spend LUB for mint discount
  const spendForMintDiscount = async (user: string, lubAmount: bigint) => {
    if (!LUB_TOKEN_ADDRESS) throw new Error("LUB token address not configured");
    const tx = await writeContractAsync({
      address: LUB_TOKEN_ADDRESS,
      abi: LUB_ABI,
      functionName: "spendForMintDiscount",
      args: [user as `0x${string}`, lubAmount],
      chainId: arbitrum.id
    });
    addHistory({
      reason: "NFT mint discount",
      amount: -Number(lubAmount),
      timestamp: new Date().toISOString(),
    });
    return tx;
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

      addHistory({
        reason: earning.description || action,
        amount: Number(earnAmount),
        timestamp: new Date().toISOString(),
      });

      console.log(`Earned ${earning.amountFormatted} for ${earning.description}`);
      return earnAmount;
    } catch (error) {
      console.error("Error earning LUB:", error);
      throw error;
    }
  };

  // Portfolio data calculation
  const getPortfolioData = (): PortfolioData => {
    const totalSpent = history.reduce((sum, item) => {
      return sum + (item.amount < 0 ? Math.abs(item.amount) : 0);
    }, 0);
    
    const totalEarned = progress.totalLubEarned;
    const referralEarnings = BigInt(0); // Future: Calculate from referral events
    const streakBonus = BigInt(0); // Future: Calculate from streak events
    
    // Calculate next tier progress
    const tierThresholds = {
      'newcomer': 0,
      'engaged': 3,
      'web3-ready': 10,
      'power-user': 25
    };
    
    const currentThreshold = tierThresholds[progress.tier as keyof typeof tierThresholds] || 0;
    const nextTierKey = Object.keys(tierThresholds).find(tier => 
      tierThresholds[tier as keyof typeof tierThresholds] > currentThreshold
    );
    const nextThreshold = nextTierKey ? tierThresholds[nextTierKey as keyof typeof tierThresholds] : currentThreshold;
    
    const nextTierProgress = nextThreshold > currentThreshold 
      ? Math.min(100, (progress.gamesCompleted / nextThreshold) * 100)
      : 100;
    
    return {
      totalValue: balance,
      totalEarned,
      totalSpent: BigInt(Math.floor(totalSpent * 1e18)),
      gamesCreated: progress.totalLubsCreated,
      nftsMinted: progress.nftsMinted,
      referralEarnings,
      streakBonus,
      tier: progress.tier,
      nextTierProgress
    };
  };

  // Helper functions
  const balanceFormatted = formatEther(balance);
  const holdRequirement = WEB3_CONFIG.pricing.farcasterHoldRequirement;
  const holdRequirementFormatted = formatEther(holdRequirement);
  const portfolioData = getPortfolioData();

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
    // getNFTMintPricing removed - use useNFTPricing hook instead
    exchangeRate: BigInt(1000), // Default to 1000 LUB per ETH (real rate from useNFTPricing)

    // Actions
    spendForGameCreation,
    spendForMintDiscount,
    earnLub,
    refetchBalance,

    // User progression
    progress,

    // LUB transaction history
    history,

    // Portfolio data
    portfolioData,
    getPortfolioData,

    // Loading state
    isPending
  };
}
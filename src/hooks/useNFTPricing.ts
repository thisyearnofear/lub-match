"use client";

import { useReadContract } from "wagmi";
import { parseAbi, formatEther } from "viem";
import { arbitrum } from "viem/chains";
import { useLubToken } from "./useLubToken";

const HEART_NFT_ADDRESS = process.env.NEXT_PUBLIC_HEART_NFT_ADDRESS as `0x${string}`;
const LUB_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS as `0x${string}`;

const HEART_NFT_ABI = parseAbi([
  "function mintPriceETH() view returns (uint256)",
  "function getMintPrice(bool useLubDiscount) view returns (uint256 ethPrice, uint256 lubCost)",
  "function getFullLubMintPrice() view returns (uint256 lubCost)"
]);

const LUB_TOKEN_ABI = parseAbi([
  "function getDiscountedMintPrice(uint256 ethPrice) view returns (uint256 lubCost, uint256 discountedEthPrice)",
  "function getLubPerEthRate() view returns (uint256)"
]);

export interface NFTPricingData {
  // Base pricing
  basePriceETH: bigint;
  basePriceFormatted: string;
  
  // Regular mint (no discount)
  regularPrice: {
    ethCost: bigint;
    ethCostFormatted: string;
    lubCost: bigint;
    totalCostFormatted: string;
  };
  
  // Discounted mint (with LUB)
  discountedPrice: {
    ethCost: bigint;
    ethCostFormatted: string;
    lubCost: bigint;
    lubCostFormatted: string;
    totalCostFormatted: string;
    savingsETH: bigint;
    savingsFormatted: string;
    discountPercentage: number;
  };

  // Full LUB mint (no ETH)
  fullLubPrice: {
    lubCost: bigint;
    lubCostFormatted: string;
    totalCostFormatted: string;
    savingsETH: bigint;
    savingsFormatted: string;
    discountPercentage: number;
  };
  
  // User affordability
  canAffordRegular: boolean;
  canAffordDiscount: boolean;
  canAffordFullLub: boolean;
  
  // Exchange rate info
  exchangeRate: bigint;
  exchangeRateFormatted: string;
  
  // Loading states
  isLoading: boolean;
  error?: string;
}

export function useNFTPricing(): NFTPricingData {
  const { balance: lubBalance } = useLubToken();
  
  // Get base mint price from Heart NFT contract
  const { data: basePriceETH, isLoading: isLoadingBasePrice, error: basePriceError } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "mintPriceETH",
    chainId: arbitrum.id,
    query: {
      staleTime: 60_000, // Cache for 1 minute
      gcTime: 300_000, // Keep in cache for 5 minutes
    },
  });
  
  // Get exchange rate from LUB Token contract
  const { data: exchangeRate, isLoading: isLoadingRate, error: rateError } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_TOKEN_ABI,
    functionName: "getLubPerEthRate",
    chainId: arbitrum.id,
    query: {
      staleTime: 300_000, // Cache for 5 minutes (exchange rate changes rarely)
      gcTime: 600_000, // Keep in cache for 10 minutes
    },
  });
  
  // Get discounted pricing from LUB Token contract
  const { data: discountData, isLoading: isLoadingDiscount, error: discountError } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_TOKEN_ABI,
    functionName: "getDiscountedMintPrice",
    args: basePriceETH ? [basePriceETH] : undefined,
    chainId: arbitrum.id,
    query: {
      enabled: !!basePriceETH,
      staleTime: 60_000, // Cache for 1 minute
      gcTime: 300_000, // Keep in cache for 5 minutes
    },
  });
  
  // Verify with Heart NFT contract's getMintPrice function
  const { data: heartNFTPricing, isLoading: isLoadingHeartNFT, error: heartNFTError } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getMintPrice",
    args: [true], // with discount
    chainId: arbitrum.id,
    query: {
      staleTime: 60_000, // Cache for 1 minute
      gcTime: 300_000, // Keep in cache for 5 minutes
    },
  });

  // Get full LUB pricing
  const { data: fullLubCost, isLoading: isLoadingFullLub, error: fullLubError } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getFullLubMintPrice",
    chainId: arbitrum.id,
    query: {
      staleTime: 300_000, // Cache for 5 minutes (rarely changes)
      gcTime: 600_000, // Keep in cache for 10 minutes
    },
  });
  
  const isLoading = isLoadingBasePrice || isLoadingRate || isLoadingDiscount || isLoadingHeartNFT || isLoadingFullLub;
  const error = basePriceError || rateError || discountError || heartNFTError || fullLubError;
  
  // Default values for loading/error states
  const defaultBigInt = BigInt(0);
  const safeBasePriceETH = basePriceETH || defaultBigInt;
  const safeExchangeRate = exchangeRate || BigInt(1000);
  const safeLubBalance = lubBalance || defaultBigInt;
  
  // Calculate pricing data
  const basePriceFormatted = formatEther(safeBasePriceETH);
  const exchangeRateFormatted = `${safeExchangeRate.toString()} LUB per ETH`;
  
  // Regular pricing (no discount)
  const regularPrice = {
    ethCost: safeBasePriceETH,
    ethCostFormatted: `${basePriceFormatted} ETH`,
    lubCost: defaultBigInt,
    totalCostFormatted: `${basePriceFormatted} ETH`,
  };
  
  // Discounted pricing (with LUB)
  let discountedPrice = {
    ethCost: safeBasePriceETH,
    ethCostFormatted: basePriceFormatted,
    lubCost: defaultBigInt,
    lubCostFormatted: "0 LUB",
    totalCostFormatted: `${basePriceFormatted} ETH`,
    savingsETH: defaultBigInt,
    savingsFormatted: "0 ETH",
    discountPercentage: 0,
  };
  
  if (discountData && heartNFTPricing) {
    const [lubCost, discountedEthPrice] = discountData;
    const [heartNFTEthPrice, heartNFTLubCost] = heartNFTPricing;
    
    // Verify consistency between contracts
    const isConsistent = discountedEthPrice === heartNFTEthPrice && lubCost === heartNFTLubCost;
    
    if (isConsistent) {
      const savingsETH = safeBasePriceETH - discountedEthPrice;
      const discountPercentage = safeBasePriceETH > 0 
        ? Math.round((Number(savingsETH) / Number(safeBasePriceETH)) * 100)
        : 0;
      
      discountedPrice = {
        ethCost: discountedEthPrice,
        ethCostFormatted: `${formatEther(discountedEthPrice)} ETH`,
        lubCost,
        lubCostFormatted: `${formatEther(lubCost)} LUB`,
        totalCostFormatted: `${formatEther(discountedEthPrice)} ETH + ${formatEther(lubCost)} LUB`,
        savingsETH,
        savingsFormatted: `${formatEther(savingsETH)} ETH`,
        discountPercentage,
      };
    }
  }

  // Full LUB pricing
  let fullLubPrice = {
    lubCost: defaultBigInt,
    lubCostFormatted: "0 LUB",
    totalCostFormatted: "0 LUB",
    savingsETH: defaultBigInt,
    savingsFormatted: "0 ETH",
    discountPercentage: 0,
  };

  if (fullLubCost) {
    const savingsETH = safeBasePriceETH; // Save all ETH
    const discountPercentage = 100; // 100% ETH discount

    fullLubPrice = {
      lubCost: fullLubCost,
      lubCostFormatted: `${formatEther(fullLubCost)} LUB`,
      totalCostFormatted: `${formatEther(fullLubCost)} LUB`,
      savingsETH,
      savingsFormatted: `${formatEther(savingsETH)} ETH`,
      discountPercentage,
    };
  }

  // Affordability checks
  const canAffordRegular = true; // Assume user can afford ETH (we don't check ETH balance)
  const canAffordDiscount = safeLubBalance >= discountedPrice.lubCost;
  const canAffordFullLub = safeLubBalance >= fullLubPrice.lubCost;

  // Debug logging for LUB balance issues
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 LUB Balance Debug:", {
      safeLubBalance: safeLubBalance.toString(),
      lubCost: discountedPrice.lubCost.toString(),
      canAffordDiscount,
      isLoading,
    });
  }
  
  return {
    basePriceETH: safeBasePriceETH,
    basePriceFormatted,
    regularPrice,
    discountedPrice,
    fullLubPrice,
    canAffordRegular,
    canAffordDiscount,
    canAffordFullLub,
    exchangeRate: safeExchangeRate,
    exchangeRateFormatted,
    isLoading,
    error: error?.message,
  };
}

// Helper hook for simple pricing display
export function useSimpleNFTPricing() {
  const pricing = useNFTPricing();
  
  return {
    regularPrice: pricing.regularPrice.totalCostFormatted,
    discountPrice: pricing.discountedPrice.totalCostFormatted,
    savings: pricing.discountedPrice.savingsFormatted,
    canAffordDiscount: pricing.canAffordDiscount,
    discountPercentage: pricing.discountedPrice.discountPercentage,
    isLoading: pricing.isLoading,
  };
}

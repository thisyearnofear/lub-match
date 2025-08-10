"use client";

import React from "react";
import { useReadContract } from "wagmi";
import { parseAbi, formatEther, parseEther } from "viem";
import { arbitrum } from "viem/chains";
import { useLubToken } from "./useLubToken";

const HEART_NFT_ADDRESS = process.env.NEXT_PUBLIC_HEART_NFT_ADDRESS as `0x${string}`;
const LUB_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS as `0x${string}`;

const HEART_NFT_ABI = parseAbi([
  "function mintCompletedHeart((string[] imageHashes, uint8[] layout, string message, uint256 completedAt, address creator, address completer, string gameType, string metadataURI, string[] usernames, uint256[] userFollowers, bool[] userVerified) heartData, string gameHash, bool useLubDiscount) payable returns (uint256)",
  "function mintCompletedHeartWithLub((string[] imageHashes, uint8[] layout, string message, uint256 completedAt, address creator, address completer, string gameType, string metadataURI, string[] usernames, uint256[] userFollowers, bool[] userVerified) heartData, string gameHash) returns (uint256)",
  "function getMintPrice(bool useLubDiscount) view returns (uint256 ethPrice, uint256 lubCost)",
  "function getFullLubMintPrice() view returns (uint256 lubCost)",
  "function canMintGame(string gameHash) view returns (bool)"
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
  
  // Get base mint price from Heart NFT contract using getMintPrice(false) for regular price
  const { data: regularPriceData, isLoading: isLoadingBasePrice, error: basePriceError } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getMintPrice",
    args: [false], // false = no discount, get regular price
    chainId: arbitrum.id,
    query: {
      enabled: !!HEART_NFT_ADDRESS, // Only call if contract address exists
      staleTime: 60_000, // Cache for 1 minute
      gcTime: 300_000, // Keep in cache for 5 minutes
      retry: false, // Don't retry on contract reverts
    },
  });
  
  const basePriceETH = regularPriceData ? regularPriceData[0] : undefined;
  
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

  // Get full LUB pricing - with enhanced error handling for contract reverts
  const { data: fullLubCost, isLoading: isLoadingFullLub, error: fullLubError } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getFullLubMintPrice",
    chainId: arbitrum.id,
    query: {
      enabled: !!HEART_NFT_ADDRESS && !!basePriceETH && !!exchangeRate, // More conditions to prevent errors
      staleTime: 300_000, // Cache for 5 minutes (rarely changes)
      gcTime: 600_000, // Keep in cache for 10 minutes
      retry: false, // Don't retry on contract reverts
    },
  });

  // Fallback calculation for full LUB pricing when contract function fails
  const fallbackFullLubCost = React.useMemo(() => {
    if (fullLubCost) return fullLubCost;
    
    // If contract function fails, calculate manually using base price and exchange rate
    if (basePriceETH && exchangeRate) {
      const calculatedCost = basePriceETH * exchangeRate;
      console.log('🔄 Using fallback LUB pricing calculation:', formatEther(calculatedCost), 'LUB');
      return calculatedCost;
    }
    
    return BigInt(0);
  }, [fullLubCost, basePriceETH, exchangeRate]);
  
  const isLoading = isLoadingBasePrice || isLoadingRate || isLoadingDiscount || isLoadingHeartNFT || isLoadingFullLub;
  
  // Only show critical errors that prevent core functionality
  const criticalErrors = [basePriceError, rateError].filter(Boolean);
  const error = criticalErrors.length > 0 ? criticalErrors[0]?.message : null;
  
  // Log non-critical errors for debugging but don't block the UI
  React.useEffect(() => {
    const nonCriticalErrors = [discountError, heartNFTError, fullLubError].filter(Boolean);
    if (nonCriticalErrors.length > 0) {
      console.warn('⚠️  Non-critical pricing errors (using fallbacks):', nonCriticalErrors);
    }
  }, [discountError, heartNFTError, fullLubError]);
  
  // Robust fallback pricing system
  const FALLBACK_CONFIG = {
    basePriceETH: parseEther("0.001"), // 0.001 ETH as per contract design
    exchangeRate: BigInt(1000), // 1000 LUB per ETH
    discountPercentage: 50, // 50% discount with LUB
  };
  
  // Use contract values or intelligent fallbacks
  const safeBasePriceETH = basePriceETH || (basePriceError ? FALLBACK_CONFIG.basePriceETH : BigInt(0));
  const safeExchangeRate = exchangeRate || (rateError ? FALLBACK_CONFIG.exchangeRate : BigInt(1000));
  const safeLubBalance = lubBalance || BigInt(0);
  
  console.log('💰 Pricing Debug:', {
    contractPrice: basePriceETH?.toString(),
    fallbackPrice: FALLBACK_CONFIG.basePriceETH.toString(),
    finalPrice: safeBasePriceETH.toString(),
    hasBasePriceError: !!basePriceError,
  });
  
  // Calculate pricing data
  const basePriceFormatted = formatEther(safeBasePriceETH);
  const exchangeRateFormatted = `${safeExchangeRate.toString()} LUB per ETH`;
  
  // Regular pricing (no discount)
  const regularPrice = {
    ethCost: safeBasePriceETH,
    ethCostFormatted: `${basePriceFormatted} ETH`,
    lubCost: BigInt(0),
    totalCostFormatted: `${basePriceFormatted} ETH`,
  };
  
  // Discounted pricing (with LUB) - with fallback calculation
  let discountedPrice = {
    ethCost: safeBasePriceETH,
    ethCostFormatted: basePriceFormatted,
    lubCost: BigInt(0),
    lubCostFormatted: "0 LUB",
    totalCostFormatted: `${basePriceFormatted} ETH`,
    savingsETH: BigInt(0),
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
  } else if (discountData) {
    // Fallback: use discounted data even without HeartNFT validation
    const [lubCost, discountedEthPrice] = discountData;
    const savingsETH = safeBasePriceETH - discountedEthPrice;
    const discountPercentage = safeBasePriceETH > 0 
      ? Math.round((Number(savingsETH) / Number(safeBasePriceETH)) * 100)
      : 0;
    
    console.log('🔄 Using partial discount data (HeartNFT validation unavailable)');
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
  } else if (heartNFTPricing) {
    // Fallback: use HeartNFT pricing even without LUB Token validation
    const [heartNFTEthPrice, heartNFTLubCost] = heartNFTPricing;
    const savingsETH = safeBasePriceETH - heartNFTEthPrice;
    const discountPercentage = safeBasePriceETH > 0 
      ? Math.round((Number(savingsETH) / Number(safeBasePriceETH)) * 100)
      : 0;
    
    console.log('🔄 Using HeartNFT pricing (LUB Token validation unavailable)');
    discountedPrice = {
      ethCost: heartNFTEthPrice,
      ethCostFormatted: `${formatEther(heartNFTEthPrice)} ETH`,
      lubCost: heartNFTLubCost,
      lubCostFormatted: `${formatEther(heartNFTLubCost)} LUB`,
      totalCostFormatted: `${formatEther(heartNFTEthPrice)} ETH + ${formatEther(heartNFTLubCost)} LUB`,
      savingsETH,
      savingsFormatted: `${formatEther(savingsETH)} ETH`,
      discountPercentage,
    };
  }
  
  // Fallback discount pricing when contract functions fail
  if (!discountData && !heartNFTPricing && (discountError || heartNFTError) && safeBasePriceETH > 0) {
    console.log('🔄 Using fallback discount pricing calculation');
    
    // Calculate 50% discount manually
    const discountedEth = safeBasePriceETH / BigInt(2); // 50% of ETH cost
    const lubCost = (safeBasePriceETH * safeExchangeRate) / BigInt(4); // 25% of full LUB cost
    const savingsETH = safeBasePriceETH - discountedEth;
    
    discountedPrice = {
      ethCost: discountedEth,
      ethCostFormatted: `${formatEther(discountedEth)} ETH`,
      lubCost,
      lubCostFormatted: `${formatEther(lubCost)} LUB`,
      totalCostFormatted: `${formatEther(discountedEth)} ETH + ${formatEther(lubCost)} LUB`,
      savingsETH,
      savingsFormatted: `${formatEther(savingsETH)} ETH`,
      discountPercentage: 50,
    };
  }

  // Full LUB pricing with robust fallback
  let fullLubPrice = {
    lubCost: BigInt(0),
    lubCostFormatted: "0 LUB",
    totalCostFormatted: "0 LUB",
    savingsETH: BigInt(0),
    savingsFormatted: "0 ETH",
    discountPercentage: 0,
  };

  // Calculate full LUB cost using fallback or manual calculation
  const calculatedFullLubCost = fallbackFullLubCost || (safeBasePriceETH * safeExchangeRate);
  
  if (calculatedFullLubCost && calculatedFullLubCost > 0) {
    const savingsETH = safeBasePriceETH; // Save all ETH
    const discountPercentage = 100; // 100% ETH discount

    fullLubPrice = {
      lubCost: calculatedFullLubCost,
      lubCostFormatted: `${formatEther(calculatedFullLubCost)} LUB`,
      totalCostFormatted: `${formatEther(calculatedFullLubCost)} LUB`,
      savingsETH,
      savingsFormatted: `${formatEther(savingsETH)} ETH`,
      discountPercentage,
    };
  }

  // Affordability checks
  const canAffordRegular = true; // Assume user can afford ETH (we don't check ETH balance)
  const canAffordDiscount = safeLubBalance >= discountedPrice.lubCost;
  const canAffordFullLub = safeLubBalance >= fullLubPrice.lubCost;

  // Debug logging for LUB balance issues (memoized to prevent spam)
  const debugInfo = React.useMemo(() => {
    if (process.env.NODE_ENV === "development") {
      return {
        safeLubBalance: safeLubBalance.toString(),
        lubCost: discountedPrice.lubCost.toString(),
        canAffordDiscount,
        isLoading,
      };
    }
    return null;
  }, [safeLubBalance.toString(), discountedPrice.lubCost.toString(), canAffordDiscount, isLoading]);

  React.useEffect(() => {
    if (debugInfo && !isLoading) {
      console.log("🔍 LUB Balance Debug:", debugInfo);
    }
  }, [debugInfo, isLoading]);
  
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
    error: error || undefined,
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

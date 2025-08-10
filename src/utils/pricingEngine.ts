// Unified Pricing Engine - Single source of truth for all pricing logic
// Handles Farcaster hold requirements, Romance spending costs, NFT pricing, and earning calculations

import { WEB3_CONFIG } from "@/config";

export type LubMode = "farcaster" | "romance";
export type EarningAction = "photo_inclusion" | "game_completion" | "referral" | "social_game_win";

export interface PriceInfo {
  canAfford: boolean;
  cost: bigint;
  costFormatted: string;
  requiresHolding: boolean;
  requiresSpending: boolean;
  isFirstFree: boolean;
  message: string;
}

export interface EarningInfo {
  amount: bigint;
  amountFormatted: string;
  action: EarningAction;
  description: string;
}

export interface UserPricingState {
  lubBalance: bigint;
  farcasterLubsCreated: number;
  romanceLubsCreated: number;
  totalLubsCreated: number;
  hasConnectedWallet: boolean;
}

export class PricingEngine {
  private static instance: PricingEngine;
  
  static getInstance(): PricingEngine {
    if (!PricingEngine.instance) {
      PricingEngine.instance = new PricingEngine();
    }
    return PricingEngine.instance;
  }
  
  // Check if user can create a Farcaster lub (holding requirement)
  canCreateFarcasterLub(userState: UserPricingState): PriceInfo {
    const { lubBalance, totalLubsCreated } = userState;
    const holdRequirement = WEB3_CONFIG.pricing.farcasterHoldRequirement;
    const isFirstFree = WEB3_CONFIG.pricing.firstLubFree && totalLubsCreated === 0;
    
    if (isFirstFree) {
      return {
        canAfford: true,
        cost: BigInt(0),
        costFormatted: "FREE",
        requiresHolding: false,
        requiresSpending: false,
        isFirstFree: true,
        message: "🎉 Your first lub is free! Create one to get started."
      };
    }
    
    const canAfford = lubBalance >= holdRequirement;
    
    return {
      canAfford,
      cost: holdRequirement,
      costFormatted: this.formatLub(holdRequirement),
      requiresHolding: true,
      requiresSpending: false,
      isFirstFree: false,
      message: canAfford 
        ? `✅ Hold ${this.formatLub(holdRequirement)} LUB to create Farcaster lubs`
        : `❌ Need ${this.formatLub(holdRequirement)} LUB balance to create Farcaster lubs`
    };
  }
  
  // Calculate cost for Romance lub (spending requirement)
  getRomanceLubCost(userState: UserPricingState): PriceInfo {
    const { lubBalance, romanceLubsCreated, totalLubsCreated } = userState;
    const isFirstFree = WEB3_CONFIG.pricing.firstLubFree && totalLubsCreated === 0;
    
    if (isFirstFree) {
      return {
        canAfford: true,
        cost: BigInt(0),
        costFormatted: "FREE",
        requiresHolding: false,
        requiresSpending: false,
        isFirstFree: true,
        message: "🎉 Your first lub is free! Create one to get started."
      };
    }
    
    // Progressive cost: 10, 20, 40, 80 LUB...
    const baseCost = WEB3_CONFIG.pricing.romanceBaseCost;
    const multiplier = WEB3_CONFIG.pricing.romanceCostMultiplier;
    const cost = baseCost * BigInt(Math.pow(multiplier, romanceLubsCreated));
    
    const canAfford = lubBalance >= cost;
    
    return {
      canAfford,
      cost,
      costFormatted: this.formatLub(cost),
      requiresHolding: false,
      requiresSpending: true,
      isFirstFree: false,
      message: canAfford
        ? `💝 Create romance lub for ${this.formatLub(cost)} LUB`
        : `❌ Need ${this.formatLub(cost)} LUB to create romance lub`
    };
  }
  
  // Get pricing for any lub mode
  getLubPricing(mode: LubMode, userState: UserPricingState): PriceInfo {
    switch (mode) {
      case "farcaster":
        return this.canCreateFarcasterLub(userState);
      case "romance":
        return this.getRomanceLubCost(userState);
      default:
        throw new Error(`Unknown lub mode: ${mode}`);
    }
  }
  
  // Calculate NFT minting price with optional LUB discount
  // NOTE: This is now a fallback method. Use useNFTPricing hook for real-time contract data.
  getNFTMintPrice(useLubDiscount: boolean, userLubBalance: bigint): {
    ethPrice: bigint;
    lubCost: bigint;
    canAffordDiscount: boolean;
    totalCostFormatted: string;
    discountSavings?: string;
  } {
    // Note: This is a fallback method. useNFTPricing hook provides real-time contract data.

    const baseEthPrice = BigInt(WEB3_CONFIG.pricing.nftMintPrice.replace("0.", "")) * BigInt(10 ** 15); // 0.001 ETH

    if (!useLubDiscount) {
      return {
        ethPrice: baseEthPrice,
        lubCost: BigInt(0),
        canAffordDiscount: false,
        totalCostFormatted: `${WEB3_CONFIG.pricing.nftMintPrice} ETH`
      };
    }

    // 50% ETH discount when paying with LUB
    const discountedEthPrice = baseEthPrice / BigInt(2);

    // Calculate LUB cost using exchange rate: 1000 LUB = 1 ETH
    const ethDiscount = baseEthPrice - discountedEthPrice; // 0.0005 ETH
    const lubCost = ethDiscount * BigInt(1000); // Convert to LUB using 1000:1 rate

    const canAffordDiscount = userLubBalance >= lubCost;

    const savings = this.formatEth(ethDiscount);

    return {
      ethPrice: discountedEthPrice,
      lubCost,
      canAffordDiscount,
      totalCostFormatted: `${this.formatEth(discountedEthPrice)} ETH + ${this.formatLub(lubCost)} LUB`,
      discountSavings: `Save ${savings} ETH`
    };
  }
  
  // Calculate earning amount for different actions
  calculateEarning(action: EarningAction): EarningInfo {
    const earnings = WEB3_CONFIG.earning;
    
    switch (action) {
      case "photo_inclusion":
        return {
          amount: earnings.photoInclusion,
          amountFormatted: this.formatLub(earnings.photoInclusion),
          action,
          description: "Your photos were used in a lub!"
        };
        
      case "game_completion":
        return {
          amount: earnings.gameCompletion,
          amountFormatted: this.formatLub(earnings.gameCompletion),
          action,
          description: "Completed a social game!"
        };
        
      case "referral":
        return {
          amount: earnings.referralBonus,
          amountFormatted: this.formatLub(earnings.referralBonus),
          action,
          description: "Friend joined through your referral!"
        };
        
      case "social_game_win":
        return {
          amount: earnings.socialGameWin,
          amountFormatted: this.formatLub(earnings.socialGameWin),
          action,
          description: "Won a social game!"
        };
        
      default:
        throw new Error(`Unknown earning action: ${action}`);
    }
  }
  
  // Check if user needs to acquire LUB tokens
  needsLubAcquisition(mode: LubMode, userState: UserPricingState): {
    needsLub: boolean;
    reason: string;
    suggestedAmount: bigint;
    acquisitionMethods: string[];
  } {
    const pricing = this.getLubPricing(mode, userState);
    
    if (pricing.canAfford) {
      return {
        needsLub: false,
        reason: "Sufficient LUB balance",
        suggestedAmount: BigInt(0),
        acquisitionMethods: []
      };
    }
    
    const deficit = pricing.cost - userState.lubBalance;
    
    return {
      needsLub: true,
      reason: pricing.message,
      suggestedAmount: deficit,
      acquisitionMethods: [
        "🎮 Play social games to earn LUB",
        "📸 Share photos for others to use",
        "👥 Refer friends to earn bonuses",
        "💳 Purchase LUB tokens directly"
      ]
    };
  }
  
  // Utility functions
  private formatLub(amount: bigint): string {
    const formatted = Number(amount) / 10 ** 18;
    return `${formatted.toLocaleString()} LUB`;
  }
  
  private formatEth(amount: bigint): string {
    const formatted = Number(amount) / 10 ** 18;
    return formatted.toFixed(4);
  }
  
  // Get user tier based on activity and balance
  getUserTier(userState: UserPricingState): "newcomer" | "engaged" | "web3-ready" | "power-user" {
    const { lubBalance, totalLubsCreated, hasConnectedWallet } = userState;
    const holdRequirement = WEB3_CONFIG.pricing.farcasterHoldRequirement;
    
    // Power user: Has significant LUB balance and created multiple lubs
    if (lubBalance >= holdRequirement * BigInt(10) && totalLubsCreated >= 5) {
      return "power-user";
    }
    
    // Web3 ready: Has connected wallet and some LUB
    if (hasConnectedWallet && lubBalance >= holdRequirement) {
      return "web3-ready";
    }
    
    // Engaged: Has created lubs or has some LUB
    if (totalLubsCreated >= 2 || lubBalance > BigInt(0)) {
      return "engaged";
    }
    
    // Newcomer: Just getting started
    return "newcomer";
  }
}

// Singleton instance for easy access
export const pricingEngine = PricingEngine.getInstance();

// Helper function for components
export function formatLubAmount(amount: bigint): string {
  const formatted = Number(amount) / 10 ** 18;
  return `${formatted.toLocaleString()} LUB`;
}

export function formatEthAmount(amount: bigint): string {
  const formatted = Number(amount) / 10 ** 18;
  return `${formatted.toFixed(4)} ETH`;
}

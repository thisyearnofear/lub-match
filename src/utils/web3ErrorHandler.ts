"use client";

import { arbitrum } from "viem/chains";
import { switchChain } from "@wagmi/core";
import { Config } from "wagmi";

export interface Web3ErrorInfo {
  title: string;
  message: string;
  icon: string;
  action?: {
    label: string;
    handler: () => Promise<void>;
  };
  severity: "error" | "warning" | "info";
}

export class Web3ErrorHandler {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Handle Web3 errors with user-friendly messages and automatic fixes
   */
  async handleError(error: any): Promise<Web3ErrorInfo> {
    console.error("Web3 Error:", error);

    // User rejected transaction
    if (this.isUserRejection(error)) {
      return {
        title: "Transaction Cancelled",
        message: "You cancelled the transaction. No worries, try again when ready! 😊",
        icon: "🚫",
        severity: "info"
      };
    }

    // Wrong network error
    if (this.isWrongNetworkError(error)) {
      return {
        title: "Wrong Network",
        message: "You're on the wrong network. Switch to Arbitrum to continue.",
        icon: "🔄",
        action: {
          label: "Switch to Arbitrum",
          handler: async () => {
            await this.switchToArbitrum();
          }
        },
        severity: "warning"
      };
    }

    // Insufficient funds
    if (this.isInsufficientFundsError(error)) {
      return {
        title: "Insufficient Funds",
        message: "You don't have enough ETH to complete this transaction. Make sure you have enough ETH for the mint price plus gas fees.",
        icon: "💰",
        severity: "error"
      };
    }

    // Gas estimation failed
    if (this.isGasEstimationError(error)) {
      return {
        title: "Transaction Failed",
        message: "Unable to estimate gas for this transaction. This might be due to insufficient funds or contract issues.",
        icon: "⛽",
        severity: "error"
      };
    }

    // Network/RPC errors
    if (this.isNetworkError(error)) {
      return {
        title: "Network Error",
        message: "Connection issue with the blockchain. Please check your internet connection and try again.",
        icon: "🌐",
        severity: "error"
      };
    }

    // Contract execution errors
    if (this.isContractExecutionError(error)) {
      const contractError = this.parseContractError(error);
      return {
        title: "Transaction Failed",
        message: contractError || "The smart contract rejected this transaction. Please check the requirements and try again.",
        icon: "📋",
        severity: "error"
      };
    }

    // Generic fallback
    return {
      title: "Transaction Failed",
      message: this.getGenericErrorMessage(error),
      icon: "❌",
      severity: "error"
    };
  }

  /**
   * Switch to Arbitrum network
   */
  private async switchToArbitrum(): Promise<void> {
    try {
      await switchChain(this.config, { chainId: arbitrum.id });
    } catch (switchError) {
      console.error("Failed to switch network:", switchError);
      throw new Error("Failed to switch to Arbitrum. Please switch manually in your wallet.");
    }
  }

  /**
   * Check if error is user rejection
   */
  private isUserRejection(error: any): boolean {
    return (
      error?.code === 4001 ||
      error?.code === "ACTION_REJECTED" ||
      error?.message?.toLowerCase().includes("user rejected") ||
      error?.message?.toLowerCase().includes("user denied") ||
      error?.message?.toLowerCase().includes("cancelled")
    );
  }

  /**
   * Check if error is wrong network
   */
  private isWrongNetworkError(error: any): boolean {
    return (
      error?.name === "ContractFunctionExecutionError" &&
      (error?.message?.includes("does not match the target chain") ||
       error?.message?.includes("chain mismatch") ||
       error?.cause?.name === "ChainMismatchError")
    );
  }

  /**
   * Check if error is insufficient funds
   */
  private isInsufficientFundsError(error: any): boolean {
    return (
      error?.message?.toLowerCase().includes("insufficient funds") ||
      error?.message?.toLowerCase().includes("insufficient balance") ||
      error?.code === "INSUFFICIENT_FUNDS"
    );
  }

  /**
   * Check if error is gas estimation failure
   */
  private isGasEstimationError(error: any): boolean {
    return (
      error?.message?.toLowerCase().includes("gas estimation") ||
      error?.message?.toLowerCase().includes("cannot estimate gas") ||
      error?.message?.toLowerCase().includes("execution reverted")
    );
  }

  /**
   * Check if error is network related
   */
  private isNetworkError(error: any): boolean {
    return (
      error?.message?.toLowerCase().includes("network") ||
      error?.message?.toLowerCase().includes("connection") ||
      error?.message?.toLowerCase().includes("timeout") ||
      error?.code === "NETWORK_ERROR" ||
      error?.code === "TIMEOUT"
    );
  }

  /**
   * Check if error is contract execution error
   */
  private isContractExecutionError(error: any): boolean {
    return (
      error?.name === "ContractFunctionExecutionError" ||
      error?.message?.toLowerCase().includes("contract") ||
      error?.message?.toLowerCase().includes("revert")
    );
  }

  /**
   * Parse contract-specific error messages
   */
  private parseContractError(error: any): string | null {
    const message = error?.message?.toLowerCase() || "";

    if (message.includes("already minted")) {
      return "This game has already been minted as an NFT.";
    }

    if (message.includes("invalid game")) {
      return "Invalid game data. Please try creating a new game.";
    }

    if (message.includes("not authorized")) {
      return "You're not authorized to mint this NFT.";
    }

    if (message.includes("paused")) {
      return "NFT minting is currently paused. Please try again later.";
    }

    if (message.includes("max supply")) {
      return "Maximum NFT supply reached.";
    }

    return null;
  }

  /**
   * Get generic error message
   */
  private getGenericErrorMessage(error: any): string {
    if (error?.message) {
      // Clean up technical error messages
      const message = error.message;
      if (message.length > 200) {
        return "Transaction failed due to a technical issue. Please try again.";
      }
      return message;
    }

    return "An unexpected error occurred. Please try again.";
  }

  /**
   * Get current chain info from error
   */
  static getCurrentChainFromError(error: any): { current: number; expected: number } | null {
    const message = error?.message || "";
    const currentMatch = message.match(/current chain.*?id:\s*(\d+)/i);
    const expectedMatch = message.match(/target chain.*?id:\s*(\d+)/i);

    if (currentMatch && expectedMatch) {
      return {
        current: parseInt(currentMatch[1]),
        expected: parseInt(expectedMatch[1])
      };
    }

    return null;
  }

  /**
   * Get chain name from chain ID
   */
  static getChainName(chainId: number): string {
    const chains: Record<number, string> = {
      1: "Ethereum",
      8453: "Base",
      42161: "Arbitrum",
      421614: "Arbitrum Sepolia",
      11155111: "Sepolia"
    };

    return chains[chainId] || `Chain ${chainId}`;
  }
}

/**
 * Create error handler instance
 */
export function createWeb3ErrorHandler(config: Config): Web3ErrorHandler {
  return new Web3ErrorHandler(config);
}

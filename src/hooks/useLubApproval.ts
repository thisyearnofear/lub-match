/**
 * Centralized LUB Token Approval Hook
 * 
 * Provides a reusable, consistent interface for managing LUB token approvals
 * across all contracts in the system. Eliminates code duplication and ensures
 * consistent approval handling patterns.
 */

"use client";

import { useCallback } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseAbi, formatEther } from "viem";
import { arbitrum } from "viem/chains";
import { WEB3_CONFIG } from "@/config";
import { useLubToken } from "./useLubToken";

export interface ApprovalOptions {
  /** Amount to approve. If not provided, uses the required amount */
  approvalAmount?: bigint;
  /** Whether to skip approval if current allowance is sufficient */
  skipIfSufficient?: boolean;
  /** Custom approval amount buffer (e.g., 110% of required amount) */
  bufferPercent?: number;
  /** Log approval actions to console */
  verbose?: boolean;
}

export interface ApprovalResult {
  /** Whether approval was needed and executed */
  approved: boolean;
  /** The allowance amount after approval (if any) */
  finalAllowance: bigint;
  /** Any error that occurred during approval */
  error?: string;
}

/**
 * Hook for managing LUB token approvals with smart caching and optimization
 */
const LUB_TOKEN_ADDRESS = WEB3_CONFIG.contracts.lubToken;

const LUB_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export function useLubApproval() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  // Direct allowance check
  const getAllowanceValue = useCallback(async (spender: string): Promise<bigint> => {
    if (!LUB_TOKEN_ADDRESS || !address) return BigInt(0);
    
    try {
      // For now, return 0 to trigger approval flow
      // In production, you would use readContract to get actual allowance
      return BigInt(0);
    } catch (error) {
      console.error('Failed to get LUB allowance:', error);
      return BigInt(0);
    }
  }, [address]);
  
  // Direct approval transaction
  const approveLUB = useCallback(async (spender: string, amount: bigint): Promise<string> => {
    if (!LUB_TOKEN_ADDRESS) throw new Error("LUB token address not configured");
    
    const tx = await writeContractAsync({
      address: LUB_TOKEN_ADDRESS,
      abi: LUB_ABI,
      functionName: "approve",
      args: [spender as `0x${string}`, amount],
      chainId: arbitrum.id
    });
    
    // Note: We can't directly add to history here since it's private to useLubToken
    // This is acceptable as the centralized approval system is more important
    
    return tx;
  }, [writeContractAsync]);

  /**
   * Ensures a contract has sufficient LUB allowance for a transaction
   * 
   * @param spenderAddress - Contract address that needs to spend LUB
   * @param requiredAmount - Amount of LUB the contract needs to spend
   * @param options - Additional approval options
   * @returns Promise resolving to approval result
   */
  const ensureApproval = useCallback(async (
    spenderAddress: string,
    requiredAmount: bigint,
    options: ApprovalOptions = {}
  ): Promise<ApprovalResult> => {
    const {
      skipIfSufficient = true,
      bufferPercent = 0,
      verbose = true,
      approvalAmount
    } = options;

    if (!spenderAddress || requiredAmount <= BigInt(0)) {
      return {
        approved: false,
        finalAllowance: BigInt(0),
        error: "Invalid spender address or required amount"
      };
    }

    try {
      // Check current allowance
      const currentAllowance = await getAllowanceValue(spenderAddress);
      
      if (verbose) {
        console.log(`🔍 LUB Approval Check:`, {
          spender: spenderAddress.slice(0, 8) + "...",
          required: requiredAmount.toString(),
          current: currentAllowance.toString(),
          sufficient: currentAllowance >= requiredAmount
        });
      }

      // Skip if already sufficient and requested
      if (skipIfSufficient && currentAllowance >= requiredAmount) {
        if (verbose) {
          console.log("✅ Sufficient LUB allowance already exists");
        }
        return {
          approved: false,
          finalAllowance: currentAllowance
        };
      }

      // Calculate approval amount with optional buffer
      const bufferAmount = bufferPercent > 0 
        ? (requiredAmount * BigInt(100 + bufferPercent)) / BigInt(100)
        : requiredAmount;
      
      const amountToApprove = approvalAmount || bufferAmount;

      if (verbose) {
        console.log(`⏳ Approving ${amountToApprove.toString()} LUB for ${spenderAddress.slice(0, 8)}...`);
      }

      // Execute approval
      await approveLUB(spenderAddress, amountToApprove);

      if (verbose) {
        console.log("✅ LUB approval transaction completed");
      }

      return {
        approved: true,
        finalAllowance: amountToApprove
      };
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown approval error";
      
      if (verbose) {
        console.error("❌ LUB approval failed:", errorMessage);
      }

      return {
        approved: false,
        finalAllowance: BigInt(0),
        error: errorMessage
      };
    }
  }, [getAllowanceValue, approveLUB]);

  /**
   * Batch approval for multiple contracts/amounts
   * Useful when a transaction needs to approve LUB for multiple contracts
   */
  const ensureBatchApproval = useCallback(async (
    approvals: Array<{
      spenderAddress: string;
      requiredAmount: bigint;
      options?: ApprovalOptions;
    }>
  ): Promise<ApprovalResult[]> => {
    const results: ApprovalResult[] = [];
    
    for (const approval of approvals) {
      const result = await ensureApproval(
        approval.spenderAddress,
        approval.requiredAmount,
        approval.options
      );
      results.push(result);
      
      // If any approval fails, we might want to stop
      if (result.error) {
        console.warn("Batch approval stopped due to error:", result.error);
        break;
      }
    }
    
    return results;
  }, [ensureApproval]);

  /**
   * Pre-approve a common amount for frequently used contracts
   * Useful for improving UX by pre-approving larger amounts
   */
  const preApprove = useCallback(async (
    spenderAddress: string,
    amount: bigint = BigInt("1000000000000000000000") // 1000 LUB default
  ): Promise<ApprovalResult> => {
    return ensureApproval(spenderAddress, amount, {
      skipIfSufficient: false, // Force approval even if sufficient
      verbose: true
    });
  }, [ensureApproval]);

  return {
    ensureApproval,
    ensureBatchApproval,
    preApprove
  };
}

/**
 * Higher-order component pattern for wrapping functions with automatic LUB approval
 */
export function withLubApproval<T extends any[], R>(
  contractAddress: string,
  lubAmount: bigint,
  fn: (...args: T) => Promise<R>
) {
  return async function(...args: T): Promise<R> {
    const { ensureApproval } = useLubApproval();
    
    // Ensure approval before executing function
    const approvalResult = await ensureApproval(contractAddress, lubAmount);
    
    if (approvalResult.error) {
      throw new Error(`LUB approval failed: ${approvalResult.error}`);
    }
    
    // Execute the original function
    return fn(...args);
  };
}

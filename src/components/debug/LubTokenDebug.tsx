"use client";

import React, { useState } from "react";
import { useReadContract, useAccount, useWriteContract } from "wagmi";
import { parseAbi, formatEther, parseEther } from "viem";
import { arbitrum } from "viem/chains";

// Use environment variables for contract addresses
const LUB_TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_LUB_TOKEN_ADDRESS as `0x${string}`;
const HEART_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_HEART_NFT_ADDRESS as `0x${string}`;

const LUB_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export function LubTokenDebug() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isApproving } = useWriteContract();
  const [approvalTx, setApprovalTx] = useState<string | null>(null);

  const { data: balance } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arbitrum.id,
    query: { enabled: !!address && !!LUB_TOKEN_ADDRESS },
  });

  const { data: allowance } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_ABI,
    functionName: "allowance",
    args: address ? [address, HEART_NFT_ADDRESS] : undefined,
    chainId: arbitrum.id,
    query: { enabled: !!address && !!LUB_TOKEN_ADDRESS && !!HEART_NFT_ADDRESS },
  });

  const { data: symbol } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_ABI,
    functionName: "symbol",
    chainId: arbitrum.id,
    query: { enabled: !!LUB_TOKEN_ADDRESS },
  });

  const { data: decimals } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_ABI,
    functionName: "decimals",
    chainId: arbitrum.id,
    query: { enabled: !!LUB_TOKEN_ADDRESS },
  });

  const handleApprove = async (amount: bigint) => {
    if (!address) return;

    try {
      console.log("Approving", formatEther(amount), "LUB for Heart NFT");
      const tx = await writeContractAsync({
        address: LUB_TOKEN_ADDRESS,
        abi: LUB_ABI,
        functionName: "approve",
        args: [HEART_NFT_ADDRESS, amount],
        chainId: arbitrum.id,
      });
      setApprovalTx(tx);
      console.log("Approval transaction:", tx);
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold text-gray-800">🔍 LUB Token V2 Debug</h3>
        <p className="text-gray-600">Connect wallet to see debug info</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h3 className="font-bold text-blue-800 mb-2">🔍 LUB Token V2 Debug</h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Your Address:</strong> {address}
        </div>
        <div>
          <strong>LUB Token:</strong> {LUB_TOKEN_ADDRESS || "Not configured"}
        </div>
        <div>
          <strong>Heart NFT:</strong> {HEART_NFT_ADDRESS || "Not configured"}
        </div>
        <div>
          <strong>Token Symbol:</strong> {symbol || "Loading..."}
        </div>
        <div>
          <strong>Token Decimals:</strong>{" "}
          {decimals?.toString() || "Loading..."}
        </div>
      </div>

      <div className="mt-3 p-3 bg-blue-100 rounded">
        <h4 className="font-semibold text-blue-800">
          Balance & Approval Status
        </h4>
        <div className="mt-2 space-y-1 text-sm">
          <div>
            <strong>LUB V2 Balance:</strong>{" "}
            {balance ? formatEther(balance) : "Loading..."} LUB
          </div>
          <div>
            <strong>Heart NFT V3 Allowance:</strong>{" "}
            {allowance ? formatEther(allowance) : "Loading..."} LUB
          </div>
          <div className="mt-2">
            {balance && allowance && (
              <div
                className={`p-2 rounded ${
                  balance > BigInt(0) && allowance >= parseEther("1")
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                <strong>Status:</strong>{" "}
                {balance === BigInt(0)
                  ? "❌ No LUB Token V2 balance"
                  : allowance === BigInt(0)
                  ? "⚠️ Need to approve Heart NFT V3 for LUB spending"
                  : allowance < parseEther("1")
                  ? "⚠️ Need at least 1 LUB allowance for minting"
                  : "✅ Ready for minting (1 LUB = 1 NFT)"}
                <div className="mt-1 text-sm">
                  NFT Cost: ~1 LUB | Your Allowance: {formatEther(allowance)}{" "}
                  LUB
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Actions */}
      {balance &&
        balance > BigInt(0) &&
        allowance !== undefined &&
        allowance < parseEther("1") && (
          <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">
              🔧 Fix Allowance
            </h4>
            <p className="text-sm text-green-700 mb-3">
              Approve Heart NFT V3 to spend your LUB tokens for minting:
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleApprove(parseEther("10"))}
                disabled={isApproving}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm rounded font-medium"
              >
                {isApproving ? "Approving..." : "Approve 10 LUB"}
              </button>
              <button
                onClick={() => handleApprove(parseEther("100"))}
                disabled={isApproving}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm rounded font-medium"
              >
                {isApproving ? "Approving..." : "Approve 100 LUB"}
              </button>
              <button
                onClick={() => handleApprove(balance)}
                disabled={isApproving}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm rounded font-medium"
              >
                {isApproving
                  ? "Approving..."
                  : `Approve All ${formatEther(balance)} LUB`}
              </button>
            </div>
            {approvalTx && (
              <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                <strong>Approval Transaction:</strong>{" "}
                <a
                  href={`https://arbiscan.io/tx/${approvalTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 underline"
                >
                  {approvalTx.substring(0, 10)}...{approvalTx.substring(58)}
                </a>
              </div>
            )}
          </div>
        )}

      {balance === BigInt(0) && (
        <div className="mt-3 p-3 bg-yellow-100 rounded border border-yellow-300">
          <h4 className="font-semibold text-yellow-800">💡 Possible Issues:</h4>
          <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
            <li>Your 1000 LUB might be on the old LUB Token contract</li>
            <li>You may need to migrate from LUB Token V1 to V2</li>
            <li>Check other wallets/addresses for LUB Token V2</li>
          </ul>
        </div>
      )}
    </div>
  );
}

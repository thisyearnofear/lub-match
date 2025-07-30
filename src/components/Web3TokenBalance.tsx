"use client";

import { useLubToken } from "@/hooks/useLubToken";
import { WEB3_CONFIG } from "@/config";

// Web3-dependent component that only renders on client
export function Web3TokenBalance() {
  const { balance } = useLubToken();
  
  if (!balance || balance === BigInt(0)) return null;
  
  return (
    <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
      <div className="text-center">
        <div className="text-xl font-bold text-orange-700">
          {balance.toString()} LUB
        </div>
        <div className="text-xs text-orange-600">Your Balance</div>
      </div>
    </div>
  );
}

// Web3-dependent token economics section
export function TokenEconomicsSection() {
  const { balance } = useLubToken();
  
  if (!WEB3_CONFIG.features.tokenEconomics || !balance) return null;
  
  return (
    <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
      <h3 className="text-lg font-semibold text-green-800 mb-3">
        💰 Token Balance
      </h3>
      <div className="text-center">
        <div className="text-3xl font-bold text-green-600">
          {balance.toString()} LUB
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Ready to create {balance >= BigInt(50) ? "Farcaster" : "Romance"} lubs
        </div>
      </div>
    </div>
  );
}

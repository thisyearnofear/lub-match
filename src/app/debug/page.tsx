"use client";

import { useReadContract } from "wagmi";
import { parseAbi } from "viem";
import { arbitrum } from "viem/chains";
import { WEB3_CONFIG } from "@/config";

const LUB_TOKEN_ADDRESS = WEB3_CONFIG.contracts.lubToken;
const HEART_NFT_ADDRESS = WEB3_CONFIG.contracts.heartNFT;

const LUB_TOKEN_ABI = parseAbi([
  "function getLubPerEthRate() external pure returns (uint256)",
  "function getDiscountedMintPrice(uint256 ethPrice) external view returns (uint256 lubCost, uint256 discountedEthPrice)",
  "function balanceOf(address account) external view returns (uint256)",
]);

const HEART_NFT_ABI = parseAbi([
  "function getMintPrice(bool withDiscount) external view returns (uint256 ethPrice, uint256 lubCost)",
]);

export default function DebugPage() {
  // Test LUB Token contract calls
  const { data: exchangeRate, error: rateError, isLoading: isLoadingRate } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_TOKEN_ABI,
    functionName: "getLubPerEthRate",
    chainId: arbitrum.id,
    query: {
      retry: false,
    },
  });

  const { data: discountData, error: discountError, isLoading: isLoadingDiscount } = useReadContract({
    address: LUB_TOKEN_ADDRESS,
    abi: LUB_TOKEN_ABI,
    functionName: "getDiscountedMintPrice",
    args: [BigInt("1000000000000000")], // 0.001 ETH
    chainId: arbitrum.id,
    query: {
      retry: false,
    },
  });

  // Test Heart NFT contract calls
  const { data: heartNFTRegular, error: heartNFTRegularError, isLoading: isLoadingHeartNFTRegular } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getMintPrice",
    args: [false], // regular price
    chainId: arbitrum.id,
    query: {
      retry: false,
    },
  });

  const { data: heartNFTDiscount, error: heartNFTDiscountError, isLoading: isLoadingHeartNFTDiscount } = useReadContract({
    address: HEART_NFT_ADDRESS,
    abi: HEART_NFT_ABI,
    functionName: "getMintPrice",
    args: [true], // with discount
    chainId: arbitrum.id,
    query: {
      retry: false,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Contract Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contract Addresses */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Contract Addresses</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>LUB Token:</strong> 
                <br />
                <code className="bg-gray-100 p-1 rounded text-xs break-all">
                  {LUB_TOKEN_ADDRESS || "Not configured"}
                </code>
              </div>
              <div>
                <strong>Heart NFT:</strong>
                <br />
                <code className="bg-gray-100 p-1 rounded text-xs break-all">
                  {HEART_NFT_ADDRESS || "Not configured"}
                </code>
              </div>
            </div>
          </div>

          {/* LUB Token Tests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">LUB Token Contract</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">getLubPerEthRate()</h3>
                {isLoadingRate && <p className="text-blue-600">Loading...</p>}
                {rateError && (
                  <div className="text-red-600">
                    <p>Error: {rateError.message}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(rateError, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                {exchangeRate && (
                  <p className="text-green-600">
                    Success: {exchangeRate.toString()} LUB per ETH
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-medium">getDiscountedMintPrice(0.001 ETH)</h3>
                {isLoadingDiscount && <p className="text-blue-600">Loading...</p>}
                {discountError && (
                  <div className="text-red-600">
                    <p>Error: {discountError.message}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(discountError, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                {discountData && (
                  <div className="text-green-600">
                    <p>LUB Cost: {discountData[0].toString()}</p>
                    <p>Discounted ETH: {discountData[1].toString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Heart NFT Tests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Heart NFT Contract</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">getMintPrice(false) - Regular</h3>
                {isLoadingHeartNFTRegular && <p className="text-blue-600">Loading...</p>}
                {heartNFTRegularError && (
                  <div className="text-red-600">
                    <p>Error: {heartNFTRegularError.message}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(heartNFTRegularError, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                {heartNFTRegular && (
                  <div className="text-green-600">
                    <p>ETH Price: {heartNFTRegular[0].toString()}</p>
                    <p>LUB Cost: {heartNFTRegular[1].toString()}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium">getMintPrice(true) - With Discount</h3>
                {isLoadingHeartNFTDiscount && <p className="text-blue-600">Loading...</p>}
                {heartNFTDiscountError && (
                  <div className="text-red-600">
                    <p>Error: {heartNFTDiscountError.message}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(heartNFTDiscountError, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                {heartNFTDiscount && (
                  <div className="text-green-600">
                    <p>ETH Price: {heartNFTDiscount[0].toString()}</p>
                    <p>LUB Cost: {heartNFTDiscount[1].toString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Network Info</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Chain ID:</strong> {arbitrum.id}</p>
              <p><strong>Chain Name:</strong> {arbitrum.name}</p>
              <p><strong>RPC URL:</strong> {WEB3_CONFIG.networks.arbitrum.rpcUrl}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

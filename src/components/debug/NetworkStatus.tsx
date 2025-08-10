"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { useHeartNFT } from "@/hooks/useHeartNFT";
import { useNFTPricing } from "@/hooks/useNFTPricing";
import { useLubToken } from "@/hooks/useLubToken";

export function NetworkStatus() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [isVisible, setIsVisible] = useState(false);
  
  const { getTotalSupply, getCollectionStats } = useHeartNFT();
  const nftPricing = useNFTPricing();
  const { balance, exchangeRate } = useLubToken();
  
  const [networkTests, setNetworkTests] = useState({
    totalSupply: { status: 'pending', result: null as string | null, error: null as string | null },
    collectionStats: { status: 'pending', result: null as any, error: null as string | null },
    nftPricing: { status: 'pending', result: null as any, error: null as string | null },
    lubBalance: { status: 'pending', result: null as string | null, error: null as string | null },
  });

  const runNetworkTests = async () => {
    setNetworkTests({
      totalSupply: { status: 'testing', result: null as string | null, error: null as string | null },
      collectionStats: { status: 'testing', result: null as any, error: null as string | null },
      nftPricing: { status: 'testing', result: null as any, error: null as string | null },
      lubBalance: { status: 'testing', result: null as string | null, error: null as string | null },
    });

    // Test total supply
    try {
      const supply = await getTotalSupply();
      setNetworkTests(prev => ({
        ...prev,
        totalSupply: { status: 'success', result: supply?.toString() || '0', error: null }
      }));
    } catch (error: any) {
      setNetworkTests(prev => ({
        ...prev,
        totalSupply: { status: 'error', result: null, error: error?.message || 'Unknown error' }
      }));
    }

    // Test collection stats
    try {
      const stats = await getCollectionStats();
      setNetworkTests(prev => ({
        ...prev,
        collectionStats: { 
          status: 'success', 
          result: stats ? `Custom: ${stats.totalCustomHearts}, Demo: ${stats.totalDemoHearts}` : 'No stats',
          error: null 
        }
      }));
    } catch (error: any) {
      setNetworkTests(prev => ({
        ...prev,
        collectionStats: { status: 'error', result: null, error: error?.message || 'Unknown error' }
      }));
    }

    // Test NFT pricing
    setNetworkTests(prev => ({
      ...prev,
      nftPricing: { 
        status: nftPricing.error ? 'error' : 'success',
        result: nftPricing.error ? null : `Regular: ${nftPricing.regularPrice.totalCostFormatted}`,
        error: nftPricing.error ? String(nftPricing.error) : null
      }
    }));

    // Test LUB balance
    setNetworkTests(prev => ({
      ...prev,
      lubBalance: { 
        status: 'success',
        result: `${balance.toString()} LUB, Rate: ${exchangeRate.toString()}`,
        error: null
      }
    }));
  };

  useEffect(() => {
    if (isConnected) {
      runNetworkTests();
    }
  }, [isConnected]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded text-xs z-50 opacity-50 hover:opacity-100"
      >
        Network Status
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg max-w-md z-50 text-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Network Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Connection:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </div>
        <div>
          <strong>Chain ID:</strong> {chainId}
        </div>
        <div>
          <strong>Address:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}
        </div>
        
        <hr className="border-gray-600 my-2" />
        
        <div>
          <strong>Contract Tests:</strong>
          <button
            onClick={runNetworkTests}
            className="ml-2 bg-blue-500 px-2 py-1 rounded text-xs"
          >
            Refresh
          </button>
        </div>
        
        {Object.entries(networkTests).map(([test, result]) => (
          <div key={test} className="ml-2">
            <span className="capitalize">{test.replace(/([A-Z])/g, ' $1')}:</span>
            {result.status === 'testing' && <span className="text-yellow-400"> 🔄 Testing...</span>}
            {result.status === 'success' && <span className="text-green-400"> ✅ {result.result}</span>}
            {result.status === 'error' && <span className="text-red-400"> ❌ {result.error}</span>}
            {result.status === 'pending' && <span className="text-gray-400"> ⏳ Pending</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

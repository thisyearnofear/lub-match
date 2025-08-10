"use client";

import React, { useState } from "react";
import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia, arbitrum, arbitrumSepolia } from "viem/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import "@rainbow-me/rainbowkit/styles.css";

interface Web3ProviderProps {
  children: React.ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1, // Reduced retries to prevent rate limiting
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            refetchOnWindowFocus: false, // Prevent excessive refetching
            refetchOnReconnect: false, // Prevent excessive refetching
          },
        },
      })
  );

  // Create separate configs for mini app and regular web
  const [miniAppConfig] = useState(() =>
    createConfig({
      chains: [base, arbitrum, baseSepolia, arbitrumSepolia],
      transports: {
        [base.id]: http("https://mainnet.base.org", {
          retryCount: 3,
          retryDelay: 1000,
        }),
        [arbitrum.id]: fallback([
          http(
            process.env.NEXT_PUBLIC_ARBITRUM_RPC ||
              "https://arb-mainnet.g.alchemy.com/v2/oVv496K7Ex-vGv5pvulFuDj3RuKBCGFc",
            {
              retryCount: 1, // Reduced retries
              retryDelay: 2000, // Longer delay
            }
          ),
          http("https://arbitrum.llamarpc.com", {
            retryCount: 1,
            retryDelay: 2000,
          }),
        ]),
        [baseSepolia.id]: http("https://sepolia.base.org", {
          retryCount: 3,
          retryDelay: 1000,
        }),
        [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc", {
          retryCount: 3,
          retryDelay: 1000,
        }),
      },
      connectors: [farcasterMiniApp()],
      ssr: false,
    })
  );

  const [rainbowKitConfig] = useState(() => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    
    // In development mode, only use WalletConnect if explicitly configured
    const isDevelopment = process.env.NODE_ENV === 'development';
    let validProjectId: string;
    
    if (isDevelopment && (!projectId || projectId === "valentine-memory-game")) {
      // Use the provided project ID for development
      validProjectId = "c527e9dde2f458b7e65deb0dfcab15ab"; // Your actual project ID
      console.log("Using configured WalletConnect project ID for development.");
    } else {
      // Use provided project ID or fallback for production
      validProjectId = (projectId && projectId !== "valentine-memory-game") 
        ? projectId 
        : "c527e9dde2f458b7e65deb0dfcab15ab"; // Your actual project ID as fallback
        
      if (!projectId || projectId === "valentine-memory-game") {
        console.warn("Using fallback WalletConnect project ID. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to enable full features.");
      }
    }
    
    const config = getDefaultConfig({
      appName: "Lub Match",
      projectId: validProjectId,
      chains: [arbitrum, base, baseSepolia, arbitrumSepolia],
      ssr: false, // Disable server-side rendering for wallet connections
      transports: {
        [base.id]: http("https://mainnet.base.org", {
          retryCount: 3,
          retryDelay: 1000,
        }),
        [arbitrum.id]: fallback([
          http(
            process.env.NEXT_PUBLIC_ARBITRUM_RPC ||
              "https://arb-mainnet.g.alchemy.com/v2/oVv496K7Ex-vGv5pvulFuDj3RuKBCGFc",
            {
              retryCount: 1, // Reduced retries
              retryDelay: 2000, // Longer delay
            }
          ),
          http("https://arbitrum.llamarpc.com", {
            retryCount: 1,
            retryDelay: 2000,
          }),
        ]),
        [baseSepolia.id]: http("https://sepolia.base.org", {
          retryCount: 3,
          retryDelay: 1000,
        }),
        [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc", {
          retryCount: 3,
          retryDelay: 1000,
        }),
      },
    });
    
    return config;
  });

  // Detect if we're in a Farcaster mini app context
  const [isMiniApp] = useState(() => {
    if (typeof window === "undefined") return false;

    // Check for mini app indicators
    const url = new URL(window.location.href);
    return (
      url.pathname.includes("/miniapp") ||
      url.searchParams.get("miniApp") === "true" ||
      // Check for Farcaster context
      !!(window as any).fc
    );
  });

  const config = isMiniApp ? miniAppConfig : rainbowKitConfig;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {isMiniApp ? (
          // In mini app, don't use RainbowKit UI
          children
        ) : (
          // In regular web, use RainbowKit for wallet selection
          <RainbowKitProvider>{children}</RainbowKitProvider>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

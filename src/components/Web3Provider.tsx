"use client";

import React, { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia, arbitrum, arbitrumSepolia } from "viem/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import "@rainbow-me/rainbowkit/styles.css";

interface Web3ProviderProps {
  children: React.ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient());

  // Create separate configs for mini app and regular web
  const [miniAppConfig] = useState(() =>
    createConfig({
      chains: [base, arbitrum, baseSepolia, arbitrumSepolia],
      transports: {
        [base.id]: http(),
        [arbitrum.id]: http(),
        [baseSepolia.id]: http(),
        [arbitrumSepolia.id]: http(),
      },
      connectors: [farcasterMiniApp()],
      ssr: false,
    })
  );

  const [rainbowKitConfig] = useState(() =>
    getDefaultConfig({
      appName: "Lub Match",
      projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
        "valentine-memory-game",
      chains: [arbitrum, base, baseSepolia, arbitrumSepolia],
      ssr: false,
    })
  );

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

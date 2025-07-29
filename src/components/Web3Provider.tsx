"use client";

import React, { useState } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia } from "viem/chains";
import "@rainbow-me/rainbowkit/styles.css";

interface Web3ProviderProps {
  children: React.ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() =>
    getDefaultConfig({
      appName: "Valentine Memory Game",
      projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "valentine-memory-game",
      chains: [base, baseSepolia],
      ssr: false,
    })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

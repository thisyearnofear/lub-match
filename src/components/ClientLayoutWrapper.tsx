"use client";

import dynamic from "next/dynamic";
import React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider } from "@/contexts/UserContext";

const Web3Provider = dynamic(() => import("@/components/Web3Provider"), {
  ssr: false,
});

const LubBalanceWidget = dynamic(
  () => import("@/components/LubBalanceWidget"),
  {
    ssr: false,
  }
);

const PricingDebugPanel = dynamic(
  () => import("@/components/debug/PricingDebugPanel"),
  {
    ssr: false,
  }
);

const NetworkStatus = dynamic(
  () =>
    import("@/components/debug/NetworkStatus").then((mod) => ({
      default: mod.NetworkStatus,
    })),
  {
    ssr: false,
  }
);

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <Web3Provider>
        <UserProvider>
          <LubBalanceWidget />
          {process.env.NODE_ENV === "development" && (
            <>
              <PricingDebugPanel />
              <NetworkStatus />
            </>
          )}
          {children}
        </UserProvider>
      </Web3Provider>
    </ErrorBoundary>
  );
}

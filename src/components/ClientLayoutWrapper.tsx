"use client";

import dynamic from "next/dynamic";
import React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider } from "@/contexts/UserContext";

const Web3Provider = dynamic(() => import("@/components/Web3Provider"), {
  ssr: false,
});

const LubBalanceWidget = dynamic(() => import("@/components/LubBalanceWidget"), {
  ssr: false,
});

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
          {children}
        </UserProvider>
      </Web3Provider>
    </ErrorBoundary>
  );
}

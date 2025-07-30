"use client";

import dynamic from "next/dynamic";
import React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Web3Provider = dynamic(() => import("@/components/Web3Provider"), {
  ssr: false,
});

const LubBalanceWidget = dynamic(
  () => import("@/components/LubBalanceWidget"),
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
        <LubBalanceWidget />
        {children}
      </Web3Provider>
    </ErrorBoundary>
  );
}

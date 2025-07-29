"use client";

import dynamic from "next/dynamic";
import React from "react";

const Web3Provider = dynamic(() => import("@/components/Web3Provider"), { ssr: false });

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Web3Provider>{children}</Web3Provider>;
}
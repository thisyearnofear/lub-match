"use client";
import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function useMiniAppReady() {
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready();
      } catch {
        /* Running outside Farcaster – ignore */
      }
    })();
  }, []);
}

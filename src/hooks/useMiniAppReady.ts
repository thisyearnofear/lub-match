"use client";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

// Use the actual SDK types instead of custom interface
type FarcasterContext = any; // Will be properly typed by the SDK

export function useMiniAppReady() {
  const [context, setContext] = useState<FarcasterContext | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInFarcaster, setIsInFarcaster] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Initialize the mini app
        await sdk.actions.ready({
          disableNativeGestures: false,
        });

        // Get context information
        try {
          const farcasterContext = sdk.context;
          // Serialize the context to avoid Comlink cloning issues with Promises
          const serializedContext = JSON.parse(JSON.stringify(farcasterContext || {}));
          setContext(serializedContext);
          console.log("Farcaster Mini App initialized:", serializedContext);
        } catch (contextError) {
          console.log("Could not get Farcaster context:", contextError);
          setContext(null);
        }

        setIsInFarcaster(true);
        setIsReady(true);
      } catch (error) {
        console.log("Running outside Farcaster environment");
        setIsInFarcaster(false);
        setIsReady(true);
      }
    })();
  }, []);

  const addFrame = async () => {
    if (!isInFarcaster || !isReady) return null;

    try {
      // Check if the SDK has the addFrame method
      if (sdk.actions.addFrame) {
        const result = await sdk.actions.addFrame();
        console.log("Frame added:", result);
        return result;
      }
      return null;
    } catch (error) {
      console.error("Failed to add frame:", error);
      return null;
    }
  };

  const openUrl = async (url: string, close = false) => {
    if (!isInFarcaster || !isReady) {
      window.open(url, '_blank');
      return;
    }

    try {
      // Check if the SDK has the openUrl method, otherwise fallback
      if (sdk.actions.openUrl) {
        await sdk.actions.openUrl(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
      window.open(url, '_blank');
    }
  };

  const closeApp = async (message?: string) => {
    if (!isInFarcaster || !isReady) return;

    try {
      // Check if the SDK has the close method
      if (sdk.actions.close) {
        await sdk.actions.close();
      }
    } catch (error) {
      console.error("Failed to close app:", error);
    }
  };

  return {
    context,
    isReady,
    isInFarcaster,
    addFrame,
    openUrl,
    closeApp,
  };
}

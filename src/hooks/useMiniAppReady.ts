"use client";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

// Import proper types from the SDK
type MiniAppContext = {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  location?: any;
  client: {
    platformType?: 'web' | 'mobile';
    clientFid: number;
    added: boolean;
    safeAreaInsets?: any;
    notificationDetails?: any;
  };
  features?: {
    haptics: boolean;
    cameraAndMicrophoneAccess?: boolean;
  };
};

export function useMiniAppReady() {
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // First check if we're in a mini app environment
        const isMiniApp = await sdk.isInMiniApp();
        setIsInFarcaster(isMiniApp);

        if (isMiniApp) {
          // Get context information BEFORE calling ready
          try {
            const farcasterContext = await sdk.context;
            setContext(farcasterContext);
            console.log("Farcaster Mini App context loaded:", farcasterContext);
          } catch (contextError) {
            console.log("Could not get Farcaster context:", contextError);
            setContext(null);
          }

          // Initialize the mini app
          await sdk.actions.ready({
            disableNativeGestures: false,
          });
        }

        setIsReady(true);
        setIsInitializing(false);
      } catch (error) {
        console.log("Running outside Farcaster environment or initialization failed:", error);
        setIsInFarcaster(false);
        setIsReady(true);
        setIsInitializing(false);
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
    isInitializing,
    addFrame,
    openUrl,
    closeApp,
  };
}

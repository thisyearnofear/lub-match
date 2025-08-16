"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUserIdentity } from "@/contexts/UserContext";
import { UserDisplayFormatter } from "@/utils/userDisplay";
import ActionButton from "./shared/ActionButton";

interface MiniAppWalletConnectProps {
  children?: React.ReactNode;
  showDisconnect?: boolean;
}

export default function MiniAppWalletConnect({
  children,
  showDisconnect = false,
}: MiniAppWalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  // Get unified user identity for consistent display
  const {
    farcasterUser,
    displayName,
    avatarUrl,
    isInFarcaster,
    isLoadingContext,
  } = useUserIdentity();

  // Debug logging
  console.log("🔍 MiniAppWalletConnect state:", {
    isInFarcaster,
    isLoadingContext,
    connectorsCount: connectors.length,
    connectorNames: connectors.map((c) => c.name),
    isConnected,
    address: address?.slice(0, 10) + "...",
  });

  // In Farcaster mini app, use custom connect button
  if (isInFarcaster) {
    if (isConnected && address) {
      // Use unified display formatter instead of duplicate address truncation
      const connectionDisplay = UserDisplayFormatter.getConnectionDisplay(
        farcasterUser,
        address,
        isConnected
      );

      return (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-6 h-6 rounded-full border border-gray-200"
              />
            )}
            <span>{connectionDisplay}</span>
          </div>
          {children}
          {showDisconnect && (
            <button
              onClick={() => disconnect()}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Disconnect
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect your wallet to mint NFTs and interact with the blockchain
          </p>
        </div>

        <ActionButton
          onClick={() => {
            console.log(
              "🔗 Available connectors:",
              connectors.map((c) => ({ name: c.name, id: c.id, type: c.type }))
            );

            // Look for Farcaster connector first, fallback to any available connector
            const farcasterConnector = connectors.find(
              (c) =>
                c.name.toLowerCase().includes("farcaster") ||
                c.id.toLowerCase().includes("farcaster")
            );
            const connector = farcasterConnector || connectors[0];

            if (connector) {
              console.log("🔗 Attempting to connect with:", {
                name: connector.name,
                id: connector.id,
                type: connector.type,
                isFarcasterConnector: !!farcasterConnector,
              });
              connect({ connector });
            } else {
              console.error("🔗 No connectors available");
            }
          }}
          disabled={isPending}
          fullWidth
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </ActionButton>

        {/* Display connection error if any */}
        {error && (
          <div className="text-red-500 text-sm text-center">
            Connection failed: {error.message}
          </div>
        )}

        {/* Fallback option if Farcaster connection fails */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">
            Having trouble? Try regular wallet connection:
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // Outside Farcaster, use RainbowKit
  return (
    <div className="flex flex-col items-center gap-3">
      <ConnectButton />
      {children}
    </div>
  );
}

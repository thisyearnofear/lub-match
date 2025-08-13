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
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Get unified user identity for consistent display
  const {
    farcasterUser,
    displayName,
    avatarUrl,
    isInFarcaster,
    isLoadingContext,
  } = useUserIdentity();

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
            // Use the first available connector (should be Farcaster mini app connector)
            const connector = connectors[0];
            if (connector) {
              connect({ connector });
            }
          }}
          disabled={isPending}
          fullWidth
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </ActionButton>
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

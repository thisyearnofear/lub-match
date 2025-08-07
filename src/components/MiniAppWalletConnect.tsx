"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";
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
  const { isInFarcaster } = useMiniAppReady();

  // In Farcaster mini app, use custom connect button
  if (isInFarcaster) {
    if (isConnected && address) {
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm text-gray-600">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
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

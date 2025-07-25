import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "viem/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Valentine Memory Game",
  projectId: "valentine-memory-game", // for walletconnect, can be any string for public RPC
  chains: [base, baseSepolia],
  ssr: true,
});

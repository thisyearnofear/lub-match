"use client";
import { useWriteContract } from "wagmi";
import { parseAbi } from "viem";
const REGISTRY = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}` | undefined;

const ABI = parseAbi([
  "function publishGame(string cid, string message)",
  "event GamePublished(address indexed creator, string cid, string message, uint256 timestamp)",
]);

export function usePublishGame() {
  const enabled = !!REGISTRY && process.env.NEXT_PUBLIC_ENABLE_ONCHAIN === "true";
  const { writeContractAsync, isPending, data, error } = useWriteContract();

  async function publish(cid: string, message: string) {
    if (!REGISTRY) throw new Error("Registry address not configured");
    return writeContractAsync({
      abi: ABI,
      address: REGISTRY,
      functionName: "publishGame",
      args: [cid, message],
    });
  }

  return { publish, isPending, data, error, enabled };
}
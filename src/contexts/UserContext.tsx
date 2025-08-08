"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { useAccount } from "wagmi";
import {
  useUserProgression,
  UserProgress,
  UserTier,
} from "@/utils/userProgression";
import { useLubToken } from "@/hooks/useLubToken";
import { useFarcasterUsers } from "@/hooks/useFarcasterUsers";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";
import { formatLubAmount } from "@/utils/pricingEngine";

interface UserStats {
  // Game Stats
  gamesCompleted: number;
  socialGamesPlayed: number;
  currentStreak: number;
  bestStreak: number;

  // Token Stats
  lubBalance: string;
  totalLubEarned: string;
  lubTransactionCount: number;

  // NFT Stats
  nftsMinted: number;
  nftsReceived: number;

  // Social Stats
  lubsSent: number;
  lubsReceived: number;
  gamesShared: number;
  referralsSent: number;

  // Progression
  tier: UserTier;
  tierProgress: number; // 0-100 percentage to next tier
  nextTierRequirement: string;
}

interface UserProfile {
  // Identity
  isConnected: boolean;
  walletAddress?: string;
  farcasterUser?: {
    username: string;
    displayName: string;
    pfpUrl: string;
    bio?: string;
  };

  // Stats
  stats: UserStats;

  // Progression
  progress: UserProgress;
  tier: UserTier;

  // Features
  canMintNFT: boolean;
  canPlaySocialGames: boolean;
  canEarnTokens: boolean;
  canSendLub: boolean;
}

interface UserActions {
  // Progression
  recordGameCompletion: () => void;
  recordSocialGamePlay: () => void;
  recordNFTMint: () => void;
  recordLubTransaction: (type: "sent" | "received", amount: bigint) => void;
  recordGameShare: () => void;
  recordReferral: () => void;

  // UI State
  refreshUserData: () => Promise<void>;
  resetUserData: () => void;
}

interface UserContextValue {
  profile: UserProfile;
  actions: UserActions;
  isLoading: boolean;
  error?: string;
  ensName?: string;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [lubTransactionCount, setLubTransactionCount] = useState(0);
  const [totalLubEarned, setTotalLubEarned] = useState("0");
  const [ensName, setEnsName] = useState<string>();

  // Core hooks
  const { address, isConnected } = useAccount();
  const { progress, features, recordEvent } = useUserProgression();
  const { balance, isPending: lubLoading } = useLubToken();
  const { users: farcasterUsers } = useFarcasterUsers();
  const { context: farcasterContext } = useMiniAppReady();

  // Extract tier from progress
  const tier = progress.tier;

  // Verified Farcaster user - only show if actually linked to connected wallet
  const verifiedFarcasterUser = useMemo(() => {
    if (!address) return undefined;

    // Priority 1: Mini-app context user (most reliable when in Farcaster)
    // In mini-app context, the user is authenticated and their wallet connection is verified by Farcaster
    if (farcasterContext?.user && isConnected) {
      return {
        username: farcasterContext.user.username,
        displayName: farcasterContext.user.display_name,
        pfpUrl: farcasterContext.user.pfp_url,
        bio: farcasterContext.user.bio,
      };
    }

    // Priority 2: API users with verified addresses (for web context)
    if (farcasterUsers.length > 0) {
      // Find a Farcaster user whose verified addresses include the connected wallet
      const verifiedUser = farcasterUsers.find((user) => {
        if (!user.verified_addresses?.eth_addresses) return false;

        // Check if any of their verified addresses match the connected wallet (case-insensitive)
        return user.verified_addresses.eth_addresses.some(
          (verifiedAddress) =>
            verifiedAddress.toLowerCase() === address.toLowerCase()
        );
      });

      if (verifiedUser) {
        return {
          username: verifiedUser.username,
          displayName: verifiedUser.display_name,
          pfpUrl: verifiedUser.pfp_url,
          bio: verifiedUser.bio,
        };
      }
    }

    // No verified Farcaster user found for this wallet
    return undefined;
  }, [farcasterContext, farcasterUsers, address, isConnected]);

  // Calculate tier progress
  const calculateTierProgress = useCallback(
    (
      currentTier: UserTier,
      progress: UserProgress
    ): { progress: number; nextRequirement: string } => {
      switch (currentTier) {
        case "newcomer":
          const gamesNeeded = Math.max(0, 3 - progress.gamesCompleted);
          return {
            progress: Math.min(100, (progress.gamesCompleted / 3) * 100),
            nextRequirement:
              gamesNeeded > 0
                ? `Complete ${gamesNeeded} more games`
                : "Ready for Explorer!",
          };

        case "engaged":
          const socialGamesNeeded = Math.max(0, 5 - progress.socialGamesPlayed);
          const nftsNeeded = Math.max(0, 1 - progress.nftsMinted);
          const totalNeeded = socialGamesNeeded + nftsNeeded;
          const totalCompleted = 5 - socialGamesNeeded + (1 - nftsNeeded);
          return {
            progress: Math.min(100, (totalCompleted / 6) * 100),
            nextRequirement:
              totalNeeded > 0
                ? `${
                    socialGamesNeeded > 0
                      ? `${socialGamesNeeded} social games`
                      : ""
                  }${socialGamesNeeded > 0 && nftsNeeded > 0 ? ", " : ""}${
                    nftsNeeded > 0 ? `${nftsNeeded} NFT` : ""
                  }`
                : "Ready for Web3!",
          };

        case "web3-ready":
          const lubNeeded = Math.max(0, 10 - progress.totalLubsCreated);
          return {
            progress: Math.min(100, (progress.totalLubsCreated / 10) * 100),
            nextRequirement:
              lubNeeded > 0
                ? `Create ${lubNeeded} more LUBs`
                : "Ready for Power User!",
          };

        case "power-user":
          return {
            progress: 100,
            nextRequirement: "Max tier achieved!",
          };

        default:
          return { progress: 0, nextRequirement: "Unknown" };
      }
    },
    []
  );

  // Build user stats
  const buildUserStats = useCallback((): UserStats => {
    const tierInfo = calculateTierProgress(tier, progress);

    return {
      // Game Stats
      gamesCompleted: progress.gamesCompleted,
      socialGamesPlayed: progress.socialGamesPlayed,
      currentStreak: 0, // Not tracked in current UserProgress
      bestStreak: 0, // Not tracked in current UserProgress

      // Token Stats
      lubBalance: balance ? formatLubAmount(balance) : "0",
      totalLubEarned: totalLubEarned,
      lubTransactionCount,

      // NFT Stats
      nftsMinted: progress.nftsMinted,
      nftsReceived: 0, // Not tracked in current UserProgress

      // Social Stats
      lubsSent: progress.farcasterLubsCreated + progress.romanceLubsCreated,
      lubsReceived: 0, // Not tracked in current UserProgress
      gamesShared: progress.gamesShared,
      referralsSent: progress.referralsSent,

      // Progression
      tier,
      tierProgress: tierInfo.progress,
      nextTierRequirement: tierInfo.nextRequirement,
    };
  }, [
    tier,
    progress,
    balance,
    totalLubEarned,
    lubTransactionCount,
    calculateTierProgress,
  ]);

  // Build user profile
  const buildUserProfile = useCallback((): UserProfile => {
    return {
      // Identity
      isConnected,
      walletAddress: address,
      farcasterUser: verifiedFarcasterUser, // Use verified user data only

      // Stats
      stats: buildUserStats(),

      // Progression
      progress,
      tier,

      // Features
      canMintNFT: features.nftMinting,
      canPlaySocialGames: features.socialGames,
      canEarnTokens: features.tokenEarning,
      canSendLub: features.lubCreation && isConnected,
    };
  }, [
    isConnected,
    address,
    verifiedFarcasterUser,
    buildUserStats,
    progress,
    tier,
    features,
  ]);

  // User actions
  const actions: UserActions = {
    recordGameCompletion: useCallback(() => {
      recordEvent({
        type: "game_complete",
        timestamp: new Date().toISOString(),
        data: { gameType: "memory" },
      });
    }, [recordEvent]),

    recordSocialGamePlay: useCallback(() => {
      recordEvent({
        type: "social_game",
        timestamp: new Date().toISOString(),
        data: {},
      });
    }, [recordEvent]),

    recordNFTMint: useCallback(() => {
      recordEvent({
        type: "nft_minted",
        timestamp: new Date().toISOString(),
        data: {},
      });
    }, [recordEvent]),

    recordLubTransaction: useCallback(
      (type: "sent" | "received", amount: bigint) => {
        recordEvent({
          type: type === "sent" ? "lub_created" : "lub_earned",
          timestamp: new Date().toISOString(),
          data: { amount: amount.toString() },
        });

        setLubTransactionCount((prev) => prev + 1);

        if (type === "received") {
          setTotalLubEarned((prev) => {
            const currentTotal = BigInt(prev || "0");
            const newTotal = currentTotal + amount;
            return newTotal.toString();
          });
        }
      },
      [recordEvent]
    ),

    recordGameShare: useCallback(() => {
      recordEvent({
        type: "game_shared",
        timestamp: new Date().toISOString(),
        data: {},
      });
    }, [recordEvent]),

    recordReferral: useCallback(() => {
      recordEvent({
        type: "referral_sent",
        timestamp: new Date().toISOString(),
        data: {},
      });
    }, [recordEvent]),

    refreshUserData: useCallback(async () => {
      setIsLoading(true);
      try {
        // Refresh all user data
        // This could trigger re-fetching of balances, progression, etc.
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate refresh
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to refresh user data"
        );
      } finally {
        setIsLoading(false);
      }
    }, []),

    resetUserData: useCallback(() => {
      setLubTransactionCount(0);
      setTotalLubEarned("0");
      setError(undefined);
      // This would also reset progression data if needed
    }, []),
  };

  // Handle loading state
  useEffect(() => {
    if (!lubLoading) {
      setIsLoading(false);
    }
  }, [lubLoading]);

  // Handle errors - removed since useLubToken doesn't return error

  // Listen for LUB earning events to update total earned
  useEffect(() => {
    const handleLubEarned = (event: CustomEvent) => {
      const { amount } = event.detail;
      if (amount) {
        setTotalLubEarned((prev) => {
          const currentTotal = BigInt(prev || "0");
          const newTotal = currentTotal + BigInt(amount.toString());
          return newTotal.toString();
        });
        setLubTransactionCount((prev) => prev + 1);
      }
    };

    window.addEventListener("lubEarned", handleLubEarned as EventListener);
    return () => {
      window.removeEventListener("lubEarned", handleLubEarned as EventListener);
    };
  }, []);

  // ENS Resolution Effect
  useEffect(() => {
    if (!address || !isConnected || verifiedFarcasterUser) return;

    const resolveENS = async () => {
      try {
        // Use a public ENS resolver
        const response = await fetch(
          `https://api.ensideas.com/ens/resolve/${address}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.name) {
            setEnsName(data.name);
          }
        }
      } catch (error) {
        console.log("ENS resolution failed:", error);
        // Fallback: try direct RPC call if available
        try {
          if (typeof window !== "undefined" && (window as any).ethereum) {
            const provider = (window as any).ethereum;
            // This is a simplified approach - in production you'd use ethers.js
            // For now, we'll just log that ENS resolution could be implemented
            console.log("ENS resolution could be implemented with ethers.js");
          }
        } catch (rpcError) {
          console.log("RPC ENS resolution failed:", rpcError);
        }
      }
    };

    resolveENS();
  }, [address, isConnected, verifiedFarcasterUser]);

  const contextValue: UserContextValue = {
    profile: buildUserProfile(),
    actions,
    isLoading,
    error,
    ensName,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

// Hook to use user context
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// Convenience hooks for specific user data
export function useUserStats(): UserStats {
  const { profile } = useUser();
  return profile.stats;
}

export function useUserProfile(): UserProfile {
  const { profile } = useUser();
  return profile;
}

export function useUserActions(): UserActions {
  const { actions } = useUser();
  return actions;
}

// Hook for user tier and progression
export function useUserTier(): {
  tier: UserTier;
  progress: number;
  nextRequirement: string;
} {
  const { profile } = useUser();
  return {
    tier: profile.tier,
    progress: profile.stats.tierProgress,
    nextRequirement: profile.stats.nextTierRequirement,
  };
}

// Hook for connection status and identity
export function useUserIdentity(): {
  isConnected: boolean;
  walletAddress?: string;
  farcasterUser?: UserProfile["farcasterUser"];
  displayName: string;
  avatarUrl?: string;
  ensName?: string;
} {
  const { profile, ensName } = useUser();

  const displayName =
    profile.farcasterUser?.displayName ||
    profile.farcasterUser?.username ||
    ensName ||
    (profile.walletAddress
      ? `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(
          -4
        )}`
      : "") ||
    getTierDisplayName(profile.tier);

  const avatarUrl = profile.farcasterUser?.pfpUrl;

  return {
    isConnected: profile.isConnected,
    walletAddress: profile.walletAddress,
    farcasterUser: profile.farcasterUser,
    displayName,
    avatarUrl,
    ensName,
  };
}

// Helper function to get tier display name
function getTierDisplayName(tier: UserTier): string {
  switch (tier) {
    case "newcomer":
      return "New Player";
    case "engaged":
      return "Engaged Player";
    case "web3-ready":
      return "Web3 Ready";
    case "power-user":
      return "Power User";
    default:
      return "Player";
  }
}

// Hook for feature availability
export function useUserFeatures(): {
  canMintNFT: boolean;
  canPlaySocialGames: boolean;
  canEarnTokens: boolean;
  canSendLub: boolean;
  shouldShowTokenWidget: boolean;
  shouldShowProfile: boolean;
} {
  const { profile } = useUser();

  return {
    canMintNFT: profile.canMintNFT,
    canPlaySocialGames: profile.canPlaySocialGames,
    canEarnTokens: profile.canEarnTokens,
    canSendLub: profile.canSendLub,
    shouldShowTokenWidget: profile.canEarnTokens || profile.isConnected,
    shouldShowProfile: profile.tier !== "newcomer" || profile.isConnected,
  };
}

/**
 * Global Leaderboard Hook
 * Provides React interface for global leaderboard functionality
 * Follows established patterns from useHeartNFT and useLubToken
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseAbi, formatEther, parseEther } from "viem";
import { arbitrum } from "viem/chains";
import { WEB3_CONFIG } from "@/config";
import { useUnifiedStats } from './useUnifiedStats';
import { useEarningNotifications } from '@/components/EarningToast';
import { useLubApproval } from './useLubApproval';
import { Tournament } from '@/utils/tournamentManager';
import { useStreakRewards } from '@/utils/onchainLoginStreak';

// PhotoPairLeaderboard ABI
const PHOTO_PAIR_LEADERBOARD_ABI = parseAbi([
  "function submitScore(uint32 time, uint8 accuracy, string calldata farcasterUsername) external",
  "function getPlayerEntry(address player) external view returns ((address player, string farcasterUsername, uint32 bestTime, uint8 bestAccuracy, uint32 submissionCount, uint256 totalLubEarned, (string name, uint256 unlockedAt, uint256 lubReward)[] achievements, uint256 lastSubmission, bool isActive))",
  "function getTopPlayers(uint256 limit) external view returns (address[] addresses, uint32[] times, uint8[] accuracies, string[] usernames)",
  "function getPlayerRank(address player) external view returns (uint256)",
  "function getGlobalStats() external view returns (uint256 totalPlayers, uint256 totalSubs, uint256 totalDistributed, uint256 activePlayers)",
  "function canSubmitScore(address player) external view returns (bool)",
  "function SUBMISSION_FEE() external view returns (uint256)",
  "function MIN_SUBMISSION_INTERVAL() external view returns (uint256)",
  "function activeTournamentId() external view returns (uint256)",
  "function getTournament(uint256 tournamentId) external view returns ((uint256 id, string name, uint256 startTime, uint256 endTime, uint256 entryFee, uint256 prizePool, uint256 maxParticipants, address[] participants, bool isActive, bool prizesDistributed))",
  "function joinTournament() external",
  "function submitTournamentScore(uint32 time, uint8 accuracy) external",
  "function getTournamentLeaderboard(uint256 tournamentId, uint256 limit) external view returns (address[] players, uint32[] times, uint8[] accuracies)"
]);

const PHOTO_PAIR_LEADERBOARD_ADDRESS = WEB3_CONFIG.contracts.photoPairLeaderboard;

// Types
interface GlobalLeaderboardEntry {
  player: string;
  farcasterUsername: string;
  bestTime: number;
  bestAccuracy: number;
  submissionCount: number;
  totalLubEarned: number;
  achievements: Array<{ name: string; unlockedAt: number; lubReward: number }>;
  lastSubmission: number;
  isActive: boolean;
}

interface GlobalStats {
  totalPlayers: number;
  totalSubmissions: number;
  totalLubDistributed: number;
  activePlayers: number;
}


export interface UseGlobalLeaderboardReturn {
  // Submission functionality
  canSubmitScore: boolean;
  isSubmitting: boolean;
  submitScore: (time: number, accuracy: number, farcasterUsername: string) => Promise<boolean>;
  nextSubmissionTime: string;
  submissionFee: string;
  
  // Leaderboard data
  topPlayers: {
    addresses: string[];
    times: number[];
    accuracies: number[];
    usernames: string[];
  };
  userEntry: GlobalLeaderboardEntry | null;
  userRank: number;
  globalStats: GlobalStats;
  
  // Tournament functionality
  activeTournament: Tournament | null;
  canJoinTournament: boolean;
  isJoiningTournament: boolean;
  joinTournament: () => Promise<boolean>;
  submitTournamentScore: (time: number, accuracy: number) => Promise<boolean>;
  tournamentLeaderboard: {
    players: string[];
    times: number[];
    accuracies: number[];
  };
  userTournamentRank: number;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  initialize: () => Promise<void>;
}

export function useGlobalLeaderboard(): UseGlobalLeaderboardReturn {
  const { address, isConnected } = useAccount();
  const { formattedStats, recordEvent } = useUnifiedStats();
  const { showEarning } = useEarningNotifications();
  const { writeContractAsync, isPending: isSubmitting } = useWriteContract();
  const { ensureApproval } = useLubApproval();

  // Simple state management
  const [isJoiningTournament, setIsJoiningTournament] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const enabled = !!PHOTO_PAIR_LEADERBOARD_ADDRESS && WEB3_CONFIG.features.globalLeaderboard;

  // Read contract data using wagmi hooks
  const { data: submissionFeeData } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "SUBMISSION_FEE",
    query: { enabled },
  });

  const { data: canSubmitData, refetch: refetchCanSubmit } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "canSubmitScore",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address },
  });

  const { data: topPlayersData, refetch: refetchTopPlayers } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "getTopPlayers",
    args: [BigInt(10)],
    query: { enabled },
  });

  const { data: userEntryData, refetch: refetchUserEntry } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "getPlayerEntry",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address },
  });

  const { data: userRankData, refetch: refetchUserRank } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "getPlayerRank",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address },
  });

  const { data: globalStatsData, refetch: refetchGlobalStats } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "getGlobalStats",
    query: { enabled },
  });

  const { data: activeTournamentIdData } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "activeTournamentId",
    query: { enabled },
  });

  const { data: tournamentData } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "getTournament",
    args: activeTournamentIdData ? [activeTournamentIdData] : undefined,
    query: { enabled: enabled && !!activeTournamentIdData && activeTournamentIdData > BigInt(0) },
  });

  const { data: tournamentLeaderboardData } = useReadContract({
    address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
    abi: PHOTO_PAIR_LEADERBOARD_ABI,
    functionName: "getTournamentLeaderboard",
    args: activeTournamentIdData ? [activeTournamentIdData, BigInt(10)] : undefined,
    query: { enabled: enabled && !!activeTournamentIdData && activeTournamentIdData > BigInt(0) },
  });

  // Process the contract data
  const submissionFee = submissionFeeData ? `${formatEther(submissionFeeData)} LUB` : "10 LUB";
  const canSubmitScore = canSubmitData ?? false;
  const nextSubmissionTime = canSubmitScore ? "Available now" : "Cooldown period active";
  
  const topPlayers = topPlayersData ? {
    addresses: (topPlayersData as any)[0] || [],
    times: (topPlayersData as any)[1]?.map(Number) || [],
    accuracies: (topPlayersData as any)[2]?.map(Number) || [],
    usernames: (topPlayersData as any)[3] || [],
  } : {
    addresses: [] as string[],
    times: [] as number[],
    accuracies: [] as number[],
    usernames: [] as string[],
  };

  const userEntry: GlobalLeaderboardEntry | null = userEntryData ? {
    player: (userEntryData as any)[0],
    farcasterUsername: (userEntryData as any)[1],
    bestTime: Number((userEntryData as any)[2]),
    bestAccuracy: Number((userEntryData as any)[3]),
    submissionCount: Number((userEntryData as any)[4]),
    totalLubEarned: Number(formatEther((userEntryData as any)[5])),
    achievements: (userEntryData as any)[6]?.map((ach: any) => ({
      name: ach[0],
      unlockedAt: Number(ach[1]),
      lubReward: Number(formatEther(ach[2]))
    })) || [],
    lastSubmission: Number((userEntryData as any)[7]),
    isActive: (userEntryData as any)[8]
  } : null;

  const userRank = userRankData ? Number(userRankData) : 0;

  const globalStats: GlobalStats = globalStatsData ? {
    totalPlayers: Number((globalStatsData as any)[0]),
    totalSubmissions: Number((globalStatsData as any)[1]),
    totalLubDistributed: Number(formatEther((globalStatsData as any)[2])),
    activePlayers: Number((globalStatsData as any)[3])
  } : {
    totalPlayers: 0,
    totalSubmissions: 0,
    totalLubDistributed: 0,
    activePlayers: 0
  };

  const activeTournament: Tournament | null = tournamentData ? {
    id: Number((tournamentData as any)[0]),
    name: (tournamentData as any)[1],
    startTime: Number((tournamentData as any)[2]),
    endTime: Number((tournamentData as any)[3]),
    entryFee: Number(formatEther((tournamentData as any)[4])),
    prizePool: Number(formatEther((tournamentData as any)[5])),
    maxParticipants: Number((tournamentData as any)[6]),
    participants: (tournamentData as any)[7],
    isActive: (tournamentData as any)[8],
    prizesDistributed: (tournamentData as any)[9]
  } : null;

  const canJoinTournament = Boolean(activeTournament?.isActive && 
    !activeTournament.participants.includes(address || '') &&
    activeTournament.participants.length < activeTournament.maxParticipants);

  const tournamentLeaderboard = tournamentLeaderboardData ? {
    players: (tournamentLeaderboardData as any)[0] || [],
    times: (tournamentLeaderboardData as any)[1]?.map(Number) || [],
    accuracies: (tournamentLeaderboardData as any)[2]?.map(Number) || []
  } : {
    players: [] as string[],
    times: [] as number[],
    accuracies: [] as number[]
  };

  const userTournamentRank = activeTournament && address ? 
    tournamentLeaderboard.players.findIndex((p: string) => p.toLowerCase() === address.toLowerCase()) + 1 : 0;

  const isInitialized = enabled && isConnected;
  
  /**
   * Refresh all contract data
   */
  const refreshData = useCallback(async () => {
    if (!enabled || !isConnected) return;
    
    try {
      setIsLoading(true);
      
      // Refetch all contract data
      await Promise.all([
        refetchCanSubmit(),
        refetchTopPlayers(),
        refetchUserEntry(),
        refetchUserRank(),
        refetchGlobalStats()
      ]);
    } catch (error) {
      console.error("Failed to refresh leaderboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isConnected, refetchCanSubmit, refetchTopPlayers, refetchUserEntry, refetchUserRank, refetchGlobalStats]);

  /**
   * Initialize when wallet connects
   */
  const initialize = useCallback(async () => {
    if (!enabled || !isConnected) return;
    await refreshData();
  }, [enabled, isConnected, refreshData]);
  
  /**
   * Submit score to global leaderboard
   */
  const submitScore = useCallback(async (
    time: number,
    accuracy: number,
    farcasterUsername: string
  ): Promise<boolean> => {
    if (!PHOTO_PAIR_LEADERBOARD_ADDRESS || !enabled || !canSubmitScore) {
      console.log("Cannot submit:", nextSubmissionTime);
      return false;
    }
    
    try {
      // Ensure LUB approval before submitting
      if (submissionFeeData && submissionFeeData > BigInt(0)) {
        await ensureApproval(PHOTO_PAIR_LEADERBOARD_ADDRESS, submissionFeeData, {
          verbose: true
        });
      }

      const tx = await writeContractAsync({
        address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
        abi: PHOTO_PAIR_LEADERBOARD_ABI,
        functionName: "submitScore",
        args: [time, accuracy, farcasterUsername],
        chainId: arbitrum.id
      });

      console.log("Score submitted successfully!", tx);
      
      // Record the event for stats
      recordEvent({
        type: 'global_leaderboard_submission',
        time,
        accuracy,
        rank: 0, // Will be updated when we get the actual rank
        lubEarned: 0 // Will be updated when we get the actual LUB earned
      });
      
      // Refresh data to show updated rankings
      await refreshData();
      return true;
    } catch (error) {
      console.error("Error submitting score:", error);
      return false;
    }
  }, [PHOTO_PAIR_LEADERBOARD_ADDRESS, enabled, canSubmitScore, nextSubmissionTime, submissionFeeData, ensureApproval, writeContractAsync, recordEvent, refreshData]);
  
  /**
   * Join active tournament
   */
  const joinTournament = useCallback(async (): Promise<boolean> => {
    if (!PHOTO_PAIR_LEADERBOARD_ADDRESS || !enabled || !canJoinTournament || !activeTournament) {
      console.log("Cannot join tournament");
      return false;
    }
    
    try {
      setIsJoiningTournament(true);
      
      // Ensure LUB approval for tournament entry fee
      if (activeTournament.entryFee > 0) {
        const entryFeeWei = parseEther(activeTournament.entryFee.toString());
        await ensureApproval(PHOTO_PAIR_LEADERBOARD_ADDRESS, entryFeeWei, {
          verbose: true
        });
      }
      
      const tx = await writeContractAsync({
        address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
        abi: PHOTO_PAIR_LEADERBOARD_ABI,
        functionName: "joinTournament",
        chainId: arbitrum.id
      });

      console.log("Tournament joined successfully!", tx);
      
      // Record the event
      recordEvent({
        type: 'tournament_joined',
        tournamentId: activeTournament.id,
        entryFee: activeTournament.entryFee
      });
      
      // Refresh data to show tournament participation
      await refreshData();
      return true;
    } catch (error) {
      console.error("Error joining tournament:", error);
      return false;
    } finally {
      setIsJoiningTournament(false);
    }
  }, [PHOTO_PAIR_LEADERBOARD_ADDRESS, enabled, canJoinTournament, activeTournament, ensureApproval, writeContractAsync, recordEvent, refreshData]);
  
  /**
   * Submit score to active tournament
   */
  const submitTournamentScore = useCallback(async (
    time: number,
    accuracy: number
  ): Promise<boolean> => {
    if (!PHOTO_PAIR_LEADERBOARD_ADDRESS || !enabled || !activeTournament) {
      console.log("Cannot submit to tournament");
      return false;
    }
    
    try {
      const tx = await writeContractAsync({
        address: PHOTO_PAIR_LEADERBOARD_ADDRESS,
        abi: PHOTO_PAIR_LEADERBOARD_ABI,
        functionName: "submitTournamentScore",
        args: [time, accuracy],
        chainId: arbitrum.id
      });

      console.log("Tournament score submitted successfully!", tx);
      
      // Record the event
      recordEvent({
        type: 'tournament_submission',
        tournamentId: activeTournament.id,
        time,
        accuracy
      });
      
      // Refresh tournament data
      await refreshData();
      return true;
    } catch (error) {
      console.error("Error submitting tournament score:", error);
      return false;
    }
  }, [PHOTO_PAIR_LEADERBOARD_ADDRESS, enabled, activeTournament, writeContractAsync, recordEvent, refreshData]);
  
  // Initialize when wallet connects
  useEffect(() => {
    if (isConnected && enabled) {
      initialize();
    }
  }, [isConnected, enabled, initialize]);
  
  return {
    // Submission functionality
    canSubmitScore,
    isSubmitting,
    submitScore,
    nextSubmissionTime,
    submissionFee,
    
    // Leaderboard data
    topPlayers,
    userEntry,
    userRank,
    globalStats,
    
    // Tournament functionality
    activeTournament,
    canJoinTournament,
    isJoiningTournament,
    joinTournament,
    submitTournamentScore,
    tournamentLeaderboard,
    userTournamentRank,
    
    // Loading states
    isLoading,
    isInitialized,
    
    // Actions
    refreshData,
    initialize
  };
}

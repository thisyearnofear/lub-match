"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  analytics,
  UserMetrics,
  GameMetrics,
  ViralMetrics,
} from "@/utils/analytics";
import { useUserProgression } from "@/utils/userProgression";
import { useLubToken } from "@/hooks/useLubToken";
import { WEB3_CONFIG } from "@/config";

interface AnalyticsDashboardProps {
  isAdmin?: boolean;
  compact?: boolean;
}

export function AnalyticsDashboard({
  isAdmin = false,
  compact = false,
}: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<{
    userMetrics: Partial<UserMetrics>;
    gameMetrics: Partial<GameMetrics>;
    viralMetrics: Partial<ViralMetrics>;
  } | null>(null);

  const { progress } = useUserProgression();
  const { balance } = useLubToken();

  useEffect(() => {
    const updateMetrics = () => {
      const summary = analytics.getAnalyticsSummary();
      setMetrics(summary);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="animate-pulse bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📊 Your Progress
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {progress.totalLubsCreated}
            </div>
            <div className="text-xs text-gray-600">Lubs Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress.socialGamesPlayed}
            </div>
            <div className="text-xs text-gray-600">Games Played</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.nftsMinted}
            </div>
            <div className="text-xs text-gray-600">NFTs Minted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {progress.gamesShared}
            </div>
            <div className="text-xs text-gray-600">Games Shared</div>
          </div>
        </div>

        {balance && balance > BigInt(0) && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-orange-700">
                {balance.toString()} LUB
              </div>
              <div className="text-xs text-orange-600">Your Balance</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          📊 Analytics Dashboard
        </h2>
        {isAdmin && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            Admin View
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Metrics */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">👥 Users</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="font-semibold text-blue-700">
                {metrics.userMetrics.totalUsers || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="font-semibold text-blue-700">
                {metrics.userMetrics.activeUsers || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Web3 Conversion</span>
              <span className="font-semibold text-blue-700">
                {((metrics.userMetrics.conversionRate || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Game Metrics */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            🎮 Games
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Games Created</span>
              <span className="font-semibold text-green-700">
                {metrics.gameMetrics.totalGamesCreated || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Games Completed</span>
              <span className="font-semibold text-green-700">
                {metrics.gameMetrics.totalGamesCompleted || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Share Rate</span>
              <span className="font-semibold text-green-700">
                {((metrics.gameMetrics.shareRate || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Viral Metrics */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">
            🚀 Viral Growth
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Shares</span>
              <span className="font-semibold text-purple-700">
                {metrics.viralMetrics.totalShares || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-purple-700">
                {(
                  (metrics.viralMetrics.shareConversionRate || 0) * 100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Viral Coefficient</span>
              <span className="font-semibold text-purple-700">
                {(metrics.viralMetrics.viralCoefficient || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Progress Section */}
      <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
        <h3 className="text-lg font-semibold text-orange-800 mb-3">
          🏆 Your Journey
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {progress.totalLubsCreated}
            </div>
            <div className="text-xs text-gray-600">Lubs Created</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {progress.socialGamesPlayed}
            </div>
            <div className="text-xs text-gray-600">Social Games</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {progress.nftsMinted}
            </div>
            <div className="text-xs text-gray-600">NFTs Minted</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {progress.gamesShared}
            </div>
            <div className="text-xs text-gray-600">Games Shared</div>
          </div>
        </div>

        {/* User Tier Display */}
        <div className="mt-4 flex items-center justify-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            {progress.tier.charAt(0).toUpperCase() + progress.tier.slice(1)}{" "}
            User
          </div>
        </div>
      </div>

      {/* Token Economics (if enabled) */}
      {WEB3_CONFIG.features.tokenEconomics && balance && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            💰 Token Balance
          </h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {balance.toString()} LUB
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Ready to create {balance >= BigInt(50) ? "Farcaster" : "Romance"}{" "}
              lubs
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-6 text-xs text-gray-500 text-center">
          Analytics update every 30 seconds • Data stored locally for privacy
        </div>
      )}
    </motion.div>
  );
}

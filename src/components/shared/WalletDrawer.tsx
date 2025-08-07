"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useLubToken } from "@/hooks/useLubToken";
import { useUserProgression } from "@/utils/userProgression";
import { ShareHelpers } from "@/utils/shareHelpers";
import Link from "next/link";
import ActionButton from "./ActionButton";
import { UserStatsSection } from "./UserStatsSection";
import { ConnectionIncentive } from "./ConnectionIncentive";
import { NFTGallery } from "./NFTGallery";
import { NFTDetailModal } from "./NFTDetailModal";
import { HeartData } from "@/hooks/useHeartNFT";

type TabType = "overview" | "activity" | "portfolio";

interface WalletDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletClick?: () => void;
}

export default function WalletDrawer({
  isOpen,
  onClose,
  onWalletClick,
}: WalletDrawerProps) {
  const { balanceFormatted, history, progress: lubProgress } = useLubToken();
  const { progress } = useUserProgression();
  const { isConnected, address } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedNFT, setSelectedNFT] = useState<{
    tokenId: bigint;
    heartData: HeartData;
  } | null>(null);

  const tabs = [
    { id: "overview" as TabType, label: "💝 Overview", icon: "💝" },
    { id: "activity" as TabType, label: "💕 Activity", icon: "💕" },
    ...(isConnected
      ? [{ id: "portfolio" as TabType, label: "💖 Portfolio", icon: "💖" }]
      : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            <div className="mb-4 text-center">
              <div className="text-3xl mb-2">💝</div>
              <div className="text-lg font-bold text-white">
                {balanceFormatted} LUB
              </div>
              <div className="text-xs text-gray-400 mt-1">Your love tokens</div>
              {isConnected && (
                <div className="text-xs text-pink-400 mt-1 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                  Wallet Connected
                </div>
              )}
            </div>

            {/* User Stats Section */}
            <div className="mb-4">
              <UserStatsSection
                showTierProgress={true}
                onNFTClick={() => setActiveTab("portfolio")}
              />
            </div>

            {/* Connection Incentive for unconnected users */}
            {!isConnected && (
              <div className="mb-3">
                <ConnectionIncentive
                  tier={progress.tier}
                  context="modal"
                  compact={true}
                />
              </div>
            )}

            {/* Earning Tips - More compact */}
            <div className="bg-pink-900/20 rounded-lg p-3 border border-pink-500/30 text-pink-200 text-sm">
              <div className="font-semibold mb-2 text-pink-300 flex items-center gap-1">
                <span>💕</span> How to earn LUB:
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <span>💘</span> Complete games
                </div>
                <div className="flex items-center gap-1">
                  <span>💌</span> Create LUBs
                </div>
                <div className="flex items-center gap-1">
                  <span>💖</span> Connect wallet
                </div>
                <div className="flex items-center gap-1">
                  <span>💞</span> Share with friends
                </div>
              </div>
            </div>
          </>
        );

      case "activity":
        return (
          <>
            <div className="mb-6">
              <div className="text-lg font-bold mb-4 text-white">
                Recent Activity
              </div>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/30"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {item.reason}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.timestamp}
                        </div>
                      </div>
                      <div className="text-green-400 font-bold">
                        +{item.amount} LUB
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <div className="text-3xl mb-2">💕</div>
                  <p>No activity yet. Start playing to earn LUB!</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-pink-900/30 rounded-lg p-3 border border-pink-500/30">
                <div className="text-lg mb-1">💘</div>
                <div className="font-bold text-pink-300">
                  {progress.gamesCompleted}
                </div>
                <div className="text-pink-400 text-xs">Hearts Matched</div>
              </div>
              <div className="bg-rose-900/30 rounded-lg p-3 border border-rose-500/30">
                <div className="text-lg mb-1">💌</div>
                <div className="font-bold text-rose-300">
                  {progress.totalLubsCreated}
                </div>
                <div className="text-rose-400 text-xs">Love Letters</div>
              </div>
            </div>
          </>
        );

      case "portfolio":
        return (
          <>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-300">
                    Wallet Address
                  </span>
                  <span className="text-xs font-mono text-purple-200">
                    {address
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : "Not connected"}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-300">
                    Total LUB Earned
                  </span>
                  <span className="text-sm font-bold text-purple-100">
                    {(Number(progress.totalLubEarned) / 1e18).toFixed(2)} LUB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-300">NFTs Minted</span>
                  <span className="text-sm font-bold text-purple-100">
                    {progress.nftsMinted}
                  </span>
                </div>
              </div>
            </div>

            {/* NFT Gallery */}
            <div className="mb-6">
              <NFTGallery onNFTClick={setSelectedNFT} />
            </div>

            {/* Portfolio Actions */}
            <div className="space-y-2">
              <ActionButton
                onClick={onClose}
                variant="gradient-purple"
                fullWidth
                size="sm"
              >
                💌 Create New LUB
              </ActionButton>
              <ActionButton
                onClick={onClose}
                variant="gradient-green"
                fullWidth
                size="sm"
              >
                💖 Mint Heart NFT
              </ActionButton>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900 to-black rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col border-t border-purple-500/20"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-purple-400/60 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 flex-shrink-0">
                <h2 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  💝 LUB Wallet
                </h2>
                <button
                  className="text-gray-400 hover:text-purple-400 text-2xl p-1 transition-colors"
                  onClick={onClose}
                  aria-label="Close wallet drawer"
                >
                  ×
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-purple-500/20 flex-shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-purple-400 border-b-2 border-purple-400 bg-purple-900/30"
                        : "text-gray-400 hover:text-purple-300 hover:bg-gray-800/30"
                    }`}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    <span className="hidden sm:inline">
                      {tab.label.split(" ")[1]}
                    </span>
                    <span className="sm:hidden">{tab.icon}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 overflow-y-auto flex-1 min-h-0">
                {renderTabContent()}
              </div>

              {/* Quick Actions Footer */}
              <div className="px-4 py-3 border-t border-purple-500/20 bg-gradient-to-t from-black/60 to-gray-900/30 flex-shrink-0">
                <div className="flex justify-center gap-6 text-sm">
                  <button
                    onClick={() => {
                      ShareHelpers.shareApp();
                      onClose();
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    💞 Share
                  </button>
                  <Link
                    href="/create"
                    onClick={onClose}
                    className="text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    💌 Create
                  </Link>
                  <Link
                    href="/analytics"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    💕 Stats
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* NFT Detail Modal */}
      <NFTDetailModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />
    </>
  );
}

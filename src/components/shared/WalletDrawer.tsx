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

type TabType = 'overview' | 'activity' | 'portfolio';

interface WalletDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletClick?: () => void;
}

export default function WalletDrawer({ isOpen, onClose, onWalletClick }: WalletDrawerProps) {
  const { balanceFormatted, history, progress: lubProgress } = useLubToken();
  const { progress } = useUserProgression();
  const { isConnected, address } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedNFT, setSelectedNFT] = useState<{ tokenId: bigint; heartData: HeartData } | null>(null);

  const tabs = [
    { id: 'overview' as TabType, label: '💎 Overview', icon: '💎' },
    { id: 'activity' as TabType, label: '📊 Activity', icon: '📊' },
    ...(isConnected ? [{ id: 'portfolio' as TabType, label: '🎯 Portfolio', icon: '🎯' }] : [])
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div className="mb-6 text-center">
              <div className="text-4xl mb-2">💎</div>
              <div className="text-lg font-bold">{balanceFormatted} LUB</div>
              <div className="text-xs text-gray-500 mt-1">Your current balance</div>
              {isConnected && (
                <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Wallet Connected
                </div>
              )}
            </div>
            
            {/* User Stats Section */}
            <div className="mb-6">
              <UserStatsSection 
                showTierProgress={true} 
                onNFTClick={() => setActiveTab('portfolio')}
              />
            </div>
            
            {/* Connection Incentive for unconnected users */}
            {!isConnected && (
              <div className="mb-4">
                <ConnectionIncentive tier={progress.tier} context="modal" compact={false} />
              </div>
            )}
            
            {/* Earning Tips */}
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-purple-800 text-sm">
              <div className="font-semibold mb-1">How to earn LUB:</div>
              <ul className="list-disc pl-5">
                <li>Complete memory games</li>
                <li>Create new LUB games</li>
                <li>Connect your wallet</li>
                <li>Share with friends</li>
              </ul>
            </div>
          </>
        );
      
      case 'activity':
        return (
          <>
            <div className="mb-6">
              <div className="text-lg font-bold mb-4">Recent Activity</div>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.reason}</div>
                        <div className="text-xs text-gray-500">{item.timestamp}</div>
                      </div>
                      <div className="text-green-600 font-bold">+{item.amount} LUB</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No activity yet. Start playing to earn LUB!</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="font-bold text-blue-800">{progress.gamesCompleted}</div>
                <div className="text-blue-600">Games Played</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="font-bold text-green-800">{progress.totalLubsCreated}</div>
                <div className="text-green-600">LUBs Created</div>
              </div>
            </div>
          </>
        );
      
      case 'portfolio':
        return (
          <>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-700">Wallet Address</span>
                  <span className="text-xs font-mono text-purple-600">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-700">Total LUB Earned</span>
                  <span className="text-sm font-bold text-purple-800">
                    {(Number(progress.totalLubEarned) / 1e18).toFixed(2)} LUB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">NFTs Minted</span>
                  <span className="text-sm font-bold text-purple-800">{progress.nftsMinted}</span>
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
                🎨 Create New LUB
              </ActionButton>
              <ActionButton 
                onClick={onClose}
                variant="gradient-green"
                fullWidth
                size="sm"
              >
                🖼️ Mint NFT
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
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden"
              style={{
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">💎 LUB Wallet</h2>
                <button
                  className="text-gray-400 hover:text-gray-700 text-2xl p-1"
                  onClick={onClose}
                  aria-label="Close wallet drawer"
                >
                  ×
                </button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label.split(' ')[1]}</span>
                    <span className="sm:hidden">{tab.icon}</span>
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {renderTabContent()}
              </div>
              
              {/* Quick Actions Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-center gap-6 text-sm">
                  <button
                    onClick={() => {
                      ShareHelpers.shareApp();
                      onClose();
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    💝 Share
                  </button>
                  <Link 
                    href="/create" 
                    onClick={onClose}
                    className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                  >
                    🎨 Create
                  </Link>
                  <Link 
                    href="/analytics" 
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-600 font-medium flex items-center gap-1"
                  >
                    📊 Stats
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* NFT Detail Modal */}
      <NFTDetailModal 
        nft={selectedNFT} 
        onClose={() => setSelectedNFT(null)} 
      />
    </>
  );
}
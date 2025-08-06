"use client";

import { useState } from "react";
import { useLubToken } from "@/hooks/useLubToken";
import { useUserProgression } from "@/utils/userProgression";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { UserStatsSection } from "./shared/UserStatsSection";
import { ConnectionIncentive } from "./shared/ConnectionIncentive";
import { NFTGallery } from "./shared/NFTGallery";
import { NFTDetailModal } from "./shared/NFTDetailModal";
import { HeartData } from "@/hooks/useHeartNFT";

type TabType = 'overview' | 'activity' | 'portfolio';

export default function WalletModal({ onClose }: { onClose: () => void }) {
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
                <li>Complete games</li>
                <li>Invite friends</li>
                <li>Share games on social</li>
                <li>Daily login streaks</li>
                <li>Special achievements</li>
              </ul>
            </div>
          </>
        );
      
      case 'activity':
        return (
          <>
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Recent Activity</h3>
              <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                {history && history.length > 0 ? (
                  history.map((item, idx) => (
                    <li key={idx} className="py-2 flex justify-between text-sm">
                      <span>{item.reason}</span>
                      <span className={item.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {item.amount > 0 ? "+" : ""}{item.amount} LUB
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="py-2 text-gray-400 text-center">No recent activity</li>
                )}
              </ul>
            </div>
            
            {/* Activity Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🎮</div>
                <div className="font-bold text-blue-800">{progress.gamesCompleted}</div>
                <div className="text-blue-600">Games Played</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🎯</div>
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
              <button 
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                🎨 Create New LUB
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all"
              >
                🖼️ Mint NFT
              </button>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden relative"
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">💎 LUB Wallet</h2>
            <button
              className="text-gray-400 hover:text-gray-700 text-2xl"
              onClick={onClose}
              aria-label="Close wallet modal"
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
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {renderTabContent()}
          </div>
        </motion.div>
      </div>
      
      {/* NFT Detail Modal */}
      <NFTDetailModal 
        nft={selectedNFT} 
        onClose={() => setSelectedNFT(null)} 
      />
    </>
  );
}

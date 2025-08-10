/**
 * Minimal Marketplace Modal
 * 
 * Clean, focused marketplace that appears as an optional modal for engaged users.
 * Focuses on the most impactful items without overwhelming the UI.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRewardAmount } from '@/utils/enhancedRewards';
import { WEB3_CONFIG } from '@/config';
import { useEnhancedProgression } from '@/utils/enhancedProgression';
import ActionButton from '@/components/shared/ActionButton';

interface MarketplaceModalProps {
  show: boolean;
  onClose: () => void;
}

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: bigint;
  emoji: string;
  category: 'cosmetic' | 'utility' | 'social';
  popular?: boolean;
  requirements?: {
    level?: number;
    social?: number;
  };
}

// Curated selection of the most appealing items
const FEATURED_ITEMS: MarketplaceItem[] = [
  {
    id: 'theme-sunset',
    name: 'Sunset Theme',
    description: 'Beautiful gradient theme with sunset colors',
    price: WEB3_CONFIG.economy.marketplace.themeBasic,
    emoji: '🌅',
    category: 'cosmetic',
    popular: true
  },
  {
    id: 'hint-pack-small',
    name: 'Hint Pack',
    description: 'Three helpful hints for tricky matches',
    price: WEB3_CONFIG.economy.marketplace.hintPackSmall,
    emoji: '💡',
    category: 'utility',
    popular: true
  },
  {
    id: 'game-boost',
    name: 'Friend Boost',
    description: 'Send LUB bonuses to friends who play your games',
    price: WEB3_CONFIG.economy.marketplace.friendBoost,
    emoji: '🚀',
    category: 'social'
  },
  {
    id: 'theme-neon',
    name: 'Neon Theme',
    description: 'Cyberpunk-inspired neon theme',
    price: WEB3_CONFIG.economy.marketplace.themeRare,
    emoji: '⚡',
    category: 'cosmetic',
    requirements: { level: 5 }
  },
  {
    id: 'double-xp-1hour',
    name: 'Double XP',
    description: 'Earn 2x experience for one hour',
    price: WEB3_CONFIG.economy.marketplace.doubleXpHour,
    emoji: '⚡',
    category: 'utility'
  },
  {
    id: 'custom-message',
    name: 'Victory Message',
    description: 'Set a custom message for your game completions',
    price: WEB3_CONFIG.economy.marketplace.customMessage,
    emoji: '💬',
    category: 'social'
  }
];

export function MinimalMarketplace({ show, onClose }: MarketplaceModalProps) {
  const { progress, enhancedData } = useEnhancedProgression();
  const [purchaseHistory, setPurchaseHistory] = useState<string[]>(enhancedData.itemsPurchased);

  const userLevel = progress.tier === 'power-user' ? 15 : 
                   progress.tier === 'web3-ready' ? 8 : 
                   progress.tier === 'engaged' ? 3 : 1;

  const canPurchase = (item: MarketplaceItem): boolean => {
    if (progress.lubBalance < item.price) return false;
    if (item.requirements?.level && userLevel < item.requirements.level) return false;
    if (purchaseHistory.includes(item.id)) return false;
    return true;
  };

  const handlePurchase = (item: MarketplaceItem) => {
    if (!canPurchase(item)) return;
    
    // In real implementation, this would interact with smart contract
    console.log(`Purchasing ${item.name} for ${formatRewardAmount(item.price)}`);
    setPurchaseHistory(prev => [...prev, item.id]);
    
    // Show success feedback
    // You could integrate with existing success notification system
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">✨ LUB Shop</h2>
            <p className="text-gray-600">Enhance your game experience</p>
            <div className="mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full inline-block text-sm font-medium">
              💰 {formatRewardAmount(progress.lubBalance)}
            </div>
          </div>

          {/* Featured Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {FEATURED_ITEMS.map(item => {
              const isPurchasable = canPurchase(item);
              const isOwned = purchaseHistory.includes(item.id);

              return (
                <motion.div
                  key={item.id}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    item.popular ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'
                  } ${isPurchasable ? 'hover:shadow-lg cursor-pointer' : 'opacity-75'}`}
                  whileHover={isPurchasable ? { scale: 1.02 } : {}}
                  whileTap={isPurchasable ? { scale: 0.98 } : {}}
                >
                  {item.popular && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      Popular
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-3xl mb-2">{item.emoji}</div>
                    <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-600 mb-3">{item.description}</p>
                    
                    {/* Requirements */}
                    {item.requirements && (
                      <div className="mb-2">
                        {item.requirements.level && userLevel < item.requirements.level && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            Requires level {item.requirements.level}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price & Purchase */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-600 text-sm">
                        {formatRewardAmount(item.price)}
                      </span>
                      
                      {isOwned ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Owned
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={!isPurchasable}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            isPurchasable
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {progress.lubBalance < item.price ? 'Need more LUB' : 'Buy'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Earning Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 text-xl">💡</span>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Need more LUB?
                </p>
                <p className="text-xs text-blue-600">
                  Earn LUB by playing games, sharing with friends, and maintaining daily streaks! 
                  Perfect accuracy and speed bonuses give extra rewards.
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="text-center">
            <ActionButton
              onClick={onClose}
              variant="secondary"
              size="sm"
            >
              Close Shop
            </ActionButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing marketplace modal
export function useMarketplace() {
  const [showMarketplace, setShowMarketplace] = useState(false);
  
  return {
    showMarketplace,
    openMarketplace: () => setShowMarketplace(true),
    closeMarketplace: () => setShowMarketplace(false)
  };
}

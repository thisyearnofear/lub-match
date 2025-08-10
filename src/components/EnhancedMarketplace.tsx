/**
 * Enhanced LUB Spending Marketplace
 * 
 * Provides rich spending opportunities to create engaging token sinks
 * and give users meaningful ways to use their earned LUB tokens.
 */

import React, { useState, useEffect } from 'react';
import { formatRewardAmount } from '../utils/enhancedRewards';
import { WEB3_CONFIG } from '@/config';
import { formatLubAmount } from '@/utils/pricingEngine';
import { useEnhancedProgression } from '@/utils/enhancedProgression';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: 'cosmetic' | 'utility' | 'social' | 'nft' | 'special';
  price: bigint;
  emoji: string;
  rarity?: 'common' | 'rare' | 'legendary';
  timeLimit?: number; // Duration in days for limited items
  requirements?: {
    level?: number;
    achievement?: string;
    social?: number;
  };
}

interface UserProfile {
  lubBalance: bigint;
  level: number;
  achievements: string[];
  socialScore: number;
}

// Get marketplace items from config with proper pricing
const getMarketplaceItems = (): MarketplaceItem[] => [
  // Cosmetic Items (affordable daily purchases)
  {
    id: 'theme-sunset',
    name: 'Sunset Theme',
    description: 'Beautiful gradient theme with sunset colors',
    category: 'cosmetic',
    price: WEB3_CONFIG.economy.marketplace.themeBasic,
    emoji: '🌅',
    rarity: 'common'
  },
  {
    id: 'theme-neon',
    name: 'Neon Glow Theme',
    description: 'Cyberpunk-inspired neon theme',
    category: 'cosmetic',
    price: WEB3_CONFIG.economy.marketplace.themeRare,
    emoji: '⚡',
    rarity: 'rare',
    requirements: { level: 5 }
  },
  {
    id: 'animation-hearts',
    name: 'Floating Hearts',
    description: 'Romantic heart animation for perfect matches',
    category: 'cosmetic',
    price: WEB3_CONFIG.economy.marketplace.animationBasic,
    emoji: '💕',
    rarity: 'common'
  },
  {
    id: 'celebration-fireworks',
    name: 'Victory Fireworks',
    description: 'Epic fireworks when you complete a game',
    category: 'cosmetic',
    price: WEB3_CONFIG.economy.marketplace.celebrationRare,
    emoji: '🎆',
    rarity: 'rare'
  },

  // Social Features
  {
    id: 'custom-message',
    name: 'Custom Victory Message',
    description: 'Set a personal message shown to players of your games',
    category: 'social',
    price: WEB3_CONFIG.economy.marketplace.customMessage,
    emoji: '💬',
    rarity: 'common'
  },
  {
    id: 'game-boost',
    name: 'Friend Game Boost',
    description: 'Send LUB boosts to friends who play your games',
    category: 'social',
    price: WEB3_CONFIG.economy.marketplace.friendBoost,
    emoji: '🚀',
    rarity: 'common'
  },
  {
    id: 'leaderboard-spotlight',
    name: 'Leaderboard Spotlight',
    description: 'Feature your profile on the daily leaderboard',
    category: 'social',
    price: WEB3_CONFIG.economy.marketplace.leaderboardSpotlight,
    emoji: '⭐',
    rarity: 'legendary',
    timeLimit: 1,
    requirements: { social: 100 }
  },

  // Utility Items
  {
    id: 'hint-pack-small',
    name: 'Hint Pack (3x)',
    description: 'Three hints to help with difficult card matches',
    category: 'utility',
    price: WEB3_CONFIG.economy.marketplace.hintPackSmall,
    emoji: '💡',
    rarity: 'common'
  },
  {
    id: 'time-freeze',
    name: 'Time Freeze',
    description: 'Pause the timer for 10 seconds in any game',
    category: 'utility',
    price: WEB3_CONFIG.economy.marketplace.timeFreeze,
    emoji: '⏸️',
    rarity: 'common'
  },
  {
    id: 'double-xp-1hour',
    name: 'Double XP (1 Hour)',
    description: 'Earn 2x experience points for one hour',
    category: 'utility',
    price: WEB3_CONFIG.economy.marketplace.doubleXpHour,
    emoji: '⚡',
    rarity: 'rare'
  },
  {
    id: 'premium-analytics',
    name: 'Premium Analytics',
    description: 'Detailed stats and progress tracking for 7 days',
    category: 'utility',
    price: WEB3_CONFIG.economy.marketplace.premiumAnalytics,
    emoji: '📊',
    rarity: 'rare',
    timeLimit: 7
  },

  // Special NFT Upgrades
  {
    id: 'nft-rare-chance',
    name: 'Rare NFT Chance Boost',
    description: '10% higher chance for rare NFTs on next mint',
    category: 'nft',
    price: WEB3_CONFIG.economy.marketplace.nftRareBoost,
    emoji: '🎲',
    rarity: 'rare',
    requirements: { level: 10 }
  },
  {
    id: 'nft-custom-trait',
    name: 'Custom NFT Trait',
    description: 'Add a personalized trait to your next NFT',
    category: 'nft',
    price: WEB3_CONFIG.economy.marketplace.nftCustomTrait,
    emoji: '🎨',
    rarity: 'legendary',
    requirements: { level: 15, achievement: 'nft-collector-10' }
  },

  // Limited Special Events
  {
    id: 'valentine-special-2024',
    name: 'Valentine\'s Day 2024 Badge',
    description: 'Exclusive commemorative badge (limited time!)',
    category: 'special',
    price: WEB3_CONFIG.earning.achievementGold, // 50 LUB - reasonable for special item
    emoji: '💝',
    rarity: 'legendary',
    timeLimit: 14 // 2 weeks
  }
];

export function EnhancedMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { progress, enhancedData } = useEnhancedProgression();
  const [purchaseHistory, setPurchaseHistory] = useState<string[]>(enhancedData.itemsPurchased);
  
  // Create user profile from existing progression data
  const userProfile: UserProfile = {
    lubBalance: progress.lubBalance,
    level: progress.tier === 'power-user' ? 15 : progress.tier === 'web3-ready' ? 8 : progress.tier === 'engaged' ? 3 : 1,
    achievements: enhancedData.achievementsUnlocked,
    socialScore: Math.min((enhancedData.totalShares * 10) + (enhancedData.referralsCompleted * 20), 100)
  };
  
  const MARKETPLACE_ITEMS = getMarketplaceItems();

  const categories = [
    { id: 'all', name: 'All Items', emoji: '🛍️' },
    { id: 'cosmetic', name: 'Cosmetics', emoji: '🎨' },
    { id: 'utility', name: 'Utilities', emoji: '⚙️' },
    { id: 'social', name: 'Social', emoji: '👥' },
    { id: 'nft', name: 'NFT Boosts', emoji: '🖼️' },
    { id: 'special', name: 'Special', emoji: '✨' }
  ];

  const filteredItems = MARKETPLACE_ITEMS.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const canPurchase = (item: MarketplaceItem): { canBuy: boolean; reason?: string } => {
    // Check balance
    if (userProfile.lubBalance < item.price) {
      return { canBuy: false, reason: 'Insufficient LUB balance' };
    }

    // Check level requirement
    if (item.requirements?.level && userProfile.level < item.requirements.level) {
      return { canBuy: false, reason: `Requires level ${item.requirements.level}` };
    }

    // Check achievement requirement
    if (item.requirements?.achievement && 
        !userProfile.achievements.includes(item.requirements.achievement)) {
      return { canBuy: false, reason: 'Missing required achievement' };
    }

    // Check social score requirement
    if (item.requirements?.social && userProfile.socialScore < item.requirements.social) {
      return { canBuy: false, reason: `Requires ${item.requirements.social} social score` };
    }

    // Check if already purchased (for single-use items)
    if (purchaseHistory.includes(item.id) && !item.timeLimit) {
      return { canBuy: false, reason: 'Already owned' };
    }

    return { canBuy: true };
  };

  const handlePurchase = async (item: MarketplaceItem) => {
    const purchaseCheck = canPurchase(item);
    if (!purchaseCheck.canBuy) {
      alert(purchaseCheck.reason);
      return;
    }

    // In real implementation, this would call your smart contract
    console.log(`Purchasing ${item.name} for ${formatRewardAmount(item.price)}`);
    
    // Update purchase history (balance would be updated by blockchain events in real app)
    setPurchaseHistory(prev => [...prev, item.id]);
    
    // Show success message
    alert(`Successfully purchased ${item.name}! 🎉`);
  };

  const getRarityColor = (rarity?: string): string => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'rare': return 'from-purple-400 to-blue-500';
      case 'common':
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getDaysRemaining = (item: MarketplaceItem): number | null => {
    if (!item.timeLimit) return null;
    // In real implementation, calculate based on purchase date
    return item.timeLimit;
  };

  return (
    <div className="enhanced-marketplace p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gradient bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
          LUB Marketplace 🛍️
        </h1>
        <p className="text-gray-600 mb-4">
          Use your earned LUB tokens to unlock amazing items and features!
        </p>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full inline-block font-bold text-lg">
          💰 Balance: {formatRewardAmount(userProfile.lubBalance)}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.emoji} {category.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => {
          const purchaseCheck = canPurchase(item);
          const daysRemaining = getDaysRemaining(item);
          const isOwned = purchaseHistory.includes(item.id);

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl hover:transform hover:scale-102 ${
                item.rarity === 'legendary' ? 'border-yellow-400' :
                item.rarity === 'rare' ? 'border-purple-400' :
                'border-gray-200'
              }`}
            >
              {/* Item Header with Rarity Gradient */}
              <div className={`bg-gradient-to-r ${getRarityColor(item.rarity)} p-4 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{item.emoji}</span>
                  {item.rarity && (
                    <span className="bg-black bg-opacity-30 px-2 py-1 rounded-full text-xs font-bold uppercase">
                      {item.rarity}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg">{item.name}</h3>
              </div>

              {/* Item Body */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4 h-12">
                  {item.description}
                </p>

                {/* Requirements */}
                {item.requirements && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.requirements.level && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          userProfile.level >= item.requirements.level 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Level {item.requirements.level}
                        </span>
                      )}
                      {item.requirements.social && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          userProfile.socialScore >= item.requirements.social
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Social {item.requirements.social}
                        </span>
                      )}
                      {item.requirements.achievement && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          userProfile.achievements.includes(item.requirements.achievement)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Achievement ✓
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Time Limit */}
                {daysRemaining && (
                  <div className="mb-3">
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      ⏰ {daysRemaining} days remaining
                    </span>
                  </div>
                )}

                {/* Price and Purchase Button */}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-purple-600">
                    {formatRewardAmount(item.price)}
                  </div>
                  
                  {isOwned ? (
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                      ✓ Owned
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!purchaseCheck.canBuy}
                      className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                        purchaseCheck.canBuy
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!purchaseCheck.canBuy ? purchaseCheck.reason : undefined}
                    >
                      {purchaseCheck.canBuy ? '💰 Buy' : '🔒 Locked'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Deals Section */}
      <div className="mt-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">🔥 Daily Deal</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Double XP Pack + Hint Bundle</h3>
            <p className="opacity-90">Usually 180 LUB, today only 120 LUB!</p>
            <p className="text-sm opacity-75">⏰ Resets in 18h 42m</p>
          </div>
          <button className="bg-white text-orange-500 px-6 py-3 rounded-full font-bold hover:transform hover:scale-105 transition-all">
            💎 Get Deal
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-purple-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-purple-600">
            {purchaseHistory.length}
          </div>
          <div className="text-sm text-purple-600">Items Owned</div>
        </div>
        <div className="bg-blue-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-blue-600">
            Level {userProfile.level}
          </div>
          <div className="text-sm text-blue-600">Player Level</div>
        </div>
        <div className="bg-green-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-green-600">
            {userProfile.socialScore}
          </div>
          <div className="text-sm text-green-600">Social Score</div>
        </div>
        <div className="bg-pink-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-pink-600">
            {userProfile.achievements.length}
          </div>
          <div className="text-sm text-pink-600">Achievements</div>
        </div>
      </div>
    </div>
  );
}

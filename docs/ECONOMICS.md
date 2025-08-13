# 💝 Lub Match - Features & Economics Guide

## 🎮 Core Game Experience

### Heart-Shaped Memory Game

- Romantic card matching with beautiful animations
- Custom photo uploads - use your own memories
- Personal messages - add romantic touches
- Mobile-first design - perfect on any device
- Social integration - Farcaster username support

### Game Creation Modes

1. Demo Mode: Pre-loaded romantic photos
2. Custom Mode: Upload your own photos and messages
3. Social Mode: Farcaster integration for social discovery

## 🚀 Web3 Features

### Three Payment Options for NFT Minting

| Payment Method | Cost                 | ETH Savings | LUB Required |
| -------------- | -------------------- | ----------- | ------------ |
| Regular        | 0.001 ETH            | 0%          | 0 LUB        |
| 50% Discount   | 0.0005 ETH + 0.5 LUB | 50%         | 0.5 LUB      |
| Full LUB       | 1.0 LUB              | 100%        | 1.0 LUB      |

### Heart NFT Features

- ERC721 + Enumerable standard
- Social metadata (Farcaster usernames, follower counts)
- Rarity classification based on social metrics
- Collection statistics and milestones
- IPFS metadata storage for permanence

## 💰 LUB Token Economics

### Exchange Rate & Supply

- Exchange Rate: 1000 LUB = 1 ETH
- Total Supply: 1,000,000 LUB tokens
- Realistic Pricing: 1 LUB = 0.001 ETH (perfect for NFT minting)

### Token Utility

1. **NFT Minting Discounts**: 50% off when paying with LUB
2. **Full LUB Minting**: 100% LUB payment (0 ETH required!)
3. **Game Creation**: Dynamic pricing (increases 10% per game globally)
4. **Premium Features**: Custom messages, leaderboard spotlight, NFT enhancements

### 🎯 Event-Based Reward System

**Earn LUB tokens automatically for on-chain activities:**

| Activity               | Reward | Contract Event        |
| ---------------------- | ------ | --------------------- |
| **Mint Heart NFT**     | 25 LUB | `HeartMinted`         |
| **Create Game**        | 10 LUB | `GameCreated`         |
| **Leaderboard Score**  | 15 LUB | `ScoreSubmitted`      |
| **Achievement Unlock** | 50 LUB | `AchievementUnlocked` |
| **Tournament Join**    | 30 LUB | `TournamentJoined`    |
| **Publish Game**       | 20 LUB | `GamePublished`       |

**Distribution Schedule:**

- **Weekly scanning**: Every Sunday at 23:00 UTC
- **Weekly distribution**: Every Monday at 09:00 UTC
- **Fully automated**: Based on blockchain events
- **Fraud-resistant**: Can't fake on-chain activities

### Value Proposition

- 1000 LUB Balance = 1000 NFT Mints with full LUB option
- Incredible ROI: Save 100% on ETH costs
- Perfect for Power Users: Maximize token utility

## 🎯 User Journey & Strategy

### Dual-Path Design: Social + Romance

Landing → Demo Game → Mint Heart NFT (Earn 25 LUB) → Social Games Hub → Create Lub
├── Farcaster Mode (Hold LUB)
└── Romance Mode (Spend LUB)

### Progressive User Types

1. **New Users**: Start with ETH, earn LUB through activities
2. **Active Users**: Earn LUB from minting, games, achievements
3. **LUB Holders**: Use discount minting, save 50% on ETH
4. **Power Users**: Full LUB minting, 100% ETH savings

### 🔄 LUB Earning & Spending Cycle

**Earn LUB:**

- Mint your first NFT → 25 LUB
- Participate in leaderboards → 15 LUB per score
- Join tournaments → 30 LUB
- Unlock achievements → 50 LUB
- Create games → 10 LUB bonus

**Spend LUB:**

- Discount NFT minting (save 50% ETH)
- Full LUB minting (save 100% ETH)
- Game creation (dynamic pricing)
- Premium features and customizations

### Anti-Spam Strategy

- **Event-Based Rewards**: Only real on-chain activities earn LUB
- **Dynamic Pricing**: Game creation cost increases with usage
- **Token Requirements**: LUB holding for advanced features
- **Social Verification**: Farcaster integration for authenticity
- **Fraud Resistance**: Can't fake blockchain events

## 🔧 Technical Implementation

### Event-Based Reward Architecture

**No Database Required:**

- Blockchain serves as the database
- All user activities recorded as events
- Weekly scanning of contract events
- Automated reward distribution

**Smart Contracts:**

- **LUB Token**: `0x5eb4dAF1637620aEC4244D6F95AA8FF65fc2B5F0`
- **Heart NFT**: `0x1db663b601aAfb926fAE305B236E4444E51f488d`
- **Leaderboard**: Coming soon
- **Game Registry**: Coming soon

**Weekly Distribution Process:**

```bash
# Sunday: Scan blockchain events
npm run scan-events

# Monday: Distribute LUB rewards
npm run distribute-rewards
```

**Benefits:**

- ✅ **Zero infrastructure costs** (no database)
- ✅ **Fraud-resistant** (can't fake events)
- ✅ **Transparent** (all rewards verifiable)
- ✅ **Scalable** (works with unlimited users)

## 🌟 V3 Release Features

### New in V3 (January 2025)

1. Full LUB Minting Support

   - Revolutionary payment option: 1 LUB = 1 NFT mint
   - Zero ETH required for LUB holders
   - Perfect economics for token utility

2. Enhanced User Experience

   - Smart payment selection with conflict resolution
   - Real-time affordability checking
   - Improved error handling with friendly messages
   - Fixed user counting in social discovery

3. Three Payment Options
   - Clear visual distinction between payment methods
   - Automatic toggle management
   - Savings indicators and affordability status

### Technical Improvements

- Contract Updates: Added mintCompletedHeartWithLub() function
- Frontend Enhancements: New useNFTPricing hook with real-time data
- API Fixes: Resolved heart image generation issues
- Error Handling: Context-aware transaction feedback

## 🎨 User Experience Design

### Progressive Web3 Integration

- Works without wallet: Full game experience
- Enhanced with wallet: Token earning and NFT minting
- Seamless onboarding: No Web3 knowledge required to start

### Social Features

- Farcaster Integration: Username display and verification
- Social Discovery: Find games by Farcaster users
- Follower Metrics: Rarity based on social engagement
- Verified Addresses: Track authentic users

### Mobile-First Design

- Touch-optimized: Perfect for mobile gameplay
- Responsive Layout: Works on all screen sizes
- Fast Loading: Optimized for mobile networks
- PWA Ready: Install as mobile app

## 🏆 Rarity & Collection System

### NFT Rarity Tiers

- Common: Basic games with standard features
- Rare: Games with social verification
- Epic: High follower count creators
- Legendary: Viral games with massive engagement

### Collection Statistics

- Total Minted: Real-time NFT count
- Unique Creators: Number of different users
- Social Metrics: Aggregate follower counts
- Milestones: Achievement tracking

## 🎯 Roadmap & Future Features

### Phase 1: Core Experience ✅ Complete

- Heart-shaped memory game
- Custom photo uploads
- Basic NFT minting
- Social integration

### Phase 2: Token Economics ✅ Complete

- LUB token deployment
- Dynamic pricing system
- Discount minting
- Social earning mechanisms

### Phase 3: Enhanced Features ✅ Complete

- Full LUB minting
- Three payment options
- Enhanced user experience
- Improved error handling

### Phase 4: Community & Scaling (Upcoming)

- Bulk Minting: Multiple NFTs in one transaction
- LUB Staking: Additional earning mechanisms
- Advanced Analytics: Minting economics dashboard
- Community Features: Social aspects of LUB usage
- Multi-chain Expansion: Deploy to other networks
- Partnership Integrations: Collaborate with other projects

## 💡 Quick Start Guide

### For Users with 1000 LUB

1. Connect Wallet with your LUB balance
2. Complete a Heart Game (demo or custom)
3. Choose "Full LUB Payment" toggle (🔥 100% OFF ETH!)
4. Mint for 1 LUB - no ETH required!
5. Repeat 1000 times with your balance! 🤯

### For New Users

1. Start with Regular Minting (0.001 ETH)
2. Earn LUB Tokens through gameplay
3. Upgrade to Discount Minting (50% off)
4. Eventually Use Full LUB (100% off)

### For Developers

1. Clone Repository: Get the latest code
2. Install Dependencies: pnpm install
3. Set Environment: Copy .env.example to .env.local
4. Run Development: pnpm dev

---

Valentine's Game V3 - Where Love Meets DeFi 💝

Key Achievement: Users with 1000 LUB can now mint 1000 NFTs without spending any ETH! 🤯

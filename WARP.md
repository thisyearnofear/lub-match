# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 🚀 Development Commands

### Core Development
```bash
# Start development server
pnpm dev

# Build application
pnpm build

# Build with bundle analysis
pnpm build:analyze

# Fast build for development
pnpm build:fast

# Start production server
pnpm start

# Lint code
pnpm lint

# Check for unused dependencies
pnpm check-deps
```

### Smart Contract Operations (packages/contracts)
```bash
cd packages/contracts

# Compile contracts
pnpm compile

# Deploy to Arbitrum mainnet
pnpm deploy:arbitrum

# Check LUB token balance
pnpm check-balance

# Test event scanning system
pnpm test-events

# Weekly reward distribution
pnpm scan-events && pnpm distribute-rewards

# Send LUB tokens manually
pnpm send-lub
```

### Testing & Analysis
```bash
# Test with specific configurations
NODE_ENV=development pnpm build

# Analyze bundle size
ANALYZE=true pnpm build

# Run dependency check
pnpm dlx depcheck
```

## 🏗️ High-Level Architecture

### Project Structure Overview
This is **Lub Match** - a sophisticated romantic memory game that has evolved into a viral social gaming platform with Web3 token economics and AI-powered challenges.

#### Core Architecture Components:

**Frontend (Next.js 15 App Router)**
- `src/app/` - App Router with API routes, dynamic game pages, and specialized features
- `src/components/` - React components including game mechanics, Web3 integration, and social features
- `src/hooks/` - Custom React hooks for Web3, game state, and social interactions
- `src/utils/` - Utility functions for IPFS, analytics, animations, and blockchain operations

**Backend & APIs**
- `src/app/api/` - Next.js API routes for game creation, analytics, Farcaster integration, and blockchain operations
- Dual-mode IPFS storage system using Pinata (app-controlled vs user-controlled)
- Event-driven reward system scanning blockchain for user activities

**Smart Contracts (Arbitrum Mainnet)**
- LUB Token V2: `0x5eb4dAF1637620aEC4244D6F95AA8FF65fc2B5F0`
- Heart NFT V2: `0x1db663b601aAfb926fAE305B236E4444E51f488d`
- Automated weekly reward distribution based on on-chain events

### Key Architectural Patterns

#### Web3 Integration
- Uses Wagmi + RainbowKit for wallet connections
- Viem for Ethereum client operations
- Multi-network support (Arbitrum, Base Sepolia)
- Event-based reward system requiring no database

#### Game Architecture
- Heart-shaped grid layout using strategic null positioning in 7x6 matrix
- Fisher-Yates shuffle algorithm for card randomization
- Framer Motion animations with hardware acceleration
- Progressive disclosure onboarding system with user level tracking

#### Storage Architecture
- **Dual-mode IPFS storage**: 
  - Quick Share (permanent app-controlled storage)
  - Private Control (user-owned deletable storage)
- Multiple IPFS gateways with automatic fallbacks
- Image compression and optimization pipeline

#### Social & AI Features
- Farcaster mini-app integration with username/profile games
- AI Challenge System with whale classification (Minnow → Mega Whale)
- Viral detection system with multiplier rewards
- Community reporting and anti-spam protection

## 🎮 Game Mechanics Understanding

### Core Game Types
1. **Romantic Journey**: Original memory game with proposal screen
2. **Social Gaming**: Username/profile picture guessing games
3. **AI Challenges**: Competitive challenges targeting Farcaster users
4. **Whale Hunting**: Premium challenges targeting high-follower users

### Token Economics (LUB Token)
- Exchange rate: 1000 LUB = 1 ETH
- Event-based rewards (no database required):
  - Heart NFT mint: 25 LUB
  - Game creation: 10 LUB
  - Leaderboard score: 15 LUB
  - Tournament participation: 30 LUB
- Marketplace spending: 5-300 LUB for cosmetics, utilities, social features

### Heart-Shaped Game Layout
The game uses a predefined layout creating heart shape:
```typescript
// 7x6 grid with strategic null positions
const heartLayout: CellType[][] = [
  [null, 0, 1, null, 2, 3, null],
  [4, 5, 6, 7, 8, 9, 10],
  [null, 11, 12, 13, 14, 15, null],
  // ... decorative and spacing rows
];
```

## 🔧 Development Environment

### Essential Environment Variables
```bash
# Smart Contract Addresses
NEXT_PUBLIC_LUB_TOKEN_ADDRESS=0x5eb4dAF1637620aEC4244D6F95AA8FF65fc2B5F0
NEXT_PUBLIC_HEART_NFT_ADDRESS=0x1db663b601aAfb926fAE305B236E4444E51f488d

# Feature Flags
NEXT_PUBLIC_ENABLE_ONCHAIN=true
NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS=true
NEXT_PUBLIC_ENABLE_NFT_MINTING=true
NEXT_PUBLIC_ENABLE_SOCIAL_EARNING=true

# API Keys
NEYNAR_API_KEY=your_neynar_api_key
PINATA_JWT=your_pinata_jwt_token

# Deployment
PRIVATE_KEY=your_private_key_for_deployment
```

### Performance Considerations
- Bundle splitting optimizations for vendor chunks, Framer Motion, and Web3 libraries
- Image optimization with AVIF format and Next.js Image component
- IPFS gateway fallbacks with 30s timeout and 3 retries
- Hardware-accelerated CSS transforms for animations

### Code Organization Principles
- **ENHANCEMENT FIRST**: Prioritize enhancing existing components
- **AGGRESSIVE CONSOLIDATION**: Delete unnecessary code rather than deprecating
- **DRY**: Single source of truth for shared logic
- **MODULAR**: Composable, testable, independent modules
- Domain-driven file structure with clear separation of concerns

## 🎯 Common Development Tasks

### Adding New Game Features
1. Components go in `src/components/`
2. Game logic hooks in `src/hooks/`
3. Utilities in `src/utils/`
4. API endpoints in `src/app/api/`

### Web3 Integration Updates
1. Contract addresses in `src/config.ts`
2. ABIs and contract interactions in relevant hooks
3. Pricing and economics configuration in config
4. Event scanning in `packages/contracts/scripts/`

### Mobile Optimization
- Mobile-first responsive design (9.5/10 rating)
- Farcaster mini-app integration with haptic feedback
- Touch-friendly interactions and safe area support
- Smart zoom controls for game interactions

### Adding New Reward Events
1. Update reward configuration in `src/config.ts`
2. Add event scanning in `packages/contracts/scripts/scanWeeklyEvents.ts`
3. Test with `pnpm test-events`
4. Deploy and verify on blockchain explorer

## 📊 Deployment & Production

### Frontend Deployment (Vercel)
- Production: [lub-match.vercel.app](https://lub-match.vercel.app)
- Automatic deployments from Git
- Environment variables via Vercel dashboard
- Edge functions for API routes

### Contract Deployment
```bash
cd packages/contracts
pnpm deploy:arbitrum
pnpm verify --network arbitrum [contract_address]
```

### Weekly Operations
Automated reward distribution system:
```bash
# Sunday 23:00 UTC - Scan events
pnpm scan-events

# Monday 09:00 UTC - Distribute rewards
pnpm distribute-rewards
```

## 🔍 Debugging & Troubleshooting

### Common Issues
- **Images not loading**: Check Pinata gateway and IPFS fallbacks
- **Wallet connection fails**: Verify network configuration in config
- **Game creation fails**: Check Pinata JWT or user API key
- **Contract interactions**: Verify addresses and network settings
- **Animation performance**: Check hardware acceleration and motion preferences

### Debug Tools
- Browser DevTools for performance profiling
- React DevTools for component debugging
- Network tab for IPFS request monitoring
- Blockchain explorer for contract verification
- Bundle analyzer: `pnpm build:analyze`

This architecture supports the evolution from romantic memory game to viral social gaming platform while maintaining clean code organization and scalable Web3 integration.

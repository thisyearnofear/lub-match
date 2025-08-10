# 💝 Lub Match - The Ultimate Valentine's Memory Game

A romantic heart-shaped memory card game with Web3 token economics, NFT minting, and social features. Built for love, powered by blockchain.

![Demo Preview](public/github-demo.gif)

## 🌟 What Makes Lub Match Special

### 🎮 Core Game Experience

- Heart-shaped memory game with romantic card matching
- Custom photo uploads - use your own memories
- Personal messages - add romantic touches
- Beautiful animations - smooth, delightful interactions
- Mobile-first design - perfect on any device

### 🚀 Web3 Features

- LUB Token Economics - earn and spend tokens for game creation
- NFT Minting - immortalize completed games as Heart NFTs
- Progressive Web3 - works great without wallet, enhanced with it
- Social Integration - Farcaster usernames and social discovery
- Three Payment Options - Regular ETH, 50% LUB discount, or 100% LUB payment

### 💰 Token Economics

- 1000 LUB = 1 ETH exchange rate (realistic and sustainable)
- Full LUB Minting - mint NFTs with 100% LUB (0 ETH required!)
- Social Earning - earn 10 LUB when your images are used in games
- Dynamic Pricing - game creation cost increases with global usage

## 🎯 Quick Start

### For Players

1. Visit the game at [valentines-proposal-visibait.vercel.app](https://valentines-proposal-visibait.vercel.app)
2. Play the demo - no wallet required
3. Connect wallet for enhanced features
4. Mint your Heart NFT - choose your payment method

### For LUB Token Holders

- 1000 LUB Balance = 1000 NFT Mints with full LUB option
- Zero ETH Required - use pure LUB for minting
- Maximum Value - 100% savings on ETH costs

## 🏗️ Technical Stack

### Frontend

- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Wagmi + Viem for Web3 integration
- Framer Motion for animations

### Blockchain

- Arbitrum Mainnet for low gas costs
- LUB Token (ERC20) - 0xEC3Fd6325E2E05dBed1a3bF17FDDB20414446083
- Heart NFT (ERC721) - 0x5b8fbC567089a3C5424bFFa8911AFa00C6a87836
- IPFS Storage via Pinata for metadata

## 🚀 Development

### Prerequisites

- Node.js 18+
- pnpm package manager
- Git

### Setup

# Clone the repository

git clone <repository-url>
cd valentines-game

# Install dependencies

pnpm install

# Copy environment template

cp .env.example .env.local

# Start development server

pnpm dev

### Environment Variables

# Smart Contract Addresses

NEXT_PUBLIC_LUB_TOKEN_ADDRESS=0xEC3Fd6325E2E05dBed1a3bF17FDDB20414446083
NEXT_PUBLIC_HEART_NFT_ADDRESS=0x5b8fbC567089a3C5424bFFa8911AFa00C6a87836

# Feature Flags

NEXT_PUBLIC_ENABLE_ONCHAIN=true
NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS=true
NEXT_PUBLIC_ENABLE_NFT_MINTING=true

# API Keys (optional for development)

NEYNAR_API_KEY=your_neynar_api_key
PINATA_JWT=your_pinata_jwt_token

### Available Scripts

pnpm dev # Start development server
pnpm build # Build for production
pnpm start # Start production server
pnpm lint # Run ESLint
pnpm type-check # Run TypeScript checks

## 📊 Smart Contracts

### LUB Token (ERC20)

- Address: 0xEC3Fd6325E2E05dBed1a3bF17FDDB20414446083
- Supply: 1,000,000 LUB
- Exchange Rate: 1000 LUB = 1 ETH
- Features: Deflationary mechanics, discount system

### Heart NFT (ERC721)

- Address: 0x5b8fbC567089a3C5424bFFa8911AFa00C6a87836
- Standard: ERC721 + Enumerable + URIStorage
- Features: Social metadata, rarity classification, three payment options
- Minting: Regular (ETH), Discount (ETH + LUB), Full LUB

## 💝 Use Cases

### Romantic Proposals

- Create custom games with proposal photos
- Add romantic messages to each card
- Mint as NFT for permanent memory

### Social Games

- Use Farcaster integration for social discovery
- Create games featuring friend groups
- Earn LUB tokens through participation

### Collectors

- Mint rare NFTs with social metadata
- Collect games from verified Farcaster users
- Participate in token economics

## 📚 Documentation

For detailed information, see our comprehensive documentation:

- [Setup & Deployment Guide](docs/DEPLOYMENT.md) - Technical setup, deployment, and configuration
- [Features & Economics Guide](docs/ECONOMICS.md) - Product features, token economics, and user guide
- [Development & Integration Guide](docs/DEVELOPMENT.md) - Technical implementation, architecture, and integration

## 🔗 Links

- Live App: [lub-match.vercel.app](https://lub-match.vercel.app)
- LUB Token: [Arbiscan](https://arbiscan.io/address/0xEC3Fd6325E2E05dBed1a3bF17FDDB20414446083)
- Heart NFT: [Arbiscan](https://arbiscan.io/address/0x5b8fbC567089a3C5424bFFa8911AFa00C6a87836)

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for the Web3 community

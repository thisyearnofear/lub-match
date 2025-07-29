# 🎯 Lub Match Integration Guide

## Overview

This guide covers the cohesive integration of Web3 features into Lub Match, maintaining DRY, CLEAN, PERFORMANT, INTUITIVE, and ORGANIZED principles.

## 🏗️ Architecture Overview

### Unified Systems

1. **Game Hash System** (`src/utils/gameHash.ts`)
   - Centralized game identification
   - Prevents duplicate NFT mints
   - Consistent across IPFS and blockchain

2. **IPFS Metadata System** (`src/utils/ipfs.ts` + `src/utils/nftMetadata.ts`)
   - Unified metadata creation for games and NFTs
   - Automatic IPFS upload with fallback handling
   - Consistent file naming and structure

3. **Web3 Configuration** (`src/config.ts`)
   - Centralized contract addresses and settings
   - Feature flags for gradual rollout
   - Environment-based configuration

4. **Enhanced Hooks** (`src/hooks/`)
   - `useHeartNFT`: NFT minting with metadata upload
   - `useLubToken`: Token economics and discounts
   - Clean error handling and loading states

## 🚀 Deployment Process

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Install contract dependencies
cd packages/contracts
npm install
```

### 2. Configure Environment Variables

```env
# Required for IPFS storage
PINATA_JWT=your_pinata_jwt

# Required for Web3 features
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract addresses (after deployment)
NEXT_PUBLIC_LUB_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_HEART_NFT_ADDRESS=0x...

# Network configuration
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_deployment_key
```

### 3. Deploy Smart Contracts

```bash
# Deploy to Arbitrum Sepolia
cd packages/contracts
npx hardhat run scripts/deployArbitrum.ts --network arbitrumSepolia

# Verify contracts
npx hardhat verify --network arbitrumSepolia <LUB_TOKEN_ADDRESS>
npx hardhat verify --network arbitrumSepolia <HEART_NFT_ADDRESS> <LUB_TOKEN_ADDRESS>
```

### 4. Enable Features

```env
# Enable Web3 features gradually
NEXT_PUBLIC_ENABLE_ONCHAIN=true
NEXT_PUBLIC_ENABLE_NFT_MINTING=true
NEXT_PUBLIC_ENABLE_LUB_TOKEN=true
```

## 🎮 User Experience Flow

### Game Creation
1. User uploads 8 photos
2. IPFS metadata created with unified system
3. Game stored with consistent hash generation
4. Optional: LUB tokens spent for creation

### Game Completion
1. Heart layout completed
2. Proposal screen appears
3. "Mint as NFT" option available (if Web3 enabled)
4. Metadata automatically uploaded to IPFS
5. NFT minted with proper game hash verification

### Token Economics
1. Users earn LUB when images are included in games
2. LUB provides discounts on NFT minting
3. Game creation costs increase over time
4. Clear incentive alignment

## 🔧 Technical Implementation

### Game Hash Generation

```typescript
// Unified hash generation
const gameHash = generateGameHash({
  imageHashes: ['ipfs://...', 'ipfs://...'],
  layout: convertHeartLayoutToContractFormat(),
  message: "Will you accept my lub?",
  creator: "0x...",
  gameType: "custom"
});
```

### NFT Minting with Metadata

```typescript
// Enhanced minting with automatic metadata upload
const heartData = {
  imageHashes: gameImages,
  layout: convertHeartLayoutToContractFormat(),
  message,
  completedAt: BigInt(Math.floor(Date.now() / 1000)),
  creator,
  completer: address,
  gameType
};

const txHash = await mintCompletedHeartWithMetadata(
  heartData,
  useLubDiscount
);
```

### IPFS Integration

```typescript
// Unified metadata creation
const metadata = createNFTMetadata(gameData, additionalAttributes);

// Upload with fallback handling
const result = await uploadNFTMetadata(gameData, userApiKey);
```

## 📊 Configuration Management

### Feature Flags

```typescript
// Centralized feature control
const WEB3_CONFIG = {
  features: {
    onchainEnabled: process.env.NEXT_PUBLIC_ENABLE_ONCHAIN === "true",
    nftMintingEnabled: !!process.env.NEXT_PUBLIC_HEART_NFT_ADDRESS,
    lubTokenEnabled: !!process.env.NEXT_PUBLIC_LUB_TOKEN_ADDRESS,
  }
};
```

### Contract Configuration

```typescript
// Unified contract addresses
const contracts = {
  lubToken: WEB3_CONFIG.contracts.lubToken,
  heartNFT: WEB3_CONFIG.contracts.heartNFT,
  registry: WEB3_CONFIG.contracts.registry,
};
```

## 🛡️ Security Considerations

### Game Hash Security
- Deterministic hashing prevents duplicates
- Excludes timestamp to allow legitimate re-mints
- Includes creator address for ownership verification

### IPFS Security
- Metadata validation before upload
- Multiple gateway fallbacks for reliability
- User-controlled vs app-controlled storage modes

### Smart Contract Security
- Anti-duplicate minting mechanisms
- Proper access controls
- Gas optimization for Arbitrum

## 🧪 Testing Strategy

### Unit Tests
```bash
# Test game hash generation
npm test -- gameHash.test.ts

# Test metadata creation
npm test -- nftMetadata.test.ts

# Test contract interactions
npm test -- contracts.test.ts
```

### Integration Tests
```bash
# Test full NFT minting flow
npm test -- integration/nft-minting.test.ts

# Test IPFS upload flow
npm test -- integration/ipfs-upload.test.ts
```

### Manual Testing Checklist
- [ ] Game creation with IPFS upload
- [ ] Game completion and proposal flow
- [ ] NFT minting with metadata
- [ ] LUB token earning and spending
- [ ] Wallet connection and network switching
- [ ] Error handling and edge cases

## 🚀 Performance Optimizations

### IPFS Optimizations
- Parallel file uploads
- Compression for large images
- Gateway selection based on performance
- Caching of metadata

### Blockchain Optimizations
- Batch operations where possible
- Gas estimation before transactions
- Optimized contract calls
- Efficient data structures

### Frontend Optimizations
- Lazy loading of Web3 components
- Optimistic UI updates
- Error boundary handling
- Progressive enhancement

## 📈 Monitoring and Analytics

### Key Metrics
- Game creation success rate
- NFT minting completion rate
- IPFS upload performance
- LUB token circulation
- User engagement with Web3 features

### Error Tracking
- IPFS upload failures
- Transaction failures
- Network connectivity issues
- Contract interaction errors

## 🔄 Maintenance and Updates

### Regular Tasks
- Monitor IPFS gateway performance
- Update contract addresses if needed
- Review and optimize gas costs
- Update dependencies and security patches

### Scaling Considerations
- IPFS pinning service management
- Contract upgrade strategies
- Database optimization for game metadata
- CDN configuration for static assets

## 📚 Additional Resources

- [Arbitrum Documentation](https://docs.arbitrum.io/)
- [Pinata IPFS Documentation](https://docs.pinata.cloud/)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)

This integration maintains the clean, modular architecture while adding powerful Web3 functionality that enhances rather than complicates the user experience.

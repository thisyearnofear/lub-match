# 🔧 Lub Match: Technical Guide

## 🚀 Deployment

This guide provides instructions for setting up and deploying the Lub Match application.

### Current Deployment Status

- **Smart Contracts (Arbitrum Mainnet)**:
    - **LUB Token V2**: `0x5eb4dAF1637620aEC4244D6F95AA8FF65fc2B5F0` (LIVE)
    - **Heart NFT V2**: `0x1db663b601aAfb926fAE305B236E4444E51f488d` (LIVE)
- **Frontend Application**:
    - **Production**: [lub-match.vercel.app](https://lub-match.vercel.app)
    - **Development**: `localhost:3000`

### Environment Setup

Create a `.env.local` file and add the following environment variables:

```
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

# Network Configuration
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
PRIVATE_KEY=your_private_key_for_deployment
```

### Frontend Deployment Steps

1.  **Build & Test**:
    ```bash
    pnpm install
    pnpm test
    pnpm build
    pnpm start
    ```
2.  **Deploy to Vercel**:
    ```bash
    vercel --prod
    ```

## 🧹 Code Cleanup & Architecture

After implementing the AI Challenge System, we performed an aggressive consolidation to eliminate duplicate code and maintain a clean architecture.

### Code Removed

- **`socialInteractionService.ts`**: Removed ~150 lines of duplicate code related to challenge creation, completion, and retrieval.
- **`viralDetectionService.ts`**: Removed ~30 lines of duplicate code related to content validation.

### Current Service Architecture

- **`challengeEngine.ts`**: AI-powered challenge generation, lifecycle management, and reward calculation.
- **`viralDetectionService.ts`**: Viral content pattern detection, confidence scoring, and verification.
- **`antiSpamService.ts`**: Content quality validation, rate limiting, and user reputation management.
- **`socialInteractionService.ts`**: Interaction tracking and analytics.

### Benefits of Cleanup

- **Development Efficiency**: Faster development, easier debugging, and reduced complexity.
- **Maintenance**: Single source of truth for each feature, making updates easier and testing more focused.
- **Performance**: Reduced memory usage and faster execution.

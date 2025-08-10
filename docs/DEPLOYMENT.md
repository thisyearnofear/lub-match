# 🚀 Lub Match - Setup & Deployment Guide

## 📋 Current Deployment Status

### Smart Contracts - Arbitrum Mainnet

| Contract     | Address                                    | Status  |
| ------------ | ------------------------------------------ | ------- |
| Heart NFT V3 | 0x5b8fbC567089a3C5424bFFa8911AFa00C6a87836 | ✅ LIVE |
| LUB Token V2 | 0xEC3Fd6325E2E05dBed1a3bF17FDDB20414446083 | ✅ LIVE |

### Frontend Application

- Production: [lub-match.vercel.app](https://lub-match.vercel.app)
- Development: localhost:3000

## 🔧 Environment Setup

### Required Environment Variables

# Smart Contract Addresses

NEXT_PUBLIC_LUB_TOKEN_ADDRESS=0xEC3Fd6325E2E05dBed1a3bF17FDDB20414446083
NEXT_PUBLIC_HEART_NFT_ADDRESS=0x5b8fbC567089a3C5424bFFa8911AFa00C6a87836

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

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] API keys tested (Neynar, Pinata)
- [ ] Smart contract addresses verified
- [ ] Feature flags set appropriately
- [ ] Build process tested locally

### Smart Contract Verification

- [ ] Contracts verified on Arbiscan
- [ ] Source code published
- [ ] Contract ownership secured
- [ ] Emergency procedures documented

### Frontend Deployment Steps

#### 1. Build & Test

# Install dependencies

pnpm install

# Run tests

pnpm test

# Build production bundle

pnpm build

# Test production build locally

pnpm start

#### 2. Deploy to Vercel

# Deploy via CLI

vercel --prod

# Or connect GitHub repo for automatic deployments

#### 3. Post-Deployment Verification

- [ ] Site loads correctly
- [ ] Wallet connection works
- [ ] Game creation functions
- [ ] NFT minting operational
- [ ] Social features active
- [ ] Analytics tracking enabled

## 🛡️ Security Configuration

### Smart Contract Security

- [ ] Contract audits completed
- [ ] Ownership transferred to multisig
- [ ] Emergency pause mechanisms tested
- [ ] Upgrade paths documented

### Frontend Security

- [ ] No sensitive data in client code
- [ ] API rate limiting implemented
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] CORS configured properly

## 📊 Monitoring & Analytics

### Key Metrics to Track

- User acquisition and retention
- Game creation and completion rates
- Wallet connection conversion
- NFT minting revenue
- Social sharing virality
- Error rates and performance

### Monitoring Tools

- [ ] Vercel Analytics enabled
- [ ] Error tracking (Sentry recommended)
- [ ] Performance monitoring
- [ ] Uptime monitoring

## 🚨 Emergency Procedures

### Smart Contract Issues

1. Deploy new contracts
2. Update environment variables
3. Redeploy frontend
4. Notify users of migration

### Frontend Issues

1. Rollback to previous deployment
2. Fix issues in development
3. Test thoroughly
4. Redeploy

### API Service Failures

1. Check service status pages
2. Implement fallback mechanisms
3. Notify users of limitations
4. Monitor for restoration

## 🔄 Phase 2 Deployment (Arbitrum Mainnet)

### Prerequisites

- Arbitrum mainnet RPC endpoint
- Sufficient ETH for deployment gas
- Private key with deployment permissions
- Contract verification setup

### Deployment Script

cd packages/contracts
npx hardhat run scripts/deployHeartNFTV3.ts --network arbitrum

### Post-Deployment Tasks

1. Contract Verification

   npx hardhat verify --network arbitrum <CONTRACT_ADDRESS>

2. Update Environment Variables

   - Add new contract addresses to .env.local
   - Update Vercel environment variables

3. Test All Features
   - Wallet connection
   - Game creation
   - NFT minting (all payment methods)
   - Social features

# Staging

NEXT_PUBLIC_ENABLE_ONCHAIN=true
NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS=true

# Production

NEXT_PUBLIC_ENABLE_ONCHAIN=true
NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS=true
NEXT_PUBLIC_ENABLE_NFT_MINTING=true

### Feature Flags

- **`ENABLE_ONCHAIN`**: Web3 wallet connection
- **`ENABLE_TOKEN_ECONOMICS`**: LUB token features
- **`ENABLE_NFT_MINTING`**: Heart NFT creation
- **`ENABLE_SOCIAL_EARNING`**: Farcaster integration

## 🧪 Testing Strategy

### Unit Testing

- **Components**: React Testing Library
- **Hooks**: Custom hook testing utilities
- **Utils**: Jest for utility functions
- **Contracts**: Hardhat testing framework

### Integration Testing

- **Web3 Integration**: Test with local blockchain
- **API Integration**: Mock external services
- **User Flows**: End-to-end testing with Playwright

### Contract Testing

```bash
cd packages/contracts
npx hardhat test
npx hardhat coverage
## 📦 Build & Deployment

### Build Process
# Type checking
pnpm type-check

# Linting
pnpm lint

# Build production bundle
pnpm build

# Analyze bundle size
pnpm analyze
### Deployment Pipeline
1. Development: Auto-deploy from feature branches
2. Staging: Auto-deploy from develop branch
3. Production: Manual deploy from main branch

### Contract Deployment
# Deploy to testnet
npx hardhat run scripts/deployHeartNFTV3.ts --network arbitrumGoerli

# Deploy to mainnet
npx hardhat run scripts/deployHeartNFTV3.ts --network arbitrum

# Verify contracts
npx hardhat verify --network arbitrum <CONTRACT_ADDRESS>
## 🔍 Code Quality & Standards

### TypeScript Configuration
- Strict Mode: Enabled for type safety
- Path Mapping: Clean import statements
- Type Definitions: Comprehensive type coverage

### Code Organization
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── config/             # Configuration files
├── contexts/           # React contexts
└── app/                # Next.js app router pages
### Performance Optimization
- Code Splitting: Automatic with Next.js
- Image Optimization: Next.js Image component
- Bundle Analysis: Regular size monitoring
- Caching Strategy: Aggressive caching for static assets

## 🛡️ Security Considerations

### Smart Contract Security
- Access Control: Proper role-based permissions
- Input Validation: Comprehensive parameter checking
- Reentrancy Protection: OpenZeppelin ReentrancyGuard
- Overflow Protection: SafeMath for arithmetic operations

### Frontend Security
- Environment Variables: Sensitive data protection
- Input Sanitization: XSS prevention
- API Security: Rate limiting and validation
- Wallet Security: Secure connection handling

## 🔧 Troubleshooting

### Common Issues
1. Contract Connection Failures
   - Check network configuration
   - Verify contract addresses
   - Ensure wallet is connected to correct network

2. IPFS Upload Failures
   - Verify Pinata JWT token
   - Check file size limits
   - Implement retry logic

3. Transaction Failures
   - Check gas limits
   - Verify token balances
   - Handle user rejections gracefully

### Debug Tools
- Network Status: Real-time connection monitoring
- Pricing Debug Panel: Contract pricing verification
- Console Logging: Comprehensive error tracking

## 📈 Performance Monitoring

### Key Metrics
- Page Load Time: < 2 seconds target
- Contract Call Time: < 5 seconds target
- Error Rate: < 0.1% target
- User Engagement: Track completion rates

### Monitoring Tools
- Vercel Analytics: Built-in performance monitoring
- Web Vitals: Core web vitals tracking
- Custom Metrics: Business-specific KPIs

```

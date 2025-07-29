# 🚀 Phase 2: Arbitrum Mainnet Deployment Guide

## Overview

Phase 2 deploys the LUB Token and Heart NFT contracts to Arbitrum Mainnet, enabling the full token economics and NFT minting functionality.

## 🔧 Prerequisites

### 1. Environment Setup
Ensure you have the following in your `.env.local`:

```env
# Required for deployment
PRIVATE_KEY=your_private_key_here
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc

# Will be populated after deployment
NEXT_PUBLIC_LUB_TOKEN_ADDRESS=
NEXT_PUBLIC_HEART_NFT_ADDRESS=

# Feature flags (enable after deployment)
NEXT_PUBLIC_ENABLE_ONCHAIN=true
NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS=true
NEXT_PUBLIC_ENABLE_NFT_MINTING=true
NEXT_PUBLIC_ENABLE_SOCIAL_EARNING=true
```

### 2. Wallet Requirements
- **ETH Balance**: At least 0.01 ETH on Arbitrum for gas fees
- **Private Key**: Secure private key for deployment account
- **RPC Access**: Arbitrum mainnet RPC endpoint

### 3. Contract Dependencies
```bash
cd packages/contracts
npm install
```

## 📋 Deployment Steps

### Step 1: Pre-deployment Checks

```bash
# Check your wallet balance
npx hardhat run scripts/checkBalance.ts --network arbitrum

# Verify network configuration
npx hardhat console --network arbitrum
```

### Step 2: Deploy Contracts

```bash
cd packages/contracts
npx hardhat run scripts/deployArbitrumMainnet.ts --network arbitrum
```

**Expected Output:**
```
🚀 Deploying to Arbitrum Mainnet...
Deploying contracts with account: 0x...
Account balance: 0.05 ETH

📄 Deploying LUB Token...
✅ LUB Token deployed to: 0x...
Total LUB supply: 10,000,000,000

💎 Deploying Heart NFT...
✅ Heart NFT deployed to: 0x...

⚙️ Setting up initial configuration...
✅ NFT mint price set to: 0.001 ETH
✅ LUB discount set to: 50 %
✅ Transferred 1,000 LUB to deployer for testing

🎉 Deployment Complete!
```

### Step 3: Update Environment Variables

Copy the contract addresses from the deployment output:

```env
NEXT_PUBLIC_LUB_TOKEN_ADDRESS=0x... # From deployment output
NEXT_PUBLIC_HEART_NFT_ADDRESS=0x...  # From deployment output
NEXT_PUBLIC_ENABLE_ONCHAIN=true
NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS=true
NEXT_PUBLIC_ENABLE_NFT_MINTING=true
NEXT_PUBLIC_ENABLE_SOCIAL_EARNING=true
```

### Step 4: Verify Contracts

```bash
# Verify LUB Token
npx hardhat verify --network arbitrum <LUB_TOKEN_ADDRESS> "10000000000000000000000000000"

# Verify Heart NFT
npx hardhat verify --network arbitrum <HEART_NFT_ADDRESS> "<LUB_TOKEN_ADDRESS>"
```

### Step 5: Test Integration

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test the complete flow:**
   - Connect wallet to Arbitrum
   - Check LUB balance display
   - Create a game (should show pricing)
   - Complete a game and try NFT minting
   - Play social games and earn LUB

## 🎯 Contract Configuration

### LUB Token Economics
- **Total Supply**: 10 billion LUB
- **Decimals**: 18
- **Farcaster Hold Requirement**: 50 LUB
- **Romance Base Cost**: 10 LUB (progressive)
- **Social Game Reward**: 3 LUB
- **Photo Inclusion Reward**: 10 LUB

### Heart NFT Settings
- **Base Mint Price**: 0.001 ETH
- **LUB Discount**: 50% off ETH price
- **LUB Cost for Discount**: 50 LUB (same as hold requirement)

## 🔍 Verification & Testing

### Contract Verification
After deployment, verify on Arbiscan:
- LUB Token: `https://arbiscan.io/address/<LUB_TOKEN_ADDRESS>`
- Heart NFT: `https://arbiscan.io/address/<HEART_NFT_ADDRESS>`

### Frontend Testing Checklist
- [ ] Wallet connects to Arbitrum
- [ ] LUB balance displays correctly
- [ ] Game creation shows pricing
- [ ] First game is free
- [ ] Subsequent games show hold/spend requirements
- [ ] Social games award LUB tokens
- [ ] NFT minting works with ETH
- [ ] NFT minting works with LUB discount
- [ ] Earning notifications appear
- [ ] User progression tracks correctly

### User Experience Testing
- [ ] **Newcomer Flow**: Demo → Social → First free game
- [ ] **Engaged Flow**: Multiple games → Pricing display → Wallet connection
- [ ] **Web3 Flow**: Connected wallet → LUB earning → NFT minting

## 🛡️ Security Considerations

### Contract Security
- **Ownership**: Consider transferring to multisig
- **Upgradability**: Contracts are not upgradeable (by design)
- **Access Control**: Only owner can set pricing parameters

### Frontend Security
- **Private Keys**: Never commit to version control
- **RPC Endpoints**: Use secure, rate-limited endpoints
- **User Funds**: Users maintain custody of tokens/NFTs

## 📊 Monitoring & Analytics

### On-Chain Metrics
- LUB token transfers and balances
- NFT minting frequency and revenue
- Game creation patterns
- User engagement with token features

### Off-Chain Metrics
- User progression through tiers
- Feature adoption rates
- Conversion from Web2 to Web3
- Social game participation

## 🚨 Troubleshooting

### Common Issues

**"Insufficient ETH balance"**
- Ensure deployer has enough ETH for gas
- Arbitrum gas is cheap but still required

**"Contract verification failed"**
- Check constructor parameters match exactly
- Ensure using correct compiler version

**"LUB balance not showing"**
- Verify contract address in environment
- Check wallet is connected to Arbitrum
- Confirm user has LUB tokens

**"NFT minting fails"**
- Check ETH balance for gas + mint price
- Verify LUB balance for discount option
- Ensure game hasn't been minted already

### Debug Commands

```bash
# Check contract deployment
npx hardhat console --network arbitrum
> const token = await ethers.getContractAt("LubToken", "0x...")
> await token.totalSupply()

# Check user balance
> await token.balanceOf("0x...")

# Check NFT contract
> const nft = await ethers.getContractAt("HeartNFT", "0x...")
> await nft.mintPrice()
```

## 🎉 Success Criteria

Phase 2 is complete when:
- ✅ Contracts deployed and verified on Arbitrum
- ✅ Frontend shows pricing and LUB balances
- ✅ Users can earn LUB from social games
- ✅ Users can create games with token requirements
- ✅ Users can mint NFTs with ETH or LUB discount
- ✅ All user progression tracking works
- ✅ Earning notifications display correctly

## 🔄 Next Steps (Phase 3)

After successful Phase 2 deployment:
1. **Monitor Usage**: Track user adoption and token circulation
2. **Optimize Pricing**: Adjust costs based on user behavior
3. **Add Features**: Implement advanced social features
4. **Scale**: Consider additional chains or features
5. **Community**: Build LUB token holder community

The system is now fully functional with real token economics on Arbitrum Mainnet!

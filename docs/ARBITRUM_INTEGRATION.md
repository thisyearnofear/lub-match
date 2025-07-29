# 🚀 Arbitrum Integration: $LUB Token & Heart NFTs

## 🎯 Overview

This implementation adds two key Arbitrum features to the Lubber's Game:

1. **💎 Heart NFTs**: Mint completed heart layouts as permanent NFTs
2. **🪙 $LUB Token**: Utility token for game creation and NFT discounts

## 🏗️ Architecture

### Smart Contracts

#### LubToken.sol
- **ERC20 token** with utility mechanics
- **Dynamic pricing**: Game creation cost increases 10% per game created globally
- **Inclusion rewards**: Users earn 10 LUB when their images are used in games
- **Mint discounts**: 50% off NFT minting when paying with LUB

#### HeartNFT.sol
- **ERC721 NFT** representing completed heart games
- **Unique game data**: Stores images, layout, message, and completion metadata
- **Dual payment**: Accept ETH or ETH+LUB with discount
- **Anti-duplicate**: Prevents minting the same game twice

### Frontend Integration

#### Hooks
- `useLubToken()`: Manage LUB balance, spending, and pricing
- `useHeartNFT()`: Handle NFT minting and game validation

#### Components
- `HeartNFTMinter`: Modal for minting completed hearts
- Updated `ValentinesProposal`: Includes NFT minting option

## 🎮 User Experience

### Game Creation Flow
1. **Pay with LUB**: Spend LUB tokens to create games (cost increases over time)
2. **Earn LUB**: Get rewarded when others use your images in their games
3. **Mint Hearts**: Turn completed games into permanent NFTs

### NFT Minting Flow
1. **Complete Game**: Finish the heart-matching game
2. **View Proposal**: See the romantic proposal
3. **Mint Option**: Click "💎 Mint as NFT" button
4. **Choose Payment**: Pay with ETH or get 50% discount with LUB
5. **Permanent Memory**: Own the completed heart forever on Arbitrum

## 🛠️ Implementation Details

### Token Economics

```typescript
// Base game creation cost: 100 LUB
// Increases 10% per game created globally
const currentCost = baseCost * (1.1 ^ totalGamesCreated)

// Inclusion reward: 10 LUB per image used
const reward = 10 * numberOfImagesUsed

// NFT mint discount: 50% off when paying with LUB
const discountedPrice = ethPrice * 0.5
```

### Data Structure

```typescript
interface HeartData {
  imageHashes: string[];     // IPFS hashes of 8 images
  layout: number[];          // 16-slot heart layout
  message: string;           // Custom message
  completedAt: bigint;       // Completion timestamp
  creator: address;          // Game creator
  completer: address;        // Game completer
  gameType: "custom" | "demo";
  metadataURI: string;       // IPFS metadata
}
```

## 🚀 Deployment

### Prerequisites
```bash
# Install dependencies
cd packages/contracts
npm install

# Set environment variables
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_private_key
```

### Deploy Contracts
```bash
# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deployArbitrum.ts --network arbitrumSepolia

# Verify contracts
npx hardhat verify --network arbitrumSepolia <LUB_TOKEN_ADDRESS>
npx hardhat verify --network arbitrumSepolia <HEART_NFT_ADDRESS> <LUB_TOKEN_ADDRESS>
```

### Frontend Configuration
```env
# Add to .env.local
NEXT_PUBLIC_LUB_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_HEART_NFT_ADDRESS=0x...
```

## 🎯 Benefits

### For Users
- **Permanent Memories**: NFTs preserve completed hearts forever
- **Earning Mechanism**: Get rewarded for contributing images
- **Cost Efficiency**: Save 50% on minting with LUB tokens
- **Gamification**: Dynamic pricing creates urgency and value

### For Platform
- **Token Utility**: Clear use cases drive LUB demand
- **Network Effects**: Users incentivized to include others
- **Revenue Model**: Platform can earn from transaction fees
- **Community Building**: Shared token economy creates engagement

## 🔮 Future Enhancements

### Phase 2: Advanced Features
- **Staking Rewards**: Stake LUB for bonus rewards
- **Governance**: Vote on platform features with LUB
- **Cross-Chain**: Bridge LUB to other networks
- **Marketplace**: Trade Heart NFTs

### Phase 3: Social Features
- **Leaderboards**: On-chain rankings and achievements
- **Tournaments**: Competitive events with LUB prizes
- **Collaborations**: Multi-user heart creations
- **Farcaster Frames**: Embedded minting in social feeds

## 🧪 Testing

### Local Testing
```bash
# Start local hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deployArbitrum.ts --network localhost

# Run frontend with local contracts
npm run dev
```

### Testnet Testing
1. Get Arbitrum Sepolia ETH from faucet
2. Deploy contracts to testnet
3. Test full user flow
4. Verify gas costs and performance

## 📊 Metrics to Track

### Token Metrics
- Total LUB supply and distribution
- Game creation cost over time
- Inclusion rewards distributed
- Mint discount usage

### NFT Metrics
- Total hearts minted
- Unique vs repeat minters
- Payment method preferences
- Gas cost optimization

### User Metrics
- Game completion rates
- NFT minting conversion
- Token earning patterns
- Cross-feature usage

## 🔒 Security Considerations

### Smart Contract Security
- **Access Control**: Only authorized contracts can mint/burn
- **Reentrancy Protection**: Safe external calls
- **Integer Overflow**: Using Solidity 0.8+ built-in protection
- **Duplicate Prevention**: Game hash uniqueness checks

### Frontend Security
- **Input Validation**: Sanitize all user inputs
- **Transaction Simulation**: Preview costs before execution
- **Error Handling**: Graceful failure modes
- **Rate Limiting**: Prevent spam transactions

## 🎉 Conclusion

This Arbitrum integration transforms Lubber's Game from a simple memory game into a comprehensive social gaming platform with:

- **Real Economic Value**: LUB tokens with clear utility
- **Permanent Memories**: NFTs that last forever
- **Network Effects**: Users benefit from including others
- **Scalable Economics**: Dynamic pricing and rewards

The modular architecture ensures easy extension while maintaining the clean, performant codebase that makes the platform delightful to use.

Ready to deploy and start building the future of social gaming on Arbitrum! 🚀
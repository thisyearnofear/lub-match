# Agent.md - Valentine's Memory Game Project

## Project Overview

This is a **Valentine's Memory Game** - a romantic, interactive web application that creates a heart-shaped memory card game where users match photo pairs. Upon completion, it reveals a Valentine's proposal with beautiful animations, fireworks, and playful interactions.

### Key Features
- 🎮 Heart-shaped memory card game layout (16 cards from 8 pairs)
- 💝 Custom photo upload and game creation
- 🎆 Romantic proposal screen with fireworks animation
- 📱 Fully responsive design with mobile-first approach
- 🔗 Shareable game links via IPFS decentralized storage
- ⛓️ Optional on-chain proof minting on Base network
- 🎨 Beautiful animations with Framer Motion
- 💫 Playful "No" button that moves away when hovered

## Technical Stack

### Frontend
- **Next.js 15** (App Router) - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations and transitions
- **@fireworks-js/react** - Celebration effects

### Backend & Storage
- **Next.js API Routes** - Backend endpoints
- **Web3.Storage** - IPFS decentralized file storage
- **Vercel** - Deployment platform

### Blockchain Integration
- **Wagmi** - React hooks for Ethereum
- **RainbowKit** - Wallet connection UI
- **Viem** - Ethereum client
- **Base & Base Sepolia** - Target networks

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **pnpm** - Package manager

## Project Structure

```
valentines-game/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   └── createGame/     # Game creation API endpoint
│   │   ├── create/             # Game creation page
│   │   ├── game/[cid]/         # Dynamic game playing page
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Homepage (default game)
│   ├── components/
│   │   ├── PhotoPairGame.tsx   # Main game component
│   │   ├── ValentinesProposal.tsx # Proposal screen
│   │   └── TextFooter.tsx      # Game instructions
│   ├── data/
│   │   └── defaultGame.ts      # Default images and messages
│   ├── hooks/
│   │   ├── useMiniAppReady.ts  # Farcaster Frame integration
│   │   └── usePublishGame.ts   # Blockchain publishing hook
│   ├── utils/
│   │   └── ipfs.ts            # IPFS upload utilities
│   └── wallet/
│       └── wagmiConfig.ts      # Web3 configuration
├── public/
│   ├── game-photos/           # Default game images (1-36.avif)
│   ├── hamster_jumping.gif    # Success animation
│   └── sad_hamster.png        # Proposal screen image
└── packages/                   # Additional packages (if any)
```

## Core Components

### 1. PhotoPairGame.tsx
- **Purpose**: Main memory game logic and UI
- **Features**:
  - Heart-shaped grid layout (7x6 grid with strategic null cells)
  - Card flip animations with Framer Motion
  - Match detection and visual feedback (green for correct, red for incorrect)
  - Responsive design with dynamic cell sizing
  - Image preloading for smooth performance

### 2. ValentinesProposal.tsx
- **Purpose**: Romantic proposal screen after game completion
- **Features**:
  - Multi-step reveal animation (3 steps over 15 seconds)
  - Background photo grid overlay
  - Fireworks celebration on "Yes"
  - Playful "No" button that moves randomly on hover
  - Custom message support

### 3. Game Creation Flow (/create)
- **Purpose**: Allow users to create custom games
- **Features**:
  - Drag & drop photo upload (8 pairs + 36 optional reveal images)
  - Custom proposal message input
  - IPFS upload via Web3.Storage
  - Optional on-chain proof minting
  - Shareable link generation

## Data Flow

### Game Creation
1. User uploads 8 photos (pairs) + optional 36 reveal photos
2. Files uploaded to IPFS via Web3.Storage
3. Metadata JSON created with file references
4. CID (Content Identifier) returned as game ID
5. Optional: Publish proof on Base blockchain
6. Shareable URL: `/game/[cid]`

### Game Playing
1. Load metadata from IPFS using CID
2. Fetch images from IPFS gateway
3. Shuffle and display memory game
4. Track matches and completion
5. Show proposal screen on completion

## Environment Variables

```bash
# Required for game creation
WEB3_STORAGE_TOKEN=your_web3_storage_token

# Optional for on-chain features
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_ENABLE_ONCHAIN=true
```

## Key Algorithms

### Heart Layout
The game uses a predefined 7x6 grid with strategic null positions to create a heart shape:
```typescript
const heartLayout: CellType[][] = [
  [null, 0, 1, null, 2, 3, null],
  [4, 5, 6, 7, 8, 9, 10],
  [null, 11, 12, 13, 14, 15, null],
  [null, null, "deco", "deco", "deco", null, null],
  [null, null, null, "deco", null, null, null],
  [null, null, null, null, null, null, null],
];
```

### Shuffle Algorithm
Fisher-Yates shuffle for random card distribution:
```typescript
const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
```

## Development Workflow

### Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Adding New Features
1. **UI Components**: Add to `src/components/`
2. **API Endpoints**: Add to `src/app/api/`
3. **Utilities**: Add to `src/utils/`
4. **Types**: Define in component files or separate `.d.ts` files

## Performance Considerations

### Image Optimization
- Uses Next.js Image component with proper `sizes` attributes
- AVIF format for smaller file sizes
- Preloading for smooth card flips
- Progressive loading with placeholder states

### Animation Performance
- Hardware-accelerated CSS transforms
- Framer Motion with optimized spring animations
- Strategic use of `will-change` properties
- Minimal DOM manipulations during gameplay

## Security Considerations

### IPFS Content
- All uploaded content is public on IPFS
- No sensitive data should be uploaded
- Content addressing prevents tampering

### Blockchain Integration
- Uses established patterns (Wagmi + RainbowKit)
- Minimal smart contract interaction
- Gas-optimized transactions

## Deployment

### Vercel (Recommended)
- Automatic deployments from Git
- Environment variables via dashboard
- Edge functions for API routes

### Other Platforms
- Requires Node.js runtime for API routes
- Environment variables must be configured
- Build step: `pnpm build`

## Troubleshooting

### Common Issues
1. **Images not loading**: Check IPFS gateway availability
2. **Wallet connection fails**: Verify network configuration
3. **Game creation fails**: Check Web3.Storage token
4. **Animations choppy**: Reduce motion preferences or hardware limitations

### Debug Tools
- Browser DevTools for performance profiling
- React DevTools for component debugging
- Network tab for IPFS request monitoring

## Future Enhancement Ideas

### Gameplay
- Multiple difficulty levels (different grid sizes)
- Timer challenges
- Multiplayer support
- Sound effects and music

### Technical
- Progressive Web App (PWA) support
- Offline gameplay capability
- Advanced image processing
- NFT integration for game results

### Social
- Leaderboards
- Social sharing improvements
- Template gallery
- Community features

## Contributing Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing Tailwind CSS patterns
- Implement proper error handling
- Add comments for complex logic

### Testing
- Test on multiple devices and browsers
- Verify IPFS integration in production
- Test wallet connection flows
- Validate responsive design

### Pull Requests
- Include description of changes
- Update this Agent.md if architecture changes
- Ensure all environment variables are documented
- Test deployment on staging environment

---

**Last Updated**: Created during initial codebase review
**Maintainer**: Development team
**License**: MIT (as specified in package.json)
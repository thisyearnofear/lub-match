# Agent.md - Lub Match Memory Game

## Project Overview

This is a **Lub Match** - a romantic, interactive web application that creates a heart-shaped memory card game where users match photo pairs. Upon completion, it reveals a Lubbly proposal with beautiful animations, fireworks, and playful interactions.

### Key Features

- 🎮 Heart-shaped memory card game layout (16 cards from 8 pairs)
- 💝 Custom photo upload and game creation
- 🎆 Romantic proposal screen with fireworks animation
- 📱 Fully responsive design with mobile-first approach
- 🔗 Dual-mode storage: Quick Share (app-controlled) or Private Control (user-owned)
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
- **Pinata** - IPFS storage with dual-mode architecture
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
│   │   └── ipfs.ts            # Dual-mode Pinata storage utilities
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

- **Purpose**: Allow users to create custom games with dual storage modes
- **Features**:
  - Drag & drop photo upload (8 pairs + 36 optional reveal images)
  - Custom proposal message input
  - **Quick Share Mode**: App-controlled Pinata storage (permanent)
  - **Private Control Mode**: User's own Pinata API key (deletable)
  - Optional on-chain proof minting
  - Shareable link generation with storage mode indication

## Data Flow

### Game Creation

1. User selects storage mode (Quick Share or Private Control)
2. User uploads 8 photos (pairs) + optional 36 reveal photos
3. Files uploaded to Pinata IPFS based on selected mode:
   - **Quick Share**: Uses app's Pinata account (permanent storage)
   - **Private Control**: Uses user's Pinata API key (user can delete)
4. Metadata JSON created with file references and storage mode
5. CID (Content Identifier) returned as game ID
6. Optional: Publish proof on Base blockchain
7. Shareable URL: `/game/[cid]` with storage mode indication

### Game Playing

1. Load metadata from IPFS using CID
2. Fetch images from Pinata gateway (with IPFS fallback)
3. Shuffle and display memory game
4. Track matches and completion
5. Show proposal screen on completion
6. Display storage mode info (deletable vs permanent)

## Environment Variables

```bash
# Required for Quick Share mode
PINATA_JWT=your_pinata_jwt_token

# Optional for on-chain features
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_ENABLE_ONCHAIN=true

# Auto-configured by deployment platform
VERCEL_URL=your-app.vercel.app
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

### Security Considerations

### Storage Modes

- **Quick Share**: Content is permanent and publicly accessible
- **Private Control**: Users maintain deletion rights via their Pinata account
- All IPFS content is publicly accessible with the CID
- No sensitive data should be uploaded without understanding permanence

### Blockchain Integration

- Uses established patterns (Wagmi + RainbowKit)
- Minimal smart contract interaction
- Gas-optimized transactions

## Design System

### Comprehensive Overview
A unified, romantic design system that consolidates inconsistent patterns into reusable, delightful components. Follows **ENHANCEMENT FIRST** principle by maximizing reusability and minimizing code duplication. All design decisions centralized in semantic design tokens with micro-interactions for delightful user experiences.

### Core Infrastructure

#### Design Tokens (`src/theme/designTokens.ts`)
Single source of truth for all design decisions with semantic naming:

**Colors:**
- `colors.primary[50-600]` - Romantic pink/rose (brand: #ec4899 main)
- `colors.secondary[50-600]` - Playful purple/blue (accent)
- `colors.success` - Green (#10b981) for positive feedback
- `colors.error` - Red (#ef4444) for errors
- `colors.warning` - Amber (#f59e0b) for warnings
- `colors.neutral[0-900]` - Grayscale (text, borders, backgrounds)

**Spacing:** 4px unit grid via `spacing[1-16]` (4px, 8px, 12px, 16px, etc.)

**Typography:**
- `typography.fontFamily.display` - Playfair Display (romantic serif)
- `typography.fontFamily.body` - System fonts (accessible)
- `typography.fontFamily.mono` - Monaco/Menlo (code)
- `typography.fontSize.xs` through `typography.fontSize.4xl`
- `typography.fontWeight.normal|semibold|bold`

**Shadows:** `shadows.sm|base|md|lg|glow|glow-lg`

**Borders:** `borderRadius.xs|sm|md|lg|xl|full`

**Transitions:**
- Durations: `transitions.duration.fastest|base|slow|slowest`
- Easings: `transitions.easing.linear|easeInOut|bounce|elastic`
- Utility: `transitions.property(duration, easing)`

**Z-Index Scale:** `zIndex.hide|base|dropdown|sticky|fixed|modal|notification|floating`

**Component Variants:**
- `componentVariants.button` → {primary, secondary, ghost, gradient, danger}
- `componentVariants.card` → {base, hovered, selected}
- `componentVariants.input` → {base, focus, error}
- `componentVariants.notification` → {success, error, info, warning}

**Animations:** Reusable Framer Motion variants for consistent motion

### Micro-Interactions (`src/hooks/useMicroInteractions.ts`)
Reusable celebration & feedback patterns with haptic + sound + visual feedback:

```typescript
const { trigger, triggerHaptic, playSound } = useMicroInteraction();

trigger({
  type: 'success|error|info|celebration|heartbeat|bounce|glow',
  haptic: true,  // Mobile vibration (light|medium|heavy)
  sound: true,   // Web Audio API tones
  duration: 600,
  callback: () => {},
});
```

**Animation Sequences** (Framer Motion variants via `interactionSequences`):
- `successMatch` - Scale + glow for card matches
- `errorShake` - Shake for mismatches
- `cardReveal` - Spring bounce reveal
- `uploadSuccess` - Celebration on file add
- `friendAdded` - Spring animation for friend selection
- `glowPulse` - Continuous glow (CTAs)
- `spin` - Loading spinner
- `float` - Gentle floating motion
- `burst` - Celebratory burst
- `fadeIn` - Simple opacity fade
- `fadeInUp` - Fade + slide up
- `scaleIn` - Zoom from small
- `pulse` - Infinite subtle pulse
- `bounce` - Infinite bouncing
- `heartbeat` - Love-themed pulse
- `shimmer` - Loading shimmer
- `slideInRight` / `slideInLeft` - Directional slides

### Unified UI Components

**Button** (`src/components/shared/Button.tsx`)
- Consolidates: ActionButton + PrimaryButton + custom button styles (5+ patterns → 1)
- Variants: `primary|secondary|ghost|gradient|danger`
- Sizes: `sm|base|lg` (WCAG 44px minimum)
- Props: `loading`, `icon`, `microInteraction`, `fullWidth`
- Built-in accessibility (focus states, semantic HTML)
```typescript
<Button variant="primary" size="lg" microInteraction={true}>
  Create Lub 💝
</Button>
```

**Notification** (`src/components/shared/Notification.tsx`)
- Consolidates: Toast + Alert + ErrorMessage patterns (3+ patterns → 1)
- Types: `success|error|info|warning`
- Features: Auto-dismiss, progress bar, actions, romantic messaging
- Global management via `NotificationProvider` + `useNotification()`
- Romantic messages with emoji (💝 Perfect match, 💔 Oops, etc)
```typescript
const { showNotification } = useNotification();
showNotification({
  type: 'success',
  message: 'Perfect match! 💝',
  romantic: true,
  duration: 3000,
});
```

**EnhancedDropzone** (`src/components/shared/EnhancedDropzone.tsx`)
- Consolidates: Old DropzoneField component with enhanced features
- Features: Drag-drop animations, celebration micro-interactions, compression feedback
- Props: `files`, `setFiles`, `maxFiles`, `label`, `hint`, `celebration`
```typescript
<EnhancedDropzone
  files={photos}
  setFiles={setPhotos}
  maxFiles={8}
  label="💕 Upload Your Love Story"
  celebration={true}
/>
```

### Enhanced Components

**FarcasterUsernameInput** (`src/components/FarcasterUsernameInput.tsx`)
- **Fixed**: Property name mismatch (follower_count → followerCount)
- **Enhanced**: Design token integration + micro-interactions
- Features: Search celebrations, improved styling, follower badges
- Visual polish with smooth animations for friend selection

**Create Page** (`src/app/create/page.tsx`)
- **Updated**: Uses `EnhancedDropzone` instead of `DropzoneField`
- **Messaging**: Romantic labels and hints throughout
- **Enhanced**: Consistent design token application

### Implementation Guidelines

**1. Use Design Tokens (Never Hardcode Values)**
```typescript
// ✅ Good
import { colors, spacing, borderRadius } from '@/theme/designTokens';
style={{ padding: spacing[4], color: colors.primary[400], borderRadius: borderRadius.lg }}

// ❌ Bad
style={{ padding: '16px', color: '#ec4899', borderRadius: '16px' }}
```

**2. Use Unified Components for Consistency**
```typescript
// ✅ Good - Button component
<Button variant="primary" onClick={handleSubmit}>Action</Button>

// ✅ Good - Notification system
const { showNotification } = useNotification();
showNotification({ type: 'success', message: 'Done!', romantic: true });

// ❌ Bad - Custom implementations
<button style={{ background: '#ec4899' }}>Action</button>
```

**3. Trigger Micro-Interactions for Delight**
```typescript
const { trigger } = useMicroInteraction();
trigger({ type: 'success', haptic: true, sound: true });
```

**4. Apply Animation Sequences Consistently**
```typescript
import { interactionSequences } from '@/hooks/useMicroInteractions';
<motion.div variants={interactionSequences.uploadSuccess}>Content</motion.div>
```

### File Structure
```
src/
├── theme/
│   └── designTokens.ts              # Single source of truth for design tokens
├── hooks/
│   └── useMicroInteractions.ts      # Celebrations & feedback patterns
└── components/shared/
    ├── Button.tsx                   # Unified button (replaces 5+ patterns)
    ├── Notification.tsx             # Unified notification (replaces 3+ patterns)
    └── EnhancedDropzone.tsx         # Enhanced file upload with animations
```

### Architecture Principles

**Single Source of Truth (DRY Principle)**
- All colors centralized in `colors` object
- All spacing uses `spacing` utility
- All animations use `animations` or `interactionSequences`
- All transitions use `transitions` utility

**ENHANCEMENT FIRST**
- No new UI patterns created—consolidated existing ones
- 5+ button components → 1 unified Button component
- 3+ notification patterns → 1 unified Notification component
- 1 old dropzone → 1 enhanced dropzone with animations

**Reusability Over Uniqueness**
- `interactionSequences` are Framer Motion variants reused across components
- `hapticPatterns` are standardized vibration feedback
- `componentVariants` pre-configured for buttons, cards, inputs, notifications

**Accessibility Built-in**
- WCAG 44px minimum touch targets
- Focus ring styling with `a11y.focusRing`
- Proper semantic HTML in all components
- Keyboard navigation support maintained

### Performance Impact

**Reduced JavaScript**
- Removed duplicate button/notification code
- Single dropzone implementation instead of duplicates
- Shared animation utilities reduce bundle size

**Optimized Animations**
- Hardware-accelerated CSS transforms
- Framer Motion spring animations with optimized parameters
- Web Audio API replaces audio files for sound effects

**No Runtime Overhead**
- Design tokens are compile-time constants
- Animation sequences are pre-defined variants
- No computed values or dynamic calculations

### Integration Checklist & Next Steps

**Immediate Actions (Phase 1)**
1. Test create page file uploads with EnhancedDropzone
2. Verify FarcasterUsernameInput fixes work in production
3. Check build passes with new components
4. Mobile testing on real devices

**Wider Adoption (Phase 2)**
1. Replace all custom buttons with Button component
2. Replace all toast/alert patterns with Notification
3. Add NotificationProvider to layout.tsx
4. Update all toast imports
5. Convert error messages to romantic style

**Polish & Consistency (Phase 3)**
1. Update all spacing to use `spacing` tokens
2. Ensure all colors use design tokens
3. Apply micro-interactions to key user actions
4. Romantic messaging across all feedback

### Detailed Documentation
For more detailed information about each component, see the following files in the docs directory:
- `docs/design-system/DESIGN_SYSTEM_IMPLEMENTATION.md` - Complete implementation details
- `docs/design-system/DESIGN_TOKENS_QUICK_REF.md` - Developer quick reference
- `docs/design-system/INTEGRATION_CHECKLIST.md` - Rollout strategy and success criteria

### Design Ethos
✅ **Romantic** - Romantic messaging, delightful animations, emoji usage throughout
✅ **Playful** - Celebration micro-interactions, bouncy animations, fun transitions
✅ **Accessible** - WCAG 44px+ touch targets, focus states, keyboard navigation
✅ **Consistent** - Single source of truth for all design decisions
✅ **Performant** - Hardware-accelerated animations, compiled constants
✅ **Modular** - Reusable components and animation sequences

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

1. **Images not loading**: Check Pinata gateway availability and IPFS fallback
2. **Wallet connection fails**: Verify network configuration
3. **Game creation fails**: Check Pinata JWT token or user API key
4. **Animations choppy**: Reduce motion preferences or hardware limitations
5. **Private mode fails**: Verify user's Pinata API key permissions

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
- Offline gameplay capability for cached games
- Advanced image processing and optimization
- NFT integration for game results
- Batch upload for multiple games
- Advanced Pinata management dashboard

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

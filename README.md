# 💝 Lub Match - The Ultimate Valentine's Memory Game

A romantic heart-shaped memory card game with Web3 token economics, NFT minting, and social features. Built for love, powered by blockchain.

![Demo Preview](public/github-demo.gif)

## 🌟 **What Makes Lub Match Special**

### 🎮 **Core Game Experience**

- **Heart-shaped memory game** with romantic card matching
- **Custom photo uploads** - use your own memories
- **Personal messages** - add romantic touches
- **Beautiful animations** - smooth, delightful interactions
- **Mobile-first design** - perfect on any device

### 🚀 **Web3 Features**

- **LUB Token Economics** - earn and spend tokens for game creation
- **NFT Minting** - immortalize completed games as NFTs
- **Progressive Web3** - works great without wallet, enhanced with it
- **Arbitrum Mainnet** - low gas fees, fast transactions

### 👥 **Social Features**

- **Farcaster Integration** - connect with friends
- **Social Games** - username guessing challenges
- **Viral Sharing** - spread the love across platforms
- **Achievement System** - track your lub journey

## 🎯 **How It Works**

### **For Newcomers**

```
Demo Game → Mint Heart NFT → Social Games → "First lub FREE!" → Create & Share
```

### **For Web3 Users**

```
Connect Wallet → Earn LUB → Create Games → Mint NFTs → Build Collection
```

## 🚀 **Live Demo**

Experience Lub Match: [https://valentines-proposal-visibait.vercel.app](https://valentines-proposal-visibait.vercel.app)

## 🛠️ **Tech Stack**

### **Frontend**

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Wagmi + Viem** - Web3 React hooks

### **Blockchain**

- **Arbitrum Mainnet** - Layer 2 for low gas fees
- **Smart Contracts** - LUB Token (ERC-20) + Heart NFT (ERC-721)
- **RainbowKit** - Beautiful wallet connection
- **IPFS** - Decentralized metadata storage

### **Social & APIs**

- **Neynar API** - Farcaster integration
- **Pinata** - IPFS pinning service
- **Analytics** - User progression tracking

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+ and pnpm
- Neynar API key (for Farcaster features)
- Pinata JWT (for IPFS storage)

### **Installation**

```bash
# Clone the repository
git clone https://github.com/thisyearnofear/valentines-game.git
cd valentines-game

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
pnpm dev
```

### **Environment Setup**

```env
# Required for Farcaster features (server-side only, secure)
NEYNAR_API_KEY=your_neynar_api_key

# Required for IPFS storage
PINATA_JWT=your_pinata_jwt

# Smart contract addresses (Arbitrum Mainnet)
NEXT_PUBLIC_LUB_TOKEN_ADDRESS=0xc51065eCBe91E7DbA69934F37130DCA29E516189
NEXT_PUBLIC_HEART_NFT_ADDRESS=0x18082d110113B40A24A41dF10b4b249Ee461D3eb

# Feature flags
NEXT_PUBLIC_ENABLE_ONCHAIN=true
NEXT_PUBLIC_ENABLE_TOKEN_ECONOMICS=true
NEXT_PUBLIC_ENABLE_NFT_MINTING=true
NEXT_PUBLIC_ENABLE_SOCIAL_EARNING=true
```

## Prerequisites 📋

- Node.js (v18.18.0 or higher)
- npm or yarn
- Git

## Getting Started 🚀

1. Clone the repository:

```bash
git clone https://github.com/visibait/lub-match.git
cd lub-match
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Replace the photos:

   - Navigate to the `public/game-photos` directory
   - Replace the existing images (1.avif through 36.avif) with your own photos
   - Make sure to keep the same naming convention
   - Use photos of you and your partner together!

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Customization 🎨

### Changing Photos

- Add your photos to `public/game-photos/`
- Name them from 1.avif to 36.avif
- For best results, use square images of the same size
- Convert your images to .avif format for better performance

### Modifying Text

- Edit proposal messages in `components/ValentinesProposal.tsx`
- Change game instructions in `components/TextFooter.tsx`

### Styling

- The project uses Tailwind CSS for styling
- Modify colors, fonts, and other styles in the respective component files
- Main color schemes can be adjusted in `tailwind.config.js`

## Tech Stack 💻

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Fireworks.js](https://fireworks.js.org/)

## Contributing 🤝

Contributions are welcome! Feel free to submit issues and enhancement requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License.

## Acknowledgments 🙏

- Inspired by love and creativity
- Built with Next.js 15 App Router

## Author ✍️

visibait - [https://visibait.com]

## Donate

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/visibait)

---

Made with ❤️ to send lub

_Note: This project is meant for romantic purposes. Please use responsibly and spread love!_

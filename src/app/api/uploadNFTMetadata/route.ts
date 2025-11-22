import { NextRequest, NextResponse } from "next/server";
import { PINATA_JWT } from "@/config";
import { PinataSDK } from "pinata";
import { generateGameHash, GameHashData } from "@/utils/gameHash";

export const runtime = "nodejs";

// Heart layout matching PhotoPairGame component
const heartLayout = [
  [null, 0, 1, null, 2, 3, null],
  [4, 5, 6, 7, 8, 9, 10],
  [null, 11, 12, 13, 14, 15, null],
  [null, null, "deco", "deco", "deco", null, null],
  [null, null, null, "deco", null, null, null],
  [null, null, null, null, null, null, null],
];

/**
 * Fetches an image and converts it to a base64 data URI
 * This ensures images render correctly on marketplaces like OpenSea
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'LubMatch-NFT-Generator/1.0' }
    });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.warn(`Failed to convert image to base64: ${url}`, error);
    // Return a colorful placeholder if fetch fails
    return `data:image/svg+xml;base64,${Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100%" height="100%" fill="#be185d"/>
        <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">?</text>
      </svg>
    `).toString('base64')}`;
  }
}

interface NFTMetadataRequest {
  imageHashes: string[];
  layout: number[];
  message: string;
  completedAt: string; // ISO string
  creator: string;
  completer: string;
  gameType: "custom" | "demo";
  users?: FarcasterUser[]; // Rich user data for enhanced collectability
  gameStats?: {
    completionTime: number; // seconds
    accuracy: number; // percentage
    socialDiscoveries: number; // new profiles discovered
  };
}

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  power_badge?: boolean;
}

interface HeartNFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    imageHashes: string[];
    layout: number[];
    message: string;
    completedAt: string;
    creator: string;
    completer: string;
    gameType: "custom" | "demo";
    gameHash: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const data: NFTMetadataRequest = await req.json();

    // Validate required fields
    if (!data.imageHashes || !data.layout || !data.message || !data.creator || !data.completer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if Pinata JWT is available
    if (!PINATA_JWT) {
      return NextResponse.json(
        { error: "No Pinata API key available for metadata upload" },
        { status: 500 }
      );
    }

    // Generate game hash for uniqueness
    const hashData: GameHashData = {
      imageHashes: data.imageHashes,
      layout: data.layout,
      message: data.message,
      creator: data.creator,
      gameType: data.gameType
    };
    const gameHash = generateGameHash(hashData);

    // Create comprehensive metadata with enhanced naming and collectability
    const completedDate = new Date(data.completedAt);
    const dateString = completedDate.toISOString().split('T')[0];
    const timeString = completedDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });

    // Enhanced naming and description with rich user data
    const { nftName, nftDescription, rarityAttributes } = generateEnhancedMetadata(
      data,
      completedDate,
      dateString,
      timeString,
      gameHash
    );

    const metadata: HeartNFTMetadata = {
      name: nftName,
      description: nftDescription,
      image: await generateHeartImage(data.imageHashes, gameHash, data.layout, data.users),
      attributes: [
        {
          trait_type: "Collection Type",
          value: data.gameType === 'demo' ? 'Farcaster Trending Snapshot' : 'Custom Lub Heart'
        },
        { trait_type: "Featured Profiles", value: Math.min(data.imageHashes.length, 8) },
        { trait_type: "Capture Date", value: dateString },
        { trait_type: "Capture Time (UTC)", value: timeString },
        { trait_type: "Heart Layout", value: "Classic 16-Cell Heart" },
        { trait_type: "Creator", value: data.creator },
        { trait_type: "Completer", value: data.completer },
        { trait_type: "Self Completion", value: data.creator === data.completer ? "Yes" : "No" },
        ...rarityAttributes,
        ...(data.gameType === 'demo' ? [
          { trait_type: "Snapshot Type", value: "Trending Users" },
          { trait_type: "Social Discovery", value: "Enabled" },
          { trait_type: "Community Moment", value: "Preserved" }
        ] : [
          { trait_type: "Message Length", value: data.message.length },
          { trait_type: "Personal Message", value: "Included" }
        ]),
        ...(data.gameStats ? [
          { trait_type: "Completion Time", value: `${Math.round(data.gameStats.completionTime)}s` },
          { trait_type: "Accuracy", value: `${data.gameStats.accuracy}%` },
          { trait_type: "Social Discoveries", value: data.gameStats.socialDiscoveries }
        ] : [])
      ],
      properties: {
        imageHashes: data.imageHashes,
        layout: data.layout,
        message: data.message,
        completedAt: data.completedAt,
        creator: data.creator,
        completer: data.completer,
        gameType: data.gameType,
        gameHash
      }
    };

    // Use existing Pinata infrastructure (same as createGame route)
    const pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: "gateway.pinata.cloud"
    });

    // Create metadata file
    const metadataFile = new File(
      [JSON.stringify(metadata, null, 2)],
      `lub-match-${gameHash.substring(0, 8)}.json`,
      { type: "application/json" }
    );

    // Upload metadata using the same pattern as createGame
    const upload = await pinata.upload.public
      .file(metadataFile)
      .name(`Lub Match NFT - ${gameHash.substring(0, 8)}`)
      .keyvalues({
        type: "lub-match-nft-metadata",
        gameHash,
        lubType: data.gameType,
        lubCreator: data.creator,
        lubReceiver: data.completer,
        createdAt: new Date().toISOString()
      });

    const metadataURI = `ipfs://${upload.cid}`;

    return NextResponse.json({
      metadataURI,
      gameHash,
      success: true
    });

  } catch (error) {
    console.error("NFT metadata upload error:", error);

    let errorMessage = "Failed to upload NFT metadata";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle specific error types (same pattern as createGame)
      if (error.message.includes('413') || error.message.includes('too large')) {
        statusCode = 413;
        errorMessage = "Metadata too large. Please try again.";
      } else if (error.message.includes('timeout')) {
        statusCode = 408;
        errorMessage = "Upload timeout. Please try again.";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false
      },
      { status: statusCode }
    );
  }
}

/**
 * Generate a heart-shaped lub composite image from the Farcaster user images
 * Creates an actual heart layout matching the game experience
 */
async function generateHeartImage(imageHashes: string[], gameHash: string, layout: number[], users?: FarcasterUser[]): Promise<string> {
  try {
    // 1. Convert all image URLs to Base64
    // This is critical for NFT marketplaces to render the images inside the SVG
    const base64Images = await Promise.all(
      imageHashes.map(url => fetchImageAsBase64(url))
    );

    // 2. Generate heart composite SVG with embedded images
    const heartSvg = generateHeartSVG(
      base64Images, // Pass base64 strings instead of raw URLs
      'demo',
      new Date().toISOString(),
      users || []
    );

    // 3. Upload SVG to IPFS
    const pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: "gateway.pinata.cloud"
    });

    const svgFile = new File(
      [heartSvg],
      `heart-${gameHash.substring(0, 8)}.svg`,
      { type: "image/svg+xml" }
    );

    const upload = await pinata.upload.public
      .file(svgFile)
      .name(`Heart Composite SVG - ${gameHash.substring(0, 8)}`)
      .keyvalues({
        type: "heart-composite-svg",
        gameHash: gameHash,
        gameType: 'demo',
        createdAt: new Date().toISOString()
      });

    const imageURI = `ipfs://${upload.cid}`;
    return imageURI;
  } catch (error) {
    console.error("Error generating heart image:", error);

    // Fallback: Create a simple placeholder if generation fails
    const heartSvg = createHeartLayoutSVG(imageHashes, gameHash);
    return `data:image/svg+xml;base64,${Buffer.from(heartSvg).toString('base64')}`;
  }
}

/**
 * Create an SVG representation of the heart layout as fallback
 * This maintains the heart shape without requiring canvas dependency
 */
function createHeartLayoutSVG(imageUrls: string[], gameHash: string): string {
  const cellSize = 80;
  const gap = 4;
  const svgWidth = 7 * cellSize + 6 * gap;
  const svgHeight = 6 * cellSize + 5 * gap;

  // Heart layout matching PhotoPairGame
  const heartLayout = [
    [null, 0, 1, null, 2, 3, null],
    [4, 5, 6, 7, 8, 9, 10],
    [null, 11, 12, 13, 14, 15, null],
    [null, null, "deco", "deco", "deco", null, null],
    [null, null, null, "deco", null, null, null],
    [null, null, null, null, null, null, null],
  ];

  let svgContent = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#be185d;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
  `;

  heartLayout.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * (cellSize + gap);
      const y = rowIndex * (cellSize + gap);

      if (cell === "deco") {
        // Decorative heart cells
        svgContent += `
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                rx="8" fill="#f87171" stroke="#dc2626" stroke-width="2"/>
          <text x="${x + cellSize / 2}" y="${y + cellSize / 2}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="${cellSize * 0.4}" fill="#dc2626">💝</text>
        `;
      } else if (typeof cell === 'number' && cell < imageUrls.length) {
        // Profile image placeholder (SVG can't load external images easily)
        svgContent += `
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                rx="8" fill="#6b7280" stroke="#374151" stroke-width="2"/>
          <text x="${x + cellSize / 2}" y="${y + cellSize / 2}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="${cellSize * 0.3}" fill="#ffffff">👤</text>
        `;
      }
    });
  });

  // Add title
  svgContent += `
    <rect x="0" y="${svgHeight - 50}" width="${svgWidth}" height="50" fill="rgba(0,0,0,0.8)"/>
    <text x="${svgWidth / 2}" y="${svgHeight - 30}" text-anchor="middle"
          font-family="Arial" font-size="16" font-weight="bold" fill="white">
      Farcaster Trending Snapshot
    </text>
    <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle"
          font-family="Arial" font-size="12" fill="#d1d5db">
      ${new Date().toLocaleDateString()}
    </text>
  `;

  svgContent += '</svg>';
  return svgContent;
}

/**
 * Generate enhanced metadata with rich user data and sophisticated naming
 */
function generateEnhancedMetadata(
  data: NFTMetadataRequest,
  completedDate: Date,
  dateString: string,
  timeString: string,
  gameHash: string
) {
  if (data.gameType === 'custom') {
    return {
      nftName: `Custom Lub Heart ${gameHash.substring(0, 8)}`,
      nftDescription: `A custom lub heart featuring ${data.imageHashes.length} carefully chosen images. Message: "${data.message}" - Created on ${dateString} as a personal expression of connection and affection.`,
      rarityAttributes: []
    };
  }

  // Enhanced demo game metadata with rich user data
  const users = data.users || [];
  // Only count unique users, max 8 for the game
  const uniqueUsers = users.slice(0, 8); // Take first 8 unique users
  const uniqueCount = uniqueUsers.length;
  const usernames = uniqueUsers.map(u => `@${u.username}`); // Use only unique users
  const powerBadgeHolders = uniqueUsers.filter(u => u.power_badge).length;
  const totalFollowers = uniqueUsers.reduce((sum, u) => sum + u.follower_count, 0);
  const verifiedUsers = uniqueUsers.filter(u => u.verified_addresses?.eth_addresses && u.verified_addresses.eth_addresses.length > 0).length;

  // Debug logging to track user count discrepancies
  console.log(`📊 User Stats Debug: Total users: ${users.length}, Unique count: ${uniqueCount}, Verified: ${verifiedUsers}, Power badges: ${powerBadgeHolders}`);

  // Calculate rarity metrics using unique count
  const avgFollowers = Math.round(totalFollowers / Math.max(uniqueCount, 1));
  const powerBadgeRatio = Math.round((powerBadgeHolders / Math.max(uniqueCount, 1)) * 100);
  const verificationRatio = Math.round((verifiedUsers / Math.max(uniqueCount, 1)) * 100);

  // Create sophisticated naming
  const featuredUsers = usernames.slice(0, 3).join(', ');
  const remainingCount = Math.max(0, uniqueCount - 3);
  const userSuffix = remainingCount > 0 ? ` +${remainingCount} others` : '';

  // Determine special characteristics for naming
  const specialTraits = [];
  if (powerBadgeRatio >= 50) specialTraits.push("Power Badge Collective");
  if (avgFollowers >= 10000) specialTraits.push("Influencer Circle");
  if (verificationRatio >= 75) specialTraits.push("Verified Assembly");
  if (totalFollowers >= 100000) specialTraits.push("Mega Community");

  const specialSuffix = specialTraits.length > 0 ? ` - ${specialTraits[0]}` : '';

  const nftName = usernames.length > 0
    ? `Heart of ${featuredUsers}${userSuffix}${specialSuffix}`
    : `Farcaster Trending Heart ${dateString}`;

  // Rich description with context
  const contextualInfo = [];
  if (powerBadgeHolders > 0) contextualInfo.push(`${powerBadgeHolders} power badge holders`);
  if (avgFollowers >= 1000) contextualInfo.push(`avg ${formatNumber(avgFollowers)} followers`);
  if (verifiedUsers > 0) contextualInfo.push(`${verifiedUsers} verified addresses`);

  const contextString = contextualInfo.length > 0 ? ` featuring ${contextualInfo.join(', ')}` : '';

  const nftDescription = `A unique heart-shaped snapshot of ${uniqueCount} trending Farcaster community members captured on ${dateString} at ${timeString} UTC${contextString}. This digital artifact preserves a specific moment in Farcaster's social graph - when these ${uniqueCount} voices were actively shaping the community conversation. Each heart represents the intersection of social discovery, community engagement, and the ephemeral nature of trending moments in decentralized social networks.`;

  // Enhanced rarity attributes
  const rarityAttributes = [
    { trait_type: "Total Community Reach", value: formatNumber(totalFollowers) },
    { trait_type: "Average Followers", value: formatNumber(avgFollowers) },
    { trait_type: "Power Badge Holders", value: powerBadgeHolders },
    { trait_type: "Power Badge Ratio", value: `${powerBadgeRatio}%` },
    { trait_type: "Verified Users", value: verifiedUsers },
    { trait_type: "Verification Ratio", value: `${verificationRatio}%` },
    { trait_type: "Community Influence", value: getCommunityInfluenceLevel(avgFollowers, powerBadgeRatio) },
    { trait_type: "Rarity Score", value: calculateRarityScore(totalFollowers, powerBadgeHolders, verifiedUsers) },
    { trait_type: "Featured Usernames", value: usernames.slice(0, 5).join(', ') || 'Anonymous' }
  ];

  return { nftName, nftDescription, rarityAttributes };
}

/**
 * Format large numbers for display
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Determine community influence level based on metrics
 */
function getCommunityInfluenceLevel(avgFollowers: number, powerBadgeRatio: number): string {
  if (avgFollowers >= 50000 && powerBadgeRatio >= 50) return "Legendary";
  if (avgFollowers >= 20000 && powerBadgeRatio >= 25) return "Epic";
  if (avgFollowers >= 10000 || powerBadgeRatio >= 50) return "Rare";
  if (avgFollowers >= 5000 || powerBadgeRatio >= 25) return "Uncommon";
  return "Common";
}

/**
 * Calculate overall rarity score for the NFT
 */
function calculateRarityScore(totalFollowers: number, powerBadgeHolders: number, verifiedUsers: number): number {
  let score = 0;

  // Follower score (logarithmic)
  score += Math.log10(Math.max(totalFollowers, 1)) * 10;

  // Power badge bonus
  score += powerBadgeHolders * 25;

  // Verification bonus
  score += verifiedUsers * 15;

  // Cap and round
  return Math.min(Math.round(score), 1000);
}

/**
 * Generate heart-shaped composite SVG
 * Matches the exact layout from PhotoPairGame component
 */
function generateHeartSVG(
  imageUrls: string[], // These are now Base64 strings
  gameType: "custom" | "demo",
  completedAt: string,
  users: FarcasterUser[]
): string {
  const cellSize = 120;
  const gap = 12; // Increased gap for cleaner look
  const svgWidth = 7 * cellSize + 6 * gap + 80; // Added padding
  const svgHeight = 6 * cellSize + 5 * gap + 200; // More space for header/footer
  const contentStartX = 40;
  const contentStartY = 40;

  // Enhanced title generation
  const { title, subtitle } = generateEnhancedTitle(gameType, completedAt, users);

  let svgContent = `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <!-- Premium Gradient Background -->
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2e1065;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#701a75;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#be185d;stop-opacity:1" />
        </linearGradient>
        
        <!-- Glassmorphism Card Effect -->
        <filter id="glass" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
        </filter>

        <!-- Soft Drop Shadow -->
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.4"/>
        </filter>

        <!-- Inner Glow for Cells -->
        <filter id="inner-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
          <feOffset dx="1" dy="1"/>
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feFlood flood-color="white" flood-opacity="0.2"/>
          <feComposite in2="SourceAlpha" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      <!-- Decorative background pattern (subtle circles) -->
      <circle cx="10%" cy="10%" r="150" fill="white" fill-opacity="0.03"/>
      <circle cx="90%" cy="80%" r="200" fill="white" fill-opacity="0.03"/>
  `;

  // Add heart layout
  heartLayout.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = contentStartX + colIndex * (cellSize + gap);
      const y = contentStartY + rowIndex * (cellSize + gap);

      if (cell === "deco") {
        // Decorative heart cells (Red/Pink Glass)
        svgContent += `
          <g filter="url(#shadow)">
            <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                  rx="24" fill="rgba(244, 63, 94, 0.8)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            <text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 5}"
                  text-anchor="middle" dominant-baseline="middle"
                  font-size="${cellSize * 0.5}" fill="white" style="text-shadow: 0 2px 4px rgba(0,0,0,0.2)">💝</text>
          </g>
        `;
      } else if (typeof cell === 'number' && cell < imageUrls.length) {
        // Profile image with premium border
        const imageUrl = imageUrls[cell];
        svgContent += `
          <g filter="url(#shadow)">
            <defs>
              <clipPath id="clip${cell}">
                <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="24"/>
              </clipPath>
            </defs>
            <!-- Cell Background -->
            <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                  rx="24" fill="#1f2937"/>
            
            <!-- Profile Image -->
            <image x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                   href="${imageUrl}" clip-path="url(#clip${cell})"
                   preserveAspectRatio="xMidYMid slice"/>
            
            <!-- Glass Overlay/Border -->
            <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                  rx="24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="4"
                  filter="url(#inner-glow)"/>
          </g>
        `;
      }
    });
  });

  // Add enhanced title section (Glassmorphism Card)
  const titleY = svgHeight - 160;
  const cardPadding = 20;

  svgContent += `
    <!-- Info Card Background -->
    <rect x="${cardPadding}" y="${titleY}" width="${svgWidth - (cardPadding * 2)}" height="140" 
          rx="20" fill="rgba(0, 0, 0, 0.4)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

    <!-- Title -->
    <text x="${svgWidth / 2}" y="${titleY + 45}" text-anchor="middle"
          font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="28" font-weight="bold" fill="white" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5)">
      ${title}
    </text>
    
    <!-- Subtitle -->
    <text x="${svgWidth / 2}" y="${titleY + 80}" text-anchor="middle"
          font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="16" fill="#e5e7eb" letter-spacing="1">
      ${subtitle.toUpperCase()}
    </text>
  `;

  // Add user stats if available
  if (users.length > 0) {
    const totalFollowers = users.reduce((sum, u) => sum + u.follower_count, 0);
    const powerBadgeCount = users.filter(u => u.power_badge).length;

    // Format stats with icons
    const statsText = `👥 ${formatNumber(totalFollowers)} Reach  •  ⚡ ${powerBadgeCount} Power Badges`;

    svgContent += `
      <text x="${svgWidth / 2}" y="${titleY + 115}" text-anchor="middle"
            font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="14" font-weight="500" fill="#f472b6">
        ${statsText}
      </text>
    `;
  }

  svgContent += '</svg>';
  return svgContent;
}

/**
 * Generate enhanced title and subtitle based on user data
 */
function generateEnhancedTitle(gameType: "custom" | "demo", completedAt: string, users: FarcasterUser[]) {
  const date = new Date(completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const time = new Date(completedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });

  if (gameType === 'custom') {
    return {
      title: 'Custom Lub Heart',
      subtitle: `Created ${date} at ${time} UTC`
    };
  }

  // Enhanced demo game titles
  if (users.length === 0) {
    return {
      title: 'Farcaster Trending Heart',
      subtitle: `Captured ${date} at ${time} UTC`
    };
  }

  // Ensure we only count up to 8 unique users
  const userCount = Math.min(users.length, 8);
  const powerBadgeHolders = users.filter(u => u.power_badge).length;
  const totalFollowers = users.reduce((sum, u) => sum + u.follower_count, 0);
  const avgFollowers = Math.round(totalFollowers / userCount);

  // Determine special characteristics
  let titlePrefix = 'Heart of';
  if (powerBadgeHolders >= userCount * 0.5) titlePrefix = 'Power Badge Heart of';
  else if (avgFollowers >= 50000) titlePrefix = 'Influencer Heart of';
  else if (avgFollowers >= 10000) titlePrefix = 'Community Heart of';

  const featuredUsers = users.slice(0, 2).map(u => u.username).join(' & ');
  const remainingCount = Math.max(0, userCount - 2);
  const userSuffix = remainingCount > 0 ? ` +${remainingCount}` : '';

  return {
    title: `${titlePrefix} ${featuredUsers}${userSuffix}`,
    subtitle: `Trending moment • ${date} ${time} UTC`
  };
}
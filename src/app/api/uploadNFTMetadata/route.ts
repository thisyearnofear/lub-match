import { NextRequest, NextResponse } from "next/server";
import { PINATA_JWT } from "@/config";
import { PinataSDK } from "pinata";
import { generateGameHash, GameHashData } from "@/utils/gameHash";

export const runtime = "nodejs";

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
    // Try to generate actual heart composite image
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://valentines-proposal-visibait.vercel.app';

    const response = await fetch(`${baseUrl}/api/generateHeartImage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrls: imageHashes,
        gameHash,
        gameType: 'demo', // This will be passed from the calling function
        completedAt: new Date().toISOString(),
        users: users || []
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.imageURI;
    } else {
      console.warn("Heart image generation failed, using fallback");
    }
  } catch (error) {
    console.error("Error calling heart image generation:", error);
  }

  // Fallback: Create a structured SVG-based heart layout as data URI
  const heartSvg = createHeartLayoutSVG(imageHashes, gameHash);
  return `data:image/svg+xml;base64,${Buffer.from(heartSvg).toString('base64')}`;
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
          <text x="${x + cellSize/2}" y="${y + cellSize/2}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="${cellSize * 0.4}" fill="#dc2626">💝</text>
        `;
      } else if (typeof cell === 'number' && cell < imageUrls.length) {
        // Profile image placeholder (SVG can't load external images easily)
        svgContent += `
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                rx="8" fill="#6b7280" stroke="#374151" stroke-width="2"/>
          <text x="${x + cellSize/2}" y="${y + cellSize/2}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="${cellSize * 0.3}" fill="#ffffff">👤</text>
        `;
      }
    });
  });
  
  // Add title
  svgContent += `
    <rect x="0" y="${svgHeight - 50}" width="${svgWidth}" height="50" fill="rgba(0,0,0,0.8)"/>
    <text x="${svgWidth/2}" y="${svgHeight - 30}" text-anchor="middle"
          font-family="Arial" font-size="16" font-weight="bold" fill="white">
      Farcaster Trending Snapshot
    </text>
    <text x="${svgWidth/2}" y="${svgHeight - 10}" text-anchor="middle"
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
  const uniqueCount = users.length ? Math.min(users.length, 8) : Math.min(new Set(data.imageHashes).size, 8);
  const usernames = users.map(u => `@${u.username}`).slice(0, 8); // Limit for readability
  const powerBadgeHolders = users.filter(u => u.power_badge).length;
  const totalFollowers = users.reduce((sum, u) => sum + u.follower_count, 0);
  const verifiedUsers = users.filter(u => u.verified_addresses?.eth_addresses && u.verified_addresses.eth_addresses.length > 0).length;
  
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
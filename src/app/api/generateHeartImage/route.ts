import { NextRequest, NextResponse } from "next/server";
import { PINATA_JWT } from "@/config";
import { PinataSDK } from "pinata";

export const runtime = "nodejs";

interface HeartImageRequest {
  imageUrls: string[];
  gameHash: string;
  gameType: "custom" | "demo";
  completedAt: string;
  users?: FarcasterUser[];
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

// Heart layout matching PhotoPairGame component
const heartLayout = [
  [null, 0, 1, null, 2, 3, null],
  [4, 5, 6, 7, 8, 9, 10],
  [null, 11, 12, 13, 14, 15, null],
  [null, null, "deco", "deco", "deco", null, null],
  [null, null, null, "deco", null, null, null],
  [null, null, null, null, null, null, null],
];

export async function POST(req: NextRequest) {
  try {
    const data: HeartImageRequest = await req.json();
    
    if (!data.imageUrls || !data.gameHash) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!PINATA_JWT) {
      return NextResponse.json(
        { error: "No Pinata API key available" },
        { status: 500 }
      );
    }

    // Generate heart composite SVG
    const heartSvg = generateHeartSVG(
      data.imageUrls,
      data.gameType,
      data.completedAt,
      data.users || []
    );

    // Upload SVG to IPFS
    const pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: "gateway.pinata.cloud"
    });

    const svgFile = new File(
      [heartSvg],
      `heart-${data.gameHash.substring(0, 8)}.svg`,
      { type: "image/svg+xml" }
    );

    const upload = await pinata.upload.public
      .file(svgFile)
      .name(`Heart Composite SVG - ${data.gameHash.substring(0, 8)}`)
      .keyvalues({
        type: "heart-composite-svg",
        gameHash: data.gameHash,
        gameType: data.gameType,
        createdAt: new Date().toISOString()
      });

    const imageURI = `ipfs://${upload.cid}`;

    return NextResponse.json({
      imageURI,
      success: true
    });

  } catch (error) {
    console.error("Heart image generation error:", error);
    
    return NextResponse.json(
      {
        error: "Failed to generate heart image",
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * Generate heart-shaped composite SVG
 * Matches the exact layout from PhotoPairGame component
 */
function generateHeartSVG(
  imageUrls: string[],
  gameType: "custom" | "demo",
  completedAt: string,
  users: FarcasterUser[]
): string {
  const cellSize = 120;
  const gap = 8;
  const svgWidth = 7 * cellSize + 6 * gap;
  const svgHeight = 6 * cellSize + 5 * gap + 120; // Extra space for enhanced title
  
  // Enhanced title generation
  const { title, subtitle } = generateEnhancedTitle(gameType, completedAt, users);
  
  let svgContent = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#be185d;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
  `;
  
  // Add heart layout
  heartLayout.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = colIndex * (cellSize + gap);
      const y = rowIndex * (cellSize + gap);
      
      if (cell === "deco") {
        // Decorative heart cells
        svgContent += `
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                rx="12" fill="#f87171" stroke="#dc2626" stroke-width="3" filter="url(#shadow)"/>
          <text x="${x + cellSize/2}" y="${y + cellSize/2 + 8}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="${cellSize * 0.4}" fill="#dc2626">💝</text>
        `;
      } else if (typeof cell === 'number' && cell < imageUrls.length) {
        // Profile image with external reference
        const imageUrl = imageUrls[cell];
        svgContent += `
          <defs>
            <clipPath id="clip${cell}">
              <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="12"/>
            </clipPath>
          </defs>
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                rx="12" fill="#6b7280" stroke="#374151" stroke-width="3" filter="url(#shadow)"/>
          <image x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
                 href="${imageUrl}" clip-path="url(#clip${cell})"
                 preserveAspectRatio="xMidYMid slice"/>
        `;
      }
    });
  });
  
  // Add enhanced title section
  const titleY = svgHeight - 120;
  svgContent += `
    <rect x="0" y="${titleY}" width="${svgWidth}" height="120" fill="rgba(0,0,0,0.85)" rx="0"/>
    <text x="${svgWidth/2}" y="${titleY + 25}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">
      ${title}
    </text>
    <text x="${svgWidth/2}" y="${titleY + 50}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="14" fill="#d1d5db">
      ${subtitle}
    </text>
  `;
  
  // Add user stats if available
  if (users.length > 0) {
    const userCount = Math.min(users.length, 8);
    const totalFollowers = users.reduce((sum, u) => sum + u.follower_count, 0);
    const powerBadgeCount = users.filter(u => u.power_badge).length;
    const statsText = `${formatNumber(totalFollowers)} total reach • ${powerBadgeCount} power badges`;
    
    svgContent += `
      <text x="${svgWidth/2}" y="${titleY + 75}" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
        ${statsText}
      </text>
    `;
    
    // Add featured usernames
    const featuredUsers = users.slice(0, 4).map(u => `@${u.username}`).join(' • ');
    if (featuredUsers) {
      svgContent += `
        <text x="${svgWidth/2}" y="${titleY + 95}" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="11" fill="#6b7280">
          ${featuredUsers}${userCount > 4 ? ` +${userCount - 4} more` : ''}
        </text>
      `;
    }
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

/**
 * Format large numbers for display
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
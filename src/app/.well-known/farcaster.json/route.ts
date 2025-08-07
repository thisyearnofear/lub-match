import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const manifest = {
    miniapp: {
      version: "1",
      name: "Lub Match",
      iconUrl: `${baseUrl}/favicon.ico`,
      homeUrl: baseUrl,
      splashImageUrl: `${baseUrl}/hamster_jumping.gif`,
      splashBackgroundColor: "#ec4899",
      subtitle: "Send lub & feel da lub!",
      description: "A romantic heart-shaped memory game to send lub to your special someone! Play with Farcaster friends, mint NFTs, and share the love.",
      screenshotUrls: [
        `${baseUrl}/github-demo.gif`
      ],
      primaryCategory: "games",
      tags: [
        "games",
        "social",
        "romance",
        "memory",
        "nft"
      ],
      heroImageUrl: `${baseUrl}/github-demo.gif`,
      tagline: "Send lub & feel da lub!",
      ogTitle: "Lub Match 💝",
      ogDescription: "A romantic heart-shaped memory game to send lub to your special someone!",
      ogImageUrl: `${baseUrl}/github-demo.gif`,
      requiredChains: [
        "eip155:8453", // Base
        "eip155:42161" // Arbitrum
      ],
      requiredCapabilities: [
        "actions.ready",
        "wallet.getEthereumProvider"
      ]
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}

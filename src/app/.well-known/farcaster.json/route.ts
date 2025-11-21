import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NODE_ENV === "production"
    ? "https://lub-match.vercel.app"
    : "http://localhost:3000";
}

export async function GET() {
  const baseUrl = getBaseUrl();

  const accountAssociation = {
    header: process.env.FARCASTER_ACCOUNT_ASSOC_HEADER || "",
    payload: process.env.FARCASTER_ACCOUNT_ASSOC_PAYLOAD || "",
    signature: process.env.FARCASTER_ACCOUNT_ASSOC_SIGNATURE || "",
  };

  const miniapp = {
    version: "1",
    name: "Lub Match",
    iconUrl: `${baseUrl}/game-photos/lub.png`,
    homeUrl: baseUrl,
    imageUrl: `${baseUrl}/game-photos/lub.png`,
    buttonTitle: "💝 Play Lub Match!",
    splashImageUrl: `${baseUrl}/game-photos/lub.png`,
    splashBackgroundColor: "#ec4899",
  };

  return NextResponse.json({ accountAssociation, miniapp });
}

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

    // Create comprehensive metadata
    const metadata: HeartNFTMetadata = {
      name: `Lub Match #${gameHash.substring(0, 8)}`,
      description: `lub sent with ${data.imageHashes.length} trending Farcaster users. ${data.gameType === 'demo' ? 'Demo lub completed!' : `Lub message: "${data.message}"`}`,
      image: await generateHeartImage(data.imageHashes, gameHash),
      attributes: [
        { trait_type: "Lub Type", value: data.gameType === 'demo' ? 'Demo Lub' : 'Custom Lub' },
        { trait_type: "Featured Users", value: data.imageHashes.length },
        { trait_type: "Lub Length", value: data.message.length },
        { trait_type: "Lub Sent", value: new Date(data.completedAt).toISOString().split('T')[0] },
        { trait_type: "Lub Creator", value: data.creator },
        { trait_type: "Lub Receiver", value: data.completer },
        { trait_type: "Self Lub", value: data.creator === data.completer ? "Yes" : "No" }
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
 * For now, returns a placeholder. In production, this would create an actual composite
 */
async function generateHeartImage(imageHashes: string[], gameHash: string): Promise<string> {
  // Placeholder implementation
  // In production, this would:
  // 1. Fetch all Farcaster user images from IPFS
  // 2. Create a heart-shaped lub composite using Canvas API or similar
  // 3. Add "Lub Match" branding and completion timestamp
  // 4. Upload the composite image to IPFS
  // 5. Return the IPFS URI

  return `ipfs://placeholder-lub-composite-${gameHash.substring(0, 8)}`;
}
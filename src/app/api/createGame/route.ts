import { NextResponse } from "next/server";
import { storage } from "@/utils/decentralizedStorage";
import { UPLOAD_LIMITS, validateFileSize, validateTotalSize, formatBytes } from "@/config/uploadLimits";

export const runtime = "nodejs"; // force Node, not edge

// Configure larger body size limit for this route
export const maxDuration = 60; // seconds timeout (static value required by Next.js)

// Helper function to fetch Farcaster PFPs and convert to File objects
interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
}

async function fetchFarcasterPfps(users: FarcasterUser[]): Promise<File[]> {
  const files: File[] = [];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      const response = await fetch(user.pfp_url);
      if (!response.ok) {
        console.warn(`Failed to fetch PFP for ${user.username}: ${response.status}`);
        continue;
      }
      
      const blob = await response.blob();
      const extension = user.pfp_url.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${user.username}-pfp.${extension}`;
      
      const file = new File([blob], fileName, { type: blob.type });
      files.push(file);
    } catch (error) {
      console.warn(`Error fetching PFP for ${user.username}:`, error);
    }
  }
  
  return files;
}

export async function POST(req: Request) {
  try {
    // Check content length before processing
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const requestSize = parseInt(contentLength);
      console.log(`Request size: ${formatBytes(requestSize)}`);
      
      // Warn if approaching server limits
      if (requestSize > UPLOAD_LIMITS.SERVER.MAX_REQUEST_SIZE * 0.9) {
        return NextResponse.json(
          {
            error: "Request too large. Please compress your images or use fewer/smaller images.",
            details: `Request size: ${formatBytes(requestSize)}. Maximum allowed: ${formatBytes(UPLOAD_LIMITS.SERVER.MAX_REQUEST_SIZE)}.`
          },
          { status: 413 }
        );
      }
    }

    const formData = await req.formData();
    const message = formData.get("message") as string | null;
    const storageMode = (formData.get("storageMode") as string) || "quick";
    const userApiKey = formData.get("userApiKey") as string | null;
    const lubMode = formData.get("lubMode") as string | null;
    let pairs: File[] = [];
    let farcasterUsers: FarcasterUser[] = [];

    if (lubMode === "photos") {
      pairs = formData.getAll("pairs") as File[];
      if (pairs.length !== 8) {
        return NextResponse.json(
          { error: "You must upload exactly 8 photos for photo mode." },
          { status: 400 },
        );
      }
    } else if (lubMode === "farcaster") {
      const farcasterUsersJson = formData.get("farcasterUsers") as string | null;
      if (farcasterUsersJson) {
        try {
          farcasterUsers = JSON.parse(farcasterUsersJson);
        } catch (error) {
          console.error("Failed to parse Farcaster users:", error);
          return NextResponse.json(
            { error: "Invalid Farcaster users data." },
            { status: 400 },
          );
        }
      }
      if (farcasterUsers.length !== 8) {
        return NextResponse.json(
          { error: "You must select exactly 8 Farcaster friends for Farcaster mode." },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid lub creation mode selected." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }
    if (storageMode === "private" && !userApiKey) {
      return NextResponse.json(
        { error: "API key required for private mode." },
        { status: 400 },
      );
    }

    // Fetch Farcaster PFPs and convert to files
    let revealFiles: File[] = [];
    if (farcasterUsers.length > 0) {
      try {
        revealFiles = await fetchFarcasterPfps(farcasterUsers);
      } catch (error) {
        console.error("Failed to fetch Farcaster PFPs:", error);
        return NextResponse.json(
          { error: "Failed to fetch profile pictures from Farcaster" },
          { status: 500 },
        );
      }
    }

    // Enhanced file size validation using centralized config
    const allFiles = [...pairs, ...revealFiles];
    
    // Check individual file sizes
    for (const file of allFiles) {
      const validation = validateFileSize(file);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: validation.error,
            suggestion: "Please compress your images before uploading."
          },
          { status: 413 }
        );
      }
    }
    
    // Check total payload size
    const totalValidation = validateTotalSize(allFiles);
    if (!totalValidation.valid) {
      return NextResponse.json(
        {
          error: totalValidation.error,
          suggestion: "Please use smaller images or compress them before uploading."
        },
        { status: 413 }
      );
    }
    
    console.log(`Processing ${allFiles.length} files, total size: ${formatBytes(totalValidation.totalSize!)}`);

    let gamePairs: File[];
    let revealList: File[] | undefined;

    if (lubMode === "photos") {
      gamePairs = pairs;
      revealList = undefined; // No specific reveal images for photo mode
    } else if (lubMode === "farcaster") {
      gamePairs = revealFiles.slice(0, 8); // Use PFPs as game pairs
      revealList = revealFiles; // Use all fetched PFPs as reveal images
    } else {
      // This case should ideally be caught earlier by validation
      return NextResponse.json(
        { error: "Invalid lub creation mode for file processing." },
        { status: 400 },
      );
    }
    
    const result = await storage.uploadGame(
      gamePairs,
      revealList,
      message,
      userApiKey || undefined
    );

    return NextResponse.json({
      cid: result.cid,
      deletable: result.deletable,
      storageMode: storageMode,
    });
  } catch (error: unknown) {
    console.error("CreateGame API error:", error);
    
    let errorMessage = "Server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error types
      if (error.message.includes('413') || error.message.includes('too large') || error.message.includes('Request Entity Too Large')) {
        statusCode = 413;
        errorMessage = "Upload too large. Please compress your images and try again.";
      } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        statusCode = 408;
        errorMessage = "Upload timeout. Please try with smaller images.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        statusCode = 502;
        errorMessage = "Network error during upload. Please try again.";
      }
    }
    
    console.error("Error details:", {
      message: errorMessage,
      originalMessage: error instanceof Error ? error.message : "Unknown",
      stack: error instanceof Error ? error.stack : "N/A",
      name: error instanceof Error ? error.name : "N/A",
      statusCode
    });
    
    return NextResponse.json(
      {
        error: errorMessage,
        code: statusCode,
        suggestion: statusCode === 413 ? "Try compressing your images to under 2MB each before uploading." : undefined
      },
      { status: statusCode }
    );
  }
}

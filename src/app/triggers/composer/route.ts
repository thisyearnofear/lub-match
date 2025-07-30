import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Composer trigger activated:', body);
    
    // Generate a shareable cast with Lub Match
    const shareText = "Just played Lub Match! 💝 Test your Farcaster knowledge and earn LUB tokens! 🎮";
    const frameUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = {
      type: 'composer',
      data: {
        text: shareText,
        embeds: [frameUrl]
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Composer trigger error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Lub Match composer trigger endpoint',
    description: 'Helps users share Lub Match with their followers' 
  });
}

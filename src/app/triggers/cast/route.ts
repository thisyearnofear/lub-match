import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract cast information
    const { castHash, fid } = body;
    
    console.log('Cast trigger activated:', { castHash, fid });
    
    // Here you could:
    // 1. Fetch cast data using Neynar API
    // 2. Generate a score or analysis
    // 3. Return a response to show in the frame
    
    // For now, return a simple response
    const response = {
      type: 'frame',
      frameUrl: `/?cast=${castHash}&action=score`,
      message: 'View your Lub Match score for this cast!'
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Cast trigger error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Lub Match cast trigger endpoint',
    description: 'Analyzes casts for Lub Match compatibility' 
  });
}

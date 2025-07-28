import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }
    
    const gameDir = join(process.cwd(), 'public', 'games', gameId);
    const metadataPath = join(gameDir, 'metadata.json');
    
    if (!existsSync(metadataPath)) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Convert relative paths to full URLs
    const baseUrl = `/games/${gameId}`;
    const pairUrls = metadata.pairs.map((filename: string) => `${baseUrl}/${filename}`);
    const revealUrls = metadata.reveal.map((filename: string) => `${baseUrl}/${filename}`);
    
    return NextResponse.json({
      ...metadata,
      pairUrls,
      revealUrls
    });
    
  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json(
      { error: 'Failed to load game', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
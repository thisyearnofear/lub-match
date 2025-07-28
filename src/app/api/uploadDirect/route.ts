import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const gameId = formData.get('gameId') as string || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = formData.get('message') as string || 'Will you accept my lub? 💕';
    
    // Create game directory
    const gameDir = join(process.cwd(), 'public', 'games', gameId);
    if (!existsSync(gameDir)) {
      await mkdir(gameDir, { recursive: true });
    }
    
    const imageUrls: string[] = [];
    const revealUrls: string[] = [];
    
    // Process pair images
    const pairs = formData.getAll('pairs') as File[];
    for (let i = 0; i < pairs.length; i++) {
      const file = pairs[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `pair-${i}.${getFileExtension(file.name)}`;
      const filepath = join(gameDir, filename);
      await writeFile(filepath, buffer);
      
      imageUrls.push(`/games/${gameId}/${filename}`);
    }
    
    // Process reveal images
    const reveals = formData.getAll('reveal') as File[];
    for (let i = 0; i < reveals.length; i++) {
      const file = reveals[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `reveal-${i}.${getFileExtension(file.name)}`;
      const filepath = join(gameDir, filename);
      await writeFile(filepath, buffer);
      
      revealUrls.push(`/games/${gameId}/${filename}`);
    }
    
    // Create metadata
    const metadata = {
      message,
      pairs: imageUrls.map(url => url.split('/').pop()),
      reveal: revealUrls.map(url => url.split('/').pop()),
      createdAt: new Date().toISOString(),
      gameId
    };
    
    const metadataPath = join(gameDir, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({
      gameId,
      imageUrls,
      revealUrls,
      deletable: true,
      success: true
    });
    
  } catch (error) {
    console.error('Direct upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop() || 'jpg';
}
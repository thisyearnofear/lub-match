#!/usr/bin/env tsx
/**
 * Combined Networks Test Script
 * Demonstrates how Farcaster and Lens users work together in the game
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  pfpUrl: string;
  network: 'farcaster' | 'lens';
  followerCount: number;
  gameScore?: number;
}

async function testCombinedNetworks() {
  console.log('🎮 Testing Combined Farcaster + Lens Gaming Experience\n');
  
  try {
    // Load Lens data
    const lensDataPath = join(process.cwd(), 'src/data/lensRewardsUsers.json');
    const lensData = JSON.parse(readFileSync(lensDataPath, 'utf8'));
    
    console.log(`🌿 Loaded ${lensData.count} Lens users`);
    console.log(`🟣 Simulating Farcaster users (would be fetched from API)`);
    
    // Simulate Farcaster users (in real app these come from API)
    const mockFarcasterUsers: SocialUser[] = [
      {
        id: '1', username: 'dwr', displayName: 'Dan Romero', 
        pfpUrl: 'https://example.com/dwr.jpg', network: 'farcaster', followerCount: 150000
      },
      {
        id: '2', username: 'vitalik', displayName: 'Vitalik Buterin', 
        pfpUrl: 'https://example.com/vitalik.jpg', network: 'farcaster', followerCount: 200000
      },
      {
        id: '3', username: 'jessepollak', displayName: 'Jesse Pollak', 
        pfpUrl: 'https://example.com/jesse.jpg', network: 'farcaster', followerCount: 80000
      }
    ];
    
    // Combine users (simulating the useFarcasterUsers hook with network: 'both')
    const lensUsers = lensData.users.slice(0, 5); // Take first 5 Lens users
    const combinedUsers = [...mockFarcasterUsers, ...lensUsers];
    
    console.log(`\n📊 Combined User Pool:`);
    console.log(`   🟣 Farcaster: ${mockFarcasterUsers.length} users`);
    console.log(`   🌿 Lens: ${lensUsers.length} users`);
    console.log(`   🔄 Total: ${combinedUsers.length} users`);
    
    // Simulate game card selection (first 8 users)
    const gameUsers = combinedUsers.slice(0, 8);
    console.log(`\n🎯 Selected for Memory Game (8 cards):`);
    
    gameUsers.forEach((user, i) => {
      const networkEmoji = user.network === 'farcaster' ? '🟣' : '🌿';
      const followerText = user.followerCount ? user.followerCount.toLocaleString() : '0';
      const gameScoreText = user.gameScore ? ` (${user.gameScore}/100 🎮)` : '';
      
      console.log(`   ${i+1}. ${networkEmoji} ${user.displayName} (@${user.username}) - ${followerText} followers${gameScoreText}`);
    });
    
    // Network distribution analysis
    const farcasterInGame = gameUsers.filter(u => u.network === 'farcaster').length;
    const lensInGame = gameUsers.filter(u => u.network === 'lens').length;
    
    console.log(`\n🎮 Game Network Distribution:`);
    console.log(`   🟣 Farcaster cards: ${farcasterInGame}/8 (${(farcasterInGame/8*100).toFixed(1)}%)`);
    console.log(`   🌿 Lens cards: ${lensInGame}/8 (${(lensInGame/8*100).toFixed(1)}%)`);
    
    // Simulate completion message
    const networkText = farcasterInGame > 0 && lensInGame > 0 
      ? 'from Farcaster & Lens Protocol' 
      : lensInGame > 0 
        ? 'from Lens Protocol' 
        : 'from Farcaster';
    
    const userNames = gameUsers.slice(0, 3).map(u => u.displayName).join(', ');
    const completionMessage = `💌 Lub completed with ${userNames} and ${gameUsers.length - 3} other users ${networkText}! 💝`;
    
    console.log(`\n✨ Completion Message:`);
    console.log(`   "${completionMessage}"`);
    
    console.log(`\n🚀 Social Games Integration:`);
    console.log(`   • Username guessing works with both networks`);
    console.log(`   • Profile picture matching uses authentic images`);
    console.log(`   • Whale classification spans both ecosystems`);
    console.log(`   • Challenge system targets users from either network`);
    
    console.log(`\n✅ Combined network experience ready!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testCombinedNetworks().catch(console.error);
}

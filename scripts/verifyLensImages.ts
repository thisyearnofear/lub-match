#!/usr/bin/env tsx
/**
 * Lens Profile Image Verification Script
 * Verifies that collected Lens users have accessible profile images
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface LensUser {
  id: string;
  displayName: string;
  pfpUrl: string;
  lensHandle?: string;
  gameScore: number;
}

interface LensRewardsData {
  users: LensUser[];
  count: number;
  collectedAt: string;
}

async function verifyLensImages() {
  console.log('🔍 Verifying Lens profile images...');
  
  try {
    // Load the collected Lens data
    const dataPath = join(process.cwd(), 'src/data/lensRewardsUsers.json');
    const rawData = readFileSync(dataPath, 'utf8');
    const data: LensRewardsData = JSON.parse(rawData);
    
    console.log(`📊 Loaded ${data.count} Lens users from ${new Date(data.collectedAt).toLocaleDateString()}`);
    
    let validImages = 0;
    let invalidImages = 0;
    
    for (const user of data.users) {
      console.log(`\n👤 ${user.displayName} (${user.lensHandle})`);
      console.log(`   📊 Game Score: ${user.gameScore}`);
      console.log(`   🖼️  Profile Image: ${user.pfpUrl}`);
      
      if (user.pfpUrl && user.pfpUrl !== '') {
        try {
          // Test if the image URL is reachable
          const response = await fetch(user.pfpUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`   ✅ Image accessible (${response.status})`);
            validImages++;
          } else {
            console.log(`   ❌ Image not accessible (${response.status})`);
            invalidImages++;
          }
        } catch (error) {
          console.log(`   ❌ Image check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          invalidImages++;
        }
      } else {
        console.log(`   ⚠️  No profile image URL`);
        invalidImages++;
      }
      
      // Small delay to be respectful to servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📈 Summary:');
    console.log(`✅ Valid images: ${validImages}`);
    console.log(`❌ Invalid/missing images: ${invalidImages}`);
    console.log(`📊 Success rate: ${((validImages / data.count) * 100).toFixed(1)}%`);
    
    if (validImages >= data.count * 0.8) {
      console.log('\n🎉 Great! Most profile images are accessible and ready for games.');
    } else {
      console.log('\n⚠️  Some profile images may not load properly in the game.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying Lens images:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyLensImages().catch(console.error);
}

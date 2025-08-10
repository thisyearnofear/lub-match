"use client";

export interface ShareOptions {
  text: string;
  url?: string;
  fallbackAlert?: boolean;
}

export interface GameShareData {
  cid: string;
  message?: string;
  type?: 'heart' | 'social';
}

export interface AchievementShareData {
  type: 'nft_minted' | 'game_completed' | 'high_score';
  details: string;
  url?: string;
}

export class ShareHelpers {
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
      return false;
    }
  }

  static async shareNative(options: ShareOptions): Promise<boolean> {
    if (window.navigator.share) {
      try {
        await window.navigator.share({
          text: options.text,
          url: options.url
        });
        return true;
      } catch (error) {
        console.warn('Native share failed:', error);
        return false;
      }
    }
    return false;
  }

  static openFarcasterCompose(text: string): void {
    const encodedText = encodeURIComponent(text);
    window.open(`https://warpcast.com/~/compose?text=${encodedText}`, '_blank');
  }

  static async shareWithFallback(options: ShareOptions): Promise<void> {
    // Try native share first
    const nativeSuccess = await this.shareNative(options);
    if (nativeSuccess) return;

    // Try clipboard copy
    const clipboardSuccess = await this.copyToClipboard(options.url || options.text);
    
    if (clipboardSuccess) {
      // Open Farcaster compose
      this.openFarcasterCompose(options.text);
    } else {
      // Final fallback - just open Farcaster
      this.openFarcasterCompose(options.text);
      
      if (options.fallbackAlert) {
        alert('Share text: ' + options.text);
      }
    }
  }

  static generateGameShareText(data: GameShareData): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const gameUrl = `${baseUrl}/game/${data.cid}`;
    
    if (data.type === 'social') {
      return `🎮 Just played some amazing Farcaster social games! Challenge your knowledge: ${gameUrl}`;
    }
    
    return `💝 Will you Lub me? Match all the hearts! ${gameUrl}`;
  }

  static generateAchievementShareText(data: AchievementShareData): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    switch (data.type) {
      case 'nft_minted':
        return `🎨 Just minted my heart as an NFT on @arbitrum! 💝 ${data.details} Play the game: ${data.url || baseUrl}`;
      
      case 'game_completed':
        return `🎉 Just completed a heart game! ${data.details} Try it yourself: ${data.url || baseUrl}`;
      
      case 'high_score':
        return `🏆 New high score! ${data.details} Can you beat it? ${data.url || baseUrl}`;
      
      default:
        return `💝 Check out Lub Match - the ultimate Valentine's memory game! ${baseUrl}`;
    }
  }

  // Helper function to safely count unique users for share text
  static getUniqueUserCount(usernames?: string[], imageUrls?: string[]): number {
    if (usernames && usernames.length > 0) {
      return Math.min(usernames.length, 8);
    }
    if (imageUrls && imageUrls.length > 0) {
      return Math.min(new Set(imageUrls).size, 8);
    }
    return 0;
  }

  // Helper function to generate user list text with proper counting
  static generateUserListText(usernames: string[], maxDisplay: number = 3): string {
    const uniqueCount = Math.min(usernames.length, 8);
    const displayNames = usernames.slice(0, maxDisplay);
    const remainingCount = Math.max(0, uniqueCount - maxDisplay);
    
    if (remainingCount > 0) {
      return `${displayNames.join(', ')} and ${remainingCount} others`;
    }
    return displayNames.join(', ');
  }

  static async shareGame(data: GameShareData): Promise<void> {
    const text = this.generateGameShareText(data);
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/game/${data.cid}`;
    
    await this.shareWithFallback({ text, url });
  }

  static async shareAchievement(data: AchievementShareData): Promise<void> {
    const text = this.generateAchievementShareText(data);
    
    await this.shareWithFallback({ text, url: data.url });
  }

  static async shareApp(): Promise<void> {
    const text = "💝 Check out Lub Match - the ultimate Valentine's memory game! Create heart games with your photos and mint them as NFTs.";
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    
    await this.shareWithFallback({ text, url });
  }
}
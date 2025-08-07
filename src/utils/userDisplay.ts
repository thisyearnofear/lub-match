/**
 * User Display Utilities
 * Centralized logic for user identity display across components
 * Maintains DRY principles and consistent user experience
 */

import { useUserProfile } from "@/contexts/UserContext";

// Define the types we need locally to avoid circular dependencies
interface FarcasterUser {
  username: string;
  displayName?: string;
  pfpUrl?: string;
}

export interface UserDisplayConfig {
  showUsername: boolean;
  showAvatar: boolean;
  showBalance: boolean;
  format: 'compact' | 'full' | 'minimal';
  maxUsernameLength?: number;
}

export interface DiamondDisplayData {
  title: string;
  subtitle: string;
  avatar?: string;
  displayName?: string;
  shouldShowAvatar: boolean;
  shouldShowUsername: boolean;
}

/**
 * Centralized formatter for user display elements
 * Prevents duplication of display logic across components
 */
export class UserDisplayFormatter {
  /**
   * Generate wallet title based on user context
   */
  static getWalletTitle(
    farcasterUser?: FarcasterUser,
    config: Partial<UserDisplayConfig> = {}
  ): string {
    const defaultConfig: UserDisplayConfig = {
      showUsername: true,
      showAvatar: false,
      showBalance: false,
      format: 'compact',
      maxUsernameLength: 12,
      ...config
    };

    if (defaultConfig.showUsername && farcasterUser?.username) {
      const username = farcasterUser.username.length > (defaultConfig.maxUsernameLength || 12)
        ? `${farcasterUser.username.slice(0, defaultConfig.maxUsernameLength)}...`
        : farcasterUser.username;
      
      return `💝 @${username}'s LUB`;
    }
    
    return "💝 LUB Wallet";
  }

  /**
   * Generate diamond display data for balance widget
   */
  static getDiamondDisplay(
    farcasterUser?: FarcasterUser,
    balance?: string,
    config: Partial<UserDisplayConfig> = {}
  ): DiamondDisplayData {
    const defaultConfig: UserDisplayConfig = {
      showUsername: true,
      showAvatar: true,
      showBalance: true,
      format: 'compact',
      maxUsernameLength: 10,
      ...config
    };

    const hasUsername = defaultConfig.showUsername && farcasterUser?.username;
    const hasBalance = defaultConfig.showBalance && balance;

    let title = "Connected";
    if (hasUsername) {
      const username = farcasterUser!.username.length > (defaultConfig.maxUsernameLength || 10)
        ? `${farcasterUser!.username.slice(0, defaultConfig.maxUsernameLength)}...`
        : farcasterUser!.username;
      title = `@${username}`;
    }

    const subtitle = hasBalance ? `${balance} LUB` : "";

    return {
      title,
      subtitle,
      avatar: defaultConfig.showAvatar ? farcasterUser?.pfpUrl : undefined,
      displayName: farcasterUser?.displayName,
      shouldShowAvatar: defaultConfig.showAvatar && !!farcasterUser?.pfpUrl,
      shouldShowUsername: !!hasUsername
    };
  }

  /**
   * Generate user greeting for various contexts
   */
  static getUserGreeting(
    farcasterUser?: FarcasterUser,
    context: 'welcome' | 'wallet' | 'game' = 'welcome'
  ): string {
    const name = farcasterUser?.displayName || farcasterUser?.username;
    
    if (!name) {
      switch (context) {
        case 'welcome': return "Welcome to Lub Match! 💝";
        case 'wallet': return "Your LUB Wallet 💎";
        case 'game': return "Let's play! 🎮";
        default: return "Welcome! 💝";
      }
    }

    switch (context) {
      case 'welcome': return `Welcome back, ${name}! 💝`;
      case 'wallet': return `${name}'s LUB Wallet 💎`;
      case 'game': return `Ready to play, ${name}? 🎮`;
      default: return `Hello, ${name}! 💝`;
    }
  }

  /**
   * Format user identity for compact display
   */
  static getCompactIdentity(
    farcasterUser?: FarcasterUser,
    walletAddress?: string,
    maxLength: number = 12
  ): string {
    if (farcasterUser?.username) {
      return farcasterUser.username.length > maxLength
        ? `@${farcasterUser.username.slice(0, maxLength - 1)}...`
        : `@${farcasterUser.username}`;
    }

    if (farcasterUser?.displayName) {
      return farcasterUser.displayName.length > maxLength
        ? `${farcasterUser.displayName.slice(0, maxLength - 1)}...`
        : farcasterUser.displayName;
    }

    if (walletAddress) {
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }

    return "Anonymous";
  }
}

/**
 * Hook for consistent user display across components
 * Leverages existing UserContext without duplication
 */
export function useUserDisplay(config: Partial<UserDisplayConfig> = {}) {
  // This will be implemented to use existing UserContext
  // Keeping interface clean for now
  return {
    getWalletTitle: (farcasterUser?: FarcasterUser) =>
      UserDisplayFormatter.getWalletTitle(farcasterUser, config),
    getDiamondDisplay: (farcasterUser?: FarcasterUser, balance?: string) =>
      UserDisplayFormatter.getDiamondDisplay(farcasterUser, balance, config),
    getUserGreeting: (farcasterUser?: FarcasterUser, context?: 'welcome' | 'wallet' | 'game') =>
      UserDisplayFormatter.getUserGreeting(farcasterUser, context),
    getCompactIdentity: (farcasterUser?: FarcasterUser, walletAddress?: string) =>
      UserDisplayFormatter.getCompactIdentity(farcasterUser, walletAddress, config.maxUsernameLength)
  };
}

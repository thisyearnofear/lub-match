/**
 * Text utilities for handling usernames and display text in UI components
 */

/**
 * Truncates a username to fit within a given character limit
 * @param username - The username to truncate (without @)
 * @param maxLength - Maximum character length (default: 12)
 * @returns Truncated username with ellipsis if needed
 */
export function truncateUsername(username: string, maxLength: number = 12): string {
  if (username.length <= maxLength) {
    return username;
  }
  return username.slice(0, maxLength - 1) + '…';
}

/**
 * Splits a long username into multiple lines for button display
 * @param username - The username to split (without @)
 * @param maxLineLength - Maximum characters per line (default: 8)
 * @returns Array of username parts for multi-line display
 */
export function splitUsernameForButton(username: string, maxLineLength: number = 8): string[] {
  if (username.length <= maxLineLength) {
    return [username];
  }

  // Try to split at natural break points (dots, underscores, numbers)
  const breakPoints = /[._\-0-9]/g;
  const matches = [...username.matchAll(breakPoints)];
  
  if (matches.length > 0) {
    // Find the best break point around the middle
    const midPoint = username.length / 2;
    const bestMatch = matches.reduce((best, current) => {
      const currentDistance = Math.abs((current.index || 0) - midPoint);
      const bestDistance = Math.abs((best.index || 0) - midPoint);
      return currentDistance < bestDistance ? current : best;
    });
    
    const breakIndex = (bestMatch.index || 0) + 1;
    if (breakIndex > 2 && breakIndex < username.length - 2) {
      return [
        username.slice(0, breakIndex),
        username.slice(breakIndex)
      ];
    }
  }
  
  // Fallback: split roughly in half
  const splitPoint = Math.ceil(username.length / 2);
  return [
    username.slice(0, splitPoint),
    username.slice(splitPoint)
  ];
}

/**
 * Gets appropriate CSS classes for username display based on length
 * @param username - The username to analyze
 * @param context - The display context ('button' | 'list' | 'card')
 * @returns Object with CSS classes and display strategy
 */
export function getUsernameDisplayClasses(
  username: string, 
  context: 'button' | 'list' | 'card' = 'button'
) {
  const length = username.length;
  
  const baseClasses = {
    button: 'break-words hyphens-auto leading-tight',
    list: 'truncate',
    card: 'break-words'
  };
  
  const sizeClasses = {
    short: 'text-sm sm:text-base', // <= 8 chars
    medium: 'text-xs sm:text-sm',  // 9-15 chars  
    long: 'text-xs'                // > 15 chars
  };
  
  const lengthCategory = length <= 8 ? 'short' : length <= 15 ? 'medium' : 'long';
  
  return {
    baseClass: baseClasses[context],
    sizeClass: sizeClasses[lengthCategory],
    shouldSplit: context === 'button' && length > 12,
    shouldTruncate: context === 'list' && length > 20,
    lengthCategory
  };
}

/**
 * Component helper for rendering usernames in buttons with proper wrapping
 */
export interface UsernameButtonProps {
  username: string;
  className?: string;
  showAt?: boolean;
}

/**
 * Formats a username for display with @ symbol
 * @param username - The username (with or without @)
 * @param showAt - Whether to show @ symbol (default: true)
 * @returns Formatted username
 */
export function formatUsername(username: string, showAt: boolean = true): string {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  return showAt ? `@${cleanUsername}` : cleanUsername;
}

/**
 * Checks if a username is likely to cause display issues on mobile
 * @param username - The username to check
 * @returns Boolean indicating if special handling is needed
 */
export function needsMobileOptimization(username: string): boolean {
  return username.length > 10 || /[A-Z]{3,}/.test(username) || username.includes('_'.repeat(2));
}

/**
 * CSS class constants for consistent username styling
 */
export const USERNAME_STYLES = {
  // Button styles
  BUTTON_BASE: 'flex items-center justify-center text-center min-h-[3rem] sm:min-h-[3.5rem]',
  BUTTON_TEXT: 'break-words hyphens-auto leading-tight max-w-full overflow-hidden',
  
  // List styles  
  LIST_CONTAINER: 'flex-1 min-w-0',
  LIST_TEXT: 'truncate',
  
  // Card styles
  CARD_TEXT: 'break-words leading-relaxed',
  
  // Responsive text sizes
  SIZE_SMALL: 'text-xs',
  SIZE_MEDIUM: 'text-xs sm:text-sm', 
  SIZE_LARGE: 'text-sm sm:text-base',
} as const;

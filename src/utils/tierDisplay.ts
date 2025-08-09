/**
 * Standardized Tier Display Utilities
 * Single source of truth for tier names and display logic
 */

import { UserTier } from "@/utils/userProgression";

// Centralized tier display names
export const TIER_DISPLAY_NAMES: Record<UserTier, string> = {
  newcomer: "💕 New Lover",
  engaged: "💖 Heart Matcher", 
  "web3-ready": "💝 Love Token Holder",
  "power-user": "👑 Cupid Master"
};

// Simple tier names (without emojis)
export const TIER_SIMPLE_NAMES: Record<UserTier, string> = {
  newcomer: "Newcomer",
  engaged: "Heart Matcher", 
  "web3-ready": "Love Token Holder",
  "power-user": "Cupid Master"
};

// Get display name for a tier
export function getTierDisplayName(tier: UserTier, includeEmoji: boolean = true): string {
  return includeEmoji ? TIER_DISPLAY_NAMES[tier] : TIER_SIMPLE_NAMES[tier];
}

// Get tier color for UI
export function getTierColor(tier: UserTier): string {
  switch (tier) {
    case 'newcomer':
      return 'text-pink-500';
    case 'engaged':
      return 'text-purple-500';
    case 'web3-ready':
      return 'text-blue-500';
    case 'power-user':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
}

// Get tier background color for UI
export function getTierBgColor(tier: UserTier): string {
  switch (tier) {
    case 'newcomer':
      return 'bg-pink-100';
    case 'engaged':
      return 'bg-purple-100';
    case 'web3-ready':
      return 'bg-blue-100';
    case 'power-user':
      return 'bg-yellow-100';
    default:
      return 'bg-gray-100';
  }
}

// Get tier gradient for UI
export function getTierGradient(tier: UserTier): string {
  switch (tier) {
    case 'newcomer':
      return 'from-pink-100 to-rose-100';
    case 'engaged':
      return 'from-purple-100 to-pink-100';
    case 'web3-ready':
      return 'from-blue-100 to-purple-100';
    case 'power-user':
      return 'from-yellow-100 to-orange-100';
    default:
      return 'from-gray-100 to-gray-200';
  }
}

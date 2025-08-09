"use client";

import { useMemo } from "react";

/**
 * Heart-specific game animation utilities
 * Provides optimized animation states and delays for heart-shaped game layout
 */

// Heart layout position mapping for staggered animations
const HEART_POSITION_DELAYS = [
  // Row 1: [null, 0, 1, null, 2, 3, null]
  0, 0.1, 0.15, 0, 0.2, 0.25, 0,
  // Row 2: [4, 5, 6, 7, 8, 9, 10] 
  0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6,
  // Row 3: [null, 11, 12, 13, 14, 15, null]
  0, 0.65, 0.7, 0.75, 0.8, 0.85, 0,
  // Decorative rows get minimal delay
  0, 0, 0.9, 0.95, 1.0, 0, 0,
  0, 0, 0, 1.05, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0
];

export type HeartGameState = 'idle' | 'selected' | 'matched' | 'incorrect' | 'anticipation';

/**
 * Get the appropriate game state for a tile based on game conditions
 */
export function getTileGameState(
  tileIndex: number,
  selected: number[],
  matched: number[],
  incorrect: number[],
  justMatched: number[]
): HeartGameState {
  if (justMatched.includes(tileIndex)) return 'matched';
  if (incorrect.includes(tileIndex)) return 'incorrect';
  if (matched.includes(tileIndex)) return 'matched';
  if (selected.includes(tileIndex)) return 'anticipation';
  return 'idle';
}

/**
 * Get staggered delay for heart position-based animations
 */
export function getHeartPositionDelay(layoutIndex: number): number {
  return HEART_POSITION_DELAYS[layoutIndex] || 0;
}

/**
 * Hook for managing heart game tile animations
 */
export function useHeartGameAnimations(
  tileIndex: number,
  layoutIndex: number,
  gameState: HeartGameState,
  isComplete: boolean = false
) {
  return useMemo(() => {
    const baseDelay = getHeartPositionDelay(layoutIndex);
    
    // Different delay patterns for different states
    const staggerDelay = isComplete 
      ? Math.random() * 0.8 // Random completion animation
      : baseDelay;

    return {
      gameState,
      staggerDelay,
      variant: 'heart-game' as const,
      disabled: isComplete
    };
  }, [tileIndex, layoutIndex, gameState, isComplete]);
}

/**
 * Heart layout utilities
 */
export const HeartLayoutUtils = {
  /**
   * Check if a position in the heart layout should have a tile
   */
  isValidTilePosition: (layoutIndex: number, heartLayout: any[][]): boolean => {
    const flatLayout = heartLayout.flat();
    const cell = flatLayout[layoutIndex];
    return typeof cell === 'number';
  },

  /**
   * Check if a position is decorative
   */
  isDecoPosition: (layoutIndex: number, heartLayout: any[][]): boolean => {
    const flatLayout = heartLayout.flat();
    const cell = flatLayout[layoutIndex];
    return cell === 'deco';
  },

  /**
   * Get the tile number for a layout position
   */
  getTileNumber: (layoutIndex: number, heartLayout: any[][]): number | null => {
    const flatLayout = heartLayout.flat();
    const cell = flatLayout[layoutIndex];
    return typeof cell === 'number' ? cell : null;
  }
};
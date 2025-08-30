"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Interactive hints system for engaging idle users
 * Provides smart timing for onboarding and curiosity effects
 * ENHANCEMENT: Context-aware hints based on game state
 */

interface InteractiveHintsState {
  showOnboarding: boolean;
  onboardingTiles: Set<number>;
  nextCuriosityPulse: number;
  lastInteraction: number;
  // NEW: State for context-aware hints
  potentialMatches: Set<number>;
}

// NEW: Props for enhanced hinting
interface UseInteractiveHintsProps {
  tileIndex: number;
  isGameActive: boolean;
  isIdle: boolean;
  // NEW: Add game state for smarter hints
  selected: number[];
  matched: number[];
  shuffledPairs: string[];
}

export function useInteractiveHints({
  tileIndex,
  isGameActive,
  isIdle,
  selected,
  matched,
  shuffledPairs
}: UseInteractiveHintsProps) {
  const [state, setState] = useState<InteractiveHintsState>(() => ({
    showOnboarding: true,
    onboardingTiles: new Set(),
    nextCuriosityPulse: 0, // Will be set after mount
    lastInteraction: 0, // Will be set after mount
    potentialMatches: new Set() // NEW: Track potential matches
  }));

  // Initialize timestamps after mount to avoid hydration mismatch
  useEffect(() => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      nextCuriosityPulse: now + 8000,
      lastInteraction: now
    }));
  }, []);

  // Record user interaction to pause hints
  const recordInteraction = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastInteraction: Date.now(),
      showOnboarding: false // Disable onboarding after first interaction
    }));
  }, []);

  // Onboarding wiggle effect (first 10 seconds, random tiles)
  useEffect(() => {
    if (!state.showOnboarding || isGameActive) return;

    const timer = setTimeout(() => {
      setState(prev => {
        // Select 3-4 random tiles for wiggling
        const numTiles = 16; // Total game tiles
        const wiggleCount = 3 + Math.floor(Math.random() * 2); // 3-4 tiles
        const selectedTiles = new Set<number>();
        
        while (selectedTiles.size < wiggleCount) {
          selectedTiles.add(Math.floor(Math.random() * numTiles));
        }

        return {
          ...prev,
          onboardingTiles: selectedTiles
        };
      });

      // Clear wiggle after animation completes
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          onboardingTiles: new Set()
        }));
      }, 1000);

    }, 2000 + Math.random() * 3000); // Random delay 2-5 seconds

    return () => clearTimeout(timer);
  }, [state.showOnboarding, isGameActive]);

  // Disable onboarding after 15 seconds regardless
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, showOnboarding: false }));
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  // NEW: Calculate potential matches when idle
  useEffect(() => {
    if (!isIdle || isGameActive || selected.length > 0) {
      // Clear potential matches when not idle or when a card is selected
      if (state.potentialMatches.size > 0) {
        setState(prev => ({ ...prev, potentialMatches: new Set() }));
      }
      return;
    }

    // Only calculate potential matches if we have at least one matched pair
    if (matched.length >= 2) {
      // Find unmatched pairs that could be potential matches
      const unmatchedIndices = shuffledPairs
        .map((_, index) => index)
        .filter(index => !matched.includes(index));
      
      // Group unmatched cards by their image
      const imageToIndices: Record<string, number[]> = {};
      unmatchedIndices.forEach(index => {
        const image = shuffledPairs[index];
        if (!imageToIndices[image]) {
          imageToIndices[image] = [];
        }
        imageToIndices[image].push(index);
      });

      // Find pairs (potential matches)
      const potentialMatchIndices = new Set<number>();
      Object.values(imageToIndices).forEach(indices => {
        if (indices.length >= 2) {
          // Add both indices of the potential match
          indices.slice(0, 2).forEach(index => potentialMatchIndices.add(index));
        }
      });

      setState(prev => ({ ...prev, potentialMatches: potentialMatchIndices }));
    }
  }, [isIdle, isGameActive, selected.length, matched.length, shuffledPairs.length]);

  // NEW: Calculate if this tile should pulse (part of a potential match)
  const shouldPulse = state.potentialMatches.has(tileIndex);

  return {
    // Animation states
    shouldWiggle: state.onboardingTiles.has(tileIndex),
    shouldPulse, // NEW: Context-aware pulsing
    shouldSway: isIdle && !state.showOnboarding && !isGameActive && !shouldPulse, // Gentle sway when truly idle and not pulsing
    
    // Control functions
    recordInteraction,
    
    // State info
    isOnboardingActive: state.showOnboarding,
    timeSinceInteraction: Date.now() - state.lastInteraction
  };
}

/**
 * Get staggered delay for onboarding wiggle based on tile position
 */
export function getOnboardingDelay(tileIndex: number): number {
  // Stagger the wiggle timing so not all tiles wiggle at once
  return (tileIndex % 4) * 0.2; // 0, 0.2, 0.4, 0.6 second delays
}

/**
 * Get unique sway timing for each tile to create organic movement
 */
export function getSwayTiming(tileIndex: number) {
  // Each tile gets slightly different timing for organic feel
  const baseDuration = 6;
  const variation = (tileIndex % 7) * 0.3; // 0 to 1.8 second variation
  const delay = (tileIndex % 11) * 0.15; // 0 to 1.5 second stagger
  
  return {
    duration: baseDuration + variation, // 6-7.8 seconds
    delay: delay // 0-1.5 second stagger
  };
}
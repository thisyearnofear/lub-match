/**
 * MICRO-INTERACTIONS HOOK
 * Reusable celebration, feedback, and delight moments
 * Follows ENHANCEMENT FIRST - use existing Framer Motion where possible
 */

import { useCallback, useRef } from 'react';

export type MicroInteractionType = 
  | 'success'
  | 'error'
  | 'info'
  | 'celebration'
  | 'heartbeat'
  | 'bounce'
  | 'glow';

export interface MicroInteractionConfig {
  type: MicroInteractionType;
  duration?: number; // ms
  sound?: boolean;
  haptic?: boolean; // Mobile vibration
  callback?: () => void;
}

/**
 * Hook for triggering micro-interactions
 * Combines visual feedback with optional sound/haptic feedback
 */
export const useMicroInteraction = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!('vibrate' in navigator)) return;

    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 30,
      heavy: [50, 30, 50],
    };

    try {
      navigator.vibrate(patterns[pattern]);
    } catch (e) {
      // Silently fail on unsupported devices
    }
  }, []);

  const playSound = useCallback((soundType: 'success' | 'error' | 'whoosh' = 'success') => {
    const frequencies: Record<string, [number, number][]> = {
      success: [[523.25, 0.2], [659.25, 0.2], [783.99, 0.3]],
      error: [[349.23, 0.2], [293.66, 0.3]],
      whoosh: [[400, 0.1], [600, 0.1], [800, 0.1]],
    };

    const notes = frequencies[soundType] || frequencies.success;
    playTones(notes);
  }, []);

  const trigger = useCallback(
    async (config: MicroInteractionConfig) => {
      const { type, duration = 500, sound = true, haptic = true, callback } = config;

      // Visual feedback happens on component level
      // This hook handles sound + haptic

      if (haptic) {
        const hapticMap: Record<MicroInteractionType, 'light' | 'medium' | 'heavy'> = {
          success: 'medium',
          error: 'heavy',
          info: 'light',
          celebration: 'medium',
          heartbeat: 'light',
          bounce: 'light',
          glow: 'light',
        };
        triggerHaptic(hapticMap[type]);
      }

      if (sound) {
        const soundMap: Record<MicroInteractionType, 'success' | 'error' | 'whoosh'> = {
          success: 'success',
          error: 'error',
          info: 'whoosh',
          celebration: 'success',
          heartbeat: 'whoosh',
          bounce: 'whoosh',
          glow: 'whoosh',
        };
        playSound(soundMap[type]);
      }

      // Execute callback after duration
      if (callback) {
        setTimeout(callback, duration);
      }
    },
    [triggerHaptic, playSound]
  );

  return {
    trigger,
    triggerHaptic,
    playSound,
  };
};

/**
 * Play tones using Web Audio API
 * Lightweight alternative to audio files
 */
function playTones(notes: [frequency: number, duration: number][]) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    let currentTime = audioContext.currentTime;

    notes.forEach(([frequency, duration]) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gain.gain.setValueAtTime(0.3, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      currentTime += duration;
    });
  } catch (e) {
    // Audio context not supported - silently fail
  }
}

/**
 * Reusable animation sequences for common interaction patterns
 */
export const interactionSequences = {
  /**
   * Celebrate a successful match - scales up and glows
   */
  successMatch: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      scale: [1, 1.15, 1],
      boxShadow: [
        'none',
        '0 0 20px rgba(236, 72, 153, 0.6)',
        'none',
      ],
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },

  /**
   * Shake animation for incorrect match
   */
  errorShake: {
    animate: {
      x: [0, -8, 8, -8, 8, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  },

  /**
   * Subtle pulse for idle hints
   */
  idlePulse: {
    animate: {
      opacity: [0.7, 1, 0.7],
      transition: { duration: 2, repeat: Infinity },
    },
  },

  /**
   * Bounce in when card is revealed
   */
  cardReveal: {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
  },

  /**
   * Photo upload success - small celebration
   */
  uploadSuccess: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      y: [20, 0],
      transition: { duration: 0.5 },
    },
  },

  /**
   * Friend added celebration
   */
  friendAdded: {
    initial: { scale: 0, x: -20 },
    animate: {
      scale: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
      },
    },
  },

  /**
   * Glow effect for call-to-action
   */
  glowPulse: {
    animate: {
      boxShadow: [
        '0 0 20px rgba(236, 72, 153, 0.2)',
        '0 0 40px rgba(236, 72, 153, 0.4)',
        '0 0 20px rgba(236, 72, 153, 0.2)',
      ],
      transition: { duration: 2, repeat: Infinity },
    },
  },

  /**
   * Loading state - rotating spinner
   */
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },

  /**
   * Floating motion for background elements
   */
  float: {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  /**
   * Celebration confetti burst
   */
  burst: {
    animate: {
      scale: [0, 1.2, 1],
      opacity: [1, 1, 0],
      y: [0, -100],
      transition: { duration: 0.8 },
    },
  },
} as const;

/**
 * Haptic feedback presets for common interactions
 */
export const hapticPatterns = {
  success: { light: 10, medium: 30, heavy: [50, 30, 50] },
  error: [100, 50, 100],
  success3: [10, 20, 10, 20, 10],
  pop: 20,
  click: 15,
} as const;

/**
 * Hook for orchestrating complex interaction sequences
 */
export const useInteractionSequence = (sequenceName: keyof typeof interactionSequences) => {
  return interactionSequences[sequenceName];
};

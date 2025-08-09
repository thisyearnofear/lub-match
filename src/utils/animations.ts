/**
 * Animation System
 * Centralized, performance-optimized animations for consistent motion language
 * Respects user preferences and device capabilities
 */

import { useState, useEffect } from "react";
import { Variants } from "framer-motion";

/**
 * Centralized animation presets
 * All animations use transform properties for GPU acceleration
 */
export const AnimationPresets = {
  // Tile animations for home page
  tileHover: {
    scale: 1.02,
    boxShadow: "0 8px 25px rgba(236, 72, 153, 0.15)",
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    }
  },

  tileEntry: {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        delay: i * 0.1, 
        duration: 0.3,
        ease: "easeOut"
      }
    })
  } as Variants,

  // Breathing animation for CTAs
  breathe: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Balance update animations
  balanceUpdate: {
    scale: [1, 1.1, 1],
    color: ["#ffffff", "#ec4899", "#ffffff"],
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  },

  // Subtle pulse for connected state
  connectedPulse: {
    boxShadow: [
      "0 0 0 0 rgba(236, 72, 153, 0.4)",
      "0 0 0 8px rgba(236, 72, 153, 0)",
      "0 0 0 0 rgba(236, 72, 153, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeOut"
    }
  },

  // Drawer animations
  drawerSlide: {
    hidden: { y: "100%" },
    visible: { 
      y: 0,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300 
      }
    },
    exit: { 
      y: "100%",
      transition: { 
        duration: 0.2,
        ease: "easeIn"
      }
    }
  } as Variants,

  // Backdrop fade
  backdropFade: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  } as Variants,

  // Avatar appearance
  avatarPop: {
    hidden: { 
      scale: 0,
      opacity: 0
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  } as Variants,

  // Heart-specific game animations
  heartTileIdle: {
    scale: [1, 1.015, 1],
    transition: { 
      duration: 3, 
      repeat: Infinity, 
      ease: "easeInOut",
      delay: 0 // Will be overridden per tile
    }
  },

  heartTileHover: {
    scale: 1.08,
    rotateZ: [-0.5, 0.5],
    boxShadow: "0 8px 25px rgba(236, 72, 153, 0.2)",
    transition: { duration: 0.2, ease: "easeOut" }
  },

  heartTileFlipAnticipation: {
    scale: 0.95,
    rotateY: -5,
    transition: { duration: 0.15, ease: "easeOut" }
  },

  heartTileFlip: {
    rotateY: 180,
    scale: 1.05,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  },

  heartMatchCelebration: {
    scale: [1, 1.2, 1.05, 1],
    rotate: [0, 5, -2, 0],
    boxShadow: [
      "0 4px 8px rgba(34, 197, 94, 0.2)",
      "0 8px 25px rgba(34, 197, 94, 0.4)",
      "0 4px 8px rgba(34, 197, 94, 0.2)"
    ],
    transition: { duration: 0.8, ease: "easeOut" }
  },

  heartIncorrectShake: {
    x: [-2, 2, -2, 2, 0],
    scale: [1, 0.98, 1],
    transition: { duration: 0.5, ease: "easeInOut" }
  },

  // Interactive hint animations
  onboardingWiggle: {
    x: [0, -3, 3, -2, 2, 0],
    rotate: [0, -1, 1, -0.5, 0.5, 0],
    scale: [1, 1.03, 1.01, 1.02, 1], // Enhanced scale variation
    boxShadow: [
      "0 4px 8px rgba(236, 72, 153, 0.1)",
      "0 8px 20px rgba(236, 72, 153, 0.25)", // Subtle glow peak
      "0 6px 15px rgba(147, 51, 234, 0.2)",   // Purple accent
      "0 8px 18px rgba(236, 72, 153, 0.22)",  // Pink glow
      "0 4px 8px rgba(236, 72, 153, 0.1)"    // Back to normal
    ],
    transition: { 
      duration: 0.8, 
      ease: "easeInOut",
      delay: 0 // Will be overridden per tile
    }
  },

  curiosityPulse: {
    scale: [1, 1.04, 1.02, 1],
    boxShadow: [
      "0 4px 8px rgba(236, 72, 153, 0.1)",
      "0 6px 15px rgba(236, 72, 153, 0.3)",
      "0 4px 8px rgba(236, 72, 153, 0.1)"
    ],
    transition: { duration: 1.2, ease: "easeOut" }
  },

  gentleSway: {
    y: [0, -1, 0, 1, 0],
    x: [0, 0.5, 0, -0.5, 0],
    transition: { 
      duration: 6, // Will be varied per tile
      repeat: Infinity, 
      ease: "easeInOut",
      delay: 0 // Will be set per tile
    }
  },

  // Floating hearts for background
  floatingHeart: {
    y: [0, -20, 0],
    x: [0, 5, -5, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
} as const;

/**
 * Performance-conscious animation hook
 * Automatically disables animations based on user preferences and device capabilities
 */
export function useOptimizedAnimation(
  animationType: keyof typeof AnimationPresets,
  enabled: boolean = true
): any {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check for low power mode or slow devices
    const checkPerformance = () => {
      const connection = (navigator as any).connection;
      const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
      const isLowEndDevice = navigator.hardwareConcurrency <= 2;

      return !(prefersReducedMotion || isSlowConnection || isLowEndDevice);
    };

    setShouldAnimate(enabled && checkPerformance());
  }, [enabled]);

  return shouldAnimate ? AnimationPresets[animationType] : undefined;
}

/**
 * Hook for staggered animations
 * Useful for lists and grids
 */
export function useStaggeredAnimation(
  baseAnimation: keyof typeof AnimationPresets,
  itemCount: number,
  enabled: boolean = true
) {
  const animation = useOptimizedAnimation(baseAnimation, enabled);
  
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1
        }
      }
    },
    item: animation
  };
}

/**
 * Performance monitoring for animations
 * Helps identify animation performance issues
 */
export function useAnimationPerformance() {
  const [fps, setFps] = useState(60);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        setIsLowPerformance(currentFPS < 30);
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    // Only monitor during active animations
    const startMonitoring = () => {
      animationId = requestAnimationFrame(measureFPS);
    };

    // Start monitoring after a short delay
    const timeoutId = setTimeout(startMonitoring, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return {
    fps,
    isLowPerformance,
    shouldReduceAnimations: isLowPerformance
  };
}

/**
 * Utility for creating responsive animation variants
 */
export function createResponsiveVariants(
  mobile: any,
  desktop: any
) {
  return {
    mobile,
    desktop
  };
}

/**
 * Common easing functions
 */
export const Easings = {
  spring: { type: "spring", stiffness: 300, damping: 30 },
  smooth: { duration: 0.3, ease: "easeOut" },
  quick: { duration: 0.15, ease: "easeOut" },
  bounce: { type: "spring", stiffness: 400, damping: 10 }
} as const;

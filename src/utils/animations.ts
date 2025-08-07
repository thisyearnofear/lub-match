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

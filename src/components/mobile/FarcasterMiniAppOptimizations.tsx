/**
 * Farcaster Mini-App Mobile Optimizations
 * PERFORMANT: Optimized for Farcaster mobile environment
 * CLEAN: Mini-app specific UI patterns and interactions
 * MODULAR: Reusable mini-app enhancement components
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";

interface FarcasterMiniAppOptimizationsProps {
  children: React.ReactNode;
  enableHaptics?: boolean;
  enableNativeGestures?: boolean;
  showMiniAppIndicator?: boolean;
}

export default function FarcasterMiniAppOptimizations({
  children,
  enableHaptics = true,
  enableNativeGestures = false,
  showMiniAppIndicator = true
}: FarcasterMiniAppOptimizationsProps) {
  const { context, isInFarcaster, isReady, isInitializing } = useMiniAppReady();
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  // Extract safe area insets from Farcaster context
  useEffect(() => {
    if (context?.client?.safeAreaInsets) {
      setSafeAreaInsets(context.client.safeAreaInsets);
    } else {
      // Fallback to CSS env() values
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
      });
    }
  }, [context]);

  // Haptic feedback utility
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHaptics || !isInFarcaster || !context?.features?.haptics) return;
    
    try {
      // Use Farcaster SDK haptic feedback if available
      if ((window as any).fc?.haptic) {
        (window as any).fc.haptic(type);
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  }, [enableHaptics, isInFarcaster, context]);

  // Enhanced touch interactions for mini-app
  const enhanceTouchInteractions = useCallback(() => {
    if (!isInFarcaster) return;

    // Add haptic feedback to all buttons
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      const handleTouchStart = () => triggerHaptic('light');
      button.addEventListener('touchstart', handleTouchStart, { passive: true });
      
      // Cleanup function would be needed in a real implementation
      return () => button.removeEventListener('touchstart', handleTouchStart);
    });
  }, [isInFarcaster, triggerHaptic]);

  useEffect(() => {
    if (isReady) {
      enhanceTouchInteractions();
    }
  }, [isReady, enhanceTouchInteractions]);

  // Loading state for mini-app initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"
          />
          <h2 className="text-white text-lg font-semibold mb-2">Loading Lub Match</h2>
          <p className="text-white/70 text-sm">Initializing mini-app...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom,
        paddingLeft: safeAreaInsets.left,
        paddingRight: safeAreaInsets.right,
      }}
    >
      {/* Mini-app indicator */}
      {showMiniAppIndicator && isInFarcaster && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-purple-600/90 backdrop-blur-sm text-white text-center py-1 text-xs font-medium"
          style={{ top: safeAreaInsets.top }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Running in Farcaster
          </div>
        </motion.div>
      )}

      {/* Enhanced content wrapper */}
      <div className={isInFarcaster ? 'farcaster-mini-app' : ''}>
        {children}
      </div>

      {/* Mini-app specific styles */}
      <style jsx global>{`
        .farcaster-mini-app {
          /* Enhanced touch targets for mini-app */
          --touch-target-size: 48px;
        }
        
        .farcaster-mini-app button,
        .farcaster-mini-app [role="button"] {
          min-height: var(--touch-target-size);
          min-width: var(--touch-target-size);
          touch-action: manipulation;
        }
        
        .farcaster-mini-app input,
        .farcaster-mini-app textarea,
        .farcaster-mini-app select {
          font-size: 16px !important; /* Prevent zoom on iOS */
        }
        
        /* Smooth scrolling for mini-app */
        .farcaster-mini-app * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Enhanced focus states for mini-app */
        .farcaster-mini-app button:focus-visible,
        .farcaster-mini-app [role="button"]:focus-visible {
          outline: 3px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

// Hook for mini-app specific interactions
export function useMiniAppInteractions() {
  const { context, isInFarcaster, isReady } = useMiniAppReady();
  
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!isInFarcaster || !context?.features?.haptics) return;
    
    try {
      if ((window as any).fc?.haptic) {
        (window as any).fc.haptic(type);
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  }, [isInFarcaster, context]);

  const shareToFarcaster = useCallback(async (text: string, url?: string) => {
    if (!isInFarcaster || !isReady) {
      // Fallback to regular sharing
      if (navigator.share) {
        try {
          await navigator.share({ text, url });
        } catch (error) {
          console.log('Native sharing not available:', error);
        }
      }
      return;
    }

    try {
      // Use Farcaster-specific sharing if available
      if ((window as any).fc?.share) {
        await (window as any).fc.share({ text, url });
      }
    } catch (error) {
      console.log('Farcaster sharing not available:', error);
    }
  }, [isInFarcaster, isReady]);

  const openInFarcaster = useCallback(async (url: string) => {
    if (!isInFarcaster || !isReady) {
      window.open(url, '_blank');
      return;
    }

    try {
      if ((window as any).fc?.openUrl) {
        await (window as any).fc.openUrl(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.log('Farcaster URL opening not available:', error);
      window.open(url, '_blank');
    }
  }, [isInFarcaster, isReady]);

  return {
    triggerHaptic,
    shareToFarcaster,
    openInFarcaster,
    isInFarcaster,
    isReady,
    context
  };
}

// Mobile-optimized action button for mini-app
export function MiniAppActionButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  hapticType = 'light',
  className = '',
  ...props
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'gradient';
  disabled?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
  className?: string;
  [key: string]: any;
}) {
  const { triggerHaptic } = useMiniAppInteractions();

  const handleClick = () => {
    triggerHaptic(hapticType);
    onClick();
  };

  const baseClasses = "min-h-[48px] min-w-[48px] px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700",
    secondary: "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20",
    gradient: "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600"
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

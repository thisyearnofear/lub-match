/**
 * Animated Tile Component
 * Reusable component for consistent tile animations across the app
 * Optimized for performance and accessibility
 */

"use client";

import { motion } from "framer-motion";
import { useOptimizedAnimation } from "@/utils/animations";
import { ReactNode } from "react";

interface AnimatedTileProps {
  children: ReactNode;
  index: number;
  isPrimary?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  testId?: string;
  variant?: "default" | "heart-game" | "heart-deco" | "collaboration";
  gameState?: "idle" | "selected" | "matched" | "incorrect" | "anticipation";
  staggerDelay?: number;
  interactiveHint?: "wiggle" | "pulse" | null;
  // NEW: Collaboration-specific props
  collaborationState?: 'idle' | 'compatible' | 'matched' | 'requesting' | 'spark_sent';
  collaborationHint?: 'skill-match' | 'project-fit' | 'cross-platform' | null;
  experienceTier?: 'love' | 'social' | 'professional';
}

/**
 * Animated tile with consistent motion language
 * Automatically optimizes animations based on device capabilities
 */
export function AnimatedTile({
children,
index,
isPrimary = false,
onClick,
className = "",
disabled = false,
ariaLabel,
testId,
variant = "default",
gameState = "idle",
staggerDelay = 0,
interactiveHint = null,
  collaborationState = 'idle',
  collaborationHint = null,
  experienceTier = 'love',
}: AnimatedTileProps) {
  // Get optimized animations based on variant and hints
  const getAnimations = () => {
    // Helper function to safely get animation or fallback
    const safeAnimation = (animationType: string, enabled: boolean) => {
      const animation = useOptimizedAnimation(animationType as any, enabled);
      return animation || {};
    };

    // NEW: Collaboration variant animations
    if (variant === "collaboration") {
      // Collaboration hints override normal animations
      if (collaborationHint === "skill-match" && collaborationState === "idle") {
        return {
          entry: safeAnimation("tileEntry", !disabled),
          hover: safeAnimation("heartTileHover", !disabled),
          idle: safeAnimation("collaborationSpark", !disabled),
        };
      }

      if (collaborationHint === "project-fit" && collaborationState === "idle") {
        return {
          entry: safeAnimation("tileEntry", !disabled),
          hover: safeAnimation("heartTileHover", !disabled),
          idle: safeAnimation("collaborationRequest", !disabled),
        };
      }

      if (collaborationHint === "cross-platform" && collaborationState === "idle") {
        return {
          entry: safeAnimation("tileEntry", !disabled),
          hover: safeAnimation("heartTileHover", !disabled),
          idle: safeAnimation("crossPlatformCelebration", !disabled),
        };
      }

      switch (collaborationState) {
        case "compatible":
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: safeAnimation("heartTileHover", !disabled),
            idle: safeAnimation("collaborationSpark", !disabled),
          };
        case "matched":
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: {},
            idle: safeAnimation("collaborationMatch", !disabled),
          };
        case "requesting":
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: {},
            idle: safeAnimation("collaborationRequest", !disabled),
          };
        case "spark_sent":
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: {},
            idle: safeAnimation("collaborationSpark", !disabled),
          };
        default:
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: safeAnimation("heartTileHover", !disabled),
            idle: {},
          };
      }
    }

    if (variant === "heart-game") {
      // Interactive hints override normal idle animations
      if (interactiveHint === "wiggle" && gameState === "idle") {
        return {
          entry: safeAnimation("tileEntry", !disabled),
          hover: safeAnimation("heartTileHover", !disabled),
          idle: safeAnimation("onboardingWiggle", !disabled),
        };
      }

      if (interactiveHint === "pulse" && gameState === "idle") {
        return {
          entry: safeAnimation("tileEntry", !disabled),
          hover: safeAnimation("heartTileHover", !disabled),
          idle: safeAnimation("curiosityPulse", !disabled),
        };
      }

      switch (gameState) {
        case "idle":
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: safeAnimation("heartTileHover", !disabled),
            idle: safeAnimation("heartTileIdle", !disabled),
          };
        case "anticipation":
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: {},
            idle: safeAnimation("heartTileFlipAnticipation", !disabled),
          };
        case "matched":
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: {},
            idle: safeAnimation("heartMatchCelebration", !disabled),
          };
        case "incorrect":
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: {},
            idle: safeAnimation("heartIncorrectShake", !disabled),
          };
        default:
          return {
            entry: safeAnimation("tileEntry", !disabled),
            hover: safeAnimation("heartTileHover", !disabled),
            idle: {},
          };
      }
    }

    // Default variant animations with experience tier support
    let idleAnimation = "breathe";
    
    // NEW: Experience tier-specific idle animations
    if (experienceTier === 'love') {
      idleAnimation = "loveTierPulse";
    } else if (experienceTier === 'social') {
      idleAnimation = "socialTierBounce";
    } else if (experienceTier === 'professional') {
      idleAnimation = "professionalTierGlow";
    }
    
    return {
      entry: safeAnimation("tileEntry", !disabled),
      hover: safeAnimation("tileHover", !disabled),
      idle: safeAnimation(idleAnimation as any, isPrimary && !disabled),
    };
  };

  const animations = getAnimations();

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={{
        ...animations.entry,
        visible: {
          ...(animations.entry.visible || {}),
          transition: {
            ...(animations.entry.visible?.transition || {}),
            delay:
              staggerDelay + (animations.entry.visible?.transition?.delay || 0),
          },
        },
      }}
      whileHover={disabled ? {} : animations.hover}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        ${onClick ? "cursor-pointer" : ""} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""} 
        ${variant === "heart-game" ? "heart-game-tile" : ""}
        ${className}
      `}
      style={{
        // Ensure animations use transform (GPU accelerated)
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <motion.div
        animate={
          animations.idle
            ? {
                ...animations.idle,
                transition: {
                  ...(animations.idle?.transition || {}),
                  delay: staggerDelay * 0.1, // Stagger idle animations
                },
              }
            : {}
        }
        style={{
          // Prevent layout shifts during animation
          transformOrigin: "center",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * Animated container for multiple tiles
 * Provides staggered entry animations
 */
interface AnimatedTileContainerProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function AnimatedTileContainer({
  children,
  className = "",
  testId,
}: AnimatedTileContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      data-testid={testId}
    >
      {children}
    </motion.div>
  );
}

/**
 * Floating hearts background animation
 * Subtle background enhancement for romantic theme
 */
interface FloatingHeartsProps {
  count?: number;
  className?: string;
}

export function FloatingHearts({
  count = 5,
  className = "",
}: FloatingHeartsProps) {
  const floatingAnimation = useOptimizedAnimation("floatingHeart");

  if (!floatingAnimation || Object.keys(floatingAnimation).length === 0) {
    return null; // Don't render if animations are disabled
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-pink-200/20 text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={floatingAnimation}
          transition={{
            ...floatingAnimation.transition,
            delay: i * 0.5,
          }}
        >
          💝
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Pulse animation for connected states
 * Subtle indicator for active connections
 */
interface PulseIndicatorProps {
  isActive: boolean;
  children: ReactNode;
  className?: string;
}

export function PulseIndicator({
  isActive,
  children,
  className = "",
}: PulseIndicatorProps) {
  const pulseAnimation = useOptimizedAnimation("connectedPulse", isActive);

  return (
    <motion.div animate={pulseAnimation} className={className}>
      {children}
    </motion.div>
  );
}

export default AnimatedTile;

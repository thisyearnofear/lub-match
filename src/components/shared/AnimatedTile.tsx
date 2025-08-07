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
  testId
}: AnimatedTileProps) {
  // Get optimized animations
  const entryAnimation = useOptimizedAnimation('tileEntry', !disabled);
  const hoverAnimation = useOptimizedAnimation('tileHover', !disabled);
  const breatheAnimation = useOptimizedAnimation('breathe', isPrimary && !disabled);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={entryAnimation}
      whileHover={disabled ? {} : hoverAnimation}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        ${onClick ? 'cursor-pointer' : ''} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}
      `}
      style={{ 
        // Ensure animations use transform (GPU accelerated)
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <motion.div 
        animate={breatheAnimation}
        style={{
          // Prevent layout shifts during animation
          transformOrigin: 'center'
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
  testId 
}: AnimatedTileContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
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

export function FloatingHearts({ count = 5, className = "" }: FloatingHeartsProps) {
  const floatingAnimation = useOptimizedAnimation('floatingHeart');

  if (!floatingAnimation || Object.keys(floatingAnimation).length === 0) {
    return null; // Don't render if animations are disabled
  }

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
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

export function PulseIndicator({ isActive, children, className = "" }: PulseIndicatorProps) {
  const pulseAnimation = useOptimizedAnimation('connectedPulse', isActive);

  return (
    <motion.div
      animate={pulseAnimation}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedTile;

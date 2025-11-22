/**
 * UNIFIED BUTTON COMPONENT
 * Single source of truth for all button variants
 * Consolidates: ActionButton, PrimaryButton, SecondaryButton patterns
 * Enhances: Consistent styling, micro-interactions, accessibility
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  colors,
  componentVariants,
  spacing,
  borderRadius,
  typography,
  transitions,
  a11y,
  createGradient,
} from '@/theme/designTokens';
import { useMicroInteraction, interactionSequences } from '@/hooks/useMicroInteractions';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gradient' | 'danger';
type ButtonSize = 'sm' | 'base' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  microInteraction?: boolean; // Trigger celebration on click
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const sizeConfig = {
  sm: {
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    minHeight: '36px',
  },
  base: {
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    minHeight: '44px',
  },
  lg: {
    padding: `${spacing[4]} ${spacing[6]}`,
    fontSize: typography.fontSize.lg,
    minHeight: '52px',
  },
};

const variantConfig: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: createGradient(colors.primary[400], colors.primary[600]),
    color: colors.neutral[0],
    border: 'none',
  },
  secondary: {
    background: createGradient(colors.secondary[400], colors.secondary[600]),
    color: colors.neutral[0],
    border: 'none',
  },
  gradient: {
    background: createGradient(colors.primary[400], colors.secondary[500]),
    color: colors.neutral[0],
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: colors.primary[400],
    border: `2px solid ${colors.primary[400]}`,
  },
  danger: {
    background: colors.error,
    color: colors.neutral[0],
    border: 'none',
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'base',
      fullWidth = false,
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      microInteraction = false,
      onClick,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const { trigger: triggerMicroInteraction } = useMicroInteraction();
    const isDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (microInteraction && !isDisabled) {
        triggerMicroInteraction({
          type: 'success',
          duration: 600,
        });
      }
      onClick?.(e);
    };

    const sizeStyle = sizeConfig[size];
    const variantStyle = variantConfig[variant];

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        style={{
          ...sizeStyle,
          ...variantStyle,
          width: fullWidth ? '100%' : 'auto',
          borderRadius: borderRadius.lg,
          fontWeight: typography.fontWeight.semibold as any,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
          transition: transitions.property('base'),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[2],
          ...(!isDisabled && {
            ':hover': {
              filter: 'brightness(1.1)',
            },
          }),
        } as React.CSSProperties}
        className={`focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 disabled:cursor-not-allowed transition-all ${className}`}
        {...(props as any)}
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '1em',
              height: '1em',
              border: `2px solid currentColor`,
              borderRightColor: 'transparent',
              borderRadius: '50%',
            }}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span>{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && <span>{icon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

"use client";

import { ReactNode, MouseEventHandler } from "react";
import { motion } from "framer-motion";

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'share' 
  | 'danger' 
  | 'ghost'
  | 'gradient-pink'
  | 'gradient-purple'
  | 'gradient-blue'
  | 'gradient-green';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ActionButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  animate?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  id?: string;
  name?: string;
  value?: string;
  form?: string;
  autoFocus?: boolean;
  tabIndex?: number;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-pink-600 hover:bg-pink-700 text-white",
  secondary: "bg-gray-500 hover:bg-gray-600 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  share: "bg-purple-600 hover:bg-purple-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300",
  'gradient-pink': "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white",
  'gradient-purple': "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white",
  'gradient-blue': "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white",
  'gradient-green': "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "py-2 px-4 text-sm",
  md: "py-3 px-6 text-base",
  lg: "py-4 px-8 text-lg",
};

export default function ActionButton({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  loading = false,
  fullWidth = false,
  animate = true,
  disabled = false,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  id,
  name,
  value,
  form,
  autoFocus,
  tabIndex,
}: ActionButtonProps) {
  const baseClasses = "rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2";
  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];
  const widthClasses = fullWidth ? "w-full" : "";
  const disabledClasses = (disabled || loading) ? "opacity-50 cursor-not-allowed" : "";
  const hoverClasses = animate && !disabled && !loading ? "transform hover:scale-105" : "";

  const className = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${disabledClasses} ${hoverClasses}`.trim();

  const content = (
    <>
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {!loading && icon && <span>{icon}</span>}
      <span>{children}</span>
    </>
  );

  const buttonProps = {
    className,
    disabled: disabled || loading,
    onClick,
    type,
    'aria-label': ariaLabel,
    id,
    name,
    value,
    form,
    autoFocus,
    tabIndex,
  };

  if (animate && !disabled && !loading) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...buttonProps}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <button {...buttonProps}>
      {content}
    </button>
  );
}
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { 
  splitUsernameForButton, 
  getUsernameDisplayClasses, 
  formatUsername,
  USERNAME_STYLES 
} from "@/utils/textUtils";

interface UsernameButtonProps {
  username: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  variant?: 'primary' | 'success' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  showAt?: boolean;
  icon?: ReactNode;
  className?: string;
  animate?: boolean;
}

const variantStyles = {
  primary: "bg-purple-700 hover:bg-purple-600 text-white",
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white", 
  neutral: "bg-purple-800 text-purple-300"
};

const sizeStyles = {
  sm: "p-2 rounded-lg min-h-[2.5rem]",
  md: "p-3 sm:p-4 rounded-xl min-h-[3rem] sm:min-h-[3.5rem]",
  lg: "p-4 sm:p-5 rounded-xl min-h-[3.5rem] sm:min-h-[4rem]"
};

export default function UsernameButton({
  username,
  onClick,
  disabled = false,
  selected = false,
  variant = 'primary',
  size = 'md',
  showAt = true,
  icon,
  className = '',
  animate = true
}: UsernameButtonProps) {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  const displayClasses = getUsernameDisplayClasses(cleanUsername, 'button');
  const formattedUsername = formatUsername(cleanUsername, showAt);
  
  // Split username for better mobile display if needed
  const usernameParts = displayClasses.shouldSplit 
    ? splitUsernameForButton(cleanUsername)
    : [cleanUsername];
  
  const baseClasses = `
    ${USERNAME_STYLES.BUTTON_BASE}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    font-semibold transition-all duration-300
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
    ${selected ? 'ring-2 ring-white ring-opacity-50' : ''}
    ${className}
  `.trim();

  const content = (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {usernameParts.length > 1 ? (
        // Multi-line username display
        <div className="text-center">
          <div className={`${USERNAME_STYLES.BUTTON_TEXT} ${displayClasses.sizeClass}`}>
            {showAt && '@'}{usernameParts[0]}
          </div>
          <div className={`${USERNAME_STYLES.BUTTON_TEXT} ${displayClasses.sizeClass}`}>
            {usernameParts[1]}
          </div>
        </div>
      ) : (
        // Single line username display
        <span className={`${USERNAME_STYLES.BUTTON_TEXT} ${displayClasses.sizeClass}`}>
          {formattedUsername}
        </span>
      )}
      
      {icon && (
        <span className="text-lg flex-shrink-0">
          {icon}
        </span>
      )}
    </div>
  );

  const buttonProps = {
    onClick: disabled ? undefined : onClick,
    disabled,
    className: baseClasses,
    type: 'button' as const
  };

  if (animate && !disabled) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
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

// Specialized variant for social games
export function SocialGameUsernameButton({
  username,
  onClick,
  disabled = false,
  isCorrect,
  isSelected,
  showResult = false,
  ...props
}: Omit<UsernameButtonProps, 'variant' | 'icon'> & {
  isCorrect?: boolean;
  isSelected?: boolean;
  showResult?: boolean;
}) {
  const getVariant = () => {
    if (!showResult) return 'primary';
    if (isCorrect) return 'success';
    if (isSelected && !isCorrect) return 'error';
    return 'neutral';
  };

  const getIcon = () => {
    if (!showResult) return undefined;
    if (isCorrect) return '✓';
    if (isSelected && !isCorrect) return '✗';
    return undefined;
  };

  return (
    <UsernameButton
      username={username}
      onClick={onClick}
      disabled={disabled}
      variant={getVariant()}
      icon={getIcon()}
      selected={isSelected && !showResult}
      {...props}
    />
  );
}

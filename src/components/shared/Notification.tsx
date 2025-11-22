/**
 * UNIFIED NOTIFICATION COMPONENT
 * Single source of truth for all notification/toast patterns
 * Consolidates: Toast, Alert, ErrorMessage, SuccessMessage patterns
 * Delightful, romantic language + consistent styling
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  colors,
  componentVariants,
  spacing,
  borderRadius,
  animations,
  transitions,
} from '@/theme/designTokens';
import { useMicroInteraction } from '@/hooks/useMicroInteractions';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // Auto-dismiss ms, 0 = manual only
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  romantic?: boolean; // Use romantic language/emoji
}

// Romantic messaging for delight
const romanticMessages: Record<NotificationType, { prefix: string; emoji: string }> = {
  success: {
    prefix: '💝 Perfect match! ',
    emoji: '✨',
  },
  error: {
    prefix: '💔 Oops, ',
    emoji: '😔',
  },
  info: {
    prefix: '💌 Heads up, ',
    emoji: 'ℹ️',
  },
  warning: {
    prefix: '⚠️ Heads up, ',
    emoji: '🤔',
  },
};

const variantStyles: Record<NotificationType, React.CSSProperties> = {
  success: {
    background: `${colors.success}15`,
    borderColor: colors.success,
    color: colors.success,
  },
  error: {
    background: `${colors.error}15`,
    borderColor: colors.error,
    color: colors.error,
  },
  info: {
    background: `${colors.secondary[400]}15`,
    borderColor: colors.secondary[400],
    color: colors.secondary[600],
  },
  warning: {
    background: `${colors.warning}15`,
    borderColor: colors.warning,
    color: colors.warning,
  },
};

export const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      type,
      title,
      message,
      duration = 5000,
      onDismiss,
      action,
      icon,
      romantic = true,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);
    const { trigger: triggerMicroInteraction } = useMicroInteraction();

    useEffect(() => {
      if (duration && duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onDismiss]);

    useEffect(() => {
      if (isVisible) {
        triggerMicroInteraction({
          type: type === 'error' ? 'error' : 'info',
          sound: true,
        });
      }
    }, [isVisible, type, triggerMicroInteraction]);

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    const romanticConfig = romantic ? romanticMessages[type] : null;
    const displayMessage = romanticConfig
      ? `${romanticConfig.prefix}${message}`
      : message;

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              ...variantStyles[type],
              border: `1px solid ${variantStyles[type].borderColor}`,
              borderRadius: borderRadius.lg,
              padding: `${spacing[4]} ${spacing[4]}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing[3],
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(8px)',
            }}
            className="max-w-md w-full"
          >
            {/* Icon */}
            <div style={{ flexShrink: 0, fontSize: '1.5em', marginTop: '2px' }}>
              {icon || romanticConfig?.emoji || '•'}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && (
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: spacing[1],
                    fontSize: '0.95rem',
                  }}
                >
                  {title}
                </div>
              )}
              <div
                style={{
                  fontSize: '0.9rem',
                  opacity: 0.9,
                  wordWrap: 'break-word',
                }}
              >
                {displayMessage}
              </div>

              {/* Action Button */}
              {action && (
                <button
                  onClick={() => {
                    action.onClick();
                    handleDismiss();
                  }}
                  style={{
                    marginTop: spacing[2],
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textDecoration: 'underline',
                    opacity: 0.8,
                    transition: transitions.property('fast'),
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = '0.8';
                  }}
                >
                  {action.label}
                </button>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1.2em',
                flexShrink: 0,
                opacity: 0.6,
                transition: transitions.property('fast'),
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.6';
              }}
              aria-label="Dismiss notification"
            >
              ✕
            </button>

            {/* Progress bar for auto-dismiss */}
            {duration && duration > 0 && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: variantStyles[type].color,
                  borderRadius: borderRadius.xl,
                  transformOrigin: 'left',
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

Notification.displayName = 'Notification';

/**
 * Notification Context & Provider for global toast notifications
 */
interface Toast extends NotificationProps {
  id: string;
}

const NotificationContext = React.createContext<{
  showNotification: (props: Omit<Toast, 'id'>) => string;
  dismissNotification: (id: string) => void;
} | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Toast[]>([]);

  const showNotification = (props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const notification: Toast = { ...props, id };

    setNotifications((prev) => [...prev, notification]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification }}>
      {children}

      {/* Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: spacing[4],
          right: spacing[4],
          zIndex: 800,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{ marginBottom: spacing[3], pointerEvents: 'auto' }}
            >
              <Notification
                {...notification}
                onDismiss={() => dismissNotification(notification.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export default Notification;

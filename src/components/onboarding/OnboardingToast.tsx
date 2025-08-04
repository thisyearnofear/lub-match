"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface OnboardingToastProps {
  show: boolean;
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  onClose: () => void;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

export function OnboardingToast({
  show,
  title,
  message,
  icon = "💡",
  duration = 6000,
  onClose,
  actionButton,
}: OnboardingToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl shadow-xl p-4 border border-purple-300">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1">{title}</div>
                <div className="text-xs opacity-90 leading-relaxed">
                  {message}
                </div>
                {actionButton && (
                  <button
                    onClick={actionButton.onClick}
                    className="mt-3 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-xs font-semibold transition-all duration-200"
                  >
                    {actionButton.text}
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing onboarding notifications
export function useOnboardingToasts() {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      icon?: string;
      duration?: number;
      show: boolean;
      actionButton?: {
        text: string;
        onClick: () => void;
      };
    }>
  >([]);

  const showToast = (
    title: string,
    message: string,
    options?: {
      icon?: string;
      duration?: number;
      actionButton?: {
        text: string;
        onClick: () => void;
      };
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        message,
        show: true,
        ...options,
      },
    ]);
  };

  const hideToast = (id: string) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, show: false } : toast))
    );

    // Remove from array after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none">
      <div className="space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <OnboardingToast
            key={toast.id}
            show={toast.show}
            title={toast.title}
            message={toast.message}
            icon={toast.icon}
            duration={toast.duration}
            actionButton={toast.actionButton}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );

  return {
    showToast,
    ToastContainer,
  };
}

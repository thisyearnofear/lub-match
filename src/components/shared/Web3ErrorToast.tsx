"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Web3ErrorInfo } from "@/utils/web3ErrorHandler";

interface Web3ErrorToastProps {
  error: Web3ErrorInfo | null;
  onClose: () => void;
  duration?: number;
}

export function Web3ErrorToast({ error, onClose, duration = 8000 }: Web3ErrorToastProps) {
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Auto-close timer
  React.useEffect(() => {
    if (!error || error.action) return; // Don't auto-close if there's an action

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [error, onClose, duration]);

  const handleAction = async () => {
    if (!error?.action) return;

    setIsExecutingAction(true);
    try {
      await error.action.handler();
      onClose(); // Close on success
    } catch (actionError) {
      console.error("Action failed:", actionError);
      // Could show another toast for action failure
    } finally {
      setIsExecutingAction(false);
    }
  };

  const getSeverityStyles = (severity: Web3ErrorInfo["severity"]) => {
    switch (severity) {
      case "error":
        return {
          bg: "from-red-900 to-red-800",
          border: "border-red-600",
          text: "text-red-100"
        };
      case "warning":
        return {
          bg: "from-yellow-900 to-orange-800",
          border: "border-yellow-600",
          text: "text-yellow-100"
        };
      case "info":
        return {
          bg: "from-blue-900 to-blue-800",
          border: "border-blue-600",
          text: "text-blue-100"
        };
      default:
        return {
          bg: "from-gray-900 to-gray-800",
          border: "border-gray-600",
          text: "text-gray-100"
        };
    }
  };

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-4"
          style={{
            paddingBottom: "max(0px, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className={`
              bg-gradient-to-r ${getSeverityStyles(error.severity).bg}
              border ${getSeverityStyles(error.severity).border}
              rounded-2xl shadow-2xl p-4 backdrop-blur-sm
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{error.icon}</span>
                <div>
                  <h3 className={`font-bold text-lg ${getSeverityStyles(error.severity).text}`}>
                    {error.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`${getSeverityStyles(error.severity).text} hover:opacity-70 text-xl p-1 transition-opacity`}
                aria-label="Close error"
              >
                ×
              </button>
            </div>

            {/* Message */}
            <p className={`${getSeverityStyles(error.severity).text} opacity-90 mb-4 leading-relaxed`}>
              {error.message}
            </p>

            {/* Action Button */}
            {error.action && (
              <div className="flex justify-end">
                <button
                  onClick={handleAction}
                  disabled={isExecutingAction}
                  className={`
                    px-4 py-2 rounded-xl font-medium transition-all
                    ${error.severity === "warning" 
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                      : "bg-white/20 hover:bg-white/30 text-white"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2
                  `}
                >
                  {isExecutingAction ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Switching...</span>
                    </>
                  ) : (
                    <>
                      <span>{error.action.label}</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Progress bar for auto-close (only if no action) */}
            {!error.action && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-2xl"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook for managing Web3 error toasts
 */
export function useWeb3ErrorToast() {
  const [error, setError] = useState<Web3ErrorInfo | null>(null);

  const showError = (errorInfo: Web3ErrorInfo) => {
    setError(errorInfo);
  };

  const hideError = () => {
    setError(null);
  };

  const ToastComponent = () => (
    <Web3ErrorToast error={error} onClose={hideError} />
  );

  return {
    showError,
    hideError,
    ToastComponent,
    hasError: !!error
  };
}

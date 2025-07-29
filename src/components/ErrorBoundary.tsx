"use client";

import React, { Component, ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Send error to analytics
    if (typeof window !== "undefined") {
      try {
        const { analytics } = require("@/utils/analytics");
        analytics.track("error_boundary", {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      } catch (analyticsError) {
        console.warn("Failed to track error:", analyticsError);
      }
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">😅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              Don't worry, this happens sometimes. The error has been logged and we'll fix it soon!
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                🔄 Refresh Page
              </button>
              
              <button
                onClick={() => window.location.href = "/"}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                🏠 Go Home
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  🐛 Debug Info (Dev Mode)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Web3 Error Boundary - specific for Web3 operations
interface Web3ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function Web3ErrorBoundary({ children, fallback }: Web3ErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 m-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-orange-800">Web3 Feature Unavailable</h3>
                <p className="text-sm text-orange-600">
                  Don't worry! You can still enjoy the game without Web3 features.
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-orange-700">
              <p>• All games work normally</p>
              <p>• Social features are available</p>
              <p>• Connect wallet later for token features</p>
            </div>
          </motion.div>
        )
      }
      onError={(error) => {
        console.warn("Web3 Error:", error.message);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Loading States Component
interface LoadingStateProps {
  type?: "game" | "web3" | "social" | "general";
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ 
  type = "general", 
  message, 
  size = "md" 
}: LoadingStateProps) {
  const getLoadingContent = () => {
    switch (type) {
      case "game":
        return {
          emoji: "🎮",
          defaultMessage: "Loading your game...",
          color: "from-purple-500 to-pink-500"
        };
      case "web3":
        return {
          emoji: "⛓️",
          defaultMessage: "Connecting to blockchain...",
          color: "from-blue-500 to-indigo-500"
        };
      case "social":
        return {
          emoji: "👥",
          defaultMessage: "Loading social features...",
          color: "from-green-500 to-emerald-500"
        };
      default:
        return {
          emoji: "💝",
          defaultMessage: "Loading...",
          color: "from-pink-500 to-rose-500"
        };
    }
  };

  const { emoji, defaultMessage, color } = getLoadingContent();
  const sizeClasses = {
    sm: "text-sm p-3",
    md: "text-base p-4",
    lg: "text-lg p-6"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-gradient-to-r ${color} bg-opacity-10 rounded-xl ${sizeClasses[size]} text-center`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-2xl mb-2"
      >
        {emoji}
      </motion.div>
      <p className="text-gray-700 font-medium">
        {message || defaultMessage}
      </p>
    </motion.div>
  );
}

// Network Error Component
interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
}

export function NetworkError({ onRetry, message }: NetworkErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 text-center"
    >
      <div className="text-4xl mb-4">📡</div>
      <h3 className="font-semibold text-red-800 mb-2">Connection Issue</h3>
      <p className="text-sm text-red-600 mb-4">
        {message || "Unable to connect to the network. Please check your internet connection."}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300"
        >
          🔄 Try Again
        </button>
      )}
    </motion.div>
  );
}

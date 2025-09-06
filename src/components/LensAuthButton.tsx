"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLensAuth } from '@/hooks/useLensAuth';
import ActionButton from './shared/ActionButton';
import { motion, AnimatePresence } from 'framer-motion';

interface LensAuthButtonProps {
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export default function LensAuthButton({
  onAuthSuccess,
  onAuthError,
  className = '',
  variant = 'primary',
  size = 'md',
}: LensAuthButtonProps) {
  const { isConnected } = useAccount();
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    logout, 
    clearError 
  } = useLensAuth();
  
  const [showDetails, setShowDetails] = useState(false);

  const handleLogin = async () => {
    clearError();
    await login();
    
    // Check if authentication was successful
    const authState = useLensAuth().authState;
    if (authState.isAuthenticated) {
      onAuthSuccess?.();
    } else if (error) {
      onAuthError?.(error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!isConnected) {
    return (
      <div className="text-sm text-gray-500 text-center">
        Connect your wallet to access Lens features
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Connected to Lens Protocol</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect Lens'}
          </button>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-gray-600 bg-gray-50 p-2 rounded border"
            >
              <div>Wallet: {useLensAuth().authState.walletAddress?.slice(0, 6)}...{useLensAuth().authState.walletAddress?.slice(-4)}</div>
              {useLensAuth().authState.profileId && (
                <div>Profile: {useLensAuth().authState.profileId}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <ActionButton
        onClick={handleLogin}
        disabled={isLoading || !isConnected}
        variant={variant}
        size={size}
        fullWidth
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting to Lens...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>🌿</span>
            <span>Connect to Lens Protocol</span>
          </div>
        )}
      </ActionButton>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"
        >
          <div className="flex items-start gap-2">
            <span className="text-red-500">⚠️</span>
            <div className="flex-1">
              <div className="font-medium">Authentication Failed</div>
              <div className="text-xs mt-1">{error}</div>
              <button
                onClick={clearError}
                className="text-xs text-red-700 hover:text-red-900 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Sign a message to access Lens features like user discovery and social interactions
      </div>
    </div>
  );
}

/**
 * Compact version for use in smaller spaces
 */
export function LensAuthButtonCompact({
  onAuthSuccess,
  onAuthError,
  className = '',
}: Omit<LensAuthButtonProps, 'variant' | 'size'>) {
  const { isConnected } = useAccount();
  const { isAuthenticated, isLoading, login } = useLensAuth();

  if (!isConnected || isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={async () => {
        await login();
        if (useLensAuth().authState.isAuthenticated) {
          onAuthSuccess?.();
        }
      }}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <span>🌿</span>
      )}
      <span>{isLoading ? 'Connecting...' : 'Connect Lens'}</span>
    </button>
  );
}
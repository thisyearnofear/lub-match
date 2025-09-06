"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { lensAuth, LensAuthState } from '@/services/lensService';

export interface UseLensAuthReturn {
  // Authentication state
  authState: LensAuthState;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  resumeSession: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
}

/**
 * Hook for Lens Protocol authentication
 * Integrates with wagmi wallet connection
 */
export function useLensAuth(): UseLensAuthReturn {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [authState, setAuthState] = useState<LensAuthState>({
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update auth state when it changes
  const updateAuthState = useCallback(() => {
    const currentState = lensAuth.getAuthState();
    setAuthState(currentState);
  }, []);

  // Resume session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        await lensAuth.resumeSession();
        updateAuthState();
      } catch (err) {
        console.log('No existing Lens session to resume');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [updateAuthState]);

  // Login function
  const login = useCallback(async () => {
    if (!isConnected || !address || !walletClient) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await lensAuth.login({
        walletClient,
        walletAddress: address,
      });

      if (!result.success) {
        setError(result.error || 'Authentication failed');
      } else {
        updateAuthState();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, walletClient, updateAuthState]);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await lensAuth.logout();
      updateAuthState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthState]);

  // Resume session function
  const resumeSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await lensAuth.resumeSession();
      if (!result.success) {
        setError(result.error || 'Session resume failed');
      } else {
        updateAuthState();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session resume failed');
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthState]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-logout when wallet disconnects
  useEffect(() => {
    if (!isConnected && authState.isAuthenticated) {
      logout();
    }
  }, [isConnected, authState.isAuthenticated, logout]);

  return {
    authState,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    resumeSession,
    clearError,
  };
}

/**
 * Simple hook to check if user is authenticated with Lens
 */
export function useIsLensAuthenticated(): boolean {
  const { isAuthenticated } = useLensAuth();
  return isAuthenticated;
}
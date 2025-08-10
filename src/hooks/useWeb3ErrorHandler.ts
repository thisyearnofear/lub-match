"use client";

import { useConfig } from "wagmi";
import { createWeb3ErrorHandler, Web3ErrorInfo } from "@/utils/web3ErrorHandler";
import { useWeb3ErrorToast } from "@/components/shared/Web3ErrorToast";

/**
 * Hook for handling Web3 errors with user-friendly messages and automatic fixes
 */
export function useWeb3ErrorHandler() {
  const config = useConfig();
  const { showError, hideError, ToastComponent, hasError } = useWeb3ErrorToast();
  
  const errorHandler = createWeb3ErrorHandler(config);

  /**
   * Handle a Web3 error and show appropriate toast
   */
  const handleError = async (error: any): Promise<Web3ErrorInfo> => {
    const errorInfo = await errorHandler.handleError(error);
    showError(errorInfo);
    return errorInfo;
  };

  /**
   * Handle error with custom callback
   */
  const handleErrorWithCallback = async (
    error: any, 
    onResolved?: () => void
  ): Promise<Web3ErrorInfo> => {
    const errorInfo = await errorHandler.handleError(error);
    
    // If there's an action, wrap it with the callback
    if (errorInfo.action && onResolved) {
      const originalHandler = errorInfo.action.handler;
      errorInfo.action.handler = async () => {
        await originalHandler();
        onResolved();
      };
    }
    
    showError(errorInfo);
    return errorInfo;
  };

  return {
    handleError,
    handleErrorWithCallback,
    hideError,
    ToastComponent,
    hasError
  };
}

/**
 * Simplified hook that just returns the error handler function
 */
export function useSimpleWeb3ErrorHandler() {
  const { handleError } = useWeb3ErrorHandler();
  return handleError;
}

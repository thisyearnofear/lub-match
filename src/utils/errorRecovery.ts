"use client";

// Error recovery utilities for better user experience

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Error classification for better user messaging
 */
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  suggestedAction?: string;
}

/**
 * Classify errors for better user experience
 */
export function classifyError(error: Error | unknown): ClassifiedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();
  
  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('cors')
  ) {
    return {
      type: ErrorType.NETWORK,
      message: errorMessage,
      userMessage: 'Connection problem. Please check your internet and try again.',
      canRetry: true,
      suggestedAction: 'Check your internet connection and retry',
    };
  }
  
  // Authentication errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('login') ||
    lowerMessage.includes('token')
  ) {
    return {
      type: ErrorType.AUTHENTICATION,
      message: errorMessage,
      userMessage: 'Authentication required. Please sign in and try again.',
      canRetry: false,
      suggestedAction: 'Sign in to your account',
    };
  }
  
  // Server errors (5xx)
  if (
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('504') ||
    lowerMessage.includes('server error')
  ) {
    return {
      type: ErrorType.SERVER,
      message: errorMessage,
      userMessage: 'Server is temporarily unavailable. Please try again in a moment.',
      canRetry: true,
      suggestedAction: 'Wait a moment and retry',
    };
  }
  
  // Client errors (4xx)
  if (
    lowerMessage.includes('400') ||
    lowerMessage.includes('404') ||
    lowerMessage.includes('bad request')
  ) {
    return {
      type: ErrorType.CLIENT,
      message: errorMessage,
      userMessage: 'Invalid request. Please refresh the page and try again.',
      canRetry: false,
      suggestedAction: 'Refresh the page',
    };
  }
  
  // Validation errors
  if (
    lowerMessage.includes('validation') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('required')
  ) {
    return {
      type: ErrorType.VALIDATION,
      message: errorMessage,
      userMessage: 'Invalid data provided. Please check your input and try again.',
      canRetry: false,
      suggestedAction: 'Check your input and try again',
    };
  }
  
  // Default unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: errorMessage,
    userMessage: 'Something unexpected happened. Please try again.',
    canRetry: true,
    suggestedAction: 'Try again or refresh the page',
  };
}

/**
 * Enhanced error recovery hook
 */
export interface ErrorRecoveryState {
  error: ClassifiedError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
}

export interface ErrorRecoveryActions {
  retry: () => Promise<void>;
  reset: () => void;
  reportError: (error: Error | unknown) => void;
}

/**
 * Create error recovery state and actions
 */
export function createErrorRecovery(
  onRetry: () => Promise<void>,
  config: Partial<RetryConfig> = {}
): {
  state: ErrorRecoveryState;
  actions: ErrorRecoveryActions;
  setState: (state: Partial<ErrorRecoveryState>) => void;
} {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  let state: ErrorRecoveryState = {
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false,
  };
  
  const setState = (newState: Partial<ErrorRecoveryState>) => {
    state = { ...state, ...newState };
  };
  
  const actions: ErrorRecoveryActions = {
    retry: async () => {
      if (!state.canRetry || state.isRetrying || state.retryCount >= retryConfig.maxAttempts) {
        return;
      }
      
      setState({ isRetrying: true });
      
      try {
        await onRetry();
        setState({
          error: null,
          isRetrying: false,
          retryCount: 0,
          canRetry: false,
        });
      } catch (error) {
        const classifiedError = classifyError(error);
        setState({
          error: classifiedError,
          isRetrying: false,
          retryCount: state.retryCount + 1,
          canRetry: classifiedError.canRetry && state.retryCount + 1 < retryConfig.maxAttempts,
        });
      }
    },
    
    reset: () => {
      setState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: false,
      });
    },
    
    reportError: (error: Error | unknown) => {
      const classifiedError = classifyError(error);
      setState({
        error: classifiedError,
        isRetrying: false,
        canRetry: classifiedError.canRetry && state.retryCount < retryConfig.maxAttempts,
      });
    },
  };
  
  return { state, actions, setState };
}

/**
 * Utility to handle common async operations with error recovery
 */
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  onError?: (error: ClassifiedError) => void,
  config?: Partial<RetryConfig>
): Promise<T> {
  try {
    return await retryWithBackoff(operation, config);
  } catch (error) {
    const classifiedError = classifyError(error);
    onError?.(classifiedError);
    throw classifiedError;
  }
}

/**
 * Check if the user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Wait for the user to come back online
 */
export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }
    
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
  });
}
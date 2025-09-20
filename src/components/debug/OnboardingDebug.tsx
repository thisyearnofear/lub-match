"use client";

import { useState, useEffect } from "react";

// ENHANCEMENT FIRST: Enhanced debug panel with loading diagnostics
interface DebugPanelProps {
  loading?: boolean;
  apiCheckComplete?: boolean;
  hasApiKey?: boolean | null;
  usersLength?: number;
  error?: string | null;
  isInFarcaster?: boolean;
  miniAppReady?: boolean;
}

export default function OnboardingDebug(props?: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingDuration, setLoadingDuration] = useState(0);
  
  // Track loading duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (props?.loading || !props?.apiCheckComplete) {
      interval = setInterval(() => {
        setLoadingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [props?.loading, props?.apiCheckComplete]);

  // Auto-expand if loading takes too long
  useEffect(() => {
    if (loadingDuration > 10) {
      setIsExpanded(true);
    }
  }, [loadingDuration]);

  const clearOnboarding = () => {
    localStorage.clear();
    window.location.reload();
  };

  const isDev = process.env.NODE_ENV === "development";
  const shouldShow = isDev || isExpanded;

  if (!shouldShow) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs opacity-50 hover:opacity-100"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/90 text-white p-3 rounded-lg text-xs max-w-xs backdrop-blur-sm border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <button 
          onClick={clearOnboarding} 
          className="block w-full text-left hover:text-yellow-400"
        >
          🔄 Reset Onboarding
        </button>
        
        {/* ENHANCEMENT FIRST: Loading diagnostics */}
        {props && (
          <div className="border-t border-gray-600 pt-2 space-y-1">
            <div className={`flex justify-between ${props.loading ? 'text-yellow-400' : 'text-green-400'}`}>
              <span>Loading:</span>
              <span>{props.loading ? 'Yes' : 'No'}</span>
            </div>
            
            <div className={`flex justify-between ${!props.apiCheckComplete ? 'text-yellow-400' : 'text-green-400'}`}>
              <span>API Check:</span>
              <span>{props.apiCheckComplete ? 'Complete' : 'Pending'}</span>
            </div>
            
            <div className={`flex justify-between ${props.hasApiKey === null ? 'text-yellow-400' : props.hasApiKey ? 'text-green-400' : 'text-red-400'}`}>
              <span>API Key:</span>
              <span>{props.hasApiKey === null ? 'Unknown' : props.hasApiKey ? 'Available' : 'Missing'}</span>
            </div>
            
            <div className={`flex justify-between ${(props.usersLength || 0) === 0 ? 'text-red-400' : 'text-green-400'}`}>
              <span>Users:</span>
              <span>{props.usersLength || 0}</span>
            </div>
            
            <div className={`flex justify-between ${props.error ? 'text-red-400' : 'text-green-400'}`}>
              <span>Error:</span>
              <span>{props.error ? 'Yes' : 'No'}</span>
            </div>
            
            <div className={`flex justify-between ${props.isInFarcaster ? 'text-green-400' : 'text-gray-400'}`}>
              <span>Farcaster:</span>
              <span>{props.isInFarcaster ? 'Yes' : 'No'}</span>
            </div>
            
            <div className={`flex justify-between ${props.miniAppReady ? 'text-green-400' : 'text-yellow-400'}`}>
              <span>Mini App:</span>
              <span>{props.miniAppReady ? 'Ready' : 'Loading'}</span>
            </div>
            
            {loadingDuration > 0 && (
              <div className={`flex justify-between ${loadingDuration > 10 ? 'text-red-400' : 'text-yellow-400'}`}>
                <span>Duration:</span>
                <span>{loadingDuration}s</span>
              </div>
            )}
            
            {props.error && (
              <div className="mt-2 p-2 bg-red-900/50 rounded text-red-200 text-xs">
                {props.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

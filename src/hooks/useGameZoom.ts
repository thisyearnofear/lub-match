"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface ZoomState {
  scale: number;
  isZoomed: boolean;
  targetCard: number | null;
}

export interface ZoomControls {
  zoomState: ZoomState;
  zoomToCard: (cardIndex: number) => void;
  zoomOut: () => void;
  resetZoom: () => void;
  getTransformStyle: () => React.CSSProperties;
}

interface UseGameZoomOptions {
  zoomedScale?: number;
  baseScale?: number;
  transitionDuration?: number;
  autoZoomOutDelay?: number;
}

export function useGameZoom(options: UseGameZoomOptions = {}): ZoomControls {
  const {
    zoomedScale = 1.2, // Reduced from 1.4 to prevent cutoff
    baseScale = 0.9, // Increased from 0.85 for better visibility
    transitionDuration = 600,
    autoZoomOutDelay = 1500,
  } = options;

  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: baseScale,
    isZoomed: false,
    targetCard: null,
  });

  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  const zoomToCard = useCallback(
    (cardIndex: number) => {
      // Clear any existing timeout
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }

      setZoomState({
        scale: Math.min(zoomedScale, 1.2), // Limit max zoom to prevent cutoff
        isZoomed: true,
        targetCard: cardIndex,
      });
    },
    [zoomedScale],
  );

  const zoomOut = useCallback(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }

    setZoomState((prev) => ({
      ...prev,
      scale: baseScale,
      isZoomed: false,
      targetCard: null,
    }));
  }, [baseScale]);

  const resetZoom = useCallback(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }

    setZoomState({
      scale: baseScale,
      isZoomed: false,
      targetCard: null,
    });
  }, [baseScale]);

  const getTransformStyle = useCallback((): React.CSSProperties => {
    return {
      transform: `scale(${zoomState.scale})`,
      transformOrigin: "center center",
      transition: `transform ${transitionDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
      willChange: "transform",
      maxWidth: "100%",
      overflow: "visible",
    };
  }, [zoomState.scale, transitionDuration]);

  return {
    zoomState,
    zoomToCard,
    zoomOut,
    resetZoom,
    getTransformStyle,
  };
}

// Auto-zoom behavior hook for game-specific logic
export function useAutoZoom(
  selected: number[],
  matched: number[],
  zoomControls: ZoomControls,
) {
  const { zoomToCard, zoomOut } = zoomControls;
  const previousSelectedRef = useRef<number[]>([]);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const previousSelected = previousSelectedRef.current;
    previousSelectedRef.current = selected;

    // Card selection logic
    if (selected.length === 1 && previousSelected.length === 0) {
      // First card selected - zoom to it
      zoomToCard(selected[0]);
    } else if (selected.length === 2) {
      // Second card selected - zoom to show both cards
      const avgIndex = Math.floor((selected[0] + selected[1]) / 2);
      zoomToCard(avgIndex);

      // Auto zoom out after match attempt
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      zoomTimeoutRef.current = setTimeout(() => {
        zoomOut();
      }, 1500);
    } else if (selected.length === 0 && previousSelected.length > 0) {
      // Cards deselected - zoom out
      zoomOut();
    }
  }, [selected, zoomToCard, zoomOut]);

  // Zoom out when game completes
  useEffect(() => {
    if (matched.length === 16) {
      // Game complete - zoom out to show full heart
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      zoomTimeoutRef.current = setTimeout(() => {
        zoomOut();
      }, 500);
    }
  }, [matched.length, zoomOut]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);
}

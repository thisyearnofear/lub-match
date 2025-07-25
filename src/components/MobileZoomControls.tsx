"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomControls } from "@/hooks/useGameZoom";

interface MobileZoomControlsProps {
  zoomControls: ZoomControls;
  disabled?: boolean;
  className?: string;
}

export default function MobileZoomControls({
  zoomControls,
  disabled = false,
  className = "",
}: MobileZoomControlsProps) {
  const { zoomState, zoomOut, resetZoom } = zoomControls;

  // Only show controls on mobile and when zoomed
  const shouldShow = zoomState.isZoomed && !disabled;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        >
          <div className="flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            {/* Zoom Out Button */}
            <motion.button
              onClick={zoomOut}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              aria-label="Zoom out"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </motion.button>

            {/* Info Text */}
            <span className="text-white text-sm font-medium">
              Pinch to zoom
            </span>

            {/* Reset Button */}
            <motion.button
              onClick={resetZoom}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              aria-label="Reset zoom"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </motion.button>
          </div>

          {/* Visual zoom indicator */}
          <div className="mt-2 flex justify-center">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i < Math.floor(zoomState.scale * 3)
                        ? "bg-pink-400"
                        : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for detecting mobile device
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Simplified mobile controls for minimal UI
export function SimpleMobileZoomControls({
  zoomControls,
  disabled = false,
}: {
  zoomControls: ZoomControls;
  disabled?: boolean;
}) {
  const { zoomState, zoomOut } = zoomControls;
  const shouldShow = zoomState.isZoomed && !disabled;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={zoomOut}
          className="fixed bottom-6 right-6 w-12 h-12 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-colors"
          whileTap={{ scale: 0.9 }}
          aria-label="Zoom out to see full heart"
        >
          💝
        </motion.button>
      )}
    </AnimatePresence>
  );
}

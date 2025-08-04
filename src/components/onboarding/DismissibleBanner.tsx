"use client";
import { useEffect, useState } from "react";

export default function DismissibleBanner({
  message,
  localStorageKey,
  className = "",
  children,
}: {
  message: React.ReactNode;
  localStorageKey: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(localStorageKey);
      if (!seen) setShow(true);
    }
  }, [localStorageKey]);

  const handleClose = () => {
    setShow(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(localStorageKey, "1");
    }
  };

  if (!show) return null;

  return (
    <div
      className={`w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 text-purple-900 text-sm rounded-xl shadow-lg mt-2 animate-fade-in ${className}`}
      style={{ zIndex: 100 }}
    >
      <div className="flex items-center gap-2 flex-1">
        {message}
        {children}
      </div>
      <button
        className="ml-4 text-purple-500 hover:text-purple-700 text-xl font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors"
        onClick={handleClose}
        aria-label="Dismiss info banner"
      >
        ×
      </button>
    </div>
  );
}

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
      className={`w-full flex items-center justify-between px-4 py-2 bg-purple-50 border border-purple-200 text-purple-900 text-sm rounded-lg shadow-sm mt-2 ${className}`}
      style={{ zIndex: 100 }}
    >
      <div className="flex items-center gap-2">{message}{children}</div>
      <button
        className="ml-4 text-purple-400 hover:text-purple-700 text-lg font-bold"
        onClick={handleClose}
        aria-label="Dismiss info banner"
      >
        ×
      </button>
    </div>
  );
}

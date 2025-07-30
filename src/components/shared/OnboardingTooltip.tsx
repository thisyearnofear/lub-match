"use client";
import { useEffect, useState } from "react";

export default function OnboardingTooltip({
  children,
  message,
  localStorageKey = "lub_onboarding_seen",
  placement = "bottom",
}: {
  children: React.ReactNode;
  message: string;
  localStorageKey?: string;
  placement?: "top" | "bottom" | "left" | "right";
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

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      {show && (
        <div
          className={`absolute z-50 bg-white border border-purple-200 rounded-lg shadow-lg px-4 py-3 text-sm text-purple-900 animate-fade-in ${
            placement === "bottom"
              ? "left-1/2 -translate-x-1/2 top-full mt-2"
              : placement === "top"
              ? "left-1/2 -translate-x-1/2 bottom-full mb-2"
              : placement === "left"
              ? "right-full mr-2 top-1/2 -translate-y-1/2"
              : "left-full ml-2 top-1/2 -translate-y-1/2"
          }`}
          style={{ minWidth: 220, maxWidth: 320 }}
        >
          <div className="mb-2">{message}</div>
          <button
            className="text-xs text-purple-600 hover:underline mt-1"
            onClick={handleClose}
          >
            Got it!
          </button>
        </div>
      )}
    </span>
  );
}

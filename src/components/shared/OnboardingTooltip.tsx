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
          className={`absolute z-50 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-300 rounded-xl shadow-xl px-4 py-3 text-sm text-purple-900 animate-fade-in ${
            placement === "bottom"
              ? "left-1/2 -translate-x-1/2 top-full mt-2"
              : placement === "top"
              ? "left-1/2 -translate-x-1/2 bottom-full mb-2"
              : placement === "left"
              ? "right-full mr-3 top-1/2 -translate-y-1/2"
              : "left-full ml-3 top-1/2 -translate-y-1/2"
          }`}
          style={{ minWidth: 240, maxWidth: 320 }}
        >
          <div className="mb-3 font-medium">{message}</div>
          <button
            className="text-xs text-purple-700 hover:text-purple-900 font-semibold hover:underline mt-1"
            onClick={handleClose}
          >
            Got it!
          </button>
        </div>
      )}
    </span>
  );
}

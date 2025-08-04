"use client";

import { createContext, useContext, ReactNode } from "react";
import { useOnboardingToasts } from "./OnboardingToast";

interface OnboardingContextType {
  showToast: (
    title: string,
    message: string,
    options?: {
      icon?: string;
      duration?: number;
      actionButton?: {
        text: string;
        onClick: () => void;
      };
    }
  ) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { showToast, ToastContainer } = useOnboardingToasts();

  return (
    <OnboardingContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer />
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext must be used within OnboardingProvider"
    );
  }
  return context;
}

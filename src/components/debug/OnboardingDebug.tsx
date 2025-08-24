"use client";

import { useState, useEffect } from "react";
import { useSubtleOnboarding } from "@/hooks/useSubtleOnboarding";

export default function OnboardingDebug() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const { hasSeenOnboarding, markOnboardingCompleted } = useSubtleOnboarding();
  const [localStorageData, setLocalStorageData] = useState<
    Record<string, string>
  >({});

  // Refresh localStorage data
  const refreshData = () => {
    if (typeof window === "undefined") return;

    const data: Record<string, string> = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("onboarding")) {
        data[key] = localStorage.getItem(key) || "";
      }
    });
    setLocalStorageData(data);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const clearOnboardingData = () => {
    if (typeof window === "undefined") return;

    const keys = Object.keys(localStorage).filter((key) =>
      key.includes("onboarding")
    );
    keys.forEach((key) => localStorage.removeItem(key));
    refreshData();
  };

  const testOnboardingStates = () => {
    console.log("=== ONBOARDING DEBUG INFO ===");
    console.log("MAIN_INTRO seen:", hasSeenOnboarding("MAIN_INTRO"));
    console.log("GAME_COMPLETE seen:", hasSeenOnboarding("GAME_COMPLETE"));
    console.log(
      "ADVANCED_FEATURES seen:",
      hasSeenOnboarding("ADVANCED_FEATURES")
    );
    console.log("localStorage data:", localStorageData);
  };

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Onboarding Debug</h3>

      <div className="space-y-2">
        <div>
          <strong>Status:</strong>
          <div className="ml-2">
            <div>
              Main Intro:{" "}
              {hasSeenOnboarding("MAIN_INTRO") ? "✅ Seen" : "❌ Not seen"}
            </div>
            <div>
              Game Complete:{" "}
              {hasSeenOnboarding("GAME_COMPLETE") ? "✅ Seen" : "❌ Not seen"}
            </div>
            <div>
              Advanced:{" "}
              {hasSeenOnboarding("ADVANCED_FEATURES")
                ? "✅ Seen"
                : "❌ Not seen"}
            </div>
          </div>
        </div>

        <div>
          <strong>localStorage:</strong>
          <div className="ml-2 max-h-20 overflow-y-auto">
            {Object.entries(localStorageData).length === 0 ? (
              <div className="text-gray-400">No onboarding data</div>
            ) : (
              Object.entries(localStorageData).map(([key, value]) => (
                <div key={key} className="text-xs">
                  {key}: {value}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={refreshData}
            className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-xs"
          >
            Refresh
          </button>
          <button
            onClick={testOnboardingStates}
            className="bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-xs"
          >
            Test States
          </button>
          <button
            onClick={clearOnboardingData}
            className="bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-xs"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

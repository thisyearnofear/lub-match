"use client";

export default function OnboardingDebug() {
  if (process.env.NODE_ENV !== "development") return null;

  const clearOnboarding = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
      <button onClick={clearOnboarding} className="hover:text-yellow-400">
        🔄 Reset Onboarding
      </button>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";

export type LubCreationMode = "photos" | "farcaster";

interface LubCreationModeSelectorProps {
  selectedMode: LubCreationMode | null;
  onModeSelect: (mode: LubCreationMode) => void;
  disabled?: boolean;
}

export default function LubCreationModeSelector({
  selectedMode,
  onModeSelect,
  disabled = false,
}: LubCreationModeSelectorProps) {
  const modes = [
    {
      id: "photos" as const,
      title: "Upload My Photos",
      subtitle: "Perfect for personal memories",
      icon: "📸",
      description: "Upload 8 photos to create a personalized memory game",
      requirement: "8 photos needed",
    },
    {
      id: "farcaster" as const,
      title: "Use Farcaster Friends",
      subtitle: "Quick social lub with PFPs",
      icon: "👥",
      description: "Select friends from Farcaster to use their profile pictures",
      requirement: "4+ friends needed",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">
          How do you want to make lub? 💕
        </h3>
        <p className="text-sm text-gray-600">
          Choose your approach to create the perfect memory game
        </p>
      </div>

      <div className="grid gap-4">
        {modes.map((mode) => (
          <motion.button
            key={mode.id}
            type="button"
            onClick={() => onModeSelect(mode.id)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`
              w-full p-4 rounded-xl border-2 text-left transition-all duration-300
              ${
                selectedMode === mode.id
                  ? "border-pink-500 bg-pink-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <div className="flex items-start space-x-4">
              <div className="text-2xl mt-1">{mode.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">{mode.title}</h4>
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${
                        selectedMode === mode.id
                          ? "border-pink-500 bg-pink-500"
                          : "border-gray-300"
                      }
                    `}
                  >
                    {selectedMode === mode.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{mode.subtitle}</p>
                <p className="text-xs text-gray-500 mb-2">{mode.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-pink-600">
                    {mode.requirement}
                  </span>
                  {selectedMode === mode.id && (
                    <span className="text-xs text-pink-600 font-medium">
                      ✓ Selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {selectedMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <p className="text-sm text-blue-700">
            <span className="font-medium">Great choice!</span> Now add your{" "}
            {selectedMode === "photos" ? "photos" : "Farcaster friends"} below to
            continue making lub.
          </p>
        </motion.div>
      )}
    </div>
  );
}
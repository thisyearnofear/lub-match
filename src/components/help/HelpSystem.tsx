"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UnifiedOnboardingSystem from "@/components/onboarding/UnifiedOnboardingSystem";
import { useSubtleOnboarding } from "@/hooks/useSubtleOnboarding";
import ActionButton from "@/components/shared/ActionButton";

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpSystem({ isOpen, onClose }: HelpSystemProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const { startOnboarding, skipOnboarding } = useSubtleOnboarding();

  const helpSections = [
    {
      id: "overview",
      title: "🎮 How to Play",
      icon: "🎮",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Welcome to Lub Match!
          </h3>
          <div className="space-y-3 text-white/80">
            <p>
              🧩 <strong>Match the pairs:</strong> Find matching Farcaster users
              to complete the heart puzzle
            </p>
            <p>
              💝 <strong>Complete the heart:</strong> Each successful match
              fills in part of the heart shape
            </p>
            <p>
              🎉 <strong>Celebrate together:</strong> Share your completed heart
              with friends
            </p>
            <p>
              ✨ <strong>Earn rewards:</strong> Get LUB tokens for playing and
              sharing
            </p>
          </div>
          <ActionButton
            variant="gradient-pink"
            size="sm"
            onClick={() => {
              startOnboarding("MAIN_INTRO", "welcome");
              onClose();
            }}
          >
            🚀 Start Tutorial
          </ActionButton>
        </div>
      ),
    },
    {
      id: "social",
      title: "👥 Social Features",
      icon: "👥",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Connect & Share</h3>
          <div className="space-y-3 text-white/80">
            <p>
              🌟 <strong>Real people:</strong> Match actual Farcaster users, not
              random photos
            </p>
            <p>
              💬 <strong>Social proof:</strong> See who's popular in the
              community
            </p>
            <p>
              🔗 <strong>Share your wins:</strong> Cast your completed hearts to
              Farcaster
            </p>
            <p>
              🎁 <strong>Invite friends:</strong> More fun when played together
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "rewards",
      title: "🪙 LUB Tokens",
      icon: "🪙",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            What are LUB tokens?
          </h3>
          <div className="space-y-3 text-white/80">
            <p>
              🎮 <strong>Game currency:</strong> Earn LUB by playing and
              completing hearts
            </p>
            <p>
              💎 <strong>Unlock features:</strong> Use LUB for special game
              modes and NFT discounts
            </p>
            <p>
              🎨 <strong>Create memories:</strong> Turn your favorite games into
              permanent keepsakes
            </p>
            <p>
              🌱 <strong>No pressure:</strong> You can enjoy the game without
              any tokens!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "advanced",
      title: "🚀 Advanced Features",
      icon: "🚀",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Optional Web3 Features
          </h3>
          <div className="space-y-3 text-white/80">
            <p>
              🔗 <strong>Connect wallet:</strong> Optional - only needed for
              NFTs and advanced features
            </p>
            <p>
              🎨 <strong>Mint NFTs:</strong> Turn completed games into
              collectible art
            </p>
            <p>
              🏆 <strong>Challenges:</strong> Compete with other players for
              bigger rewards
            </p>
            <p>
              📊 <strong>Analytics:</strong> Track your progress and
              achievements
            </p>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mt-4">
            <p className="text-blue-200 text-sm">
              💡 <strong>Tip:</strong> You can enjoy the full game experience
              without connecting a wallet. Web3 features are just bonus options
              for those who want them!
            </p>
          </div>
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Help & Tutorials</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          </div>

          <div className="flex h-[60vh]">
            {/* Sidebar */}
            <div className="w-1/3 bg-white/5 border-r border-white/10 p-4">
              <div className="space-y-2">
                {helpSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{section.icon}</span>
                      <span className="text-white font-medium">
                        {section.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {helpSections.find((s) => s.id === activeSection)?.content}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-white/60 text-sm">
                Need more help? Join our community!
              </div>
              <div className="flex gap-3">
                <ActionButton
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    window.open("https://warpcast.com/~/channel/lub", "_blank")
                  }
                >
                  💬 Community
                </ActionButton>
                <ActionButton
                  variant="gradient-purple"
                  size="sm"
                  onClick={onClose}
                >
                  Got it!
                </ActionButton>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default HelpSystem;

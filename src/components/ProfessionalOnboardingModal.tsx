/** ENHANCEMENT FIRST: Professional onboarding modal extending existing modal patterns
 * CLEAN: Focused on professional tier introduction and profile setup
 * MODULAR: Independent component for professional onboarding
 * PERFORMANT: Lazy loaded and optimized animations
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialUser, ExperienceTier } from "@/types/socialGames";
import { CollaborationService, CollaborationUtils } from "@/services/collaborationService";
import ActionButton from "./shared/ActionButton";
import { useOptimizedAnimation } from "@/utils/animations";

interface ProfessionalOnboardingModalProps {
  currentUser?: SocialUser;
  gameHistory: any[];
  onComplete: (upgraded: boolean) => void;
  onClose: () => void;
}

const STEPS = ['intro', 'benefits', 'profile', 'ready'] as const;
type Step = typeof STEPS[number];

export default function ProfessionalOnboardingModal({
  currentUser,
  gameHistory,
  onComplete,
  onClose
}: ProfessionalOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const modalAnimation = useOptimizedAnimation("backdropFade");

  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  const handleUpgrade = useCallback(async () => {
    setIsUpgrading(true);
    // Simulate upgrade process
    setTimeout(() => {
      onComplete(true);
    }, 1500);
  }, [onComplete]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <motion.div
            key="intro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Meet Your Creative Match 💕
            </h2>
            <p className="text-blue-200 mb-6 max-w-md mx-auto">
              Connect with fellow creators across Farcaster and Lens.
              Find your artistic soulmate, spark creative collaborations, and make magic together.
            </p>
            <div className="bg-blue-900/30 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">
                ✨ <strong>AI-powered matching</strong> based on complementary creative vibes and shared passions
              </p>
            </div>
          </motion.div>
        );

      case 'benefits':
        return (
          <motion.div
            key="benefits"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="text-5xl mb-6">🎭</div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Creative Collaboration Magic ✨
            </h2>
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="bg-teal-900/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎨</span>
                  <div className="text-left">
                    <h3 className="text-teal-300 font-semibold">Creative Soul Matching</h3>
                    <p className="text-teal-200 text-sm">AI pairs you with creators who spark your imagination</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-900/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌈</span>
                  <div className="text-left">
                    <h3 className="text-purple-300 font-semibold">Cross-Universe Connections</h3>
                    <p className="text-purple-200 text-sm">Bridge Farcaster + Lens creative communities</p>
                  </div>
                </div>
              </div>
              <div className="bg-cyan-900/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💫</span>
                  <div className="text-left">
                    <h3 className="text-cyan-300 font-semibold">Collaborative Sparks</h3>
                    <p className="text-cyan-200 text-sm">Discover dreamy projects and co-create magic</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'profile':
        const userSkills = currentUser ? CollaborationService.analyzeSkills(currentUser) : [];
        const readiness = currentUser ? CollaborationUtils.getCollaborationReadiness(currentUser) : 'not_ready';

        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="text-5xl mb-6">🎨</div>
            <h2 className="text-2xl font-bold text-white mb-4">
            Your Creative Aura ✨
            </h2>

            {currentUser && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={currentUser.pfpUrl}
                    alt={currentUser.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="text-left">
                    <h3 className="text-white font-semibold">{currentUser.displayName}</h3>
                    <p className="text-gray-300 text-sm">@{currentUser.username}</p>
                  </div>
                </div>

                {userSkills.length > 0 && (
                <div className="mb-4">
                <p className="text-gray-300 text-sm mb-2">🎭 Your Creative Superpowers:</p>
                <div className="flex flex-wrap gap-2">
                {userSkills.map(skill => (
                <span
                key={skill}
                className="px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs rounded-full shadow-lg"
                >
                {CollaborationUtils.formatSkills([skill])[0]}
                </span>
                ))}
                </div>
                </div>
                )}

                <div className="text-left">
                <p className="text-gray-300 text-sm mb-1">✨ Creative Energy:</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                readiness === 'ready' ? 'bg-green-900/50 text-green-300' :
                readiness === 'interested' ? 'bg-yellow-900/50 text-yellow-300' :
                'bg-gray-700 text-gray-300'
                }`}>
                <span>
                {readiness === 'ready' ? '🟢' :
                readiness === 'interested' ? '🟡' : '⚪'}
                </span>
                {readiness === 'ready' ? 'Creative sparks ready! ⚡' :
                readiness === 'interested' ? 'Open to inspiration 🌟' :
                'Recharging creative batteries 🔋'}
                </div>
                </div>
              </div>
            )}

            <p className="text-blue-200 text-sm mb-6">
            ✨ Your creative aura will be magically enhanced with AI-detected superpowers and collaboration vibes.
            </p>
          </motion.div>
        );

      case 'ready':
        return (
          <motion.div
            key="ready"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">🎭</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Spark Creative Magic? ✨
            </h2>
            <p className="text-blue-200 mb-6 max-w-md mx-auto">
              Join a vibrant universe of dreamers and doers. Find your creative kindred spirits,
              discover magical collaborations, and co-create wonders together.
            </p>

            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🎨</span>
                <span className="text-white font-semibold">Your creative journey begins:</span>
              </div>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• ✨ AI weaves your creative aura into perfect matches</li>
                <li>• 🌈 Bridge creative universes across platforms</li>
                <li>• 🎭 Discover kindred spirits with complementary magic</li>
                <li>• 💫 Start co-creating dreams and wonders together</li>
              </ul>
            </div>
          </motion.div>
        );
    }
  };

  const canProceed = currentStep !== 'ready';
  const canGoBack = STEPS.indexOf(currentStep) > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        {...modalAnimation}
        className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl shadow-2xl max-w-lg w-full border border-blue-700"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 text-sm font-medium">
                  Step {STEPS.indexOf(currentStep) + 1} of {STEPS.length}
                </span>
              </div>
              <div className="w-full bg-blue-800 rounded-full h-1">
                <motion.div
                  className="bg-blue-400 h-1 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((STEPS.indexOf(currentStep) + 1) / STEPS.length) * 100}%`
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white text-2xl transition-colors ml-4"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {canGoBack && (
              <ActionButton
                variant="secondary"
                onClick={prevStep}
                className="flex-1"
              >
                Back
              </ActionButton>
            )}

            {canProceed ? (
              <ActionButton
                variant="primary"
                onClick={nextStep}
                className={canGoBack ? "flex-1" : "w-full"}
              >
                Continue
              </ActionButton>
            ) : (
              <ActionButton
                variant="gradient-blue"
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full"
              >
                {isUpgrading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      ✨
                    </motion.div>
                    Weaving magic...
                  </>
                ) : (
                  '🎨 Unleash Creative Magic'
                )}
              </ActionButton>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

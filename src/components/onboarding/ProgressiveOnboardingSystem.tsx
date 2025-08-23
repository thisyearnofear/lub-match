/**
 * Progressive Onboarding System
 * CLEAN: Smart feature disclosure based on user progress
 * MODULAR: Composable onboarding sequences with prerequisites
 * PERFORMANT: Lazy loading of complex explanations
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  EnhancedOnboardingStep, 
  filterStepsByComplexity, 
  checkPrerequisites 
} from "./EnhancedOnboardingSteps";

interface ProgressiveOnboardingProps {
  steps: EnhancedOnboardingStep[];
  userLevel: 'newcomer' | 'player' | 'challenger' | 'whale_hunter';
  completedSteps: string[];
  onStepComplete: (stepId: string) => void;
  onSequenceComplete: () => void;
  autoStart?: boolean;
  delay?: number;
}

interface OnboardingState {
  currentStepIndex: number;
  isVisible: boolean;
  isPaused: boolean;
  availableSteps: EnhancedOnboardingStep[];
}

export default function ProgressiveOnboardingSystem({
  steps,
  userLevel,
  completedSteps,
  onStepComplete,
  onSequenceComplete,
  autoStart = true,
  delay = 1000
}: ProgressiveOnboardingProps) {
  const [state, setState] = useState<OnboardingState>({
    currentStepIndex: 0,
    isVisible: false,
    isPaused: false,
    availableSteps: []
  });

  // Filter steps based on user level and prerequisites
  const filterAvailableSteps = useCallback(() => {
    // Determine max complexity based on user level
    const complexityMap = {
      newcomer: 'basic' as const,
      player: 'intermediate' as const,
      challenger: 'advanced' as const,
      whale_hunter: 'advanced' as const
    };
    
    const maxComplexity = complexityMap[userLevel];
    
    // Filter by complexity first
    let availableSteps = filterStepsByComplexity(steps, maxComplexity);
    
    // Filter by prerequisites
    availableSteps = availableSteps.filter(step => 
      checkPrerequisites(step, completedSteps)
    );
    
    // Remove already completed steps
    availableSteps = availableSteps.filter(step => 
      !completedSteps.includes(step.id)
    );
    
    return availableSteps;
  }, [steps, userLevel, completedSteps]);

  // Initialize available steps
  useEffect(() => {
    const availableSteps = filterAvailableSteps();
    setState(prev => ({
      ...prev,
      availableSteps,
      currentStepIndex: 0
    }));
  }, [filterAvailableSteps]);

  // Auto-start onboarding
  useEffect(() => {
    if (autoStart && state.availableSteps.length > 0 && !state.isVisible) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, isVisible: true }));
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, delay, state.availableSteps.length, state.isVisible]);

  // Current step
  const currentStep = state.availableSteps[state.currentStepIndex];

  // Handle step completion
  const handleStepComplete = useCallback(() => {
    if (!currentStep) return;
    
    onStepComplete(currentStep.id);
    
    // Move to next step or complete sequence
    if (state.currentStepIndex < state.availableSteps.length - 1) {
      setState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1
      }));
    } else {
      // Sequence complete
      setState(prev => ({ ...prev, isVisible: false }));
      setTimeout(() => {
        onSequenceComplete();
      }, 300);
    }
  }, [currentStep, state.currentStepIndex, state.availableSteps.length, onStepComplete, onSequenceComplete]);

  // Auto-advance timer
  useEffect(() => {
    if (!currentStep || !state.isVisible || state.isPaused) return;
    
    const timer = setTimeout(() => {
      handleStepComplete();
    }, currentStep.duration || 6000);
    
    return () => clearTimeout(timer);
  }, [currentStep, state.isVisible, state.isPaused, handleStepComplete]);

  // Handle manual actions
  const handleAction = useCallback((action: () => void) => {
    setState(prev => ({ ...prev, isPaused: true }));
    action();
    // Resume after action
    setTimeout(() => {
      setState(prev => ({ ...prev, isPaused: false }));
      handleStepComplete();
    }, 1000);
  }, [handleStepComplete]);

  const handleSkip = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
    onSequenceComplete();
  }, [onSequenceComplete]);

  const handlePause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  // Don't render if no steps available
  if (!currentStep || !state.isVisible) {
    return null;
  }

  // Get visual styling based on step category
  const getStepStyling = (step: EnhancedOnboardingStep) => {
    const categoryStyles = {
      intro: 'from-pink-500 to-purple-600',
      game: 'from-blue-500 to-indigo-600',
      challenge: 'from-purple-500 to-pink-500',
      social: 'from-green-500 to-emerald-600',
      rewards: 'from-yellow-400 to-orange-500',
      safety: 'from-red-500 to-pink-500'
    };
    
    return {
      gradient: step.visual?.gradient || categoryStyles[step.category || 'intro'],
      animation: step.visual?.animation || 'bounce',
      emoji: step.visual?.emoji || step.icon
    };
  };

  const styling = getStepStyling(currentStep);

  // Mobile-responsive positioning
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const positionClasses = isMobile
    ? "fixed bottom-4 left-4 right-4 z-50"
    : "fixed bottom-4 right-4 z-50 max-w-sm";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -50 }}
        className={positionClasses}
      >
        <motion.div
          className={`bg-gradient-to-r ${styling.gradient} rounded-xl shadow-2xl p-1`}
          animate={styling.animation === 'glow' ? {
            boxShadow: [
              '0 0 20px rgba(255, 255, 255, 0.3)',
              '0 0 40px rgba(255, 255, 255, 0.5)',
              '0 0 20px rgba(255, 255, 255, 0.3)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="bg-white rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.span 
                  className="text-2xl"
                  animate={styling.animation === 'bounce' ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  } : styling.animation === 'pulse' ? {
                    scale: [1, 1.1, 1]
                  } : styling.animation === 'shake' ? {
                    x: [0, -5, 5, -5, 5, 0]
                  } : {}}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    repeatDelay: 1 
                  }}
                >
                  {styling.emoji}
                </motion.span>
                <h3 className="font-bold text-gray-800 text-sm">
                  {currentStep.title}
                </h3>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePause}
                  className="text-gray-400 hover:text-gray-600 text-xs p-1"
                  title={state.isPaused ? "Resume" : "Pause"}
                >
                  {state.isPaused ? "▶️" : "⏸️"}
                </button>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 text-xs p-1"
                  title="Skip"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content - Mobile optimized text */}
            <p className={`text-gray-600 mb-3 leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {currentStep.message}
            </p>

            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {state.availableSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === state.currentStepIndex
                        ? 'bg-purple-500'
                        : index < state.currentStepIndex
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              {/* Complexity indicator */}
              <div className="flex items-center gap-1">
                {currentStep.complexity === 'advanced' && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    Advanced
                  </span>
                )}
                {currentStep.complexity === 'intermediate' && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Intermediate
                  </span>
                )}
              </div>
            </div>

            {/* Action button */}
            {currentStep.actionButton && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(currentStep.actionButton!.onClick)}
                  className={`flex-1 bg-gradient-to-r ${styling.gradient} text-white text-sm font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity`}
                >
                  {currentStep.actionButton.text}
                </button>
                <button
                  onClick={handleStepComplete}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Skip
                </button>
              </div>
            )}

            {/* Auto-advance timer (visual) */}
            {!state.isPaused && !currentStep.actionButton && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <motion.div
                    className={`bg-gradient-to-r ${styling.gradient} h-1 rounded-full`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ 
                      duration: (currentStep.duration || 6000) / 1000,
                      ease: "linear"
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

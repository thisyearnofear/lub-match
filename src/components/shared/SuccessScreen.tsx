"use client";

import { ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";
import ActionButton, { ButtonVariant } from "./ActionButton";
import Confetti from "../Confetti";

export interface SuccessAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
}

interface SuccessScreenProps {
  title: string;
  message: string;
  celebrationIcon?: string;
  actions: SuccessAction[];
  additionalContent?: ReactNode;
  layout?: "single-column" | "two-column" | "grid";
  className?: string;
  showConfetti?: boolean;
  celebrationLevel?: "standard" | "epic";
  nftPreview?: ReactNode;
}

export default function SuccessScreen({
  title,
  message,
  celebrationIcon = "🎉",
  actions,
  additionalContent,
  layout = "single-column",
  className = "",
  showConfetti = false,
  celebrationLevel = "standard",
  nftPreview,
}: SuccessScreenProps) {
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    if (showConfetti) {
      // Trigger confetti after a short delay for better visual impact
      const timer = setTimeout(() => {
        setTriggerConfetti(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);
  const getGridClasses = () => {
    switch (layout) {
      case "two-column":
        return "grid grid-cols-1 sm:grid-cols-2 gap-3";
      case "grid":
        return actions.length <= 2
          ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
          : "grid grid-cols-1 sm:grid-cols-2 gap-3";
      default:
        return "grid grid-cols-1 gap-3";
    }
  };

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && <Confetti trigger={triggerConfetti} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          duration: celebrationLevel === "epic" ? 0.5 : 0.3,
          ease: "easeOut",
        }}
        className={`text-center ${className}`}
      >
        {/* Celebration Header */}
        <div className="mb-6">
          <motion.div
            className="text-6xl mb-4"
            animate={
              celebrationLevel === "epic"
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }
                : undefined
            }
            transition={
              celebrationLevel === "epic"
                ? {
                    duration: 0.6,
                    ease: "easeOut",
                  }
                : undefined
            }
          >
            {celebrationIcon}
          </motion.div>
          <motion.h2
            className="text-3xl font-bold text-gray-800 mb-4 font-playfair"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {title}
          </motion.h2>
          <motion.p
            className="text-gray-600 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {message}
          </motion.p>
        </div>

        {/* NFT Preview (Priority Content) */}
        {nftPreview && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {nftPreview}
          </motion.div>
        )}

        {/* Additional Content */}
        {additionalContent && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: nftPreview ? 0.6 : 0.4, duration: 0.3 }}
          >
            {additionalContent}
          </motion.div>
        )}

        {/* Action Buttons */}
        {actions.length > 0 && (
          <motion.div
            className={`${getGridClasses()} mb-6`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: nftPreview ? 0.7 : 0.5, duration: 0.3 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: (nftPreview ? 0.8 : 0.6) + index * 0.1,
                  duration: 0.2,
                }}
              >
                <ActionButton
                  variant={action.variant || "primary"}
                  onClick={action.onClick}
                  loading={action.loading}
                  fullWidth
                  icon={action.icon}
                >
                  {action.label}
                </ActionButton>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

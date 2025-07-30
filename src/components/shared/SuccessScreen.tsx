"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import ActionButton, { ButtonVariant } from "./ActionButton";

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
  layout?: 'single-column' | 'two-column' | 'grid';
  className?: string;
}

export default function SuccessScreen({
  title,
  message,
  celebrationIcon = "🎉",
  actions,
  additionalContent,
  layout = 'single-column',
  className = ""
}: SuccessScreenProps) {
  const getGridClasses = () => {
    switch (layout) {
      case 'two-column':
        return "grid grid-cols-1 sm:grid-cols-2 gap-3";
      case 'grid':
        return actions.length <= 2 
          ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
          : "grid grid-cols-1 sm:grid-cols-2 gap-3";
      default:
        return "grid grid-cols-1 gap-3";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`text-center ${className}`}
    >
      {/* Celebration Header */}
      <div className="mb-6">
        <div className="text-6xl mb-4">{celebrationIcon}</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {title}
        </h2>
        <p className="text-gray-600 mb-4">
          {message}
        </p>
      </div>

      {/* Additional Content */}
      {additionalContent && (
        <div className="mb-6">
          {additionalContent}
        </div>
      )}

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className={`${getGridClasses()} mb-6`}>
          {actions.map((action, index) => (
            <ActionButton
              key={index}
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              loading={action.loading}
              fullWidth
              icon={action.icon}
            >
              {action.label}
            </ActionButton>
          ))}
        </div>
      )}
    </motion.div>
  );
}
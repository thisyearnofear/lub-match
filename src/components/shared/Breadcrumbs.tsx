"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
  separator?: React.ReactNode;
}

export default function Breadcrumbs({
  items,
  className = "",
  showHomeIcon = true,
  separator,
}: BreadcrumbsProps) {
  const defaultSeparator = (
    <ChevronRight className="w-4 h-4 text-purple-400" />
  );

  return (
    <nav
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      {showHomeIcon && (
        <>
          <Link
            href="/"
            className="flex items-center text-purple-300 hover:text-white transition-colors"
            aria-label="Go to homepage"
          >
            <Home className="w-4 h-4" />
          </Link>
          {items.length > 0 && (separator || defaultSeparator)}
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isActive = item.isActive || isLast;

        return (
          <React.Fragment key={index}>
            <motion.div
              className="flex items-center space-x-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.icon && (
                <span className="text-purple-400">{item.icon}</span>
              )}
              
              {item.href && !isActive ? (
                <Link
                  href={item.href}
                  className="text-purple-300 hover:text-white transition-colors underline-offset-2 hover:underline"
                  onClick={item.onClick}
                >
                  {item.label}
                </Link>
              ) : item.onClick && !isActive ? (
                <button
                  onClick={item.onClick}
                  className="text-purple-300 hover:text-white transition-colors underline-offset-2 hover:underline"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={`${
                    isActive
                      ? "text-white font-medium"
                      : "text-purple-300"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </motion.div>

            {!isLast && (separator || defaultSeparator)}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Game-specific breadcrumb component
export function GameBreadcrumbs({
  gameState,
  className = "",
}: {
  gameState: "setup" | "playing" | "complete" | "sharing";
  className?: string;
}) {
  const getGameItems = (): BreadcrumbItem[] => {
    const baseItems: BreadcrumbItem[] = [
      {
        label: "Game Setup",
        href: gameState === "setup" ? undefined : "/",
        isActive: gameState === "setup",
        icon: "🎮",
      },
      {
        label: "Playing",
        isActive: gameState === "playing",
        icon: "💝",
      },
    ];

    if (gameState === "complete" || gameState === "sharing") {
      baseItems.push({
        label: "Complete",
        isActive: gameState === "complete",
        icon: "🎉",
      });
    }

    if (gameState === "sharing") {
      baseItems.push({
        label: "Share",
        isActive: true,
        icon: "📤",
      });
    }

    return baseItems;
  };

  return (
    <div className={`mb-4 ${className}`}>
      <Breadcrumbs items={getGameItems()} />
    </div>
  );
}

// Progress indicator breadcrumbs
export function ProgressBreadcrumbs({
  steps,
  currentStep,
  onStepClick,
  className = "",
}: {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}) {
  const items: BreadcrumbItem[] = steps.map((step, index) => ({
    label: step,
    isActive: index === currentStep,
    onClick: onStepClick ? () => onStepClick(index) : undefined,
  }));

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-purple-300">
          Step {currentStep + 1} of {steps.length}
        </span>
        <div className="flex-1 mx-4 bg-purple-900 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>
      <Breadcrumbs items={items} showHomeIcon={false} />
    </div>
  );
}
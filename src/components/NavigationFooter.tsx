"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShareHelpers } from "@/utils/shareHelpers";
import ActionButton from "./shared/ActionButton";

interface NavigationFooterProps {
  currentPage?: "home" | "create" | "game" | "social" | "analytics";
  className?: string;
}

export default function NavigationFooter({ 
  currentPage = "home", 
  className = "" 
}: NavigationFooterProps) {
  const navItems = [
    {
      key: "home",
      label: "Home",
      href: "/",
      icon: "🏠",
      description: "Play demo game"
    },
    {
      key: "create",
      label: "Create",
      href: "/create",
      icon: "✨",
      description: "Make your own"
    },
    {
      key: "social",
      label: "Social Games",
      href: "/?social=true",
      icon: "🎮",
      description: "Farcaster games"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border-t border-gray-200 shadow-lg ${className}`}
    >
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg transition-all
                ${currentPage === item.key 
                  ? "bg-pink-50 text-pink-600 border border-pink-200" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }
              `}
            >
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="text-xs font-medium">{item.label}</div>
              <div className="text-xs text-gray-500 text-center leading-tight">
                {item.description}
              </div>
            </Link>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-center gap-4 text-xs">
            <button
              onClick={() => ShareHelpers.shareApp()}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              💝 Share App
            </button>
            <span className="text-gray-300">•</span>
            <Link 
              href="/analytics" 
              className="text-gray-500 hover:text-gray-600"
            >
              📊 Stats
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
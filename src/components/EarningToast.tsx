"use client";

import { motion, AnimatePresence } from "framer-motion";
import Confetti from "./Confetti";
import { useState, useEffect } from "react";
import { formatLubAmount } from "@/utils/pricingEngine";

interface EarningToastProps {
  show: boolean;
  amount: bigint;
  reason: string;
  onClose: () => void;
}

export function EarningToast({ show, amount, reason, onClose }: EarningToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-close after 4 seconds
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <Confetti trigger={show} />
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg shadow-lg p-4 max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎉</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  +{formatLubAmount(amount)} LUB Earned!
                </div>
                <div className="text-xs opacity-90">
                  {reason}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for managing earning notifications
export function useEarningNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    amount: bigint;
    reason: string;
    show: boolean;
  }>>([]);

  const showEarning = (amount: bigint, reason: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, amount, reason, show: true }]);
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, show: false } : notif
      )
    );
    
    // Remove from array after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 300);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <EarningToast
          key={notification.id}
          show={notification.show}
          amount={notification.amount}
          reason={notification.reason}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </div>
  );

  return {
    showEarning,
    ToastContainer
  };
}

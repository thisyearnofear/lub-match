"use client";

import { useLubToken } from "@/hooks/useLubToken";
import { motion } from "framer-motion";

export default function WalletModal({ onClose }: { onClose: () => void }) {
  const { balanceFormatted, history } = useLubToken();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          aria-label="Close wallet modal"
        >
          ×
        </button>
        <div className="mb-6 text-center">
          <div className="text-4xl mb-2">💎</div>
          <div className="text-lg font-bold">{balanceFormatted} LUB</div>
          <div className="text-xs text-gray-500 mt-1">Your current balance</div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Recent Activity</h3>
          <ul className="max-h-40 overflow-y-auto divide-y divide-gray-100">
            {history && history.length > 0 ? (
              history.map((item, idx) => (
                <li key={idx} className="py-2 flex justify-between text-sm">
                  <span>{item.reason}</span>
                  <span className={item.amount > 0 ? "text-green-600" : "text-red-600"}>
                    {item.amount > 0 ? "+" : ""}{item.amount} LUB
                  </span>
                </li>
              ))
            ) : (
              <li className="py-2 text-gray-400 text-center">No recent activity</li>
            )}
          </ul>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-purple-800 text-sm">
          <div className="font-semibold mb-1">How to earn LUB:</div>
          <ul className="list-disc pl-5">
            <li>Complete games</li>
            <li>Invite friends</li>
            <li>Share games on social</li>
            <li>Daily login streaks</li>
            <li>Special achievements</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

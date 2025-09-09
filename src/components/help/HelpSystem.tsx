"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpSystem({ isOpen, onClose }: HelpSystemProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-1 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">🎮 How to Play</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">💝 Match Hearts</h3>
                  <p>Click cards to flip them and find matching pairs to complete the heart shape.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">✨ Share & Connect</h3>
                  <p>Share your completed hearts and discover new connections in the community.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">🎁 Bonus Features</h3>
                  <p>Mint NFTs, earn LUB tokens, and explore advanced features - all optional!</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default HelpSystem;

"use client";

import { motion } from "framer-motion";
import { HeartData } from "@/hooks/useHeartNFT";

interface NFTDetailModalProps {
  nft: {
    tokenId: bigint;
    heartData: HeartData;
  } | null;
  onClose: () => void;
}

export function NFTDetailModal({ nft, onClose }: NFTDetailModalProps) {
  if (!nft) return null;

  const { tokenId, heartData } = nft;
  const isDemo = heartData.gameType === "demo";
  const mintDate = new Date(Number(heartData.completedAt) * 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                Heart NFT #{tokenId.toString()}
              </h2>
              <p className="text-purple-100 text-sm">
                {isDemo ? "Demo Lub" : "Custom Lub"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-2xl"
              aria-label="Close NFT details"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* NFT Preview */}
          <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
            <div className="text-6xl">💝</div>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-purple-400/10 rounded-xl" />
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Message */}
            {!isDemo && heartData.message && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Message
                </h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                  "{heartData.message}"
                </p>
              </div>
            )}

            {/* Game Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Game Type
                </h3>
                <p className="text-gray-600">
                  {isDemo ? "Demo Game" : "Custom Game"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Images
                </h3>
                <p className="text-gray-600">
                  {Math.min(new Set(heartData.imageHashes).size, 8)} photos
                </p>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Creator
                </h3>
                <p className="text-xs font-mono text-gray-600 bg-gray-50 rounded p-2">
                  {heartData.creator}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Completer
                </h3>
                <p className="text-xs font-mono text-gray-600 bg-gray-50 rounded p-2">
                  {heartData.completer}
                </p>
              </div>
            </div>

            {/* Mint Date */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Minted On
              </h3>
              <p className="text-gray-600">
                {mintDate.toLocaleDateString()} at {mintDate.toLocaleTimeString()}
              </p>
            </div>

            {/* Metadata URI */}
            {heartData.metadataURI && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Metadata
                </h3>
                <a
                  href={heartData.metadataURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 text-sm underline"
                >
                  View on IPFS
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default NFTDetailModal;
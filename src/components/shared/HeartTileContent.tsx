"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { AnimationPresets } from "@/utils/animations";

interface HeartTileContentProps {
  imageUrl?: string;
  isRevealed: boolean;
  cellSize: number;
  isSelected?: boolean;
  isMatched?: boolean;
  className?: string;
}

/**
 * Heart game tile content with flip animation
 * Handles the card flip effect and image display
 */
export function HeartTileContent({
  imageUrl,
  isRevealed,
  cellSize,
  isSelected = false,
  isMatched = false,
  className = ""
}: HeartTileContentProps) {
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: cellSize, height: cellSize }}
    >
      {/* Back of card (hidden state) */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-gray-400 shadow-lg sm:shadow-xl"
        initial={{ rotateY: 0 }}
        animate={{
          rotateY: isRevealed ? 180 : 0,
          opacity: isRevealed ? 0 : 1
        }}
        transition={{ 
          duration: 0.6, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        style={{ 
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Card back design */}
        <div className="w-full h-full flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="text-gray-500 text-2xl"
          >
            ♥
          </motion.div>
        </div>
      </motion.div>

      {/* Front of card (revealed state) */}
      {imageUrl && (
        <motion.div
          className="absolute inset-0"
          initial={{ rotateY: -180 }}
          animate={{
            rotateY: isRevealed ? 0 : -180,
            opacity: isRevealed ? 1 : 0
          }}
          transition={{ 
            duration: 0.6, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          style={{ 
            backfaceVisibility: "hidden",
            transformStyle: "preserve-3d"
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt="Heart tile"
              fill
              sizes="(max-width: 768px) 16vw, 13vh"
              priority={true}
              unoptimized
              className={`
                rounded-xl sm:rounded-2xl border-2 sm:border-4 object-cover
                ${isMatched ? 'border-green-400 shadow-green-200' : 'border-gray-400'}
                ${isSelected ? 'border-purple-400 shadow-purple-200' : ''}
                shadow-lg sm:shadow-xl transition-all duration-300
              `}
            />
            
            {/* Overlay effects */}
            {isMatched && (
              <motion.div
                className="absolute inset-0 bg-green-400/20 rounded-xl sm:rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            )}
            
            {isSelected && (
              <motion.div
                className="absolute inset-0 bg-purple-400/20 rounded-xl sm:rounded-2xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Decorative heart tile for non-interactive positions
 */
interface HeartDecoTileProps {
  cellSize: number;
  index: number;
  className?: string;
}

export function HeartDecoTile({ 
  cellSize, 
  index,
  className = "" 
}: HeartDecoTileProps) {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      style={{ width: cellSize, height: cellSize }}
      animate={{
        scale: [1, 1.05, 1],
        rotate: [0, 2, -2, 0],
        opacity: [0.6, 0.8, 0.6]
      }}
      transition={{
        duration: 3 + (index * 0.2),
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.3
      }}
    >
      <span className="text-pink-300 text-xl sm:text-2xl">♥</span>
    </motion.div>
  );
}

export default HeartTileContent;
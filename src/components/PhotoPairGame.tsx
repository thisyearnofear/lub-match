"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useGameZoom, useAutoZoom } from "@/hooks/useGameZoom";
import { SimpleMobileZoomControls } from "./MobileZoomControls";
import MatchNotification from "./shared/MatchNotification";
import { FarcasterUser } from "@/types/socialGames";
import {
  useInteractiveHints,
  getOnboardingDelay,
  getSwayTiming,
} from "@/hooks/useInteractiveHints";

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

type CellType = number | "deco" | null;

const heartLayout: CellType[][] = [
  [null, 0, 1, null, 2, 3, null],
  [4, 5, 6, 7, 8, 9, 10],
  [null, 11, 12, 13, 14, 15, null],
  [null, null, "deco", "deco", "deco", null, null],
  [null, null, null, "deco", null, null, null],
  [null, null, null, null, null, null, null],
];

type PhotoPairGameProps = {
  images: string[]; // requires exactly 8 IPFS image URLs
  users?: FarcasterUser[]; // Optional: Farcaster user data for enhanced social features
  handleShowProposalAction: () => void;
  onGameComplete?: (stats: {
    completionTime: number;
    accuracy: number;
    totalAttempts: number;
    totalMatches: number;
  }) => void;
};

const PhotoPairGame = memo(function PhotoPairGame({
  images: imagesProp,
  users: usersProp,
  handleShowProposalAction,
  onGameComplete,
}: PhotoPairGameProps) {
  // Create stable references with memoization (moved before validation)
  const imagePairs = useMemo(
    () => imagesProp?.flatMap((img) => [img, img]) || [],
    [imagesProp]
  );

  // Initialize all hooks before any conditional logic
  const [shuffledPairs, setShuffledPairs] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [incorrect, setIncorrect] = useState<number[]>([]);
  const [justMatched, setJustMatched] = useState<number[]>([]);
  const [matchedUser, setMatchedUser] = useState<FarcasterUser | null>(null);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Initialize zoom system
  const zoomControls = useGameZoom({
    zoomedScale: 1.3,
    baseScale: 0.9,
    transitionDuration: 500,
    autoZoomOutDelay: 1500,
  });

  // Auto-zoom behavior
  useAutoZoom(selected, matched, zoomControls, 1500);

  // Interactive hints for engaging idle users
  const isGameActive = selected.length > 0 || matched.length > 0 || isComplete;
  const isGameIdle = !isGameActive;

  // Validate that we have exactly 8 images (after hooks are initialized)
  if (!imagesProp || imagesProp.length !== 8) {
    return (
      <div className="text-center p-8">
        <div className="text-4xl mb-4">🚫</div>
        <h3 className="text-xl font-bold text-white mb-2">Game Unavailable</h3>
        <p className="text-purple-200">
          Need exactly 8 images to play. Got {imagesProp?.length || 0}.
        </p>
      </div>
    );
  }

  // Initialize game when images change
  useEffect(() => {
    if (imagePairs.length === 16) {
      // 8 images * 2 = 16 pairs
      setShuffledPairs(shuffleArray([...imagePairs]));
      setSelected([]);
      setMatched([]);
      setIncorrect([]);
      setJustMatched([]);
      setIsComplete(false);
    }
  }, [imagePairs]);

  const handleClick = useCallback(
    async (index: number) => {
      if (
        selected.length === 2 ||
        matched.includes(index) ||
        selected.includes(index)
      )
        return;

      setSelected((prev) => [...prev, index]);

      if (selected.length === 1) {
        // Increment total attempts when second card is selected
        setTotalAttempts((prev) => prev + 1);

        const firstIndex = selected[0];
        if (shuffledPairs[firstIndex] === shuffledPairs[index]) {
          // Increment total matches when cards match
          setTotalMatches((prev) => prev + 1);

          setJustMatched([firstIndex, index]);

          // Show match notification with user profile if available
          if (usersProp && usersProp.length > 0) {
            const matchedImageUrl = shuffledPairs[firstIndex];
            const user = usersProp.find((u) => u.pfpUrl === matchedImageUrl);
            if (user) {
              setMatchedUser(user);
              setShowMatchNotification(true);
            }
          }

          setTimeout(() => {
            setMatched((prev) => [...prev, firstIndex, index]);
            setJustMatched([]);
          }, 500);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setIncorrect([firstIndex, index]);
          setTimeout(() => setIncorrect([]), 1000);
        }
        setTimeout(() => setSelected([]), 1000);
      }
    },
    [selected, matched, shuffledPairs, usersProp]
  );

  const handleCloseMatchNotification = useCallback(() => {
    setShowMatchNotification(false);
    setMatchedUser(null);
  }, []);

  useEffect(() => {
    if (matched.length === 16 && !isComplete) {
      setIsComplete(true);

      // Calculate game stats
      const completionTime = Math.floor((Date.now() - startTime) / 1000); // in seconds
      const accuracy =
        totalAttempts > 0
          ? Math.round((totalMatches / totalAttempts) * 100)
          : 0;

      // Call the callback with game stats
      onGameComplete?.({
        completionTime,
        accuracy,
        totalAttempts,
        totalMatches,
      });

      // Show proposal after a delay
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("demoGameFinished"));
        handleShowProposalAction();
      }, 3500); // Give users time to process their success
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    matched,
    isComplete,
    onGameComplete,
    startTime,
    totalAttempts,
    totalMatches,
  ]);

  return (
    <div className="relative flex justify-center items-center w-full px-4 sm:px-6 py-8">
      <div
        className="grid grid-cols-7 gap-2 sm:gap-3"
        style={{
          maxWidth: "min(85vh, 90vw)",
          width: "100%",
          ...zoomControls.getTransformStyle(),
        }}
      >
        {/* Image preload - improved with proper sizes */}
        <div className="hidden">
          {shuffledPairs.filter(Boolean).map((image, i) => (
            <Image
              key={i}
              src={image}
              alt={`Image ${i + 1}`}
              width={400}
              height={400}
              priority
              unoptimized
            />
          ))}
        </div>

        {heartLayout.flat().map((cell, i) => {
          const cellSize = "min(max(16vw, 70px), 13vh)";

          if (cell === "deco") {
            return (
              <div
                key={i}
                className="rounded-xl sm:rounded-2xl bg-red-400 border-2 sm:border-4 border-red-500 shadow-lg sm:shadow-xl"
                style={{ width: cellSize, height: cellSize }}
              />
            );
          }

          if (cell === null) {
            return (
              <div key={i} style={{ width: cellSize, height: cellSize }} />
            );
          }

          const isSelected = selected.includes(cell);
          const isMatched = matched.includes(cell);

          // Interactive hints for this tile
          const hints = useInteractiveHints(cell, isGameActive, isGameIdle);
          const swayTiming = getSwayTiming(cell);

          // Record interaction when tile is clicked
          const handleTileClick = () => {
            if (!isComplete) {
              hints.recordInteraction();
              handleClick(cell);
            }
          };

          return (
            <motion.div
              key={i}
              className="relative cursor-pointer"
              style={{ width: cellSize, height: cellSize }}
              whileHover={{
                scale: isComplete ? 1 : 1.05,
                rotateZ: isComplete ? 0 : 2,
              }}
              animate={{
                zIndex: isSelected ? 10 : 0,
                y: isComplete
                  ? -100
                  : hints.shouldSway && !isSelected && !isMatched
                  ? [0, -1, 0, 1, 0]
                  : 0,
                opacity: isComplete ? 0 : 1,
                // Add wiggle/sway effects
                ...(hints.shouldWiggle && !isSelected && !isMatched
                  ? {
                      x: [0, -3, 3, -2, 2, 0],
                      rotate: [0, -1, 1, -0.5, 0.5, 0],
                      boxShadow: [
                        "0 4px 8px rgba(236, 72, 153, 0.1)",
                        "0 8px 20px rgba(236, 72, 153, 0.25)",
                        "0 6px 15px rgba(147, 51, 234, 0.2)",
                        "0 8px 18px rgba(236, 72, 153, 0.22)",
                        "0 4px 8px rgba(236, 72, 153, 0.1)",
                      ],
                    }
                  : hints.shouldSway && !isSelected && !isMatched
                  ? { x: [0, 0.5, 0, -0.5, 0] }
                  : {}),
                // Compute scale once based on state
                scale: isSelected
                  ? 1.15
                  : hints.shouldWiggle && !isSelected && !isMatched
                  ? [1, 1.03, 1.01, 1.02, 1]
                  : [1, 1.02, 1],
              }}
              transition={{
                scale: isSelected
                  ? { duration: 0.3 }
                  : {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.05,
                    },
                // Enhanced wiggle animation timing
                x: hints.shouldWiggle
                  ? {
                      duration: 0.8,
                      ease: "easeInOut",
                      delay: getOnboardingDelay(cell),
                    }
                  : hints.shouldSway
                  ? {
                      duration: swayTiming.duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: swayTiming.delay,
                    }
                  : { duration: 0 },
                rotate: hints.shouldWiggle
                  ? {
                      duration: 0.8,
                      ease: "easeInOut",
                      delay: getOnboardingDelay(cell),
                    }
                  : { duration: 0 },
                boxShadow: hints.shouldWiggle
                  ? {
                      duration: 0.8,
                      ease: "easeInOut",
                      delay: getOnboardingDelay(cell),
                    }
                  : { duration: 0 },
                zIndex: { duration: 0.3 },
                y: isComplete
                  ? {
                      duration: 0.3,
                      delay: Math.random() * 0.8,
                    }
                  : hints.shouldSway
                  ? {
                      duration: swayTiming.duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: swayTiming.delay,
                    }
                  : { duration: 0.3 },
                opacity: {
                  duration: 0.3,
                  delay: isComplete ? Math.random() * 0.8 : 0,
                },
              }}
              onClick={handleTileClick}
            >
              {!isSelected && !isMatched && (
                <motion.div
                  className="absolute inset-0 bg-gray-300 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-gray-400 shadow-lg sm:shadow-xl"
                  initial={{ rotateY: 0 }}
                  animate={{
                    rotateY: isSelected || isMatched ? 180 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  style={{ backfaceVisibility: "hidden" }}
                />
              )}

              {(isSelected || isMatched) && shuffledPairs[cell] && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ rotateY: -180 }}
                  animate={{ rotateY: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={shuffledPairs[cell]}
                      alt={`Image ${cell + 1}`}
                      fill
                      sizes="(max-width: 768px) 16vw, 13vh"
                      priority={true}
                      unoptimized
                      className="rounded-xl sm:rounded-2xl border-2 sm:border-4 border-gray-400 shadow-lg sm:shadow-xl object-cover"
                    />
                  </div>
                </motion.div>
              )}

              {incorrect.includes(cell) && (
                <motion.div
                  className="absolute inset-0 z-20"
                  animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-full h-full bg-red-500 rounded-xl sm:rounded-2xl"></div>
                </motion.div>
              )}

              {justMatched.includes(cell) && (
                <motion.div
                  className="absolute inset-0 z-20"
                  animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-full h-full bg-green-500 rounded-xl sm:rounded-2xl"></div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Zoom Controls */}
      <SimpleMobileZoomControls
        zoomControls={zoomControls}
        disabled={matched.length === imagePairs.length}
      />

      {/* Match Notification */}
      {matchedUser && (
        <MatchNotification
          user={matchedUser}
          isVisible={showMatchNotification}
          onClose={handleCloseMatchNotification}
          position="bottom"
          autoCloseDelay={4000}
        />
      )}
    </div>
  );
});

export default PhotoPairGame;

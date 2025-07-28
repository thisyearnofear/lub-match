"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { defaultPairs } from "@/data/defaultGame";
import { useGameZoom, useAutoZoom } from "@/hooks/useGameZoom";
import { SimpleMobileZoomControls } from "./MobileZoomControls";

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
  images?: string[]; // expects 8 images; falls back to defaultPairs
  handleShowProposalAction: () => void;
};

export default function PhotoPairGame({
  images: imagesProp,
  handleShowProposalAction,
}: PhotoPairGameProps) {
  const imagesFinal =
    imagesProp && imagesProp.length === 8 ? imagesProp : defaultPairs;
  const imagePairs = useMemo(
    () => imagesFinal.flatMap((img) => [img, img]),
    [imagesFinal],
  );

  const [shuffledPairs, setShuffledPairs] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [incorrect, setIncorrect] = useState<number[]>([]);
  const [justMatched, setJustMatched] = useState<number[]>([]);

  const [isComplete, setIsComplete] = useState(false);

  // Initialize zoom system
  const zoomControls = useGameZoom({
    zoomedScale: 1.3,
    baseScale: 0.9,
    transitionDuration: 500,
    autoZoomOutDelay: 1500,
  });

  // Auto-zoom behavior
  useAutoZoom(selected, matched, zoomControls, 1500);

  useEffect(() => {
    setShuffledPairs(shuffleArray([...imagePairs]));
    setSelected([]);
    setMatched([]);
    setIncorrect([]);
    setJustMatched([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePairs.join(",")]);

  const handleClick = async (index: number) => {
    if (
      selected.length === 2 ||
      matched.includes(index) ||
      selected.includes(index)
    )
      return;

    setSelected((prev) => [...prev, index]);

    if (selected.length === 1) {
      const firstIndex = selected[0];
      if (shuffledPairs[firstIndex] === shuffledPairs[index]) {
        setJustMatched([firstIndex, index]);
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
  };

  useEffect(() => {
    if (matched.length === imagePairs.length && !isComplete) {
      setIsComplete(true);
      setTimeout(() => {
        handleShowProposalAction();
      }, 1500); // Wait for animations to finish
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, isComplete]);

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

          return (
            <motion.div
              key={i}
              className="relative cursor-pointer"
              style={{ width: cellSize, height: cellSize }}
              whileHover={{ scale: isComplete ? 1 : 1.05 }}
              animate={{
                scale: isSelected ? 1.15 : 1,
                zIndex: isSelected ? 10 : 0,
                y: isComplete ? -100 : 0,
                opacity: isComplete ? 0 : 1,
              }}
              transition={{
                duration: 0.3,
                delay: isComplete ? Math.random() * 0.8 : 0,
              }}
              onClick={() => !isComplete && handleClick(cell)}
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
    </div>
  );
}

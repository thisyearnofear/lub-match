import { useState, useEffect, useMemo } from "react";
import { Playfair_Display } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import Fireworks from "@fireworks-js/react";
import Image from "next/image";
import Link from "next/link";
import { defaultRevealImages, defaultMessage } from "@/data/defaultGame";

type ValentinesProposalProps = {
  revealImages?: string[]; // falls back to defaultRevealImages
  message?: string; // falls back to defaultMessage
  onShare?: () => void;
};

// Function to shuffle an array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const playfairDisplay = Playfair_Display({
  display: "swap",
  subsets: ["latin"],
  fallback: ["serif"],
  preload: false,
});

export default function ValentinesProposal({
  revealImages,
  message,
  onShare,
}: ValentinesProposalProps) {
  const sourceImages =
    revealImages && revealImages.length >= 8
      ? revealImages.slice(0, 8)
      : defaultRevealImages.slice(0, 8);
  const heading = message || defaultMessage;

  // Create a 36-image grid by repeating and shuffling the source images
  const imageGrid = useMemo(() => {
    const repeated = Array(Math.ceil(36 / sourceImages.length))
      .fill(sourceImages)
      .flat()
      .slice(0, 36);
    return shuffleArray(repeated);
  }, [sourceImages]);

  const [step, setStep] = useState(0);
  const [position, setPosition] = useState<{
    top: string;
    left: string;
  } | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const getRandomPosition = () => {
    const randomTop = Math.random() * 80;
    const randomLeft = Math.random() * 80;
    return { top: `${randomTop}%`, left: `${randomLeft}%` };
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (step < 2) {
      // Change step after 5 seconds
      const timer = setTimeout(() => {
        setStep((prevStep) => prevStep + 1);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleYesClick = () => {
    setShowFireworks(true);
    setStep(3);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step-0"
            className="bg-black bg-opacity-50 p-4 rounded-lg"
            transition={{ duration: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2
              className={`text-4xl font-semibold text-white text-shadow-md ${playfairDisplay.className}`}
            >
              Darling! Your are my heart!
            </h2>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div
            key="step-1"
            className="bg-black bg-opacity-50 p-4 rounded-lg"
            transition={{ duration: 3 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2
              className={`text-4xl font-semibold text-white text-shadow-md ${playfairDisplay.className}`}
            >
              I have a question to ask you!
            </h2>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="step-2"
            transition={{ duration: 3 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            {/* Image Grid Background */}
            <div className="absolute inset-0 grid grid-cols-6">
              {imageGrid.map((src, index) => (
                <div key={index} className="relative h-full">
                  <Image
                    src={src}
                    alt={`Memory ${index + 1}`}
                    fill
                    sizes="16.67vw"
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="relative z-10 flex flex-col items-center bg-black bg-opacity-50 p-8 rounded-lg">
              <h2
                className={`text-5xl font-semibold mb-8 text-white text-shadow-lg ${playfairDisplay.className}`}
              >
                {heading}
              </h2>
              <Image
                src="/sad_hamster.png"
                alt="Sad Hamster"
                width={200}
                height={200}
                unoptimized
              />
              <div className="flex space-x-4 mt-10">
                <button
                  className="px-6 py-2 text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl hover:from-pink-600 hover:to-rose-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  onClick={handleYesClick}
                >
                  Yes, I will! 🥰
                </button>
                <button
                  className="px-6 py-2 text-lg font-semibold text-white bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-95 transition-all duration-300 shadow-lg"
                  style={
                    position
                      ? {
                          position: "absolute",
                          top: position.top,
                          left: position.left,
                        }
                      : {}
                  }
                  onMouseEnter={() =>
                    isClient && setPosition(getRandomPosition())
                  }
                >
                  No, I won&apos;t 😢
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div
            key="step-3"
            className="flex flex-col justify-center items-center"
            transition={{ duration: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-black bg-opacity-50 p-8 rounded-lg text-center mb-6">
              <h2
                className={`text-4xl font-semibold text-white text-shadow-lg mb-4 ${playfairDisplay.className}`}
              >
                You are as brave as you are beautiful <br />
                Asante sana for accepting my lub! 💕
              </h2>
              <p className="text-lg text-white text-shadow-md mt-4">
                Lets not take so long to get to the right answer next year
                please 💌
              </p>
            </div>
            <Image
              src="/hamster_jumping.gif"
              alt="Hamster Feliz"
              width={200}
              height={200}
              unoptimized
            />
            <div className="flex space-x-4 mt-6">
              {onShare && (
                <button
                  onClick={onShare}
                  className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  💝 Share on Farcaster
                </button>
              )}
              <Link
                href="/"
                className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Play Again
              </Link>
              <Link
                href="/create"
                className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Create Your Own
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showFireworks && (
        <div className="absolute w-full h-full">
          <Fireworks
            options={{
              autoresize: true,
            }}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

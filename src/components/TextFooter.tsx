import { Playfair_Display } from "next/font/google";

const playfairDisplay = Playfair_Display({
  display: "swap",
  subsets: ["latin"],
  fallback: ["serif"],
  preload: false,
});

export default function TextFooter() {
  return (
    <>
      {/* Left Text */}
      <h1
        className={`absolute left-4 sm:left-10 bottom-24 sm:bottom-5 transform text-white text-2xl sm:text-4xl md:text-5xl font-bold leading-tight ${playfairDisplay.className}`}
      >
        <span className="text-gray-400">Match</span> <br /> the photo pairs
      </h1>

      {/* Right Text */}
      <h1
        className={`absolute right-4 sm:right-10 bottom-4 sm:bottom-5 transform text-white text-2xl sm:text-4xl md:text-5xl font-bold leading-tight text-right ${playfairDisplay.className}`}
      >
        to find <br /> <span className="text-gray-400">lub</span>
      </h1>
    </>
  );
}

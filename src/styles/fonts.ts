import { Playfair_Display } from "next/font/google";

export const playfairDisplay = Playfair_Display({
  display: "swap",
  subsets: ["latin"],
  fallback: ["serif"],
  preload: true, // Changed to true for better performance
  variable: "--font-playfair-display",
});
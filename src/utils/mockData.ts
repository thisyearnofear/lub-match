// Mock data utilities for development and fallback scenarios

// Re-export the FarcasterUser interface for consistency
export interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
}

// Deterministic mock usernames to avoid hydration mismatches
const MOCK_USERNAMES = [
  "vitalik", "dwr", "balajis", "linda", "jessepollak", "rish", "manan", "ted",
  "horsefacts", "proxystudio", "keccers", "july", "varunsrin", "colin",
  "davidfurlong", "nolanz", "trevor", "luc", "schmoodles", "gami",
] as const;

/**
 * Generate deterministic mock users to avoid hydration mismatches
 * Uses consistent data based on index to ensure server/client consistency
 */
export function generateMockUsers(count: number): FarcasterUser[] {
  return Array.from({ length: count }, (_, i) => ({
    fid: 1000 + i,
    username: MOCK_USERNAMES[i % MOCK_USERNAMES.length] || `user${i}`,
    display_name: `Farcaster User ${i + 1}`,
    pfp_url: `/game-photos/${(i % 8) + 1}.avif`, // Use existing fallback images
    bio: "Building the future of social",
    follower_count: 1000 + i * 123, // Deterministic follower count
    following_count: 100 + i * 47, // Deterministic following count
    verified_addresses: {
      eth_addresses: [
        `0x${"0".repeat(40 - i.toString(16).length)}${i.toString(16)}`,
      ],
      sol_addresses: [],
    },
  }));
}

/**
 * Get fallback image URLs for the memory game
 */
export function getFallbackGameImages(): string[] {
  return [
    "/game-photos/1.avif",
    "/game-photos/2.avif", 
    "/game-photos/3.avif",
    "/game-photos/4.avif",
    "/game-photos/5.avif",
    "/game-photos/6.avif",
    "/game-photos/7.avif",
    "/game-photos/8.avif",
  ];
}

/**
 * Utility function to shuffle array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

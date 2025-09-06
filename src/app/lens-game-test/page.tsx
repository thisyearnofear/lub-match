"use client";

import { useState, useEffect } from 'react';
import { useFarcasterUsers } from '@/hooks/useFarcasterUsers';
import PhotoPairGame from '@/components/PhotoPairGame';
import Link from 'next/link';

/**
 * CLEAN: Simple test page for Lens game integration
 * MODULAR: Self-contained test environment
 */
export default function LensGameTestPage() {
  const [isClient, setIsClient] = useState(false);
  
  // ENHANCEMENT FIRST: Use existing hook with Lens network
  const {
    users,
    loading,
    error,
    getRandomPairs,
  } = useFarcasterUsers({
    count: 16,
    minFollowers: 100,
  });

  const [gameImages, setGameImages] = useState<string[]>([]);
  const [gameUsers, setGameUsers] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set up game when Lens users are loaded
  useEffect(() => {
    if (isClient && !loading && users.length >= 8) {
      const pairs = getRandomPairs();
      if (pairs.length === 8) {
        setGameImages(pairs);
        setGameUsers(users.slice(0, 8));
      }
    }
  }, [isClient, loading, users.length, getRandomPairs, users]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      {/* Header */}
      <div className="p-4 text-center">
        <Link 
          href="/"
          className="inline-block px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-white text-sm hover:bg-white/30 transition-colors mb-4"
        >
          ← Back to Home
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">
          🌿 Lens Game Test
        </h1>
        <p className="text-white/80 text-sm">
          Testing Lens Protocol users in memory game
        </p>
      </div>

      {/* Game Content */}
      <div className="flex-grow flex items-center justify-center px-4">
        {loading ? (
          <div className="text-center text-white">
            <div className="text-6xl mb-4 animate-pulse">🌿</div>
            <h2 className="text-xl font-bold mb-2">Loading Lens Users...</h2>
            <p className="text-white/80">Fetching high-quality Lens ecosystem participants</p>
          </div>
        ) : error ? (
          <div className="text-center text-white">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Error Loading Lens Data</h2>
            <p className="text-white/80 mb-4">{error}</p>
            <p className="text-sm text-white/60">
              Make sure you have collected Lens users: `pnpm collect-lens-users`
            </p>
          </div>
        ) : gameImages.length === 8 ? (
          <div className="w-full max-w-lg">
            <div className="text-center text-white mb-4">
              <p className="text-sm">
                Playing with <span className="font-bold">{users.length} Lens users</span> 
                {users.length > 0 && (
                  <span className="ml-2 text-green-200">
                    (Mixed Networks)
                  </span>
                )}
              </p>
            </div>
            <PhotoPairGame
              images={gameImages}
              users={gameUsers}
              handleShowProposalAction={() => {
                console.log('Game completed with Lens users!');
                // Could redirect or show completion message
              }}
              onGameComplete={(stats) => {
                console.log('🌿 Lens Game Stats:', {
                  ...stats,
                  lensUsers: gameUsers.length,
                  network: 'lens'
                });
              }}
            />
          </div>
        ) : (
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2">Insufficient Lens Data</h2>
            <p className="text-white/80 mb-4">
              Found {users.length} Lens users, need at least 8 for the game
            </p>
            <div className="text-sm text-white/60 space-y-1">
              <p>• Run: <code className="bg-white/20 px-2 py-1 rounded">pnpm collect-lens-users</code></p>
              <p>• This will collect 300+ high-quality Lens users</p>
              <p>• Then refresh this page</p>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/50 backdrop-blur text-white text-xs p-3 rounded-lg max-w-xs">
          <div><strong>Debug Info:</strong></div>
          <div>Users: {users.length}</div>
          <div>Network: Mixed</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Game Ready: {gameImages.length === 8 ? 'Yes' : 'No'}</div>
          {users.length > 0 && (
            <div>Sample: {users[0]?.displayName}</div>
          )}
        </div>
      )}
    </div>
  );
}

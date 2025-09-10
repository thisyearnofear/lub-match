"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLensAuth } from '@/hooks/useLensAuth';
import { useFarcasterUsers } from '@/hooks/useFarcasterUsers';
import LensAuthButton from '@/components/LensAuthButton';
import MiniAppWalletConnect from '@/components/MiniAppWalletConnect';
import ActionButton from '@/components/shared/ActionButton';

export default function LensTestPage() {
  const { isConnected, address } = useAccount();
  const { isAuthenticated, authState } = useLensAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<'farcaster' | 'lens' | 'both'>('lens'); // ENHANCEMENT FIRST: Default to lens for testing
  
  // Use the updated hook
  const {
    users,
    loading,
    error,
    refreshUsers,
  } = useFarcasterUsers({
    count: 10,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            🌿 Lens Protocol Integration Test
          </h1>

          {/* Wallet Connection Section */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">1. Wallet Connection</h2>
            <MiniAppWalletConnect />
            {isConnected && (
              <div className="mt-4 text-sm text-green-600">
                ✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}
          </div>

          {/* Lens Authentication Section */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">2. Lens Authentication</h2>
            <LensAuthButton
              onAuthSuccess={() => console.log('Lens auth successful!')}
              onAuthError={(error) => console.error('Lens auth error:', error)}
            />
            
            {isAuthenticated && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Authentication Details:</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <div>Status: ✅ Authenticated</div>
                  <div>Wallet: {authState.walletAddress?.slice(0, 6)}...{authState.walletAddress?.slice(-4)}</div>
                  {authState.profileId && <div>Profile ID: {authState.profileId}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Network Selection */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">3. Network Selection</h2>
            <div className="flex gap-2 mb-4">
              {(['farcaster', 'lens', 'both'] as const).map((networkOption) => (
                <button
                  key={networkOption}
                  onClick={() => setSelectedNetwork(networkOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedNetwork === networkOption
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border'
                  }`}
                >
                  {networkOption === 'farcaster' && '🟣 Farcaster'}
                  {networkOption === 'lens' && '🌿 Lens'}
                  {networkOption === 'both' && '🔄 Both'}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Current network: <span className="font-medium">Mixed</span>
            </div>
          </div>

          {/* User Fetching Section */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">4. User Data Fetching</h2>
            
            <div className="flex gap-4 mb-4">
              <ActionButton
                onClick={refreshUsers}
                disabled={loading}
                variant="primary"
                size="md"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  '🔄 Refresh Users'
                )}
              </ActionButton>
              
              <div className="text-sm text-gray-600 flex items-center">
                Lens Auth: {isAuthenticated ? '✅ Yes' : '❌ No'}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}

            {users.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Found {users.length} users from mixed networks
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {users.slice(0, 6).map((user, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        {user.pfpUrl && (
                          <img
                            src={user.pfpUrl}
                            alt={user.displayName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {user.displayName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            @{user.username}
                          </div>
                          <div className="text-xs text-gray-400">
                            {(user as any).network || 'farcaster'} • {user.followerCount?.toLocaleString() || '0'} followers
                            {(user as any).gameScore && <span className="ml-2 text-green-600">• {(user as any).gameScore}/100 🎮</span>}
                          </div>
                        </div>
                        <div className="text-2xl">
                          {(user as any).network === 'lens' ? '🌿' : '🟣'}
                        </div>
                      </div>
                      {user.bio && (
                        <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {user.bio}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Debug Information */}
          <div className="p-6 bg-gray-50 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">5. Debug Information</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <div>Wallet Connected: {isConnected ? '✅' : '❌'}</div>
              <div>Lens Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
              <div>Selected Network: {selectedNetwork}</div>
              <div>Active Network: Mixed</div>
              <div>Users Loaded: {users.length}</div>
              <div>Loading: {loading ? '⏳' : '✅'}</div>
              {error && <div className="text-red-600">Error: {error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
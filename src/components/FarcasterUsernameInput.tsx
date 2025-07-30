"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
}

interface FarcasterUsernameInputProps {
  onUsersSelected: (users: FarcasterUser[]) => void;
  maxUsers?: number;
  disabled?: boolean;
}

export default function FarcasterUsernameInput({
  onUsersSelected,
  maxUsers = 8,
  disabled = false,
}: FarcasterUsernameInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<FarcasterUser[]>([]);
  const [searchResults, setSearchResults] = useState<FarcasterUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/farcaster-users?search=${encodeURIComponent(query)}&limit=10`
        );

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();
        const users = data.users || [];

        // Filter out already selected users
        const filteredUsers = users.filter(
          (user: FarcasterUser) =>
            !selectedUsers.some((selected) => selected.fid === user.fid)
        );

        setSearchResults(filteredUsers);
      } catch (error: unknown) {
        setError(
          error instanceof Error ? error.message : "Failed to search users"
        );
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedUsers]
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Clear previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }

    // Debounce search
    window.searchTimeout = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const addUser = (user: FarcasterUser) => {
    if (selectedUsers.length >= maxUsers) return;

    const newSelectedUsers = [...selectedUsers, user];
    setSelectedUsers(newSelectedUsers);
    setSearchResults([]);
    setInputValue("");
    onUsersSelected(newSelectedUsers);
  };

  const removeUser = (fid: number) => {
    const newSelectedUsers = selectedUsers.filter((user) => user.fid !== fid);
    setSelectedUsers(newSelectedUsers);
    onUsersSelected(newSelectedUsers);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search Farcaster usernames..."
            disabled={disabled || selectedUsers.length >= maxUsers}
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="text-gray-400">🔍</span>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            >
              {searchResults.map((user) => (
                <button
                  key={user.fid}
                  onClick={() => addUser(user)}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <Image
                    src={user.pfp_url}
                    alt={user.username}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                    unoptimized
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      @{user.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.display_name}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {user.follower_count.toLocaleString()} followers
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">
              Selected Users ({selectedUsers.length}/{maxUsers})
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {selectedUsers.map((user) => (
              <motion.div
                key={user.fid}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group bg-gray-50 rounded-xl p-3 flex items-center space-x-3"
              >
                <Image
                  src={user.pfp_url}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    @{user.username}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user.display_name}
                  </p>
                </div>
                <button
                  onClick={() => removeUser(user.fid)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Remove user"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        💡 Search for Farcaster users to include their profile pictures in your
        game
      </p>
    </div>
  );
}

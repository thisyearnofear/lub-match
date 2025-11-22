"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  colors,
  spacing,
  borderRadius,
  transitions,
  animations,
} from "@/theme/designTokens";
import {
  useMicroInteraction,
  interactionSequences,
} from "@/hooks/useMicroInteractions";

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  followerCount: number;
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
  const { trigger: triggerMicroInteraction } = useMicroInteraction();

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

    // Celebrate friend added!
    triggerMicroInteraction({
      type: "success",
      haptic: true,
    });
  };

  const removeUser = (fid: number) => {
    const newSelectedUsers = selectedUsers.filter((user) => user.fid !== fid);
    setSelectedUsers(newSelectedUsers);
    onUsersSelected(newSelectedUsers);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
      {/* Search Input */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="🔍 Search Farcaster friends..."
            disabled={disabled || selectedUsers.length >= maxUsers}
            style={{
              width: "100%",
              padding: `${spacing[3]} ${spacing[4]} ${spacing[3]} ${spacing[4]}`,
              paddingRight: spacing[10],
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.xl,
              fontSize: "1rem",
              fontFamily: "inherit",
              outline: "none",
              transition: transitions.property("base"),
              background: colors.neutral[0],
              color: colors.neutral[900],
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = colors.primary[400];
              (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${colors.primary[50]}`;
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = colors.neutral[300];
              (e.target as HTMLInputElement).style.boxShadow = "none";
            }}
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
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: spacing[2],
                background: colors.neutral[0],
                border: `1px solid ${colors.neutral[200]}`,
                borderRadius: borderRadius.xl,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                maxHeight: "240px",
                overflowY: "auto",
                zIndex: 100,
              }}
            >
              {searchResults.map((user, idx) => (
                <motion.button
                  key={user.fid}
                  onClick={() => addUser(user)}
                  whileHover={{ backgroundColor: colors.neutral[50] }}
                  style={{
                    width: "100%",
                    padding: `${spacing[3]} ${spacing[4]}`,
                    display: "flex",
                    alignItems: "center",
                    gap: spacing[3],
                    border: "none",
                    background: colors.neutral[0],
                    cursor: "pointer",
                    transition: transitions.property("fast"),
                    textAlign: "left",
                    borderRadius:
                      idx === 0 && searchResults.length === 1
                        ? borderRadius.xl
                        : idx === 0
                        ? `${borderRadius.xl} ${borderRadius.xl} 0 0`
                        : idx === searchResults.length - 1
                        ? `0 0 ${borderRadius.xl} ${borderRadius.xl}`
                        : 0,
                  }}
                >
                  <Image
                    src={user.pfpUrl}
                    alt={user.username}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                    unoptimized
                  />
                  <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 600,
                        color: colors.neutral[900],
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      @{user.username}
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: colors.neutral[500],
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.displayName}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: colors.neutral[400],
                      whiteSpace: "nowrap",
                    }}
                  >
                    👥 {user.followerCount.toLocaleString()}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: spacing[3],
            background: `${colors.error}15`,
            border: `1px solid ${colors.error}40`,
            borderRadius: borderRadius.lg,
            color: colors.error,
          }}
        >
          <p style={{ fontSize: "0.875rem", margin: 0 }}>💔 {error}</p>
        </motion.div>
      )}

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4
              style={{
                fontWeight: 600,
                color: colors.neutral[800],
                margin: 0,
                fontSize: "0.95rem",
              }}
            >
              💝 Friends Selected ({selectedUsers.length}/{maxUsers})
            </h4>
            {selectedUsers.length === maxUsers && (
              <span style={{ fontSize: "0.75rem", color: colors.success }}>
                ✨ All set!
              </span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: spacing[3],
            }}
          >
            <AnimatePresence>
              {selectedUsers.map((user) => (
                <motion.div
                  key={user.fid}
                  variants={interactionSequences.friendAdded}
                  initial="initial"
                  animate="animate"
                  exit={{ scale: 0, opacity: 0 }}
                  style={{
                    position: "relative",
                    background: colors.neutral[50],
                    borderRadius: borderRadius.lg,
                    padding: spacing[3],
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: spacing[2],
                    border: `1px solid ${colors.neutral[200]}`,
                    cursor: "pointer",
                    transition: transitions.property("base"),
                  }}
                  onHoverStart={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = colors.primary[400];
                    el.style.boxShadow = "0 4px 12px rgba(236, 72, 153, 0.2)";
                  }}
                  onHoverEnd={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = colors.neutral[200];
                    el.style.boxShadow = "none";
                  }}
                >
                <Image
                  src={user.pfpUrl}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                  unoptimized
                />
                <p
                  style={{
                    fontWeight: 600,
                    color: colors.neutral[900],
                    fontSize: "0.75rem",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  @{user.username.slice(0, 8)}
                </p>

                {/* Remove Button */}
                <motion.button
                  type="button"
                  onClick={() => removeUser(user.fid)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    width: "24px",
                    height: "24px",
                    borderRadius: borderRadius.full,
                    background: colors.error,
                    color: colors.neutral[0],
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  aria-label={`Remove ${user.username}`}
                >
                  ✕
                </motion.button>
                </motion.div>
                ))}
                </AnimatePresence>
                </div>
                </motion.div>
                )}

      {/* Helper Text */}
      <p
        style={{
          fontSize: "0.75rem",
          color: colors.neutral[500],
          margin: 0,
          marginTop: spacing[2],
        }}
      >
        💡 Search for Farcaster friends to include their profile pictures in your
        game
      </p>
    </div>
  );
}

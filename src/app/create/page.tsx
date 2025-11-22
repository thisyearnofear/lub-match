"use client";

import { useState, useCallback, useEffect } from "react";
import Dropzone from "react-dropzone";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { usePublishGame } from "@/hooks/usePublishGame";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";
import Web3Provider from "@/components/Web3Provider";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import FarcasterUsernameInput from "@/components/FarcasterUsernameInput";
import LubCreationModeSelector, {
  LubCreationMode,
} from "@/components/LubCreationModeSelector";
import { useUserProgression } from "@/utils/userProgression";
import { useLubToken } from "@/hooks/useLubToken";
import { PricingDisplay } from "@/components/PricingDisplay";
import { LoadingState, NetworkError } from "@/components/ErrorBoundary";
import { WEB3_CONFIG } from "@/config";
import SuccessScreen from "@/components/shared/SuccessScreen";
import ActionButton from "@/components/shared/ActionButton";
import FloatingActionButton from "@/components/shared/FloatingActionButton";
import WalletDrawer from "@/components/shared/WalletDrawer";
import { useSuccessActions } from "@/hooks/useSuccessActions";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { isImageFile } from "@/utils/imageCompression";
import { formatBytes, UPLOAD_LIMITS } from "@/config/uploadLimits";
import { useImageCompression } from "@/hooks/useImageCompression";
import { EnhancedDropzone } from "@/components/shared/EnhancedDropzone";
import Button from "@/components/shared/Button";
import { colors, spacing } from "@/theme/designTokens";

// Debug info component
function DebugInfo() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(
    null
  );

  useEffect(() => {
    setDebugInfo({
      pinataJWT: !!process.env.PINATA_JWT,
      hasFormData: typeof FormData !== "undefined",
      hasFetch: typeof fetch !== "undefined",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    });
  }, []);

  if (!debugInfo) return null;

  return (
    <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
      <summary className="cursor-pointer font-medium">Debug Info</summary>
      <pre className="mt-2 text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
    </details>
  );
}

const PAIRS_LIMIT = UPLOAD_LIMITS.GAME.MAX_PHOTOS;

const DEFAULT_MESSAGE = "Will you accept my lub? 💕";

type StorageMode = "quick" | "private";

function DropzoneField({
  files,
  setFiles,
  maxFiles,
  accept,
  disabled,
}: {
  files: File[];
  setFiles: (f: File[]) => void;
  maxFiles: number;
  accept?: { [key: string]: string[] };
  disabled?: boolean;
}) {
  const { isCompressing, progress, error, processFiles, reset } =
    useImageCompression();

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length + files.length > maxFiles) return;

      const newFiles = accepted.slice(0, maxFiles - files.length);

      if (newFiles.length === 0) return;

      try {
        const result = await processFiles(newFiles);
        setFiles([...files, ...result.files]);

        // Show compression stats if compression occurred
        if (result.compressionStats && result.compressionStats.savedBytes > 0) {
          console.log(
            `✅ Compression saved ${formatBytes(
              result.compressionStats.savedBytes
            )} (${result.compressionStats.savedPercentage.toFixed(
              1
            )}% reduction)`
          );
        }
      } catch (error) {
        console.error("File processing failed:", error);
        alert(
          error instanceof Error ? error.message : "Failed to process files"
        );
      }
    },
    [files, setFiles, maxFiles, processFiles]
  );

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-6">
      <Dropzone
        onDrop={onDrop}
        accept={accept}
        multiple
        maxFiles={maxFiles}
        disabled={disabled || isCompressing}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
              isCompressing
                ? "border-blue-500 bg-blue-50"
                : isDragActive
                ? "border-pink-500 bg-pink-50 scale-[1.02]"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="text-2xl">{isCompressing ? "🔄" : "�"}</div>
              <p className="text-sm font-medium text-gray-700">
                {isCompressing
                  ? "Compressing images..."
                  : files.length === 0
                  ? "Tap to select photos"
                  : `${files.length}/${maxFiles} photos selected`}
              </p>
              <p className="text-xs text-gray-500">
                {isCompressing
                  ? `${progress.toFixed(0)}% complete`
                  : isDragActive
                  ? "Drop your photos here"
                  : "or drag and drop"}
              </p>
              {isCompressing && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        )}
      </Dropzone>

      {files.length > 0 && (
        <div className="space-y-3 mt-4">
          {/* File size summary */}
          <div className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
            <span>Total size:</span>
            <span className="font-medium">
              {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
            </span>
          </div>

          {/* File grid */}
          <div className="grid grid-cols-3 gap-3">
            {files.map((f, idx) => (
              <div key={idx} className="relative group">
                <Image
                  src={URL.createObjectURL(f)}
                  alt="preview"
                  width={120}
                  height={120}
                  className="w-full aspect-square object-cover rounded-xl shadow-md"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg hover:bg-red-600 transition-colors"
                  aria-label="Remove"
                >
                  ×
                </button>
                <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* File size indicator */}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                  {formatBytes(f.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  followerCount: number;
}

function CreateGameContent() {
  useMiniAppReady();
  const [lubMode, setLubMode] = useState<LubCreationMode | null>(null);
  const [pairs, setPairs] = useState<File[]>([]);
  const [farcasterUsers, setFarcasterUsers] = useState<FarcasterUser[]>([]);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Storage mode selection - defaulting to quick mode for mobile-first UX
  const [storageMode, setStorageMode] = useState<StorageMode>("quick");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [cid, setCid] = useState<string | null>(null);
  const [deletable, setDeletable] = useState(false);
  const [onchainError, setOnchainError] = useState<string | null>(null);
  const [showOnchain, setShowOnchain] = useState(false);
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [showWalletDrawer, setShowWalletDrawer] = useState(false);

  const { goToGame } = useAppNavigation();
  const { publish, isPending, data: txHash, enabled } = usePublishGame();

  // User progression and pricing integration
  const { progress, features, messaging, recordEvent } = useUserProgression();
  const {
    canCreateFarcasterLub,
    getRomanceLubCost,
    progress: lubProgress,
  } = useLubToken();
  const { isConnected } = useAccount();

  // Use shared success actions hook
  const { getGameCreationSuccessActions } = useSuccessActions({
    onReset: () => {
      setShowSuccessCelebration(false);
      setCid(null);
      setPairs([]);
      setFarcasterUsers([]);
      setMessage(DEFAULT_MESSAGE);
      setLubMode(null);
    },
  });

  // Check if user has provided enough content based on selected mode
  const hasEnoughContent =
    lubMode === "photos"
      ? pairs.length === PAIRS_LIMIT
      : lubMode === "farcaster"
      ? farcasterUsers.length === UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS
      : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that user has provided enough content with user-friendly message
    if (!hasEnoughContent) {
      const missingAmount = lubMode === "photos"
        ? PAIRS_LIMIT - pairs.length
        : lubMode === "farcaster"
          ? UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS - farcasterUsers.length
          : 0;

      setError(lubMode
        ? `You need ${missingAmount} more ${lubMode === "photos" ? "photos" : "friends"} to continue.`
        : "Please select a lub creation mode and provide enough content.");
      return;
    }

    if (storageMode === "private" && !userApiKey.trim()) {
      setError("Please provide your Pinata API key for private mode");
      return;
    }

    setLoading(true);
    setError(null);
    setCid(null);
    setOnchainError(null);

    try {
      const formData = new FormData();
      formData.append("message", message);
      formData.append("storageMode", storageMode);
      if (storageMode === "private") {
        formData.append("userApiKey", userApiKey);
      }
      if (lubMode) {
        formData.append("lubMode", lubMode);
      }

      // Add mode-specific data
      if (lubMode === "photos") {
        pairs.forEach((file) => {
          formData.append("pairs", file);
        });
      } else if (lubMode === "farcaster") {
        formData.append("farcasterUsers", JSON.stringify(farcasterUsers));
      }

      // Debug logging
      console.log("Starting upload with formData:", {
        storageMode,
        userApiKeyProvided: !!userApiKey,
        lubMode,
        pairsCount: pairs.length,
        farcasterUsersCount: farcasterUsers.length,
        messageLength: message.length,
      });

      // Simulate upload progress
      setUploadProgress(20);

      const res = await fetch("/api/createGame", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      console.log("Upload response:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      if (!res.ok) {
        let errorMessage = "Failed to create game";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      setUploadProgress(100);

      if (!result.cid) {
        throw new Error("No game ID returned from server");
      }

      setCid(result.cid);
      setDeletable(result.deletable || false);
      setShowOnchain(true);
      const url = `${window.location.origin}/game/${result.cid}?created=1`;

      // Record lub creation in user progression
      recordEvent({
        type: "lub_created",
        timestamp: new Date().toISOString(),
        data: {
          mode: lubMode === "photos" ? "romance" : "farcaster",
          cid: result.cid,
          storageMode,
          messageLength: message.length,
        },
      });

      // Try to copy to clipboard, but don't fail if it doesn't work
      try {
        await navigator.clipboard.writeText(url);
        console.log("✅ Link copied to clipboard");
      } catch (clipboardError) {
        console.log(
          "⚠️ Could not copy to clipboard (document not focused):",
          clipboardError
        );
        // Fallback: we'll show the link in the UI instead
      }

      // Show success celebration instead of immediate redirect
      setShowSuccessCelebration(true);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      let errorMessage = "Could not create game.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (cid) {
      // Add a delightful transition before redirecting
      setLoading(true);
      setUploadProgress(0);

      // Animate progress to build anticipation
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            // Redirect after a brief moment to show completion
            setTimeout(() => {
              goToGame(cid, true);
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleMint = async () => {
    setOnchainError(null);
    try {
      if (!cid) throw new Error("No CID available");
      const hash = await publish(cid, message);
      if (hash) {
        window.open(`https://basescan.org/tx/${hash}`, "_blank");

        // Add delightful transition for mint success too
        setLoading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setTimeout(() => {
                goToGame(cid, true);
              }, 500);
              return 100;
            }
            return prev + 15;
          });
        }, 80);
      }
    } catch (err: unknown) {
      setOnchainError(
        err instanceof Error ? err.message : "Error publishing on-chain"
      );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col py-4 px-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Success Celebration Screen */}
        {showSuccessCelebration && cid ? (
          <div className="p-8">
            <SuccessScreen
              title="Your Heart Game is Ready!"
              message="Share link copied to clipboard! Your lub is ready to be sent."
              actions={getGameCreationSuccessActions(cid)}
              layout="single-column"
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white text-center">
              <h1 className="text-xl font-bold mb-2">Send Your Lub 💝</h1>
              <p className="text-pink-100 text-sm">
                Create a delightful lub for your special someone!
              </p>
            </div>

            <div className="p-6">
              {/* Forever Storage Notice */}
              <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💕</span>
                  <h3 className="font-semibold text-pink-800">
                    Forever Love, Forever Stored
                  </h3>
                </div>
                <p className="text-sm text-pink-700">
                  Your photos will be stored permanently on IPFS - just like
                  your love! Perfect for sharing on Farcaster.
                </p>
              </div>

              {/* Advanced Mode Toggle */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-800 flex items-center justify-between p-2"
                >
                  <span>🔧 Advanced: Use your own storage</span>
                  <span
                    className={`transform transition-transform ${
                      showAdvanced ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="mb-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="storageMode"
                          value="private"
                          checked={storageMode === "private"}
                          onChange={(e) =>
                            setStorageMode(e.target.value as StorageMode)
                          }
                        />
                        <span className="text-sm font-medium text-blue-800">
                          Use my own Pinata account
                        </span>
                      </label>
                      <p className="text-xs text-blue-600 ml-6">
                        You can delete content anytime
                      </p>
                    </div>

                    {storageMode === "private" && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-800">
                          Your Pinata JWT Token
                        </label>
                        <input
                          type="password"
                          value={userApiKey}
                          onChange={(e) => setUserApiKey(e.target.value)}
                          placeholder="Paste your JWT here..."
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                        <p className="mt-1 text-xs text-blue-600">
                          Get your JWT from{" "}
                          <a
                            href="https://app.pinata.cloud/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Pinata Dashboard
                          </a>
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setStorageMode("quick");
                        setShowAdvanced(false);
                      }}
                      className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                    >
                      &larr; Back to simple mode
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <LubCreationModeSelector
                  selectedMode={lubMode}
                  onModeSelect={setLubMode}
                  disabled={loading || !!cid}
                />

                {/* Minimal Pricing Display - only show when relevant */}
                {lubMode &&
                  features.pricingDisplay &&
                  WEB3_CONFIG.features.tokenEconomics && (
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {lubMode === "farcaster"
                            ? "🎮 Farcaster Lub"
                            : "💝 Romance Lub"}
                        </span>
                        {progress.totalLubsCreated === 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            First one FREE! 🎉
                          </span>
                        )}
                      </div>

                      {progress.totalLubsCreated > 0 && (
                        <div className="text-sm text-gray-600">
                          {lubMode === "farcaster" ? (
                            <span>
                              Hold 50 LUB to create • Tokens stay in your wallet
                            </span>
                          ) : (
                            <span>
                              Costs LUB tokens • Supports the ecosystem
                            </span>
                          )}
                        </div>
                      )}

                      {!isConnected && progress.totalLubsCreated > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <ConnectButton.Custom>
                            {({ openConnectModal }) => (
                              <button
                                type="button"
                                onClick={openConnectModal}
                                className="text-xs bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors"
                              >
                                Connect Wallet
                              </button>
                            )}
                          </ConnectButton.Custom>
                          <span className="text-xs text-gray-500">
                            to see pricing
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {lubMode === "photos" && (
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">
                      📸 Upload Your Photos{" "}
                      {pairs.length === PAIRS_LIMIT
                        ? "✅"
                        : `(${pairs.length}/${PAIRS_LIMIT})`}
                    </h3>
                    <EnhancedDropzone
                      files={pairs}
                      setFiles={setPairs}
                      maxFiles={PAIRS_LIMIT}
                      accept={{ "image/*": [] }}
                      disabled={loading || !!cid}
                      label="💕 Upload Your Love Story"
                      hint="Tap or drag your favorite photos"
                      celebration={true}
                    />
                    <div className="space-y-1 mt-2">
                      {/* Inline validation feedback */}
                      {pairs.length < PAIRS_LIMIT && (
                        <p className="text-xs text-orange-600 font-medium">
                          📝 {PAIRS_LIMIT - pairs.length} more photos needed to continue
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        💡 Tip: Use photos of you two together for the best
                        experience!
                      </p>
                      <p className="text-xs text-blue-600">
                        🔄 Large images are automatically compressed to ensure
                        fast uploads
                      </p>
                    </div>
                  </div>
                )}

                {lubMode === "farcaster" && (
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-800">
                      ✨ Add Farcaster Friends{" "}
                      {farcasterUsers.length ===
                      UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS
                        ? "✅"
                        : `(${farcasterUsers.length}/8)`}
                    </h3>
                    <FarcasterUsernameInput
                      onUsersSelected={setFarcasterUsers}
                      maxUsers={UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS}
                      disabled={loading || !!cid}
                    />
                    <div className="space-y-1 mt-2">
                      {/* Inline validation feedback */}
                      {farcasterUsers.length < UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS && (
                        <p className="text-xs text-orange-600 font-medium">
                          📝 {UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS - farcasterUsers.length} more friends needed to continue
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        💕 Their profile pictures will create a beautiful collage
                        during the proposal.
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom Message */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800">
                    💌 Your Message
                  </h3>
                  <textarea
                    className="w-full rounded-xl border border-gray-300 p-4 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading || !!cid}
                    maxLength={200}
                    placeholder="Write your heartfelt message..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      This appears during the proposal
                    </p>
                    <span className="text-xs text-gray-400">
                      {message.length}/200
                    </span>
                  </div>
                </div>

                {/* Upload Progress */}
                {loading && (
                  <div className="space-y-4">
                    <LoadingState
                      type="game"
                      message={
                        cid ? "Preparing your game..." : "Creating your game..."
                      }
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-purple-600">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      {cid && (
                        <p className="text-xs text-gray-600 text-center">
                          &#9733; Almost ready! Taking you to your Lub Match...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Validation error handling with appropriate messaging */}
                {error && (
                  <>
                    {error.includes("enough content") ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <div className="text-2xl mb-2">⚠️</div>
                        <p className="text-sm text-yellow-800">{error}</p>
                        <p className="text-xs text-yellow-600 mt-1">
                          {lubMode === "photos"
                            ? `Add ${PAIRS_LIMIT - pairs.length} more photos to continue`
                            : lubMode === "farcaster"
                            ? `Add ${UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS - farcasterUsers.length} more friends to continue`
                            : "Please select a creation mode first"}
                        </p>
                      </div>
                    ) : (
                      <NetworkError
                        message={error}
                        onRetry={() => setError(null)}
                      />
                    )}
                  </>
                )}

                <button
                  type="submit"
                  className={`w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r ${
                    !hasEnoughContent
                      ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                      : 'from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
                  } shadow-lg transition-all duration-300 ${
                    !hasEnoughContent ? 'cursor-not-allowed' : 'transform hover:scale-[1.02]'
                  } ${loading ? "cursor-wait" : ""}`}
                  disabled={!lubMode || !hasEnoughContent || loading || !!cid}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {cid ? "Preparing your lub..." : "Creating lub..."}
                    </div>
                  ) : !hasEnoughContent ? (
                    `💝 ${lubMode === "photos"
                      ? `Add ${PAIRS_LIMIT - pairs.length} more photos`
                      : lubMode === "farcaster"
                      ? `Add ${UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS - farcasterUsers.length} more friends`
                      : "Select a mode to send lub"}`
                  ) : lubMode === "photos" ? (
                    `💝 Send Lub (${pairs.length}/${PAIRS_LIMIT} photos)`
                  ) : lubMode === "farcaster" ? (
                    `💝 Send Lub (${farcasterUsers.length}/${UPLOAD_LIMITS.GAME.MAX_FARCASTER_USERS} friends)`
                  ) : (
                    `💝 Select a mode to send lub`
                  )}
                </button>
              </form>

              {cid && showOnchain && (
                <div className="mt-8 p-6 rounded-xl bg-pink-50 border border-pink-200 shadow">
                  <div className="mb-2 text-lg font-semibold flex items-center gap-2">
                    🎉 Game created!
                  </div>

                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      Share your game:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`${
                          typeof window !== "undefined"
                            ? window.location.origin
                            : ""
                        }/game/${cid}?created=1`}
                        readOnly
                        className="flex-1 px-2 py-1 text-xs bg-white border rounded text-blue-700 font-mono"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/game/${cid}?created=1`;
                          try {
                            await navigator.clipboard.writeText(url);
                            alert("Link copied!");
                          } catch (error) {
                            console.log("Could not copy to clipboard:", error);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {deletable && (
                    <div className="mb-3 p-2 bg-green-100 rounded text-green-800 text-sm">
                      ✅ Private mode: You can delete this content anytime from
                      your Pinata dashboard
                    </div>
                  )}

                  {!deletable && (
                    <div className="mb-3 p-2 bg-yellow-100 rounded text-yellow-800 text-sm">
                      ⚠️ Quick mode: Content is permanently stored on IPFS
                    </div>
                  )}

                  {enabled && (
                    <div className="mb-4">
                      Want to mint an on-chain proof?{" "}
                      <span className="text-gray-500">(gas ≈ $0.05)</span>
                    </div>
                  )}
                  {enabled && (
                    <>
                      {!isConnected && (
                        <div className="mb-3">
                          <ConnectButton />
                        </div>
                      )}
                      {onchainError && (
                        <div className="text-red-600 font-medium mb-2">
                          {onchainError}
                        </div>
                      )}
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={handleMint}
                          className={`px-5 py-2 rounded-lg font-semibold bg-pink-500 text-white shadow hover:bg-pink-600 transition disabled:opacity-60 ${
                            isPending ? "cursor-wait" : ""
                          }`}
                          disabled={isPending || !isConnected}
                        >
                          {isPending ? "Minting…" : "Mint Proof"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSkip}
                          className="px-5 py-2 rounded-lg font-semibold bg-gray-300 text-gray-800 hover:bg-gray-400 shadow transition"
                        >
                          Skip
                        </button>
                      </div>
                    </>
                  )}

                  {!enabled && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="w-full px-5 py-2 rounded-lg font-semibold bg-pink-500 text-white shadow hover:bg-pink-600 transition"
                    >
                      Continue to Game
                    </button>
                  )}
                  {txHash && (
                    <div className="mt-3 text-sm">
                      <a
                        href={`https://basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 underline"
                      >
                        View transaction
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 mb-3">
                  {storageMode === "quick"
                    ? "🌍 Files stored forever on IPFS - perfect for sharing!"
                    : "🔒 Private mode: You control your content"}
                </p>
                <div className="mt-4 text-center">
                  <Link
                    href="/"
                    className="text-pink-500 hover:text-pink-600 text-sm font-medium"
                  >
                    &larr; Try the demo game first
                  </Link>
                </div>

                {/* Debug information for troubleshooting */}
                <DebugInfo />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button - always visible except during success celebration */}
      {!showSuccessCelebration && (
        <FloatingActionButton onClick={() => setShowWalletDrawer(true)} />
      )}

      {/* Wallet Drawer */}
      <WalletDrawer 
        isOpen={showWalletDrawer} 
        onClose={() => setShowWalletDrawer(false)} 
      />
    </main>
  );
}

const CreateGamePage = dynamic(
  () =>
    Promise.resolve(() => (
      <Web3Provider>
        <CreateGameContent />
      </Web3Provider>
    )),
  {
    ssr: false,
  }
);

export default CreateGamePage;

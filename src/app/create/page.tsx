"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Dropzone, { FileRejection } from "react-dropzone";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { usePublishGame } from "@/hooks/usePublishGame";
import { useMiniAppReady } from "@/hooks/useMiniAppReady";
import Web3Provider from "@/components/Web3Provider";
import Image from "next/image";

const PAIRS_LIMIT = 8;
const REVEAL_LIMIT = 36;
const DEFAULT_MESSAGE = "Will you be my Valentine? 💕";

type StorageMode = "quick" | "private";

function DropzoneField({
  label,
  files,
  setFiles,
  maxFiles,
  accept,
  disabled,
}: {
  label: string;
  files: File[];
  setFiles: (f: File[]) => void;
  maxFiles: number;
  accept?: { [key: string]: string[] };
  disabled?: boolean;
}) {
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (accepted.length + files.length > maxFiles) return;
      setFiles([...files, ...accepted.slice(0, maxFiles - files.length)]);
    },
    [files, setFiles, maxFiles],
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
        disabled={disabled}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-pink-500 bg-pink-50 scale-[1.02]"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="text-2xl">📱</div>
              <p className="text-sm font-medium text-gray-700">
                {files.length === 0
                  ? "Tap to select photos"
                  : `${files.length}/${maxFiles} photos selected`}
              </p>
              <p className="text-xs text-gray-500">
                {isDragActive ? "Drop your photos here" : "or drag and drop"}
              </p>
            </div>
          </div>
        )}
      </Dropzone>
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateGameContent() {
  useMiniAppReady();
  const [pairs, setPairs] = useState<File[]>([]);
  const [reveal, setReveal] = useState<File[]>([]);
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

  const router = useRouter();
  const {
    publish,
    isPending,
    data: txHash,
    error: publishErr,
    enabled,
  } = usePublishGame();
  const { isConnected } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pairs.length !== PAIRS_LIMIT) return;
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
      pairs.forEach((f) => formData.append("pairs", f, f.name));
      reveal.forEach((f) => formData.append("reveal", f, f.name));

      const res = await fetch("/api/createGame", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      const { cid, deletable: isDeletable } = await res.json();
      setCid(cid);
      setDeletable(isDeletable);
      setShowOnchain(true);
      const url = `${window.location.origin}/game/${cid}?created=1`;
      await navigator.clipboard.writeText(url);
      // Do not redirect yet
    } catch (err: any) {
      setError(err.message ?? "Could not create game.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (cid) {
      router.push(`/game/${cid}?created=1`);
    }
  };

  const handleMint = async () => {
    setOnchainError(null);
    try {
      if (!cid) throw new Error("No CID available");
      const hash = await publish(cid, message);
      if (hash) {
        window.open(`https://basescan.org/tx/${hash}`, "_blank");
        router.push(`/game/${cid}?created=1`);
      }
    } catch (err: any) {
      setOnchainError(err?.message ?? "Error publishing on-chain");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col py-4 px-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white text-center">
          <h1 className="text-xl font-bold mb-2">
            Create Your Valentine's Game 💝
          </h1>
          <p className="text-pink-100 text-sm">
            Upload photos to create a heart-shaped memory game
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
              Your photos will be stored permanently on IPFS - just like your
              love! Perfect for sharing on Farcaster.
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
                className={`transform transition-transform ${showAdvanced ? "rotate-180" : ""}`}
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
                  ← Back to simple mode
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">
                📸 Upload Your Photos
              </h3>
              <DropzoneField
                label={`Add ${PAIRS_LIMIT} photos for the memory game`}
                files={pairs}
                setFiles={setPairs}
                maxFiles={PAIRS_LIMIT}
                accept={{ "image/*": [] }}
                disabled={loading || !!cid}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Use photos of you two together for the best experience!
              </p>
            </div>

            {/* Optional Reveal Photos */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">
                ✨ Bonus Photos (Optional)
              </h3>
              <DropzoneField
                label={`Add up to ${REVEAL_LIMIT} photos for the proposal reveal`}
                files={reveal}
                setFiles={setReveal}
                maxFiles={REVEAL_LIMIT}
                accept={{ "image/*": [] }}
                disabled={loading || !!cid}
              />
              <p className="text-xs text-gray-500 mt-2">
                💕 These photos will create a beautiful collage during the
                proposal
              </p>
            </div>

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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Creating your game...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 disabled:transform-none ${
                loading ? "cursor-wait" : ""
              }`}
              disabled={pairs.length !== PAIRS_LIMIT || loading || !!cid}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating game...
                </div>
              ) : (
                `💝 Create Game (${pairs.length}/${PAIRS_LIMIT} photos)`
              )}
            </button>
          </form>

          {cid && showOnchain && (
            <div className="mt-8 p-6 rounded-xl bg-pink-50 border border-pink-200 shadow">
              <div className="mb-2 text-lg font-semibold flex items-center gap-2">
                🎉 Game created!{" "}
                <span className="text-pink-600">Link copied to clipboard.</span>
              </div>

              {deletable && (
                <div className="mb-3 p-2 bg-green-100 rounded text-green-800 text-sm">
                  ✅ Private mode: You can delete this content anytime from your
                  Pinata dashboard
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
            <a
              href="/"
              className="text-pink-500 hover:text-pink-600 text-sm font-medium"
            >
              ← Try the demo game first
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CreateGamePage() {
  return (
    <Web3Provider>
      <CreateGameContent />
    </Web3Provider>
  );
}

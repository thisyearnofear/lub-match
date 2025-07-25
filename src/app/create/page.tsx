"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Dropzone, { FileRejection } from "react-dropzone";
import { nanoid } from "nanoid";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { usePublishGame } from "@/hooks/usePublishGame";

const PAIRS_LIMIT = 8;
const REVEAL_LIMIT = 36;
const DEFAULT_MESSAGE = "Will you be my Valentine?";

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
    [files, setFiles, maxFiles]
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
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-pink-500 bg-pink-50"
                : "border-gray-300 bg-white"
            }`}
          >
            <input {...getInputProps()} />
            <p>
              {label} ({files.length}/{maxFiles})
            </p>
          </div>
        )}
      </Dropzone>
      {files.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3">
          {files.map((f, idx) => (
            <div key={idx} className="relative">
              <img
                src={URL.createObjectURL(f)}
                alt="preview"
                className="h-20 w-20 object-cover rounded shadow"
              />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 bg-gray-700 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useMiniAppReady } from "@/hooks/useMiniAppReady";

export default function CreateGamePage() {
  useMiniAppReady();
  const [pairs, setPairs] = useState<File[]>([]);
  const [reveal, setReveal] = useState<File[]>([]);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cid, setCid] = useState<string | null>(null);
  const [onchainError, setOnchainError] = useState<string | null>(null);
  const [showOnchain, setShowOnchain] = useState(false);

  const router = useRouter();
  const { publish, isPending, data: txHash, error: publishErr, enabled } = usePublishGame();
  const { isConnected } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pairs.length !== PAIRS_LIMIT) return;
    setLoading(true);
    setError(null);
    setCid(null);
    setOnchainError(null);

    try {
      const formData = new FormData();
      formData.append("message", message);
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
      const { cid } = await res.json();
      setCid(cid);
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
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col items-center py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Create your Valentine Memory Game
        </h1>
        <form onSubmit={handleSubmit}>
          <DropzoneField
            label="Upload 8 card-pair images"
            files={pairs}
            setFiles={setPairs}
            maxFiles={PAIRS_LIMIT}
            accept={{ "image/*": [] }}
            disabled={loading || !!cid}
          />
          <DropzoneField
            label="Optional: 36 reveal images (shown at proposal)"
            files={reveal}
            setFiles={setReveal}
            maxFiles={REVEAL_LIMIT}
            accept={{ "image/*": [] }}
            disabled={loading || !!cid}
          />
          <div className="mb-6">
            <label className="block mb-1 font-medium">
              Custom message (shows at proposal)
            </label>
            <textarea
              className="w-full rounded border border-gray-300 p-2 min-h-[48px] focus:outline-pink-400"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading || !!cid}
              maxLength={200}
            />
          </div>
          {error && (
            <div className="text-red-600 font-medium mb-4">{error}</div>
          )}
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg hover:from-pink-600 hover:to-rose-600 transition-colors disabled:opacity-60 ${
              loading ? "cursor-wait" : ""
            }`}
            disabled={pairs.length !== PAIRS_LIMIT || loading || !!cid}
          >
            {loading ? "Creating game..." : "Create Game"}
          </button>
        </form>
        {cid && enabled && showOnchain && (
          <div className="mt-8 p-6 rounded-xl bg-pink-50 border border-pink-200 shadow">
            <div className="mb-2 text-lg font-semibold flex items-center gap-2">
              🎉 Game created! <span className="text-pink-600">Cast link copied.</span>
            </div>
            <div className="mb-4">
              Want to mint an on-chain proof? <span className="text-gray-500">(gas ≈ $0.05)</span>
            </div>
            {!isConnected && (
              <div className="mb-3">
                <ConnectButton />
              </div>
            )}
            {onchainError && (
              <div className="text-red-600 font-medium mb-2">{onchainError}</div>
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
        <p className="mt-6 text-sm text-gray-600 text-center">
          You’ll get a shareable link to send to your Valentine. All files are pinned on decentralized storage.
        </p>
      </div>
    </main>
  );
}
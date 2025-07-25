import { notFound } from "next/navigation";
import PhotoPairGame from "@/components/PhotoPairGame";
import ValentinesProposal from "@/components/ValentinesProposal";
import { gatewayUrl } from "@/utils/ipfs";
import { Suspense } from "react";

async function fetchMetadata(cid: string) {
  const url = `https://w3s.link/ipfs/${cid}/metadata.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function PlayGamePage({
  params,
  searchParams,
}: {
  params: { cid: string };
  searchParams: { created?: string };
}) {
  const { cid } = params;
  const metadata = await fetchMetadata(cid);
  if (!metadata || !metadata.pairs || !Array.isArray(metadata.pairs)) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-pink-50">
        <div className="bg-white rounded-xl shadow-xl px-8 py-12 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Game not found</h2>
          <p className="mb-2">Sorry, we couldn’t load this memory game.</p>
          <a
            href="/create"
            className="text-pink-500 underline font-medium"
          >
            Create your own
          </a>
        </div>
      </main>
    );
  }

  const pairUrls: string[] = metadata.pairs.map((name: string) =>
    gatewayUrl(cid, name)
  );
  const revealUrls: string[] = (metadata.reveal?.length
    ? metadata.reveal
    : metadata.pairs
  ).map((name: string) => gatewayUrl(cid, name));

  return (
    <main className="flex items-center justify-center min-h-screen bg-black relative px-10">
      <Suspense fallback={<div className="text-white text-lg">Loading game…</div>}>
        <GameContent
          pairUrls={pairUrls}
          revealUrls={revealUrls}
          message={metadata.message}
          justCreated={!!searchParams.created}
        />
      </Suspense>
    </main>
  );
}

"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

function GameContent({
  pairUrls,
  revealUrls,
  message,
  justCreated,
}: {
  pairUrls: string[];
  revealUrls: string[];
  message: string;
  justCreated: boolean;
}) {
  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (justCreated && typeof window !== "undefined") {
      // Toast: link copied
      window.alert("Game created – link copied to clipboard!");
    }
  }, [justCreated]);

  const handleShowProposal = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowValentinesProposal(true);
    }, 2000);
  };

  return (
    <>
      {!showValentinesProposal ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isTransitioning ? 0 : 1 }}
          transition={{ duration: 2 }}
        >
          <PhotoPairGame images={pairUrls} handleShowProposal={handleShowProposal} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <ValentinesProposal revealImages={revealUrls} message={message} />
        </motion.div>
      )}
    </>
  );
}
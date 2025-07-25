"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import TextFooter from "@/components/TextFooter";
import PhotoPairGame from "@/components/PhotoPairGame";
import ValentinesProposal from "@/components/ValentinesProposal";
import {
  defaultPairs,
  defaultRevealImages,
  defaultMessage,
} from "@/data/defaultGame";

const ANIM_DURATION = 2;

export default function Home() {
  const [showValentinesProposal, setShowValentinesProposal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleShowProposal = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowValentinesProposal(true);
    }, ANIM_DURATION * 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black relative px-10">
      {!showValentinesProposal ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isTransitioning ? 0 : 1 }}
          transition={{ duration: ANIM_DURATION }}
        >
          <PhotoPairGame images={defaultPairs} handleShowProposal={handleShowProposal} />
          <TextFooter />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: ANIM_DURATION }}
        >
          <ValentinesProposal revealImages={defaultRevealImages} message={defaultMessage} />
        </motion.div>
      )}
    </div>
  );
}

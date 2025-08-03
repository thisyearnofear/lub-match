"use client";

import { useState } from "react";
import { useLubToken } from "@/hooks/useLubToken";
import WalletModal from "./WalletModal";
import OnboardingTooltip from "./shared/OnboardingTooltip";

export default function LubBalanceWidget() {
  const { balanceFormatted, enabled } = useLubToken();
  const [showModal, setShowModal] = useState(false);

  if (!enabled) return null;

  return (
    <>
      <OnboardingTooltip
        message={
          "💎 LUB is your in-game social token! Earn it by playing, sharing, and inviting friends. Spend it for creative unlocks and NFT discounts!"
        }
        placement="left"
        localStorageKey="lub_balance_tooltip_seen"
      >
        <button
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
          onClick={() => setShowModal(true)}
          aria-label="View LUB Wallet"
        >
          <span className="text-lg">💎</span>
          <span className="font-bold">{balanceFormatted} LUB</span>
        </button>
      </OnboardingTooltip>
      {showModal && <WalletModal onClose={() => setShowModal(false)} />}
    </>
  );
}

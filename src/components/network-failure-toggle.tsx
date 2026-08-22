"use client";

import { useState } from "react";
import { getNetworkFailureRate, setNetworkFailureRateOverride } from "@/lib/api/network-simulator";

const DEV_TOGGLE_RATE = 0.3;

export function NetworkFailureToggle() {
  const [active, setActive] = useState(() => getNetworkFailureRate() > 0);

  function handleToggle() {
    const next = !active;
    setNetworkFailureRateOverride(next ? DEV_TOGGLE_RATE : 0);
    setActive(next);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title="Simuler des pannes réseau (mode dev)"
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
        active
          ? "border-status-alert bg-status-alert/10 text-status-alert-text"
          : "border-border text-text-muted hover:text-text"
      }`}
    >
      Panne réseau {active ? "ON" : "OFF"}
    </button>
  );
}

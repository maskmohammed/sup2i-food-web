function parseEnvFailureRate(): number {
  const raw = Number(process.env.NEXT_PUBLIC_SIMULATE_NETWORK_FAILURE_RATE ?? "0");
  if (!Number.isFinite(raw)) return 0;
  return Math.min(Math.max(raw, 0), 1);
}

const ENV_FAILURE_RATE = parseEnvFailureRate();

// Override runtime (toggle dev) — ne persiste pas entre reloads,
// volontairement simple ("à la volée" pendant la session en cours).
let overrideFailureRate: number | null = null;

export function getNetworkFailureRate(): number {
  return overrideFailureRate ?? ENV_FAILURE_RATE;
}

export function setNetworkFailureRateOverride(rate: number | null): void {
  overrideFailureRate = rate;
}

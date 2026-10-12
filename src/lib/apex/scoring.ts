import { WEIGHT_KEYS, type Weights, type WeightKey } from "./types";

export function weightsTotal(w: Weights): number {
  return WEIGHT_KEYS.reduce((s, k) => s + (w[k] ?? 0), 0);
}

export function isValidWeights(w: Weights): boolean {
  return weightsTotal(w) === 100 && WEIGHT_KEYS.every((k) => w[k] >= 0);
}

/** criteria: 0-10 per key. Returns 0-100 score and per-key contribution. */
export function scoreOpportunity(criteria: Record<WeightKey, number>, w: Weights) {
  if (!isValidWeights(w)) throw new Error("WEIGHTS_INVALID");
  const breakdown = WEIGHT_KEYS.map((k) => {
    const v = Math.max(0, Math.min(10, criteria[k] ?? 0));
    return { key: k, value: v, weight: w[k], points: (v / 10) * w[k] };
  });
  const total = Math.round(breakdown.reduce((s, b) => s + b.points, 0));
  return { total, breakdown };
}

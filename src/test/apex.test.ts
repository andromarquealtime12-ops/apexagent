import { describe, expect, it } from "vitest";
import { scoreOpportunity, weightsTotal, isValidWeights } from "@/lib/apex/scoring";
import { canonicalKey, dedupe } from "@/lib/apex/dedupe";
import { canTransition, nextStatus } from "@/lib/apex/transitions";
import { DEFAULT_WEIGHTS, WEIGHT_KEYS } from "@/lib/apex/types";
import { frameDiff } from "@/hooks/use-motion-monitor";
import { DEFAULT_PREFS } from "@/lib/apex/store";

const full = Object.fromEntries(WEIGHT_KEYS.map((k) => [k, 10])) as Record<(typeof WEIGHT_KEYS)[number], number>;

describe("scoring", () => {
  it("default weights sum to 100", () => expect(weightsTotal(DEFAULT_WEIGHTS)).toBe(100));
  it("max criteria → 100", () => expect(scoreOpportunity(full, DEFAULT_WEIGHTS).total).toBe(100));
  it("rejects weights not totaling 100", () => {
    const bad = { ...DEFAULT_WEIGHTS, owner_fit: 30 };
    expect(isValidWeights(bad)).toBe(false);
    expect(() => scoreOpportunity(full, bad)).toThrow("WEIGHTS_INVALID");
  });
});

describe("dedupe", () => {
  it("merges same title/domain ignoring accents and www", () => {
    const a = { title: "Rédaction Fiches!", url: "https://www.ex.com/a" };
    const b = { title: "redaction fiches", url: "https://ex.com/b" };
    expect(canonicalKey(a)).toBe(canonicalKey(b));
    expect(dedupe([a, b])).toHaveLength(1);
  });
  it("keeps distinct stable ids", () => {
    expect(dedupe([{ title: "x", url: "https://e.com", stable_id: "1" }, { title: "x", url: "https://e.com", stable_id: "2" }])).toHaveLength(2);
  });
});

describe("transitions", () => {
  it("allows valid flows", () => {
    expect(nextStatus("draft", "launch")).toBe("queued");
    expect(nextStatus("paused", "resume")).toBe("running");
    expect(nextStatus("failed", "retry")).toBe("queued");
  });
  it("blocks invalid flows", () => {
    expect(canTransition("completed", "pause")).toBe(false);
    expect(() => nextStatus("completed", "launch")).toThrow();
  });
});

describe("home", () => {
  it("capture disabled by default", () => expect(DEFAULT_PREFS.capture_consent).toBe(false));
  it("detects simulated motion", () => {
    const a = new Uint8ClampedArray(400).fill(0);
    const b = new Uint8ClampedArray(400).fill(200);
    expect(frameDiff(a, a)).toBe(0);
    expect(frameDiff(a, b)).toBe(1);
  });
});

import type { MissionStatus } from "./types";

export type MissionAction = "launch" | "pause" | "resume" | "cancel" | "retry" | "complete" | "fail";

const TABLE: Record<MissionAction, { from: MissionStatus[]; to: MissionStatus }> = {
  launch: { from: ["draft"], to: "queued" },
  pause: { from: ["queued", "running"], to: "paused" },
  resume: { from: ["paused"], to: "running" },
  cancel: { from: ["draft", "queued", "running", "paused"], to: "cancelled" },
  retry: { from: ["failed", "cancelled"], to: "queued" },
  complete: { from: ["running"], to: "completed" },
  fail: { from: ["queued", "running"], to: "failed" },
};

export function canTransition(from: MissionStatus, action: MissionAction): boolean {
  return TABLE[action].from.includes(from);
}

export function nextStatus(from: MissionStatus, action: MissionAction): MissionStatus {
  if (!canTransition(from, action)) throw new Error(`INVALID_TRANSITION:${from}->${action}`);
  return TABLE[action].to;
}

export function availableActions(from: MissionStatus): MissionAction[] {
  return (["launch", "pause", "resume", "cancel", "retry"] as MissionAction[]).filter((a) => canTransition(from, a));
}

export const ACTION_LABELS: Record<MissionAction, string> = {
  launch: "Lancer",
  pause: "Suspendre",
  resume: "Reprendre",
  cancel: "Annuler",
  retry: "Relancer",
  complete: "Terminer",
  fail: "Échec",
};

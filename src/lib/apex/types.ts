import { z } from "zod";

export const MISSION_STATUSES = ["draft", "queued", "running", "paused", "completed", "failed", "cancelled"] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

export const APPROVAL_STATUSES = ["pending", "approved", "rejected", "expired", "cancelled"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const WEIGHT_KEYS = [
  "owner_fit",
  "verifiable_demand",
  "startup_cost",
  "validation_speed",
  "margin",
  "regulatory_safety",
  "differentiation",
  "recurrence",
] as const;
export type WeightKey = (typeof WEIGHT_KEYS)[number];
export type Weights = Record<WeightKey, number>;

export const WEIGHT_LABELS: Record<WeightKey, string> = {
  owner_fit: "Adéquation propriétaire",
  verifiable_demand: "Demande vérifiable",
  startup_cost: "Coût de démarrage",
  validation_speed: "Rapidité de validation",
  margin: "Marge potentielle",
  regulatory_safety: "Sécurité réglementaire",
  differentiation: "Différenciation",
  recurrence: "Potentiel de récurrence",
};

export const DEFAULT_WEIGHTS: Weights = {
  owner_fit: 20,
  verifiable_demand: 15,
  startup_cost: 15,
  validation_speed: 10,
  margin: 15,
  regulatory_safety: 10,
  differentiation: 10,
  recurrence: 5,
};

const weightsSchema = z
  .object(Object.fromEntries(WEIGHT_KEYS.map((k) => [k, z.number().int().min(0).max(100)])) as Record<WeightKey, z.ZodNumber>)
  .refine((w) => Object.values(w).reduce((a, b) => a + b, 0) === 100, { message: "Les pondérations doivent totaliser 100." });

export const missionInputSchema = z
  .object({
    title: z.string().trim().min(3, "3 caractères minimum").max(120),
    theme: z.string().trim().min(2, "Thème requis").max(80),
    region: z.string().trim().min(2, "Zone requise").max(80),
    budget_min: z.number().min(0),
    budget_max: z.number().min(0),
    currency: z.enum(["EUR", "USD", "CAD", "CHF", "GBP"]),
    skills: z.array(z.string().trim().min(1)).max(20),
    horizon: z.enum(["1 mois", "3 mois", "6 mois", "12 mois"]),
    success_criteria: z.string().trim().max(1000),
    weights: weightsSchema,
  })
  .refine((m) => m.budget_max >= m.budget_min, { message: "Le budget maximum doit être ≥ au minimum.", path: ["budget_max"] });
export type MissionInput = z.infer<typeof missionInputSchema>;

export interface Mission extends MissionInput {
  id: string;
  status: MissionStatus;
  progress: number;
  created_at: string;
  updated_at: string;
  demo?: boolean | undefined;
  history: { at: string; from: MissionStatus | null; to: MissionStatus; note?: string | undefined }[];
}

export interface Source {
  url: string;
  publisher: string;
  accessed_at: string;
}

export interface Opportunity {
  id: string;
  mission_id: string;
  title: string;
  summary: string;
  url: string;
  stable_id?: string | undefined;
  facts: string[];
  inferences: string[];
  hypotheses: string[];
  projections: string[];
  confidence: number; // 0-1
  risks: string[];
  missing_data: string[];
  next_experiment: string;
  sources: Source[];
  criteria: Record<WeightKey, number>; // 0-10
  demo?: boolean | undefined;
  created_at: string;
}

export interface Approval {
  id: string;
  status: ApprovalStatus;
  action: string;
  target: string;
  impact: string;
  cost?: string | undefined;
  data: string;
  evidence: string[];
  choices: string[];
  recommendation: string;
  next_step: string;
  decided_at?: string | undefined;
  decision?: string | undefined;
  expires_at: string;
  created_at: string;
  demo?: boolean | undefined;
}

export interface HomeSession {
  id: string;
  started_at: string;
  ended_at?: string | undefined;
  capture_enabled: boolean;
}

export interface HomeEvent {
  id: string;
  session_id: string;
  at: string;
  confidence: number;
  capture_path?: string | undefined;
  capture_data?: string | undefined; // local preview only until storage is connected
  demo?: boolean | undefined;
}

export interface Alert {
  id: string;
  at: string;
  kind: "home" | "business" | "approval" | "system";
  title: string;
  body: string;
  read: boolean;
  link?: string | undefined;
  demo?: boolean | undefined;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface Preferences {
  display_name: string;
  notifications_internal: boolean;
  notifications_push: boolean;
  capture_consent: boolean;
  sensitivity: number; // 1-100
  cooldown_s: number;
  retention_days: number;
}

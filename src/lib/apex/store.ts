/**
 * Local data layer used until the database is connected.
 * Every mutation here maps 1:1 to a future server function / RLS-protected table.
 */
import { useSyncExternalStore } from "react";
import type { Alert, Approval, ChatMessage, HomeEvent, HomeSession, Mission, MissionInput, Opportunity, Preferences } from "./types";
import { nextStatus, type MissionAction } from "./transitions";
import { dedupe } from "./dedupe";

export interface ApexState {
  session: { email: string } | null;
  missions: Mission[];
  opportunities: Opportunity[];
  approvals: Approval[];
  homeSessions: HomeSession[];
  homeEvents: HomeEvent[];
  alerts: Alert[];
  messages: ChatMessage[];
  prefs: Preferences;
}

const KEY = "apex-state-v1";
export const DEFAULT_PREFS: Preferences = {
  display_name: "",
  notifications_internal: true,
  notifications_push: false,
  capture_consent: false,
  sensitivity: 40,
  cooldown_s: 10,
  retention_days: 30,
};

const empty = (): ApexState => ({
  session: null,
  missions: [],
  opportunities: [],
  approvals: [],
  homeSessions: [],
  homeEvents: [],
  alerts: [],
  messages: [],
  prefs: { ...DEFAULT_PREFS },
});

let state: ApexState = empty();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...empty(), ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
}

function set(fn: (s: ApexState) => ApexState) {
  load();
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l());
}

export function getState() {
  load();
  return state;
}

const serverSnap = empty();
export function useApex<T>(sel: (s: ApexState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => sel(getState()),
    () => sel(serverSnap),
  );
}

export const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export const actions = {
  signIn(email: string) {
    set((s) => ({ ...s, session: { email } }));
  },
  signOut() {
    set((s) => ({ ...s, session: null }));
  },
  createMission(input: MissionInput): Mission {
    const m: Mission = { ...input, id: uid(), status: "draft", progress: 0, created_at: now(), updated_at: now(), history: [{ at: now(), from: null, to: "draft" }] };
    set((s) => ({ ...s, missions: [m, ...s.missions] }));
    return m;
  },
  transition(id: string, action: MissionAction, note?: string) {
    set((s) => ({
      ...s,
      missions: s.missions.map((m) => {
        if (m.id !== id) return m;
        const to = nextStatus(m.status, action);
        return { ...m, status: to, progress: action === "retry" ? 0 : m.progress, updated_at: now(), history: [...m.history, { at: now(), from: m.status, to, note }] };
      }),
    }));
  },
  /** Simulated runner tick. Replaced by realtime updates from the mission runner. */
  tick() {
    const s = getState();
    if (!s.missions.some((m) => m.status === "queued" || m.status === "running")) return;
    set((st) => ({
      ...st,
      missions: st.missions.map((m) => {
        if (m.status === "queued") return { ...m, status: "running", updated_at: now(), history: [...m.history, { at: now(), from: "queued", to: "running" }] };
        if (m.status !== "running") return m;
        const progress = Math.min(100, m.progress + 7);
        if (progress >= 100) return { ...m, progress, status: "completed", updated_at: now(), history: [...m.history, { at: now(), from: "running", to: "completed", note: "Aucune recherche réelle : moteur non connecté." }] };
        return { ...m, progress };
      }),
    }));
  },
  addOpportunities(list: Opportunity[]) {
    set((s) => ({ ...s, opportunities: dedupe([...s.opportunities, ...list]) }));
  },
  decideApproval(id: string, decision: "approved" | "rejected", choice?: string) {
    const a = getState().approvals.find((x) => x.id === id);
    if (!a || a.status !== "pending") throw new Error("APPROVAL_NOT_PENDING");
    if (new Date(a.expires_at) < new Date()) {
      set((s) => ({ ...s, approvals: s.approvals.map((x) => (x.id === id ? { ...x, status: "expired" } : x)) }));
      throw new Error("APPROVAL_EXPIRED");
    }
    set((s) => ({ ...s, approvals: s.approvals.map((x) => (x.id === id ? { ...x, status: decision, decided_at: now(), decision: choice } : x)) }));
  },
  startHomeSession(capture_enabled: boolean): HomeSession {
    const h: HomeSession = { id: uid(), started_at: now(), capture_enabled };
    set((s) => ({ ...s, homeSessions: [h, ...s.homeSessions] }));
    return h;
  },
  endHomeSession(id: string) {
    set((s) => ({ ...s, homeSessions: s.homeSessions.map((h) => (h.id === id && !h.ended_at ? { ...h, ended_at: now() } : h)) }));
  },
  addHomeEvent(session_id: string, confidence: number, capture_data?: string): HomeEvent {
    const e: HomeEvent = { id: uid(), session_id, at: now(), confidence, capture_data };
    const al: Alert = { id: uid(), at: e.at, kind: "home", title: "Mouvement détecté", body: `Confiance ${Math.round(confidence * 100)} %`, read: false, link: e.id };
    set((s) => ({ ...s, homeEvents: [e, ...s.homeEvents], alerts: [al, ...s.alerts] }));
    return e;
  },
  deleteHomeEvent(id: string) {
    // Event and capture are deleted together.
    set((s) => ({ ...s, homeEvents: s.homeEvents.filter((e) => e.id !== id), alerts: s.alerts.filter((a) => a.link !== id) }));
  },
  markAlert(id: string) {
    set((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)) }));
  },
  markAllAlerts() {
    set((s) => ({ ...s, alerts: s.alerts.map((a) => ({ ...a, read: true })) }));
  },
  addMessage(m: Omit<ChatMessage, "id" | "at">) {
    set((s) => ({ ...s, messages: [...s.messages, { ...m, id: uid(), at: now() }] }));
  },
  clearMessages() {
    set((s) => ({ ...s, messages: [] }));
  },
  setPrefs(p: Partial<Preferences>) {
    set((s) => ({ ...s, prefs: { ...s.prefs, ...p } }));
  },
  loadDemo(data: Pick<ApexState, "missions" | "opportunities" | "approvals" | "alerts" | "homeEvents">) {
    set((s) => ({
      ...s,
      missions: [...data.missions, ...s.missions.filter((m) => !m.demo)],
      opportunities: [...data.opportunities, ...s.opportunities.filter((o) => !o.demo)],
      approvals: [...data.approvals, ...s.approvals.filter((a) => !a.demo)],
      alerts: [...data.alerts, ...s.alerts.filter((a) => !a.demo)],
      homeEvents: [...data.homeEvents, ...s.homeEvents.filter((e) => !e.demo)],
    }));
  },
  clearAll() {
    const session = getState().session;
    set(() => ({ ...empty(), session }));
  },
};

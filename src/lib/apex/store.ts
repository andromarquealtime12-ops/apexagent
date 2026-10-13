/**
 * APEX data layer: in-memory state synced with the database (RLS-protected, per user).
 * UI reads via useApex(selector) and writes only through `actions`.
 */
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Alert, Approval, ChatMessage, HomeEvent, HomeSession, Mission, MissionInput, Opportunity, Preferences } from "./types";
import type { MissionAction } from "./transitions";

export interface ApexState {
  session: { email: string; userId: string } | null;
  ready: boolean;
  missions: Mission[];
  opportunities: Opportunity[];
  approvals: Approval[];
  homeSessions: HomeSession[];
  homeEvents: HomeEvent[];
  alerts: Alert[];
  messages: ChatMessage[];
  prefs: Preferences;
}

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
  ready: false,
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
const listeners = new Set<() => void>();
function set(fn: (s: ApexState) => ApexState) {
  state = fn(state);
  listeners.forEach((l) => l());
}
export function getState() {
  return state;
}
const serverSnap = empty();
export function useApex<T>(sel: (s: ApexState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => sel(state),
    () => sel(serverSnap),
  );
}

export const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const ERR: Record<string, string> = {
  INVALID_TRANSITION: "Transition non autorisée.",
  APPROVAL_NOT_PENDING: "Décision déjà prise.",
  APPROVAL_EXPIRED: "Cette autorisation a expiré.",
};
function fail(e: unknown): never {
  const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Erreur";
  const key = Object.keys(ERR).find((k) => msg.includes(k));
  toast.error(key ? ERR[key] : "Synchronisation impossible. Réessayez.");
  throw new Error(key ?? "SYNC_FAILED");
}

/* ---------- row mappers ---------- */
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const toMission = (r: Row): Mission => ({ ...r, budget_min: Number(r.budget_min), budget_max: Number(r.budget_max), history: r.history ?? [] }) as Mission;
const toOpp = (r: Row): Opportunity => ({ ...r, confidence: Number(r.confidence) }) as Opportunity;
const toApproval = (r: Row): Approval => ({ ...r, cost: r.cost ?? undefined, decision: r.decision ?? undefined, decided_at: r.decided_at ?? undefined }) as Approval;
const toEvent = (r: Row): HomeEvent => ({ id: r.id, session_id: r.session_id, at: r.occurred_at, confidence: Number(r.confidence), capture_path: r.capture_path ?? undefined });
const toAlert = (r: Row): Alert => ({ id: r.id, at: r.created_at, kind: r.kind, title: r.title, body: r.body, read: r.read, link: r.link ?? undefined });
const toMsg = (r: Row): ChatMessage => ({ id: r.id, role: r.role, content: r.content, at: r.created_at });

/* ---------- sync ---------- */
export async function syncAll() {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) {
    set(() => ({ ...empty(), ready: true }));
    return;
  }
  const [m, o, a, hs, he, al, msg, p] = await Promise.all([
    supabase.from("missions").select("*").order("created_at", { ascending: false }),
    supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
    supabase.from("approvals").select("*").order("created_at", { ascending: false }),
    supabase.from("home_monitor_sessions").select("*").order("started_at", { ascending: false }).limit(50),
    supabase.from("home_events").select("*").order("occurred_at", { ascending: false }).limit(500),
    supabase.from("home_alerts").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("assistant_messages").select("*").order("created_at", { ascending: true }).limit(200),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  let prefs = DEFAULT_PREFS;
  if (p.data) {
    const { user_id: _u, created_at: _c, updated_at: _d, ...rest } = p.data as Row;
    prefs = { ...DEFAULT_PREFS, ...rest };
  } else {
    await supabase.from("user_preferences").insert({ user_id: user.id });
  }
  const keepDemo = <T extends { demo?: boolean | undefined }>(xs: T[]) => xs.filter((x) => x.demo);
  set((s) => ({
    ...s,
    ready: true,
    session: { email: user.email ?? "", userId: user.id },
    missions: [...keepDemo(s.missions), ...(m.data ?? []).map(toMission)],
    opportunities: [...keepDemo(s.opportunities), ...(o.data ?? []).map(toOpp)],
    approvals: [...keepDemo(s.approvals), ...(a.data ?? []).map(toApproval)],
    homeSessions: (hs.data ?? []).map((r) => ({ id: r.id, started_at: r.started_at, ended_at: r.ended_at ?? undefined, capture_enabled: r.capture_enabled })),
    homeEvents: [...keepDemo(s.homeEvents), ...(he.data ?? []).map(toEvent)],
    alerts: [...keepDemo(s.alerts), ...(al.data ?? []).map(toAlert)],
    messages: (msg.data ?? []).map(toMsg),
    prefs,
  }));
}

export function resetState() {
  set(() => ({ ...empty(), ready: true }));
}

/** Realtime: apply mission and alert changes pushed by the server. */
export function subscribeRealtime(userId: string) {
  const ch = supabase
    .channel(`apex-${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "missions", filter: `user_id=eq.${userId}` }, (pl) => {
      if (pl.eventType === "DELETE") return set((s) => ({ ...s, missions: s.missions.filter((x) => x.id !== (pl.old as Row).id) }));
      const m = toMission(pl.new as Row);
      set((s) => ({ ...s, missions: s.missions.some((x) => x.id === m.id) ? s.missions.map((x) => (x.id === m.id ? m : x)) : [m, ...s.missions] }));
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "home_alerts", filter: `user_id=eq.${userId}` }, (pl) => {
      const a = toAlert(pl.new as Row);
      set((s) => (s.alerts.some((x) => x.id === a.id) ? s : { ...s, alerts: [a, ...s.alerts] }));
    })
    .subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}

const sessionInserts = new Map<string, PromiseLike<unknown>>();
let prefsTimer: ReturnType<typeof setTimeout> | null = null;

export const actions = {
  async signOut() {
    await supabase.auth.signOut();
    resetState();
  },
  async createMission(input: MissionInput): Promise<Mission> {
    const { data, error } = await supabase.from("missions").insert({ ...input, history: [{ at: now(), from: null, to: "draft" }] }).select().single();
    if (error || !data) fail(error);
    const m = toMission(data);
    set((s) => ({ ...s, missions: [m, ...s.missions.filter((x) => x.id !== m.id)] }));
    return m;
  },
  async transition(id: string, action: MissionAction) {
    if (id.startsWith("demo-")) return toast("Mission de démonstration : non modifiable.");
    const { data, error } = await supabase.rpc("mission_transition", { _mission_id: id, _action: action });
    if (error || !data) fail(error);
    const m = toMission(data as Row);
    set((s) => ({ ...s, missions: s.missions.map((x) => (x.id === id ? m : x)) }));
  },
  async decideApproval(id: string, decision: "approved" | "rejected", choice?: string) {
    if (id.startsWith("demo-")) {
      set((s) => ({ ...s, approvals: s.approvals.map((x) => (x.id === id && x.status === "pending" ? { ...x, status: decision, decided_at: now() } : x)) }));
      return;
    }
    const { data, error } = await supabase.rpc("approval_decide", { _approval_id: id, _decision: decision, ...(choice ? { _choice: choice } : {}) });
    if (error || !data) {
      await syncAll();
      fail(error);
    }
    const a = toApproval(data as Row);
    set((s) => ({ ...s, approvals: s.approvals.map((x) => (x.id === id ? a : x)) }));
  },
  startHomeSession(capture_enabled: boolean): HomeSession {
    const h: HomeSession = { id: uid(), started_at: now(), capture_enabled };
    set((s) => ({ ...s, homeSessions: [h, ...s.homeSessions] }));
    sessionInserts.set(h.id, supabase.from("home_monitor_sessions").insert({ id: h.id, capture_enabled }).then(({ error }) => error && toast.error("Session non enregistrée.")));
    return h;
  },
  endHomeSession(id: string) {
    const ended_at = now();
    set((s) => ({ ...s, homeSessions: s.homeSessions.map((h) => (h.id === id && !h.ended_at ? { ...h, ended_at } : h)) }));
    Promise.resolve(sessionInserts.get(id)).then(() => supabase.from("home_monitor_sessions").update({ ended_at }).eq("id", id));
  },
  async addHomeEvent(session_id: string, confidence: number, jpegDataUrl?: string) {
    const userId = state.session?.userId;
    if (!userId) return;
    await sessionInserts.get(session_id);
    const id = uid();
    let capture_path: string | undefined;
    if (jpegDataUrl && state.prefs.capture_consent) {
      const blob = await (await fetch(jpegDataUrl)).blob();
      if (blob.size <= 500_000) {
        const path = `${userId}/${session_id}/${id}.jpg`;
        const { error } = await supabase.storage.from("home-captures").upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (!error) capture_path = path;
      }
    }
    const { data, error } = await supabase.from("home_events").insert({ id, session_id, confidence, capture_path: capture_path ?? null }).select().single();
    if (error || !data) return fail(error);
    set((s) => ({ ...s, homeEvents: [toEvent(data), ...s.homeEvents] }));
  },
  async captureUrl(path: string): Promise<string | null> {
    const { data } = await supabase.storage.from("home-captures").createSignedUrl(path, 60);
    return data?.signedUrl ?? null;
  },
  async deleteHomeEvent(id: string) {
    const e = state.homeEvents.find((x) => x.id === id);
    if (e && !e.demo) {
      if (e.capture_path) {
        const { error } = await supabase.storage.from("home-captures").remove([e.capture_path]);
        if (error) fail(error);
      }
      const { error } = await supabase.from("home_events").delete().eq("id", id);
      if (error) fail(error);
    }
    set((s) => ({ ...s, homeEvents: s.homeEvents.filter((x) => x.id !== id), alerts: s.alerts.filter((a) => a.link !== id) }));
  },
  markAlert(id: string) {
    set((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)) }));
    if (!id.startsWith("demo-")) supabase.from("home_alerts").update({ read: true }).eq("id", id).then();
  },
  markAllAlerts() {
    set((s) => ({ ...s, alerts: s.alerts.map((a) => ({ ...a, read: true })) }));
    supabase.from("home_alerts").update({ read: true }).eq("read", false).then();
  },
  async sendMessage(content: string) {
    const { data, error } = await supabase.from("assistant_messages").insert({ role: "user", content }).select().single();
    if (error || !data) fail(error);
    set((s) => ({ ...s, messages: [...s.messages, toMsg(data)] }));
  },
  addLocalAssistantNote(content: string) {
    set((s) => ({ ...s, messages: [...s.messages, { id: uid(), role: "assistant", content, at: now() }] }));
  },
  async clearMessages() {
    const userId = state.session?.userId;
    if (userId) await supabase.from("assistant_messages").delete().eq("user_id", userId);
    set((s) => ({ ...s, messages: [] }));
  },
  setPrefs(p: Partial<Preferences>) {
    set((s) => ({ ...s, prefs: { ...s.prefs, ...p } }));
    const userId = state.session?.userId;
    if (!userId) return;
    if (prefsTimer) clearTimeout(prefsTimer);
    prefsTimer = setTimeout(() => {
      supabase.from("user_preferences").upsert({ user_id: userId, ...state.prefs }).then(({ error }) => error && toast.error("Réglages non enregistrés."));
    }, 500);
  },
  /** Demo data stays on this screen only; it is never written to the database. */
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
  async clearAll() {
    const userId = state.session?.userId;
    if (!userId) return;
    const paths = state.homeEvents.map((e) => e.capture_path).filter((p): p is string => !!p);
    if (paths.length) await supabase.storage.from("home-captures").remove(paths);
    await Promise.all([
      supabase.from("home_monitor_sessions").delete().eq("user_id", userId),
      supabase.from("missions").delete().eq("user_id", userId),
      supabase.from("assistant_messages").delete().eq("user_id", userId),
    ]);
    await syncAll();
  },
};

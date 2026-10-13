import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

type RuntimeGlobals = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

function env(names: readonly string[]): string | undefined {
  const p = (globalThis as RuntimeGlobals).process?.env;
  for (const n of names) {
    const v = p?.[n]?.trim();
    if (v) return v;
  }
  return undefined;
}

/** User-scoped client: forwards the verified OAuth token so RLS applies. Never uses a service-role key. */
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("Jeton OAuth vérifié requis");
  const url = env(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  const key = env(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"]);
  if (!url || !key) throw new Error("Configuration Supabase manquante");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Best-effort audit entry in the caller's activity log (never contains tokens). */
export async function audit(db: ReturnType<typeof supabaseForUser>, ctx: ToolContext, kind: string, detail: Record<string, string | number | boolean | null>) {
  try {
    await db.rpc("mcp_audit" as never, { _kind: kind, _detail: { ...detail, client_id: ctx.getClientId() ?? null } } as never);
  } catch {
    /* audit failure must not leak details */
  }
}

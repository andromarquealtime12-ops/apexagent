import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { audit, supabaseForUser } from "../supabase";

const STATUSES = ["draft", "queued", "running", "paused", "completed", "failed", "cancelled"] as const;

export default defineTool({
  name: "list_missions",
  title: "Lister les missions",
  description: "Liste les missions APEX de l'utilisateur connecté, les plus récentes d'abord.",
  inputSchema: {
    status: z.enum(STATUSES).optional().describe("Filtrer par statut."),
    limit: z.number().int().min(1).max(50).default(20).describe("Nombre maximum (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Non authentifié");
    const db = supabaseForUser(ctx);
    let q = db.from("missions").select("id,title,theme,region,status,progress,created_at").order("created_at", { ascending: false }).limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw new ToolError("Lecture des missions impossible");
    const missions = (data ?? []).map((m) => ({ id: m.id, title: m.title, theme: m.theme, region: m.region, status: m.status, progress: m.progress, created_at: m.created_at }));
    await audit(db, ctx, "mcp_list_missions", { count: missions.length, status: status ?? null });
    return { content: [{ type: "text", text: JSON.stringify(missions) }], structuredContent: { missions } };
  },
});

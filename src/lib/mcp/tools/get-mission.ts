import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { audit, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_mission",
  title: "Détail d'une mission",
  description: "Retourne le détail d'une mission APEX appartenant à l'utilisateur connecté.",
  inputSchema: { mission_id: z.string().uuid().describe("Identifiant (UUID) de la mission.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ mission_id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Non authentifié");
    const db = supabaseForUser(ctx);
    const { data: m, error } = await db
      .from("missions")
      .select("id,title,theme,region,budget_min,budget_max,currency,skills,horizon,success_criteria,status,progress,created_at,updated_at")
      .eq("id", mission_id)
      .maybeSingle();
    if (error) throw new ToolError("Lecture impossible");
    if (!m) throw new ToolError("Mission introuvable");
    const mission = {
      id: m.id, title: m.title, theme: m.theme, region: m.region,
      budget_min: Number(m.budget_min), budget_max: Number(m.budget_max), currency: m.currency,
      skills: [...(m.skills ?? [])], horizon: m.horizon, success_criteria: m.success_criteria,
      status: m.status, progress: m.progress, created_at: m.created_at, updated_at: m.updated_at,
    };
    await audit(db, ctx, "mcp_get_mission", { mission_id });
    return { content: [{ type: "text", text: JSON.stringify(mission) }], structuredContent: { mission } };
  },
});

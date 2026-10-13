import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { DEFAULT_WEIGHTS } from "@/lib/apex/types";
import { audit, supabaseForUser } from "../supabase";

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export default defineTool({
  name: "create_mission",
  title: "Créer une mission (brouillon)",
  description:
    "Crée une mission APEX en brouillon pour l'utilisateur connecté. Présente d'abord le résumé à l'utilisateur et n'appelle avec confirmed=true qu'après son accord explicite.",
  inputSchema: {
    title: text(3, 120),
    theme: text(2, 80),
    region: text(2, 80),
    budget_min: z.number().finite().min(0).max(1e9),
    budget_max: z.number().finite().min(0).max(1e9),
    currency: z.enum(["EUR", "USD", "CAD", "CHF", "GBP"]),
    horizon: z.enum(["1 mois", "3 mois", "6 mois", "12 mois"]),
    skills: z.array(text(1, 60)).max(20).default([]),
    success_criteria: z.string().trim().max(1000).default(""),
    confirmed: z.boolean().describe("true uniquement après confirmation explicite de l'utilisateur sur ce résumé exact."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (a, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Non authentifié");
    if (a.budget_max < a.budget_min) throw new ToolError("budget_max doit être supérieur ou égal à budget_min");
    const { confirmed, ...summary } = a;
    const db = supabaseForUser(ctx);
    if (!confirmed) {
      await audit(db, ctx, "mcp_create_mission_refused", { reason: "confirmation_required" });
      return {
        content: [{ type: "text", text: `Confirmation requise. Montrez ce résumé à l'utilisateur, puis rappelez avec confirmed=true s'il accepte : ${JSON.stringify(summary)}` }],
        structuredContent: { status: "confirmation_required", summary },
      };
    }
    const { data, error } = await db
      .from("missions")
      .insert({ ...summary, user_id: ctx.getUserId()!, weights: DEFAULT_WEIGHTS, history: [{ at: new Date().toISOString(), from: null, to: "draft" }] })
      .select("id,title,status")
      .single();
    if (error || !data) throw new ToolError("Création impossible");
    await audit(db, ctx, "mcp_create_mission", { mission_id: data.id });
    return { content: [{ type: "text", text: `Mission créée en brouillon : ${data.title} (${data.id})` }], structuredContent: { status: "created", mission: { id: data.id, title: data.title, status: data.status } } };
  },
});

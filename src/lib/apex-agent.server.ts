// Shared APEX agent: tools and instructions used by the text chat and the voice call.
// Every tool runs through a Supabase client authenticated AS THE USER, so RLS applies.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_WEIGHTS } from "@/lib/apex/types";

export type UserDb = SupabaseClient<Database>;

export const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";
export const AGENT_MODEL = "openai/gpt-6-astra";

export function userDb(token: string): UserDb {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase configuration");
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Verifies a user access token and returns the user id, or null. */
export async function verifyToken(token: string): Promise<string | null> {
  if (!token || token.split(".").length !== 3) return null;
  const { data, error } = await userDb(token).auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

export const AGENT_SYSTEM = `Tu es l'agent APEX Business. Tu réponds toujours en français, brièvement et clairement.
Ton rôle : aider l'utilisateur à définir et piloter ses missions de recherche d'opportunités.
Commence par demander quelle mission il veut que tu prépares si ce n'est pas clair.
Pour créer une mission, il te faut au minimum : titre, thème, zone géographique, budget min et max, devise, horizon.
Avant toute création ou tout lancement, résume exactement ce que tu vas faire et demande une confirmation explicite.
N'appelle create_mission_draft ou launch_mission avec user_confirmed=true qu'après un « oui » clair de l'utilisateur à ce résumé précis.
Tu ne fais jamais de dépense, publication, message externe ni création de compte : ces actions passent par la file ACTION REQUISE.
Aucune recherche web réelle n'est branchée : ne présente jamais de résultat inventé comme vérifié.`;

export function agentTools(db: UserDb, onChange?: () => void) {
  return {
    list_missions: tool({
      description: "Liste les missions de l'utilisateur avec leur statut.",
      inputSchema: z.object({}).strict(),
      execute: async () => {
        const { data, error } = await db.from("missions").select("id,title,theme,region,status,progress,created_at").order("created_at", { ascending: false }).limit(20);
        if (error) return { error: "LECTURE_IMPOSSIBLE" };
        return { missions: data };
      },
    }),
    list_pending_approvals: tool({
      description: "Liste les autorisations en attente (ACTION REQUISE).",
      inputSchema: z.object({}).strict(),
      execute: async () => {
        const { data, error } = await db.from("approvals").select("id,action,target,impact,cost,expires_at").eq("status", "pending").limit(20);
        if (error) return { error: "LECTURE_IMPOSSIBLE" };
        return { approvals: data };
      },
    }),
    create_mission_draft: tool({
      description: "Crée une mission en brouillon (non lancée). Exige la confirmation explicite de l'utilisateur sur ce résumé exact.",
      inputSchema: z
        .object({
          title: z.string(),
          theme: z.string(),
          region: z.string(),
          budget_min: z.number(),
          budget_max: z.number(),
          currency: z.enum(["EUR", "USD", "CAD", "CHF", "GBP"]),
          horizon: z.enum(["1 mois", "3 mois", "6 mois", "12 mois"]),
          skills: z.array(z.string()),
          success_criteria: z.string(),
          user_confirmed: z.boolean(),
        })
        .strict(),
      execute: async (a) => {
        if (!a.user_confirmed) return { status: "confirmation_requise", summary: a };
        const title = a.title.trim().slice(0, 120);
        if (title.length < 3 || a.budget_min < 0 || a.budget_max < a.budget_min) return { status: "invalide", reason: "Titre trop court ou budget incohérent." };
        const { data, error } = await db
          .from("missions")
          .insert({
            title,
            theme: a.theme.slice(0, 80),
            region: a.region.slice(0, 80),
            budget_min: a.budget_min,
            budget_max: a.budget_max,
            currency: a.currency,
            horizon: a.horizon,
            skills: a.skills.slice(0, 20).map((s) => s.slice(0, 60)),
            success_criteria: a.success_criteria.slice(0, 1000),
            weights: DEFAULT_WEIGHTS,
            history: [{ at: new Date().toISOString(), from: null, to: "draft" }],
          })
          .select("id,title,status")
          .single();
        if (error || !data) return { status: "echec" };
        onChange?.();
        return { status: "cree", mission: data };
      },
    }),
    launch_mission: tool({
      description: "Lance une mission en brouillon. Exige la confirmation explicite de l'utilisateur.",
      inputSchema: z.object({ mission_id: z.string(), user_confirmed: z.boolean() }).strict(),
      execute: async ({ mission_id, user_confirmed }) => {
        if (!user_confirmed) return { status: "confirmation_requise" };
        const { data, error } = await db.rpc("mission_transition", { _mission_id: mission_id, _action: "launch" });
        if (error || !data) return { status: "echec", reason: error?.message.includes("INVALID_TRANSITION") ? "Cette mission ne peut pas être lancée." : "Erreur" };
        onChange?.();
        return { status: "lancee", mission: { id: (data as { id: string }).id, status: (data as { status: string }).status } };
      },
    }),
  };
}

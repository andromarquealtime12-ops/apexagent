import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendAgentMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ content: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { stepCountIs, streamText } = await import("ai");
    const { AGENT_MODEL, AGENT_SYSTEM, GATEWAY_BASE, agentTools } = await import("./apex-agent.server");
    const db = context.supabase;
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "Assistant non configuré." };

    const { data: userMsg, error: insErr } = await db.from("assistant_messages").insert({ role: "user", content: data.content }).select().single();
    if (insErr || !userMsg) return { ok: false as const, error: "Message non enregistré." };

    const { data: history } = await db.from("assistant_messages").select("role,content").order("created_at", { ascending: false }).limit(30);
    const messages = (history ?? []).reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    let runId: string | undefined;
    const provider = createOpenAI({
      baseURL: GATEWAY_BASE,
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
        const res = await fetch(input, { ...init, headers });
        runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
        return res;
      },
    });

    try {
      const result = streamText({
        model: provider.responses(AGENT_MODEL),
        system: AGENT_SYSTEM,
        messages,
        tools: agentTools(db),
        stopWhen: stepCountIs(50),
        maxRetries: 0,
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
        },
      });
      let failed = false;
      for await (const part of result.fullStream) {
        if (part.type === "error") {
          failed = true;
          console.error("agent stream error", part.error);
        }
      }
      const reply = (await result.text).trim();
      if (failed || !reply) return { ok: false as const, error: "L'assistant n'a pas pu répondre. Réessayez." };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: saved } = await supabaseAdmin
        .from("assistant_messages")
        .insert({ user_id: context.userId, role: "assistant", content: reply })
        .select()
        .single();
      return { ok: true as const, user: userMsg, assistant: saved ?? { id: crypto.randomUUID(), role: "assistant", content: reply, created_at: new Date().toISOString() } };
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("agent error", status, e);
      return { ok: false as const, error: status === 402 ? "Crédits IA épuisés." : status === 429 ? "Trop de demandes, réessayez dans un instant." : "L'assistant n'a pas pu répondre." };
    }
  });

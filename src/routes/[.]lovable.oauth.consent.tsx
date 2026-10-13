import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = { data: { redirect_url?: string; redirect_to?: string; client?: { name?: string }; scope?: string } | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails(id: string): Promise<OAuthResult>;
  approveAuthorization(id: string): Promise<OAuthResult>;
  denyAuthorization(id: string): Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({ meta: [{ title: "Autoriser l'accès — APEX" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Identifiant d'autorisation manquant.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="max-w-sm rounded-xl bg-card p-6 text-sm">
        <h1 className="mb-2 text-lg font-semibold">Demande invalide ou expirée</h1>
        <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "Une application";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("Aucune redirection reçue. Réessayez."); return; }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
        <ShieldCheck className="mb-3 size-8 text-primary" aria-hidden />
        <h1 className="text-xl font-semibold">{name} veut accéder à APEX</h1>
        <p className="mt-2 text-sm text-muted-foreground">En acceptant, {name} pourra, en votre nom :</p>
        <ul className="mt-2 list-disc pl-5 text-sm">
          <li>consulter vos missions Business ;</li>
          <li>créer des missions en brouillon, après votre confirmation.</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Chaque action est inscrite dans votre journal d'activité.</p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Refuser</Button>
          <Button disabled={busy} onClick={() => decide(true)}>Autoriser</Button>
        </div>
      </div>
    </main>
  );
}

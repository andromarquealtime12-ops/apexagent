import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { syncAll } from "@/lib/apex/store";
import { oauthReturnPath } from "@/lib/oauth-return-path";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string | undefined } => ({ next: typeof s["next"] === "string" ? oauthReturnPath(s["next"]) : undefined }),
  head: () => ({
    meta: [
      { title: "Connexion — APEX" },
      { name: "description", content: "Accès privé à APEX." },
      { property: "og:title", content: "Connexion — APEX" },
      { property: "og:description", content: "Accès privé à APEX." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Adresse courriel invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(72),
});

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Adresse ou mot de passe incorrect.",
  "Email not confirmed": "Confirmez d'abord votre adresse via le courriel reçu.",
  "User already registered": "Un compte existe déjà avec cette adresse.",
};

function AuthPage() {
  const navigate = useNavigate();
  const next = Route.useSearch().next ?? "/";
  const go = () => (next !== "/" ? window.location.assign(next) : navigate({ to: "/", replace: true }));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) go();
    });
  }, [navigate, next]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!r.success) return setErr(r.error.issues[0]?.message ?? "Erreur");
    if (mode === "signup" && fd.get("password") !== fd.get("confirm")) return setErr("Les mots de passe ne correspondent pas.");
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(r.data);
        if (error) throw error;
        await syncAll();
        go();
      } else {
        const { data, error } = await supabase.auth.signUp({ ...r.data, options: { emailRedirectTo: new URL(next, window.location.origin).href } });
        if (error) throw error;
        if (data.session) {
          await syncAll();
          go();
        } else {
          setInfo("Compte créé. Ouvrez le courriel de confirmation, puis connectez-vous.");
          setMode("signin");
        }
      }
    } catch (ex) {
      const m = ex instanceof Error ? ex.message : "";
      setErr(MESSAGES[m] ?? "Connexion impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === "signup";
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded bg-primary font-mono font-bold text-primary-foreground">A</span>
          <div>
            <h1 className="text-xl font-semibold">APEX</h1>
            <p className="text-sm text-muted-foreground">{signup ? "Créer un compte" : "Accès privé"}</p>
          </div>
        </div>
        <div role="tablist" className="mb-5 grid grid-cols-2 rounded-md bg-muted p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr(null); }}
              className={`tap rounded text-sm ${mode === m ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}>
              {m === "signin" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>
        <form noValidate onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse courriel</Label>
            <Input id="email" name="email" type="email" autoComplete="email" className="h-11" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} className="h-11" required />
          </div>
          {signup && (
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input id="confirm" name="confirm" type="password" autoComplete="new-password" className="h-11" required />
            </div>
          )}
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          {info && <p role="status" className="text-sm text-success">{info}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {signup ? <UserPlus /> : <Lock />} {busy ? "Patientez…" : signup ? "Créer mon compte" : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}

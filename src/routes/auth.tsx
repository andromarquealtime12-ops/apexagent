import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actions } from "@/lib/apex/store";

export const Route = createFileRoute("/auth")({
  ssr: false,
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

const schema = z.object({ email: z.string().trim().email("Adresse courriel invalide"), password: z.string().min(8, "8 caractères minimum") });

function AuthPage() {
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded bg-primary font-mono font-bold text-primary-foreground">A</span>
          <div>
            <h1 className="text-xl font-semibold">APEX</h1>
            <p className="text-sm text-muted-foreground">Accès privé</p>
          </div>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const r = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
            if (!r.success) return setErr(r.error.issues[0]?.message ?? "Erreur");
            setErr(null);
            setBusy(true);
            actions.signIn(r.data.email);
            navigate({ to: "/", replace: true });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse courriel</Label>
            <Input id="email" name="email" type="email" autoComplete="email" className="h-11" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" className="h-11" required />
          </div>
          {err && (
            <p role="alert" className="text-sm text-destructive">
              {err}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            <Lock /> Se connecter
          </Button>
        </form>
        <p className="mt-5 rounded-md bg-warning/10 p-3 text-xs text-warning">
          Mode local : la vraie connexion sera activée dès que la base de données sera reliée.
        </p>
      </div>
    </div>
  );
}

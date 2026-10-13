import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel } from "@/components/apex/ui";
import { actions, useApex } from "@/lib/apex/store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Réglages — APEX" }, { name: "description", content: "Profil, permissions et confidentialité." }, { property: "og:title", content: "Réglages — APEX" }, { property: "og:description", content: "Profil, permissions et confidentialité." }] }),
  component: SettingsPage,
});

function Row({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SettingsPage() {
  const p = useApex((s) => s.prefs);
  const email = useApex((s) => s.session?.email);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader eyebrow="Compte" title="Réglages" />
      <div className="space-y-4">
        <Panel className="space-y-3">
          <h2 className="font-semibold">Profil</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <div className="space-y-1.5">
            <Label htmlFor="dn">Nom d'affichage</Label>
            <Input id="dn" className="h-11" value={p.display_name} onChange={(e) => actions.setPrefs({ display_name: e.target.value.slice(0, 60) })} />
          </div>
        </Panel>
        <Panel className="space-y-2">
          <h2 className="font-semibold">Notifications</h2>
          <Row id="ni" label="Alertes internes" checked={p.notifications_internal} onChange={(v) => actions.setPrefs({ notifications_internal: v })} />
          <Row id="np" label="Notifications push" hint="Disponible plus tard" checked={p.notifications_push} onChange={(v) => actions.setPrefs({ notifications_push: v })} />
        </Panel>
        <Panel className="space-y-2">
          <h2 className="font-semibold">Permissions et confidentialité</h2>
          <Row id="cc" label="Capture d'image lors d'un mouvement" hint="Désactivée par défaut. Une petite image est conservée à chaque événement." checked={p.capture_consent} onChange={(v) => actions.setPrefs({ capture_consent: v })} />
          <p className="text-xs text-muted-foreground">Jamais d'audio, de reconnaissance faciale ou d'identification de personnes.</p>
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-semibold">Conservation</h2>
          <div className="space-y-1.5">
            <Label htmlFor="ret">Supprimer les événements Maison après</Label>
            <select id="ret" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={p.retention_days} onChange={(e) => actions.setPrefs({ retention_days: Number(e.target.value) })}>
              {[7, 30, 90].map((d) => <option key={d} value={d}>{d} jours</option>)}
            </select>
          </div>
          <Button variant="destructive" onClick={async () => { if (confirm("Supprimer toutes vos données APEX ?")) { await actions.clearAll(); toast("Données supprimées"); } }}>
            <Trash2 />Supprimer toutes mes données
          </Button>
        </Panel>
        <Button variant="outline" className="w-full md:hidden" onClick={async () => { await actions.signOut(); navigate({ to: "/auth", replace: true }); }}>
          <LogOut />Déconnexion
        </Button>
      </div>
    </>
  );
}

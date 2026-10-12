import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Briefcase, Camera, Database, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MissionStatusPill, PageHeader, Panel, DemoTag } from "@/components/apex/ui";
import { actions, useApex } from "@/lib/apex/store";
import { buildDemo } from "@/lib/apex/demo";
import { fmtDate } from "@/lib/apex/format";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — APEX" },
      { name: "description", content: "Vue d'ensemble APEX Business et Maison." },
      { property: "og:title", content: "Tableau de bord — APEX" },
      { property: "og:description", content: "Vue d'ensemble APEX Business et Maison." },
    ],
  }),
  component: Dashboard,
});

function Stat({ to, icon: Icon, label, value, tone }: { to: string; icon: typeof Bell; label: string; value: number; tone?: string }) {
  return (
    <Link to={to} className="tap flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-primary">
      <Icon className={`size-5 ${tone ?? "text-primary"}`} aria-hidden />
      <div>
        <p className="text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

function Dashboard() {
  const missions = useApex((s) => s.missions);
  const pending = useApex((s) => s.approvals.filter((a) => a.status === "pending").length);
  const unread = useApex((s) => s.alerts.filter((a) => !a.read).length);
  const events = useApex((s) => s.homeEvents.length);
  const active = missions.filter((m) => ["queued", "running", "paused"].includes(m.status));

  return (
    <>
      <PageHeader eyebrow="Tableau de bord" title="Bonjour" action={<Button asChild><Link to="/business/missions/new">Nouvelle mission</Link></Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat to="/business/missions" icon={Briefcase} label="Missions actives" value={active.length} />
        <Stat to="/approvals" icon={ShieldCheck} label="Actions requises" value={pending} tone="text-warning" />
        <Stat to="/alerts" icon={Bell} label="Alertes non lues" value={unread} />
        <Stat to="/home/events" icon={Camera} label="Événements Maison" value={events} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-semibold">Missions récentes</h2>
          {missions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune mission pour l'instant.</p>
          ) : (
            <ul className="divide-y">
              {missions.slice(0, 5).map((m) => (
                <li key={m.id}>
                  <Link to="/business/missions/$id" params={{ id: m.id }} className="tap flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{m.title}</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(m.updated_at)}</span>
                    </span>
                    <MissionStatusPill status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h2 className="mb-3 font-semibold">Maison</h2>
          <p className="text-sm text-muted-foreground">La caméra est inactive. Elle ne démarre que lorsque vous l'activez.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/home"><Camera /> Ouvrir APEX Maison</Link>
          </Button>
        </Panel>
      </div>

      {import.meta.env.DEV && (
        <Panel className="mt-6 border-dashed">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Database className="size-4" aria-hidden /> Développement uniquement <DemoTag show />
            </div>
            <Button variant="secondary" onClick={() => actions.loadDemo(buildDemo())}>Charger la démonstration</Button>
          </div>
        </Panel>
      )}
    </>
  );
}

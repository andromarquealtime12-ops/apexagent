import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Plus } from "lucide-react";
import { BusinessTabs } from "@/components/apex/BusinessTabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState, MissionStatusPill, PageHeader, DemoTag } from "@/components/apex/ui";
import { useApex } from "@/lib/apex/store";
import { fmtDate, fmtMoney } from "@/lib/apex/format";

export const Route = createFileRoute("/_authenticated/business/missions/")({
  head: () => ({ meta: [{ title: "Missions — APEX" }, { name: "description", content: "Missions de recherche d'opportunités." }, { property: "og:title", content: "Missions — APEX" }, { property: "og:description", content: "Missions de recherche d'opportunités." }] }),
  component: Missions,
});

function Missions() {
  const missions = useApex((s) => s.missions);
  return (
    <>
      <PageHeader eyebrow="Business" title="Missions" action={<Button asChild><Link to="/business/missions/new"><Plus />Créer</Link></Button>} />
      <BusinessTabs />
      {missions.length === 0 ? (
        <EmptyState icon={Briefcase} title="Aucune mission" body="Créez une mission pour lancer une recherche d'opportunités." action={<Button asChild><Link to="/business/missions/new">Créer une mission</Link></Button>} />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {missions.map((m) => (
              <li key={m.id}>
                <Link to="/business/missions/$id" params={{ id: m.id }} className="block rounded-lg border bg-card p-4 hover:border-primary">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{m.title}</p>
                    <MissionStatusPill status={m.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{m.theme} · {m.region}</p>
                  <Progress value={m.progress} className="mt-3 h-1.5" aria-label="Progression" />
                  <div className="mt-2"><DemoTag show={m.demo} /></div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground">
                <tr><th className="p-3">Mission</th><th className="p-3">Zone</th><th className="p-3">Budget</th><th className="p-3">Progression</th><th className="p-3">Statut</th><th className="p-3">Mise à jour</th></tr>
              </thead>
              <tbody className="divide-y">
                {missions.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/50">
                    <td className="p-3"><Link to="/business/missions/$id" params={{ id: m.id }} className="font-medium hover:underline">{m.title}</Link> <DemoTag show={m.demo} /></td>
                    <td className="p-3">{m.region}</td>
                    <td className="p-3 font-mono text-xs">{fmtMoney(m.budget_min, m.currency)}–{fmtMoney(m.budget_max, m.currency)}</td>
                    <td className="p-3"><Progress value={m.progress} className="h-1.5 w-24" aria-label="Progression" /></td>
                    <td className="p-3"><MissionStatusPill status={m.status} /></td>
                    <td className="p-3 text-muted-foreground">{fmtDate(m.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

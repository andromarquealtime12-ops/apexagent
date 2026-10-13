import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState, MissionStatusPill, PageHeader, Panel, DemoTag } from "@/components/apex/ui";
import { OpportunityCard } from "@/components/apex/OpportunityCard";
import { actions, useApex } from "@/lib/apex/store";
import { ACTION_LABELS, availableActions } from "@/lib/apex/transitions";
import { fmtDate, fmtMoney } from "@/lib/apex/format";

export const Route = createFileRoute("/_authenticated/business/missions/$id")({
  head: () => ({ meta: [{ title: "Suivi de mission — APEX" }, { name: "description", content: "Suivi et historique d'une mission." }, { property: "og:title", content: "Suivi de mission — APEX" }, { property: "og:description", content: "Suivi et historique d'une mission." }] }),
  component: MissionDetail,
});

function MissionDetail() {
  const { id } = Route.useParams();
  const m = useApex((s) => s.missions.find((x) => x.id === id));
  const allOpps = useApex((s) => s.opportunities);
  const opps = allOpps.filter((o) => o.mission_id === id);

  if (!m) return <EmptyState icon={SearchX} title="Mission introuvable" action={<Button asChild variant="outline"><Link to="/business/missions">Retour aux missions</Link></Button>} />;

  return (
    <>
      <PageHeader eyebrow="Mission" title={m.title} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <MissionStatusPill status={m.status} />
        <DemoTag show={m.demo} />
      </div>
      <Panel className="mb-4">
        <div className="mb-2 flex justify-between text-sm"><span>Progression</span><span className="font-mono">{m.progress} %</span></div>
        <Progress value={m.progress} aria-label="Progression de la mission" />
        <div className="mt-4 flex flex-wrap gap-2">
          {availableActions(m.status).map((a) => (
            <Button key={a} variant={a === "cancel" ? "outline" : "default"} onClick={() => actions.transition(m.id, a).then(() => toast(ACTION_LABELS[a])).catch(() => {})}>
              {ACTION_LABELS[a]}
            </Button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <h2 className="mb-3 font-semibold">Paramètres</h2>
          <dl className="space-y-2 text-sm">
            {[
              ["Thème", m.theme],
              ["Zone", m.region],
              ["Budget", `${fmtMoney(m.budget_min, m.currency)} – ${fmtMoney(m.budget_max, m.currency)}`],
              ["Horizon", m.horizon],
              ["Compétences", m.skills.join(", ") || "—"],
              ["Réussite", m.success_criteria || "—"],
            ].map(([k, v]) => (
              <div key={k}><dt className="eyebrow">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <h2 className="mb-2 mt-6 font-semibold">Historique</h2>
          <ol className="space-y-2 border-l pl-4 text-sm">
            {[...m.history].reverse().map((h, i) => (
              <li key={i}>
                <MissionStatusPill status={h.to} />
                <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(h.at)}{h.note ? ` — ${h.note}` : ""}</p>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-semibold">Opportunités ({opps.length})</h2>
          {opps.length === 0 ? (
            <EmptyState icon={SearchX} title="Aucune opportunité" body="Le moteur de recherche sera branché avec la base de données. Aucun résultat n'est inventé." />
          ) : (
            opps.map((o) => <OpportunityCard key={o.id} o={o} weights={m.weights} />)
          )}
        </div>
      </div>
    </>
  );
}

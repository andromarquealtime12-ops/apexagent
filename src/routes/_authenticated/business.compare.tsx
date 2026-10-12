import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GitCompare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, PageHeader, Panel, DemoTag } from "@/components/apex/ui";
import { BusinessTabs } from "@/components/apex/BusinessTabs";
import { useApex } from "@/lib/apex/store";
import { DEFAULT_WEIGHTS, WEIGHT_KEYS, WEIGHT_LABELS } from "@/lib/apex/types";
import { scoreOpportunity } from "@/lib/apex/scoring";

export const Route = createFileRoute("/_authenticated/business/compare")({
  head: () => ({ meta: [{ title: "Comparer — APEX" }, { name: "description", content: "Comparer de 2 à 4 opportunités." }, { property: "og:title", content: "Comparer — APEX" }, { property: "og:description", content: "Comparer de 2 à 4 opportunités." }] }),
  component: Compare,
});

function Compare() {
  const opps = useApex((s) => s.opportunities);
  const missions = useApex((s) => s.missions);
  const [picked, setPicked] = useState<string[]>([]);
  const chosen = opps.filter((o) => picked.includes(o.id));
  const weightsOf = (mid: string) => missions.find((m) => m.id === mid)?.weights ?? DEFAULT_WEIGHTS;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? p : [...p, id]));

  return (
    <>
      <PageHeader eyebrow="Business" title="Comparer" />
      <BusinessTabs />
      {opps.length < 2 ? (
        <EmptyState icon={GitCompare} title="Pas assez d'opportunités" body="Il en faut au moins deux pour comparer." />
      ) : (
        <>
          <Panel className="mb-4">
            <p className="mb-2 text-sm text-muted-foreground">Sélectionnez de 2 à 4 opportunités ({picked.length}/4)</p>
            <ul className="divide-y">
              {opps.map((o) => (
                <li key={o.id}>
                  <label className="tap flex cursor-pointer items-center gap-3 py-2 text-sm">
                    <Checkbox checked={picked.includes(o.id)} onCheckedChange={() => toggle(o.id)} disabled={!picked.includes(o.id) && picked.length >= 4} />
                    <span className="flex-1">{o.title}</span>
                    <DemoTag show={o.demo} />
                  </label>
                </li>
              ))}
            </ul>
          </Panel>
          {chosen.length >= 2 && (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted text-left text-xs">
                  <tr><th className="p-3">Critère (poids)</th>{chosen.map((o) => <th key={o.id} className="p-3">{o.title}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {WEIGHT_KEYS.map((k) => (
                    <tr key={k}>
                      <td className="p-3">{WEIGHT_LABELS[k]} <span className="font-mono text-muted-foreground">({weightsOf(chosen[0]!.mission_id)[k]})</span></td>
                      {chosen.map((o) => {
                        const b = scoreOpportunity(o.criteria, weightsOf(o.mission_id)).breakdown.find((x) => x.key === k)!;
                        return <td key={o.id} className="p-3 font-mono">{b.value}/10 → {b.points.toFixed(1)}</td>;
                      })}
                    </tr>
                  ))}
                  <tr className="bg-accent font-semibold"><td className="p-3">Score /100</td>{chosen.map((o) => <td key={o.id} className="p-3 font-mono text-lg">{scoreOpportunity(o.criteria, weightsOf(o.mission_id)).total}</td>)}</tr>
                  <tr><td className="p-3">Confiance</td>{chosen.map((o) => <td key={o.id} className="p-3">{Math.round(o.confidence * 100)} %</td>)}</tr>
                  <tr><td className="p-3">Risques</td>{chosen.map((o) => <td key={o.id} className="p-3">{o.risks.join(" · ")}</td>)}</tr>
                  <tr><td className="p-3">Données manquantes</td>{chosen.map((o) => <td key={o.id} className="p-3">{o.missing_data.join(" · ")}</td>)}</tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

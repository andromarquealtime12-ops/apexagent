import { ExternalLink } from "lucide-react";
import type { Opportunity, Weights } from "@/lib/apex/types";
import { scoreOpportunity } from "@/lib/apex/scoring";
import { DemoTag } from "./ui";
import { fmtDate } from "@/lib/apex/format";

const BLOCKS: { key: "facts" | "inferences" | "hypotheses" | "projections"; label: string; cls: string }[] = [
  { key: "facts", label: "Faits sourcés", cls: "border-success/40 bg-success/5" },
  { key: "inferences", label: "Inférences", cls: "border-info/40 bg-info/5" },
  { key: "hypotheses", label: "Hypothèses", cls: "border-warning/40 bg-warning/5" },
  { key: "projections", label: "Projections", cls: "border-border bg-muted" },
];

export function OpportunityCard({ o, weights }: { o: Opportunity; weights: Weights }) {
  const { total } = scoreOpportunity(o.criteria, weights);
  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium">{o.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{o.summary}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-semibold">{total}</p>
          <p className="text-xs text-muted-foreground">Confiance {Math.round(o.confidence * 100)} %</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2"><DemoTag show={o.demo} /><a href={o.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Lien principal <ExternalLink className="size-3" /></a></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {BLOCKS.map((b) => (
          <div key={b.key} className={`rounded-md border p-2.5 ${b.cls}`}>
            <p className="eyebrow mb-1">{b.label}</p>
            <ul className="list-disc pl-4 text-sm">{o[b.key].map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        ))}
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div><dt className="eyebrow">Risques</dt><dd>{o.risks.join(" · ") || "—"}</dd></div>
        <div><dt className="eyebrow">Données manquantes</dt><dd>{o.missing_data.join(" · ") || "—"}</dd></div>
        <div><dt className="eyebrow">Prochaine expérience</dt><dd>{o.next_experiment}</dd></div>
      </dl>
      <details className="mt-3 text-sm">
        <summary className="tap flex cursor-pointer items-center text-muted-foreground">Sources ({o.sources.length})</summary>
        <ul className="space-y-1">{o.sources.map((s, i) => <li key={i}><a className="text-primary hover:underline" href={s.url} target="_blank" rel="noreferrer">{s.publisher}</a> — consulté le {fmtDate(s.accessed_at)}</li>)}</ul>
      </details>
    </article>
  );
}

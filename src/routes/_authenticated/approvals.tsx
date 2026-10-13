import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApprovalStatusPill, EmptyState, PageHeader, DemoTag } from "@/components/apex/ui";
import { actions, useApex } from "@/lib/apex/store";
import { fmtDate } from "@/lib/apex/format";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({ meta: [{ title: "Action requise — APEX" }, { name: "description", content: "Autorisations en attente." }, { property: "og:title", content: "Action requise — APEX" }, { property: "og:description", content: "Autorisations en attente." }] }),
  component: Approvals,
});

function Approvals() {
  const all = useApex((s) => s.approvals);
  const [tab, setTab] = useState<"pending" | "done">("pending");
  const list = all.filter((a) => (tab === "pending" ? a.status === "pending" : a.status !== "pending"));

  const decide = async (id: string, d: "approved" | "rejected") => {
    try {
      await actions.decideApproval(id, d);
      toast.success(d === "approved" ? "Autorisation accordée (usage unique)" : "Refusée — rien ne sera exécuté");
    } catch {
      /* error already shown */
    }
  };

  return (
    <>
      <PageHeader eyebrow="Autorisations" title="Action requise" />
      <div role="tablist" className="mb-4 inline-flex rounded-md bg-muted p-1">
        {(["pending", "done"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`tap rounded px-4 text-sm ${tab === t ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}>
            {t === "pending" ? "En attente" : "Traitées"}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={tab === "pending" ? "Rien à valider" : "Aucune décision"} body="Toute dépense, publication ou action irréversible apparaîtra ici avant d'être exécutée." />
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <article key={a.id} className="rounded-lg border-2 border-warning/40 bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2"><ApprovalStatusPill status={a.status} /><DemoTag show={a.demo} /><span className="text-xs text-muted-foreground">Expire {fmtDate(a.expires_at)}</span></div>
              <h2 className="text-lg font-semibold">{a.action}</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Cible", a.target],
                  ["Impact", a.impact],
                  ["Coût", a.cost ?? "Aucun"],
                  ["Données concernées", a.data],
                  ["Preuves", a.evidence.join(" · ")],
                  ["Choix possibles", a.choices.join(" / ")],
                  ["Recommandation d'APEX", a.recommendation],
                  ["Suite prévue", a.next_step],
                ].map(([k, v]) => <div key={k}><dt className="eyebrow">{k}</dt><dd>{v}</dd></div>)}
              </dl>
              {a.status === "pending" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => decide(a.id, "approved")}>Approuver cette action uniquement</Button>
                  <Button variant="outline" onClick={() => decide(a.id, "rejected")}>Refuser</Button>
                </div>
              ) : (
                a.decided_at && <p className="mt-3 text-xs text-muted-foreground">Décidé le {fmtDate(a.decided_at)}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

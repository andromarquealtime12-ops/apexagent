import { createFileRoute, Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { EmptyState, MissionStatusPill, PageHeader } from "@/components/apex/ui";
import { BusinessTabs } from "./business.missions.index";
import { useApex } from "@/lib/apex/store";
import { fmtDate } from "@/lib/apex/format";

export const Route = createFileRoute("/_authenticated/business/history")({
  head: () => ({ meta: [{ title: "Historique Business — APEX" }, { name: "description", content: "Journal des missions." }, { property: "og:title", content: "Historique Business — APEX" }, { property: "og:description", content: "Journal des missions." }] }),
  component: BizHistory,
});

function BizHistory() {
  const missions = useApex((s) => s.missions);
  const rows = missions.flatMap((m) => m.history.map((h) => ({ ...h, m }))).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <PageHeader eyebrow="Business" title="Historique" />
      <BusinessTabs />
      {rows.length === 0 ? (
        <EmptyState icon={History} title="Aucun historique" />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <Link to="/business/missions/$id" params={{ id: r.m.id }} className="min-w-0 flex-1 text-sm font-medium hover:underline">{r.m.title}</Link>
              <MissionStatusPill status={r.to} />
              <span className="w-full text-xs text-muted-foreground sm:w-auto">{fmtDate(r.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

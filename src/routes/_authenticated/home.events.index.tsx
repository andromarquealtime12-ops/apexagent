import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ChevronRight, Image } from "lucide-react";
import { EmptyState, PageHeader, DemoTag } from "@/components/apex/ui";
import { useApex } from "@/lib/apex/store";
import { fmtDate } from "@/lib/apex/format";

export const Route = createFileRoute("/_authenticated/home/events/")({
  head: () => ({ meta: [{ title: "Événements Maison — APEX" }, { name: "description", content: "Historique des mouvements détectés." }, { property: "og:title", content: "Événements Maison — APEX" }, { property: "og:description", content: "Historique des mouvements détectés." }] }),
  component: Events,
});

function Events() {
  const events = useApex((s) => s.homeEvents);
  return (
    <>
      <PageHeader eyebrow="Maison" title="Événements" />
      {events.length === 0 ? (
        <EmptyState icon={Activity} title="Aucun événement" body="Les mouvements détectés pendant une surveillance apparaîtront ici." />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {events.map((e) => (
            <li key={e.id}>
              <Link to="/home/events/$id" params={{ id: e.id }} className="tap flex items-center gap-3 p-3 hover:bg-muted/50">
                <Activity className="size-4 text-warning" aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm font-medium">Mouvement — {Math.round(e.confidence * 100)} %</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(e.at)}</span>
                </span>
                {e.capture_path && <Image className="size-4 text-muted-foreground" aria-label="Capture disponible" />}
                <DemoTag show={e.demo} />
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

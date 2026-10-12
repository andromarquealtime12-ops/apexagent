import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Briefcase, Camera, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, DemoTag } from "@/components/apex/ui";
import { actions, useApex } from "@/lib/apex/store";
import { fmtDate } from "@/lib/apex/format";
import type { Alert } from "@/lib/apex/types";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alertes — APEX" }, { name: "description", content: "Centre d'alertes." }, { property: "og:title", content: "Alertes — APEX" }, { property: "og:description", content: "Centre d'alertes." }] }),
  component: Alerts,
});

const ICON: Record<Alert["kind"], typeof Bell> = { home: Camera, business: Briefcase, approval: ShieldCheck, system: Info };
const KIND: Record<Alert["kind"], string> = { home: "Maison", business: "Business", approval: "Autorisation", system: "Système" };

function Alerts() {
  const alerts = useApex((s) => s.alerts);
  return (
    <>
      <PageHeader eyebrow="Centre" title="Alertes" action={alerts.some((a) => !a.read) && <Button variant="outline" onClick={actions.markAllAlerts}>Tout marquer lu</Button>} />
      {alerts.length === 0 ? (
        <EmptyState icon={Bell} title="Aucune alerte" />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {alerts.map((a) => {
            const I = ICON[a.kind];
            const body = (
              <>
                <I className={`mt-0.5 size-5 ${a.read ? "text-muted-foreground" : "text-primary"}`} aria-hidden />
                <span className="flex-1">
                  <span className={`block text-sm ${a.read ? "" : "font-semibold"}`}>{a.title}</span>
                  <span className="block text-sm text-muted-foreground">{a.body}</span>
                  <span className="eyebrow">{KIND[a.kind]} · {fmtDate(a.at)} {a.read ? "" : "· Non lue"}</span>
                </span>
                <DemoTag show={a.demo} />
              </>
            );
            const cls = "tap flex w-full items-start gap-3 p-3 text-left hover:bg-muted/50";
            return (
              <li key={a.id}>
                {a.kind === "home" && a.link ? (
                  <Link to="/home/events/$id" params={{ id: a.link }} onClick={() => actions.markAlert(a.id)} className={cls}>{body}</Link>
                ) : (
                  <button onClick={() => actions.markAlert(a.id)} className={cls}>{body}</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

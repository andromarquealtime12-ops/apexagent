import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SearchX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, DemoTag } from "@/components/apex/ui";
import { actions, useApex } from "@/lib/apex/store";
import { fmtDate } from "@/lib/apex/format";

export const Route = createFileRoute("/_authenticated/home/events/$id")({
  head: () => ({ meta: [{ title: "Détail d'événement — APEX" }, { name: "description", content: "Détail d'un mouvement détecté." }, { property: "og:title", content: "Détail d'événement — APEX" }, { property: "og:description", content: "Détail d'un mouvement détecté." }] }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const e = useApex((s) => s.homeEvents.find((x) => x.id === id));
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const path = e?.capture_path;
  useEffect(() => {
    setUrl(null);
    if (path) actions.captureUrl(path).then(setUrl);
  }, [path]);
  if (!e) return <EmptyState icon={SearchX} title="Événement introuvable" action={<Button asChild variant="outline"><Link to="/home/events">Retour</Link></Button>} />;

  return (
    <>
      <PageHeader eyebrow="Événement" title="Mouvement détecté" />
      <Panel className="space-y-3">
        <DemoTag show={e.demo} />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="eyebrow">Horodatage</dt><dd>{fmtDate(e.at)}</dd></div>
          <div><dt className="eyebrow">Confiance</dt><dd>{Math.round(e.confidence * 100)} %</dd></div>
        </dl>
        {url ? (
          <img src={url} alt="Capture de l'événement" className="w-full max-w-md rounded-md border" />
        ) : (
          <p className="text-sm text-muted-foreground">Aucune capture (capture d'image désactivée).</p>
        )}
        <Button
          variant="destructive"
          onClick={async () => {
            await actions.deleteHomeEvent(e.id);
            toast("Événement et capture supprimés");
            navigate({ to: "/home/events" });
          }}
        >
          <Trash2 />Supprimer l'événement et sa capture
        </Button>
      </Panel>
    </>
  );
}

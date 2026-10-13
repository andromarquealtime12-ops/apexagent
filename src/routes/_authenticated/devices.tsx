import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState, PageHeader, Panel } from "@/components/apex/ui";
import { actions, useApex } from "@/lib/apex/store";
import { fmtDate } from "@/lib/apex/format";
import { getDeviceName, setDeviceName, thisDeviceId, useLocationSharing } from "@/hooks/use-device-presence";

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({ meta: [{ title: "Appareils — APEX" }, { name: "description", content: "Vos appareils connectés et leur dernière position." }, { property: "og:title", content: "Appareils — APEX" }, { property: "og:description", content: "Vos appareils connectés et leur dernière position." }] }),
  component: Devices,
});

function Devices() {
  const devices = useApex((s) => s.devices);
  const { sharing, setSharing } = useLocationSharing();
  const [myId, setMyId] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    setMyId(thisDeviceId());
    setName(getDeviceName());
  }, []);

  const toggle = (v: boolean) => {
    if (!v) return setSharing(false);
    if (!navigator.geolocation) return toast.error("Localisation indisponible sur cet appareil.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setSharing(true);
        void actions.reportDevice({ id: myId, name, platform: navigator.userAgent, latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy_m: p.coords.accuracy });
        toast.success("Position partagée tant que l'app est ouverte.");
      },
      () => toast.error("Accès à la localisation refusé. Autorisez-le dans les réglages du navigateur."),
      { timeout: 30_000 },
    );
  };

  return (
    <>
      <PageHeader eyebrow="Compte" title="Appareils" />
      <Panel className="mb-4 space-y-3">
        <h2 className="font-semibold">Cet appareil</h2>
        <div className="space-y-1.5">
          <Label htmlFor="dname">Nom</Label>
          <Input id="dname" className="h-11" value={name} onChange={(e) => setName(e.target.value)}
            onBlur={() => { setDeviceName(name || "Appareil"); void actions.reportDevice({ id: myId, name: name || "Appareil", platform: navigator.userAgent }); }} />
        </div>
        <div className="flex min-h-11 items-center justify-between gap-4">
          <div>
            <Label htmlFor="share">Partager la position de cet appareil</Label>
            <p className="text-xs text-muted-foreground">Seulement quand APEX est ouvert. Visible uniquement par vous.</p>
          </div>
          <Switch id="share" checked={sharing} onCheckedChange={toggle} />
        </div>
      </Panel>

      {devices.length === 0 ? (
        <EmptyState icon={Smartphone} title="Aucun appareil" />
      ) : (
        <ul className="space-y-3">
          {devices.map((d) => (
            <li key={d.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {d.name} {d.id === myId && <span className="eyebrow ml-1 text-primary">Cet appareil</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">Vu le {fmtDate(d.last_seen_at)}</p>
                </div>
                {d.id !== myId && (
                  <Button variant="ghost" size="icon" aria-label={`Retirer ${d.name}`} onClick={() => actions.removeDevice(d.id).catch(() => {})}>
                    <Trash2 />
                  </Button>
                )}
              </div>
              {d.latitude != null && d.longitude != null ? (
                <a className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-primary hover:underline" target="_blank" rel="noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}#map=16/${d.latitude}/${d.longitude}`}>
                  <MapPin className="size-4" /> Position du {d.location_at ? fmtDate(d.location_at) : "—"} (± {Math.round(d.accuracy_m ?? 0)} m) <ExternalLink className="size-3" />
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Position non partagée.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

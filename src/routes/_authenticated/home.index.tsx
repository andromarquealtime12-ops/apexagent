import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Circle, History, ShieldAlert, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PageHeader, Panel } from "@/components/apex/ui";
import { useMotionMonitor } from "@/hooks/use-motion-monitor";
import { actions, useApex } from "@/lib/apex/store";
import { fmtDuration } from "@/lib/apex/format";

export const Route = createFileRoute("/_authenticated/home/")({
  head: () => ({ meta: [{ title: "APEX Maison" }, { name: "description", content: "Détection volontaire de mouvement." }, { property: "og:title", content: "APEX Maison" }, { property: "og:description", content: "Détection volontaire de mouvement." }] }),
  component: HomeMonitor,
});

function HomeMonitor() {
  const prefs = useApex((s) => s.prefs);
  const sessionRef = useRef<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const mon = useMotionMonitor({
    sensitivity: prefs.sensitivity,
    cooldownMs: prefs.cooldown_s * 1000,
    onStart: () => {
      sessionRef.current = actions.startHomeSession(prefs.capture_consent).id;
      setStartedAt(Date.now());
    },
    onStop: () => {
      if (sessionRef.current) actions.endHomeSession(sessionRef.current);
      sessionRef.current = null;
      setStartedAt(null);
    },
    onMotion: (conf, snap) => {
      if (!sessionRef.current) return;
      const img = prefs.capture_consent ? snap?.() : undefined;
      actions.addHomeEvent(sessionRef.current, conf, img);
      toast("Mouvement détecté", { description: `Confiance ${Math.round(conf * 100)} %` });
    },
  });

  useEffect(() => {
    if (mon.state !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mon.state]);

  const active = mon.state === "active";

  return (
    <>
      <PageHeader eyebrow="Maison" title="Surveillance" action={<Button asChild variant="outline"><Link to="/home/events"><History />Événements</Link></Button>} />

      {active && (
        <div role="status" className="sticky top-14 z-10 mb-3 flex items-center justify-between gap-3 rounded-lg bg-destructive px-4 py-2 text-destructive-foreground md:top-2">
          <span className="flex items-center gap-2 font-semibold"><Circle className="size-3 animate-pulse fill-current" aria-hidden />Caméra active</span>
          <span className="font-mono text-sm">{startedAt ? fmtDuration(now - startedAt) : "00:00:00"}</span>
          <Button size="sm" variant="secondary" onClick={mon.stop}><Square />Arrêter</Button>
        </div>
      )}

      <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-sidebar">
        <video ref={mon.videoRef} playsInline muted className={`size-full object-cover ${active ? "" : "hidden"}`} />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sidebar-foreground/70">
            <CameraOff className="size-10" aria-hidden />
            <span className="text-sm">Caméra inactive</span>
          </div>
        )}
        {active && (
          <div className="absolute bottom-2 left-2 right-2 h-1.5 overflow-hidden rounded bg-sidebar/60" aria-label="Niveau de mouvement">
            <div className="h-full bg-sidebar-primary transition-all" style={{ width: `${Math.min(100, mon.level * 400)}%` }} />
          </div>
        )}
      </div>

      {!active && (
        <Panel className="mb-4 border-warning/40 bg-warning/5">
          <p className="flex gap-2 text-sm"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            La surveillance fonctionne seulement tant que cette page reste ouverte et active. APEX Maison est une aide et ne remplace pas un système de sécurité ni les services d'urgence.
          </p>
          <Button size="lg" className="mt-4 w-full sm:w-auto" onClick={mon.start} disabled={mon.state === "requesting"}>
            <Camera />{mon.state === "requesting" ? "Autorisation…" : "Activer la surveillance"}
          </Button>
          {mon.state === "denied" && <p role="alert" className="mt-3 text-sm text-destructive">Accès à la caméra refusé. Autorisez-le dans les réglages du navigateur pour continuer.</p>}
          {mon.state === "error" && <p role="alert" className="mt-3 text-sm text-destructive">Caméra indisponible sur cet appareil.</p>}
        </Panel>
      )}

      <Panel className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span>Capture d'image</span>
          <span className={prefs.capture_consent ? "font-medium text-warning" : "text-muted-foreground"}>{prefs.capture_consent ? "Activée" : "Désactivée"}</span>
        </div>
        <div>
          <label className="mb-2 flex justify-between text-sm" id="sens"><span>Sensibilité</span><span className="font-mono">{prefs.sensitivity}</span></label>
          <Slider aria-labelledby="sens" min={1} max={100} value={[prefs.sensitivity]} onValueChange={([v]) => actions.setPrefs({ sensitivity: v ?? 40 })} />
        </div>
        <div>
          <label className="mb-2 flex justify-between text-sm" id="cd"><span>Délai entre deux événements</span><span className="font-mono">{prefs.cooldown_s} s</span></label>
          <Slider aria-labelledby="cd" min={3} max={120} value={[prefs.cooldown_s]} onValueChange={([v]) => actions.setPrefs({ cooldown_s: v ?? 10 })} />
        </div>
        <p className="text-xs text-muted-foreground">La vidéo reste sur votre appareil. Pas d'audio, pas de reconnaissance de personnes.</p>
      </Panel>
    </>
  );
}

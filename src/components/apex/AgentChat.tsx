import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Bot, Loader2, Mic, MicOff, Phone, PhoneOff, Send, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/apex/ui";
import { sendAgentMessage } from "@/lib/agent.functions";
import { actions, syncAll, useApex } from "@/lib/apex/store";
import { useLiveVoice, type LiveEvent } from "@/hooks/use-live-voice";

type Caption = { role: "user" | "assistant"; text: string };

function VoicePanel() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [working, setWorking] = useState(false);
  const onEvent = (e: LiveEvent) => {
    const ev = e as LiveEvent & { delta?: string };
    if (e.type === "session.input_transcript.delta" || e.type === "session.output_transcript.delta") {
      const role: Caption["role"] = e.type === "session.input_transcript.delta" ? "user" : "assistant";
      const delta = ev.delta ?? "";
      setCaptions((c) => {
        const last = c[c.length - 1];
        if (last && last.role === role) return [...c.slice(0, -1), { role, text: last.text + delta }];
        return [...c, { role, text: delta }].slice(-12);
      });
    }
    if (e.type === "app.delegation.pending") setWorking(true);
    if (e.type === "session.commentary.appended") setWorking(false);
    if (e.type === "app.data.changed") void syncAll();
  };
  const voice = useLiveVoice({ onEvent });
  const idle = voice.status === "idle" || voice.status === "closed";

  return (
    <section className="mb-4 rounded-lg border bg-card p-4" aria-label="Appel vocal">
      <div className="flex flex-wrap items-center gap-2">
        {idle ? (
          <Button onClick={() => { setCaptions([]); voice.start(); }}>
            <Phone /> Parler à l'agent
          </Button>
        ) : (
          <>
            <Button variant="destructive" onClick={voice.stop} disabled={voice.status === "stopping"}>
              <PhoneOff /> Raccrocher
            </Button>
            <Button variant="outline" onClick={() => voice.setMuted(!voice.muted)} disabled={voice.status !== "connected"}>
              {voice.muted ? <MicOff /> : <Mic />} {voice.muted ? "Micro coupé" : "Couper le micro"}
            </Button>
          </>
        )}
        {voice.playbackBlocked && (
          <Button variant="secondary" onClick={voice.resumePlayback}>
            <Volume2 /> Activer le son
          </Button>
        )}
        <span role="status" className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground">
          {voice.status === "connected" && <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden />}
          {{ idle: "Prêt", connecting: "Connexion…", connected: "Micro actif — appel en cours", stopping: "Fin de l'appel…", closed: "Appel terminé" }[voice.status as string] ?? voice.status}
          {working && <Loader2 className="size-4 animate-spin" aria-label="L'agent travaille" />}
        </span>
      </div>
      {voice.error && <p role="alert" className="mt-2 text-sm text-destructive">{voice.error}</p>}
      <audio ref={voice.audioRef} className="sr-only" />
      {captions.length > 0 && (
        <div className="mt-3 space-y-1 text-sm" aria-live="polite">
          {captions.map((c, i) => (
            <p key={i} className={c.role === "user" ? "text-muted-foreground" : ""}>
              <span className="eyebrow mr-2">{c.role === "user" ? "Vous" : "Agent"}</span>
              {c.text}
            </p>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Le micro n'est utilisé que pendant l'appel. L'appel vocal est facturé à la durée.</p>
    </section>
  );
}

export function AgentChat() {
  const messages = useApex((s) => s.messages);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = useServerFn(sendAgentMessage);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);

  async function submit() {
    const t = text.trim().slice(0, 4000);
    if (!t || busy) return;
    setText("");
    setBusy(true);
    actions.appendMessages([{ id: `tmp-${Date.now()}`, role: "user", content: t, created_at: new Date().toISOString() }]);
    try {
      const r = await send({ data: { content: t } });
      await syncAll();
      if (!r.ok) {
        toast.error(r.error);
        setText(t);
      }
    } catch {
      await syncAll();
      toast.error("Envoi impossible.");
      setText(t);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const visible = messages.filter((m) => m.content);
  return (
    <div className="flex min-h-[60vh] flex-col">
      <VoicePanel />
      <div className="flex-1 space-y-3 overflow-y-auto pb-2" aria-live="polite">
        {visible.length === 0 && !busy ? (
          <EmptyState icon={Bot} title="Quelle mission voulez-vous que je prépare ?" body="Décrivez votre idée : thème, zone, budget, horizon. Je résume puis je vous demande confirmation avant de créer quoi que ce soit." />
        ) : (
          visible.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">{m.content}</div>
            ) : (
              <div key={m.id} className="max-w-[90%] text-sm leading-relaxed [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ),
          )
        )}
        {busy && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> L'agent réfléchit…
          </p>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="sticky bottom-16 mt-2 flex gap-2 bg-background py-2 md:bottom-0">
        <Textarea ref={inputRef} autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder="Écrire à l'agent…" aria-label="Message" className="min-h-11 resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }} />
        <Button type="submit" size="icon" aria-label="Envoyer" disabled={busy || !text.trim()}><Send /></Button>
      </form>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHeader } from "@/components/apex/ui";
import { actions, useApex } from "@/lib/apex/store";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "Assistant — APEX" }, { name: "description", content: "Assistant contextuel APEX." }, { property: "og:title", content: "Assistant — APEX" }, { property: "og:description", content: "Assistant contextuel APEX." }] }),
  component: Assistant,
});

function Assistant() {
  const messages = useApex((s) => s.messages);
  const ctx = { m: useApex((s) => s.missions.length), a: useApex((s) => s.approvals.filter((x) => x.status === "pending").length) };
  const [text, setText] = useState("");

  const send = async () => {
    const t = text.trim().slice(0, 4000);
    if (!t) return;
    setText("");
    try {
      await actions.sendMessage(t);
      actions.addLocalAssistantNote(`L'assistant IA n'est pas encore branché. Contexte connu : ${ctx.m} mission(s), ${ctx.a} action(s) requise(s).`);
    } catch {
      setText(t);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col md:h-[calc(100vh-6rem)]">
      <PageHeader eyebrow="Assistant" title="Assistant contextuel" action={messages.length > 0 && <Button variant="ghost" onClick={actions.clearMessages}>Effacer</Button>} />
      <div className="flex-1 space-y-3 overflow-y-auto" aria-live="polite">
        {messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="Posez une question" body="Par exemple : « Quelle opportunité tester en premier ? »" />
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "border bg-card"}`}>{m.content}</div>
          ))
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-2">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder="Votre message" aria-label="Message" className="min-h-11 resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <Button type="submit" size="icon" aria-label="Envoyer"><Send /></Button>
      </form>
    </div>
  );
}

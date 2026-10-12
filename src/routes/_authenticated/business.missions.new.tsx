import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel } from "@/components/apex/ui";
import { actions } from "@/lib/apex/store";
import { DEFAULT_WEIGHTS, WEIGHT_KEYS, WEIGHT_LABELS, missionInputSchema, type Weights } from "@/lib/apex/types";
import { weightsTotal } from "@/lib/apex/scoring";

export const Route = createFileRoute("/_authenticated/business/missions/new")({
  head: () => ({ meta: [{ title: "Nouvelle mission — APEX" }, { name: "description", content: "Créer une mission de recherche." }, { property: "og:title", content: "Nouvelle mission — APEX" }, { property: "og:description", content: "Créer une mission de recherche." }] }),
  component: NewMission,
});

const sel = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm";

function NewMission() {
  const navigate = useNavigate();
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const total = weightsTotal(weights);

  function submit(e: React.FormEvent<HTMLFormElement>, launch: boolean) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = missionInputSchema.safeParse({
      title: fd.get("title"),
      theme: fd.get("theme"),
      region: fd.get("region"),
      budget_min: Number(fd.get("budget_min")),
      budget_max: Number(fd.get("budget_max")),
      currency: fd.get("currency"),
      skills: String(fd.get("skills") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      horizon: fd.get("horizon"),
      success_criteria: fd.get("success_criteria") ?? "",
      weights,
    });
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[String(i.path[0] ?? "form")] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    const m = actions.createMission(r.data);
    if (launch) actions.transition(m.id, "launch");
    toast.success(launch ? "Mission lancée" : "Brouillon enregistré");
    navigate({ to: "/business/missions/$id", params: { id: m.id } });
  }

  const field = (name: string, label: string, el: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {el}
      {errors[name] && <p role="alert" className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <>
      <PageHeader eyebrow="Business" title="Nouvelle mission" />
      <form
        onSubmit={(e) => submit(e, (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "launch")}
        className="space-y-4"
      >
        <Panel className="grid gap-4 md:grid-cols-2">
          {field("title", "Titre", <Input id="title" name="title" className="h-11" />)}
          {field("theme", "Thème", <Input id="theme" name="theme" className="h-11" />)}
          {field("region", "Zone géographique", <Input id="region" name="region" className="h-11" placeholder="ex. Québec" />)}
          {field("horizon", "Horizon", <select id="horizon" name="horizon" className={sel} defaultValue="3 mois">{["1 mois", "3 mois", "6 mois", "12 mois"].map((h) => <option key={h}>{h}</option>)}</select>)}
          {field("budget_min", "Budget minimum", <Input id="budget_min" name="budget_min" type="number" min={0} defaultValue={0} className="h-11" />)}
          {field("budget_max", "Budget maximum", <Input id="budget_max" name="budget_max" type="number" min={0} defaultValue={1000} className="h-11" />)}
          {field("currency", "Devise", <select id="currency" name="currency" className={sel} defaultValue="EUR">{["EUR", "USD", "CAD", "CHF", "GBP"].map((c) => <option key={c}>{c}</option>)}</select>)}
          {field("skills", "Compétences (séparées par des virgules)", <Input id="skills" name="skills" className="h-11" />)}
          <div className="md:col-span-2">{field("success_criteria", "Critères de réussite", <Textarea id="success_criteria" name="success_criteria" rows={3} />)}</div>
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Pondérations</h2>
            <span className={`font-mono text-sm ${total === 100 ? "text-success" : "text-destructive"}`} aria-live="polite">Total {total} / 100</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {WEIGHT_KEYS.map((k) => (
              <label key={k} className="flex items-center justify-between gap-3 text-sm">
                <span>{WEIGHT_LABELS[k]}</span>
                <Input type="number" min={0} max={100} value={weights[k]} onChange={(e) => setWeights({ ...weights, [k]: Math.max(0, Number(e.target.value) || 0) })} className="h-11 w-20 text-right font-mono" />
              </label>
            ))}
          </div>
          {errors["weights"] && <p role="alert" className="mt-2 text-xs text-destructive">{errors["weights"]}</p>}
          <Button type="button" variant="ghost" className="mt-2" onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}>Rétablir les valeurs par défaut</Button>
        </Panel>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" variant="outline" value="draft">Enregistrer le brouillon</Button>
          <Button type="submit" value="launch">Créer et lancer</Button>
        </div>
      </form>
    </>
  );
}

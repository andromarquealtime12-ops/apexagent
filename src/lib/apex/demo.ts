import { DEFAULT_WEIGHTS, type Alert, type Approval, type HomeEvent, type Mission, type Opportunity, type WeightKey } from "./types";

const SIM = "hypothèse simulée";
const iso = (minAgo: number) => new Date(Date.now() - minAgo * 60000).toISOString();

export function buildDemo() {
  const m1: Mission = {
    id: "demo-m1",
    title: "[Démonstration] Services B2B locaux",
    theme: "Services aux PME",
    region: "Québec",
    budget_min: 500,
    budget_max: 5000,
    currency: "CAD",
    skills: ["Rédaction", "Automatisation"],
    horizon: "3 mois",
    success_criteria: "Premier client payant en 60 jours.",
    weights: { ...DEFAULT_WEIGHTS },
    status: "completed",
    progress: 100,
    created_at: iso(3000),
    updated_at: iso(2800),
    demo: true,
    history: [
      { at: iso(3000), from: null, to: "draft" },
      { at: iso(2990), from: "draft", to: "queued" },
      { at: iso(2985), from: "queued", to: "running" },
      { at: iso(2800), from: "running", to: "completed" },
    ],
  };
  const m2: Mission = { ...m1, id: "demo-m2", title: "[Démonstration] Produits numériques éducatifs", theme: "Éducation", status: "paused", progress: 42, history: [...m1.history.slice(0, 3), { at: iso(100), from: "running", to: "paused" }] };

  const opp = (id: string, title: string, url: string, c: Record<WeightKey, number>, conf: number): Opportunity => ({
    id,
    mission_id: m1.id,
    title: `[Démonstration] ${title}`,
    summary: `Résumé fictif (${SIM}).`,
    url,
    facts: [`Fait fictif — ${SIM}`],
    inferences: ["Inférence fictive à partir du fait ci-dessus."],
    hypotheses: ["La demande existe localement."],
    projections: ["10 clients en 6 mois (projection fictive)."],
    confidence: conf,
    risks: ["Concurrence non évaluée"],
    missing_data: ["Prix pratiqués par les concurrents"],
    next_experiment: "Page d'attente + 20 messages ciblés.",
    sources: [{ url, publisher: "Exemple (fictif)", accessed_at: iso(2900) }],
    criteria: c,
    demo: true,
    created_at: iso(2800),
  });
  const opportunities = [
    opp("demo-o1", "Rédaction de fiches produits", "https://example.com/a", { owner_fit: 9, verifiable_demand: 6, startup_cost: 9, validation_speed: 8, margin: 6, regulatory_safety: 9, differentiation: 4, recurrence: 7 }, 0.55),
    opp("demo-o2", "Automatisation de devis", "https://example.org/b", { owner_fit: 7, verifiable_demand: 7, startup_cost: 7, validation_speed: 6, margin: 8, regulatory_safety: 8, differentiation: 7, recurrence: 8 }, 0.48),
    opp("demo-o3", "Veille d'appels d'offres", "https://example.net/c", { owner_fit: 6, verifiable_demand: 8, startup_cost: 6, validation_speed: 5, margin: 7, regulatory_safety: 7, differentiation: 6, recurrence: 9 }, 0.4),
  ];

  const approvals: Approval[] = [
    {
      id: "demo-a1",
      status: "pending",
      action: "Créer un compte sur une plateforme d'annonces",
      target: "example.com (fictif)",
      impact: "Publication d'une page d'attente visible publiquement",
      cost: "0 $",
      data: "Nom d'affichage, adresse courriel",
      evidence: [`Opportunité « Rédaction de fiches produits » — ${SIM}`],
      choices: ["Approuver", "Refuser"],
      recommendation: "Approuver : test peu coûteux et réversible.",
      next_step: "APEX prépare la page sans la publier avant une seconde validation.",
      expires_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      created_at: iso(60),
      demo: true,
    },
  ];

  const alerts: Alert[] = [
    { id: "demo-al1", at: iso(60), kind: "approval", title: "[Démonstration] Action requise", body: "Création de compte en attente.", read: false, demo: true },
    { id: "demo-al2", at: iso(2800), kind: "business", title: "[Démonstration] Mission terminée", body: "3 opportunités simulées.", read: false, demo: true },
  ];
  const homeEvents: HomeEvent[] = [{ id: "demo-e1", session_id: "demo-s1", at: iso(400), confidence: 0.62, demo: true }];
  return { missions: [m1, m2], opportunities, approvals, alerts, homeEvents };
}

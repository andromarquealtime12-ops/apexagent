import type { ReactNode } from "react";
import { AlertTriangle, Ban, CheckCircle2, CircleDashed, Clock, Loader2, Pause, PlayCircle, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalStatus, MissionStatus } from "@/lib/apex/types";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";
const toneCls: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/10 text-info border-info/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusPill({ tone, icon: Icon, label, spin }: { tone: Tone; icon: LucideIcon; label: string; spin?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", toneCls[tone])}>
      <Icon className={cn("size-3.5", spin && "animate-spin")} aria-hidden />
      {label}
    </span>
  );
}

const MISSION: Record<MissionStatus, [Tone, LucideIcon, string]> = {
  draft: ["neutral", CircleDashed, "Brouillon"],
  queued: ["info", Clock, "En file"],
  running: ["info", Loader2, "En cours"],
  paused: ["warning", Pause, "Suspendue"],
  completed: ["success", CheckCircle2, "Terminée"],
  failed: ["danger", AlertTriangle, "Échec"],
  cancelled: ["neutral", Ban, "Annulée"],
};
export function MissionStatusPill({ status }: { status: MissionStatus }) {
  const [t, i, l] = MISSION[status];
  return <StatusPill tone={t} icon={i} label={l} spin={status === "running"} />;
}

const APPROVAL: Record<ApprovalStatus, [Tone, LucideIcon, string]> = {
  pending: ["warning", PlayCircle, "Action requise"],
  approved: ["success", CheckCircle2, "Approuvée"],
  rejected: ["danger", XCircle, "Refusée"],
  expired: ["neutral", Clock, "Expirée"],
  cancelled: ["neutral", Ban, "Annulée"],
};
export function ApprovalStatusPill({ status }: { status: ApprovalStatus }) {
  const [t, i, l] = APPROVAL[status];
  return <StatusPill tone={t} icon={i} label={l} />;
}

export function DemoTag({ show }: { show?: boolean | undefined }) {
  if (!show) return null;
  return <span className="eyebrow rounded border border-dashed border-warning/50 px-1.5 py-0.5 text-warning">Démonstration</span>;
}

export function PageHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed bg-card px-6 py-10 text-center">
      <Icon className="mb-3 size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("min-w-0 rounded-lg border bg-card p-4", className)}>{children}</section>;
}

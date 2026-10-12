import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Briefcase, Home, LayoutDashboard, LogOut, MessageSquare, Settings, ShieldCheck, WifiOff } from "lucide-react";
import { actions, useApex } from "@/lib/apex/store";

const PRIMARY = [
  { to: "/", label: "Accueil", icon: LayoutDashboard, exact: true },
  { to: "/business/missions", label: "Business", icon: Briefcase },
  { to: "/home", label: "Maison", icon: Home },
  { to: "/alerts", label: "Alertes", icon: Bell },
  { to: "/settings", label: "Réglages", icon: Settings },
] as const;
const EXTRA = [
  { to: "/approvals", label: "Action requise", icon: ShieldCheck },
  { to: "/assistant", label: "Assistant", icon: MessageSquare },
] as const;

function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(navigator.onLine);
    const a = () => setOn(true);
    const b = () => setOn(false);
    window.addEventListener("online", a);
    window.addEventListener("offline", b);
    return () => {
      window.removeEventListener("online", a);
      window.removeEventListener("offline", b);
    };
  }, []);
  return on;
}

export function AppShell({ children }: { children: ReactNode }) {
  const unread = useApex((s) => s.alerts.filter((a) => !a.read).length);
  const pending = useApex((s) => s.approvals.filter((a) => a.status === "pending").length);
  const email = useApex((s) => s.session?.email);
  const online = useOnline();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => actions.tick(), 1500);
    return () => clearInterval(t);
  }, []);

  const badge = (to: string) => (to === "/alerts" ? unread : to === "/approvals" ? pending : 0);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded bg-sidebar-primary font-mono text-sm font-bold text-sidebar-primary-foreground">A</span>
          <span className="font-semibold tracking-wide">APEX</span>
        </div>
        <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-1">
          {[...PRIMARY, ...EXTRA].map((i) => (
            <Link
              key={i.to}
              to={i.to}
              activeOptions={{ exact: "exact" in i && i.exact }}
              className="tap flex items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
            >
              <i.icon className="size-4" aria-hidden />
              <span className="flex-1">{i.label}</span>
              {badge(i.to) > 0 && <span className="rounded-full bg-sidebar-primary px-1.5 text-xs font-semibold text-sidebar-primary-foreground">{badge(i.to)}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border pt-3">
          <p className="truncate px-2 text-xs text-sidebar-foreground/60">{email}</p>
          <button
            onClick={() => {
              actions.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="tap mt-1 flex w-full items-center gap-3 rounded-md px-3 text-sm hover:bg-sidebar-accent"
          >
            <LogOut className="size-4" aria-hidden /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        {!online && (
          <div role="status" className="flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm text-warning-foreground">
            <WifiOff className="size-4" aria-hidden /> Hors ligne — les données affichées peuvent être anciennes.
          </div>
        )}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur md:hidden">
          <span className="font-semibold tracking-wide">APEX</span>
          <div className="flex gap-1">
            {EXTRA.map((i) => (
              <Link key={i.to} to={i.to} aria-label={i.label} className="tap relative grid place-items-center rounded-md hover:bg-muted data-[status=active]:text-primary">
                <i.icon className="size-5" aria-hidden />
                {badge(i.to) > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning" aria-label={`${badge(i.to)} en attente`} />}
              </Link>
            ))}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">{children}</main>
        <nav aria-label="Navigation principale" className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card md:hidden">
          {PRIMARY.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              activeOptions={{ exact: "exact" in i && i.exact }}
              className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground data-[status=active]:font-semibold data-[status=active]:text-primary"
            >
              <i.icon className="size-5" aria-hidden />
              {i.label}
              {badge(i.to) > 0 && <span className="absolute right-[28%] top-1.5 min-w-4 rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{badge(i.to)}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

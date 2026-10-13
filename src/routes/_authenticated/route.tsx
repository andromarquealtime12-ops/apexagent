import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/apex/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getState, subscribeRealtime, syncAll, useApex } from "@/lib/apex/store";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    if (!getState().session) await syncAll();
  },
  component: Layout,
});

function Layout() {
  const ready = useApex((s) => s.ready);
  const userId = useApex((s) => s.session?.userId);
  useEffect(() => {
    if (!userId) return;
    return subscribeRealtime(userId);
  }, [userId]);

  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-label="Chargement" />
      </div>
    );
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

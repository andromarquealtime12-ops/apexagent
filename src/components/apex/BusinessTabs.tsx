import { Link } from "@tanstack/react-router";
import { Bot, Briefcase, GitCompare, History } from "lucide-react";

export function BusinessTabs() {
  const cls = "tap inline-flex items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted data-[status=active]:bg-accent data-[status=active]:text-accent-foreground";
  return (
    <nav aria-label="Business" className="mb-5 flex gap-1 overflow-x-auto">
      <Link to="/business/assistant" className={cls}><Bot className="size-4" />Agent</Link>
      <Link to="/business/missions" activeOptions={{ exact: true }} className={cls}><Briefcase className="size-4" />Missions</Link>
      <Link to="/business/compare" className={cls}><GitCompare className="size-4" />Comparer</Link>
      <Link to="/business/history" className={cls}><History className="size-4" />Historique</Link>
    </nav>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/apex/ui";
import { BusinessTabs } from "@/components/apex/BusinessTabs";
import { AgentChat } from "@/components/apex/AgentChat";

export const Route = createFileRoute("/_authenticated/business/assistant")({
  head: () => ({ meta: [{ title: "Agent Business — APEX" }, { name: "description", content: "Discutez avec l'agent APEX à l'écrit ou à la voix." }, { property: "og:title", content: "Agent Business — APEX" }, { property: "og:description", content: "Discutez avec l'agent APEX à l'écrit ou à la voix." }] }),
  component: () => (
    <>
      <PageHeader eyebrow="Business" title="Agent" />
      <BusinessTabs />
      <AgentChat />
    </>
  ),
});

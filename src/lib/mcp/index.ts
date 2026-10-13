import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMissions from "./tools/list-missions";
import getMission from "./tools/get-mission";
import createMission from "./tools/create-mission";

// Direct Supabase issuer (build-time ref); the sentinel only serves manifest extraction.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "apexagent",
  title: "Apexagent",
  version: "0.1.0",
  instructions:
    "Outils APEX pour consulter et créer les missions Business de l'utilisateur connecté. Toujours demander une confirmation explicite avant de créer une mission.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMissions, getMission, createMission],
});

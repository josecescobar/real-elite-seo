import { createFileRoute } from "@tanstack/react-router";
import { LocalSeoScreen } from "@/client/features/real-elite/screens";

export const Route = createFileRoute("/_app/p/$projectId/local-seo")({
  component: LocalSeoRoute,
});

function LocalSeoRoute() {
  return <LocalSeoScreen />;
}

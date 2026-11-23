import { createFileRoute } from "@tanstack/react-router";
import { WebsiteHealthScreen } from "@/client/features/real-elite/screens";

export const Route = createFileRoute("/_app/p/$projectId/website-health")({
  component: WebsiteHealthRoute,
});

function WebsiteHealthRoute() {
  return <WebsiteHealthScreen />;
}

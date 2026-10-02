import { createFileRoute } from "@tanstack/react-router";
import { RealEliteOverview } from "@/client/features/real-elite/screens";

export const Route = createFileRoute("/_app/p/$projectId/")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return <RealEliteOverview />;
}

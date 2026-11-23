import { createFileRoute } from "@tanstack/react-router";
import { GoogleSearchScreen } from "@/client/features/real-elite/screens";

export const Route = createFileRoute("/_app/p/$projectId/google-search")({
  component: GoogleSearchRoute,
});

function GoogleSearchRoute() {
  return <GoogleSearchScreen />;
}

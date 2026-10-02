import { createFileRoute } from "@tanstack/react-router";
import { ActionItemsScreen } from "@/client/features/real-elite/screens";

export const Route = createFileRoute("/_app/p/$projectId/action-items")({
  component: ActionItemsRoute,
});

function ActionItemsRoute() {
  return <ActionItemsScreen />;
}

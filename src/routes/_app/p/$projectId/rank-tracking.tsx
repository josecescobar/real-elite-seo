import { createFileRoute } from "@tanstack/react-router";
import { PlannedPaid } from "@/client/features/real-elite/DataWidget";

export const Route = createFileRoute("/_app/p/$projectId/rank-tracking")({
  component: RankTrackingLayout,
});

function RankTrackingLayout() {
  return (
    <PlannedPaid
      title="Rank Tracking"
      detail="DataForSEO rank tracking. Disabled in the local Real Elite prototype."
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PlannedPaid } from "@/client/features/real-elite/DataWidget";
import { SamChat } from "@/client/features/sam/SamChat";

const samSearchSchema = z.object({
  // Active session id. Omitted until a session is selected/created.
  s: z.string().optional(),
});

export const Route = createFileRoute("/_app/p/$projectId/sam")({
  validateSearch: samSearchSchema,
  component: function DisabledSam() {
    return (
      <PlannedPaid
        title="SAM"
        detail="OpenRouter is pay-per-use. Disabled in the local Real Elite prototype."
      />
    );
  },
});

function SamRoute() {
  const { projectId } = Route.useParams();
  const { s } = Route.useSearch();
  return <SamChat projectId={projectId} activeSessionId={s} />;
}

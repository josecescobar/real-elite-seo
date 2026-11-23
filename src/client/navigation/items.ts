import {
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  MapPin,
} from "lucide-react";
import { linkOptions } from "@tanstack/react-router";
import { GoogleGlyphMuted } from "@/client/features/gsc/GoogleGlyph";

const projectNavItems = [
  {
    to: "/p/$projectId" as const,
    label: "Overview",
    icon: LayoutDashboard,
    // Without exact matching, the index path is a prefix of every project
    // route and Overview would render active everywhere.
    activeOptions: { exact: true, includeSearch: false },
  },
  {
    to: "/p/$projectId/google-search" as const,
    label: "Google Search Performance",
    icon: GoogleGlyphMuted,
  },
  {
    to: "/p/$projectId/website-health" as const,
    label: "Website Health",
    icon: ClipboardCheck,
  },
  {
    to: "/p/$projectId/local-seo" as const,
    label: "Local SEO",
    icon: MapPin,
  },
  {
    to: "/p/$projectId/action-items" as const,
    label: "Action Items",
    icon: ListChecks,
  },
] as const;

// Shown only when no project is selected yet.
export const connectNavGroup = {
  label: "Real Elite",
  items: [],
};

function getProjectNavItems(projectId: string) {
  return linkOptions(
    projectNavItems.map((item) => ({
      ...item,
      params: { projectId },
      search: {},
    })),
  );
}

export function getProjectNavGroups(projectId: string) {
  return [
    {
      label: "Real Elite",
      items: getProjectNavItems(projectId),
    },
  ];
}

export const dataforseoHelpLinkOptions = linkOptions({
  to: "/help/dataforseo-api-key",
});

import * as React from "react";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SeoApiStatusBanners } from "@/client/layout/AppShellParts";
import { Sidebar } from "@/client/components/Sidebar";
import { getLastProjectId } from "@/client/lib/active-project";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/client/components/ui/sidebar";

export function AuthenticatedAppLayout({
  children,
  projectId,
  ready,
  banner,
}: {
  children: React.ReactNode;
  projectId?: string;
  /** The session is confirmed. Until then the shell renders but loads nothing. */
  ready: boolean;
  banner?: React.ReactNode;
}) {
  // On non-project pages (e.g. /settings) there's no projectId in the URL, so
  // derive one for the nav/switcher: prefer the last-visited project, else the
  // most recent. The whole app tree is client-only (see root ClientOnly), so we
  // can read localStorage synchronously during render — this lets the sidebar
  // show the full project nav on the very first paint instead of briefly
  // flashing only the always-visible Connect group while projects load. It is
  // read on every render, not once: the shell stays mounted across project
  // pages, which update the remembered project as the user moves between them.
  const projectsQuery = useQuery({
    ...projectsQueryOptions(),
    enabled: ready && !projectId,
  });
  const rememberedProjectId = getLastProjectId();
  const fallbackProjects = projectsQuery.data ?? [];
  const fallbackProjectId =
    fallbackProjects.find((project) => project.id === rememberedProjectId)
      ?.id ??
    fallbackProjects[0]?.id ??
    null;
  // Once the projects list loads, fallbackProjectId is the validated choice
  // (remembered-if-valid, else most recent). Before it loads, fall back to the
  // remembered id so the project nav renders immediately; a stale id here only
  // builds links that self-correct via the route guard once data arrives.
  const sidebarProjectId =
    projectId ?? fallbackProjectId ?? rememberedProjectId;
  // No project to show yet, but the list that may name one is still loading
  // (a first visit to a page without a project in the URL).
  const sidebarProjectPending =
    sidebarProjectId === null && projectsQuery.isPending;
  // Real Elite v1 keeps DataForSEO off, so the paid-key nag stays hidden.

  return (
    <SidebarProvider className="h-[100dvh] min-h-0 overflow-hidden">
      <Sidebar
        projectId={sidebarProjectId}
        projectPending={sidebarProjectPending}
        ready={ready}
      />
      <SidebarInset className="min-h-0 overflow-hidden md:!m-0 md:!mt-2 md:!rounded-none md:!rounded-tl-lg md:border-l md:border-t md:border-sidebar-border md:!shadow-none">
        <MobileTopBar />
        <SeoApiStatusBanners
          shouldShowSeoApiWarning={false}
          seoApiKeyStatusError={false}
        />
        {banner}
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MobileTopBar() {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-2 py-1.5 md:hidden">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Link to="/" className="ml-1 font-semibold text-foreground">
        Real Elite SEO
      </Link>
    </div>
  );
}

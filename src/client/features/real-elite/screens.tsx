import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  BaselineFile,
  GoogleWidget,
} from "@/server/features/real-elite/parse";
import { DataWidget } from "./DataWidget";

type Snapshot = {
  generatedAt: string;
  site: string;
  google: {
    oauth: "configured" | "missing";
    missingEnv: string[];
    searchConsole: GoogleWidget;
    ga4: GoogleWidget;
  };
  baselineFile: string | null;
  baselineDir: string;
  baseline: BaselineFile;
  actions: {
    state: "ok" | "unavailable" | "error";
    source: string;
    refreshedAt: string | null;
    detail?: string;
    openCount: number;
    items: Array<{
      identifier: string;
      title: string;
      status: string;
      assignee: string;
      verifyStep: string | null;
    }>;
  };
  planned: Array<{ title: string; detail: string }>;
  costs: { ongoingUsd: number; detail: string };
};

type PageSpeed = {
  state: "ok" | "no_data";
  source: string;
  strategy: string;
  url: string;
  refreshedAt: string | null;
  performanceScore: number | null;
  detail: string | null;
  crux: {
    state: "ok" | "no_data";
    source: string;
    overallCategory?: string;
    detail?: string;
    refreshedAt: string | null;
  };
};

function useSnapshot() {
  return useQuery({
    queryKey: ["real-elite-snapshot"],
    queryFn: async () => {
      const response = await fetch("/api/real-elite/snapshot");
      if (!response.ok) throw new Error("Snapshot request failed");
      return (await response.json()) as Snapshot;
    },
  });
}

function usePageSpeed() {
  return useQuery({
    queryKey: ["real-elite-pagespeed"],
    queryFn: async () => {
      const response = await fetch("/api/real-elite/snapshot?section=pagespeed");
      if (!response.ok) throw new Error("PageSpeed request failed");
      return (await response.json()) as PageSpeed;
    },
  });
}

function Screen({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function Loading() {
  return <p className="text-sm text-muted-foreground">Loading…</p>;
}

export function RealEliteOverview() {
  const snapshot = useSnapshot();
  if (snapshot.isPending) {
    return (
      <Screen title="Overview" description="realelitecontracting.com">
        <Loading />
      </Screen>
    );
  }
  if (snapshot.isError || !snapshot.data) {
    return (
      <Screen title="Overview" description="realelitecontracting.com">
        <DataWidget title="Workspace" source="Local prototype" refreshedAt={null} empty />
      </Screen>
    );
  }
  const data = snapshot.data;
  const crawl = data.baseline.crawl;
  return (
    <Screen
      title="Overview"
      description={`${data.site} · local prototype · ongoing cost $${data.costs.ongoingUsd}`}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <DataWidget
          title="Live Search Console"
          source="Google Search Console API (free OAuth)"
          refreshedAt={data.google.searchConsole.refreshedAt}
          empty={data.google.searchConsole.state !== "ok"}
          note={
            data.google.searchConsole.state === "ok"
              ? null
              : data.google.searchConsole.detail
          }
        >
          {data.google.searchConsole.summary ? (
            <p>{data.google.searchConsole.summary}</p>
          ) : null}
        </DataWidget>
        <DataWidget
          title="Live GA4"
          source="Google Analytics Data API (free OAuth)"
          refreshedAt={data.google.ga4.refreshedAt}
          empty={data.google.ga4.state !== "ok"}
          note={data.google.ga4.state === "ok" ? null : data.google.ga4.detail}
        >
          {data.google.ga4.summary ? <p>{data.google.ga4.summary}</p> : null}
        </DataWidget>
        <DataWidget
          title="Own crawl"
          source={crawl?.source ?? data.baselineDir}
          refreshedAt={crawl?.refreshedAt ?? null}
          empty={!crawl}
        >
          {crawl ? (
            <p>
              {crawl.pagesCrawled} of {crawl.pagesLimit} pages · status {crawl.status}
            </p>
          ) : null}
        </DataWidget>
        <DataWidget
          title="Action items"
          source={data.actions.source}
          refreshedAt={data.actions.refreshedAt}
          empty={data.actions.state !== "ok"}
        >
          <p>
            {data.actions.openCount} open issues on the Real Elite SEO project
          </p>
        </DataWidget>
      </div>
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">Planned (paid)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.planned.map((item) => (
            <li key={item.title}>
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground"> — {item.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">{data.costs.detail}</p>
      </section>
    </Screen>
  );
}

export function GoogleSearchScreen() {
  const snapshot = useSnapshot();
  if (snapshot.isPending) {
    return (
      <Screen title="Google Search Performance" description="Search Console and GA4">
        <Loading />
      </Screen>
    );
  }
  if (!snapshot.data) {
    return (
      <Screen title="Google Search Performance" description="Search Console and GA4">
        <DataWidget title="Search Console" source="Google Search Console API" refreshedAt={null} empty />
      </Screen>
    );
  }
  const data = snapshot.data;
  const frozen = data.baseline.searchConsoleMobileFrozen;
  return (
    <Screen
      title="Google Search Performance"
      description="Search Console and GA4 follow the connection stored for this local project. An OAuth client in the environment does not fill these widgets, and this screen does not start a sign-in. The frozen baseline is a separate, dated export."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <DataWidget
          title="Live Search Console"
          source="Google Search Console API (free OAuth)"
          refreshedAt={data.google.searchConsole.refreshedAt}
          empty={data.google.searchConsole.state !== "ok"}
          note={
            data.google.searchConsole.state === "ok"
              ? null
              : data.google.searchConsole.detail
          }
        >
          {data.google.searchConsole.summary ? (
            <p>{data.google.searchConsole.summary}</p>
          ) : null}
        </DataWidget>
        <DataWidget
          title="Live GA4"
          source="Google Analytics Data API (free OAuth)"
          refreshedAt={data.google.ga4.refreshedAt}
          empty={data.google.ga4.state !== "ok"}
          note={data.google.ga4.state === "ok" ? null : data.google.ga4.detail}
        >
          {data.google.ga4.summary ? <p>{data.google.ga4.summary}</p> : null}
        </DataWidget>
        <DataWidget
          title="OAuth client"
          source="Local environment (values are not shown)"
          refreshedAt={data.generatedAt}
          empty={false}
        >
          <p>
            {data.google.oauth === "configured"
              ? "Configured"
              : `Missing: ${data.google.missingEnv.join(", ")}`}
          </p>
          <p className="mt-2 text-muted-foreground">{data.google.searchConsole.detail}</p>
          <p className="mt-2 text-muted-foreground">{data.google.ga4.detail}</p>
        </DataWidget>
        <DataWidget
          title="Frozen mobile baseline"
          source={frozen?.source ?? "No baseline export"}
          refreshedAt={frozen?.refreshedAt ?? null}
          empty={!frozen}
        >
          {frozen ? (
            <p>
              {frozen.clicks} clicks · {frozen.impressions} impressions · {frozen.device} ·{" "}
              {frozen.windowStart} to {frozen.windowEnd}
            </p>
          ) : null}
        </DataWidget>
      </div>
    </Screen>
  );
}

export function WebsiteHealthScreen() {
  const snapshot = useSnapshot();
  const pagespeed = usePageSpeed();
  const crawl = snapshot.data?.baseline.crawl ?? null;
  return (
    <Screen
      title="Website Health"
      description="Own crawl export, PageSpeed, and Chrome UX Report. Nothing here is invented when a source is missing."
    >
      {snapshot.isPending ? <Loading /> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <DataWidget
          title="Crawl"
          source={crawl?.source ?? snapshot.data?.baselineDir ?? "Baseline JSON"}
          refreshedAt={crawl?.refreshedAt ?? null}
          empty={!crawl}
        >
          {crawl ? (
            <div className="space-y-2">
              <p>
                Audit {crawl.auditId} · {crawl.status} · {crawl.pagesCrawled} of{" "}
                {crawl.pagesLimit} pages
              </p>
              <p>
                Missing titles {crawl.missingTitles} · missing descriptions{" "}
                {crawl.missingDescriptions} · duplicate titles {crawl.duplicateTitles} ·
                duplicate descriptions {crawl.duplicateDescriptions} · Lighthouse runs{" "}
                {crawl.lighthouseRuns}
              </p>
              <p>
                Not in the sitemap:{" "}
                {crawl.notInSitemap.length === 0
                  ? "None in this export"
                  : crawl.notInSitemap.join(", ")}
              </p>
              <p>
                Service URLs outside this crawl:{" "}
                {crawl.serviceUrlsOutsideThisCrawl.length === 0
                  ? "None in this export"
                  : crawl.serviceUrlsOutsideThisCrawl.join(", ")}
              </p>
            </div>
          ) : null}
        </DataWidget>
        <DataWidget
          title="PageSpeed (mobile lab)"
          source={pagespeed.data?.source ?? "PageSpeed Insights API (free)"}
          refreshedAt={pagespeed.isPending ? null : (pagespeed.data?.refreshedAt ?? null)}
          empty={!pagespeed.isPending && pagespeed.data?.performanceScore == null}
          note={pagespeed.isPending ? null : pagespeed.data?.detail}
        >
          {pagespeed.isPending ? (
            <p>Checking PageSpeed…</p>
          ) : (
            <p>
              {Math.round((pagespeed.data?.performanceScore ?? 0) * 100)} mobile
              performance score
            </p>
          )}
        </DataWidget>
        <DataWidget
          title="Chrome UX Report"
          source={pagespeed.data?.crux.source ?? "Chrome UX Report"}
          refreshedAt={pagespeed.data?.crux.refreshedAt ?? null}
          empty={!pagespeed.isPending && pagespeed.data?.crux.state !== "ok"}
          note={
            pagespeed.isPending ? null : (pagespeed.data?.crux.detail ?? null)
          }
        >
          {pagespeed.isPending ? (
            <p>Checking PageSpeed…</p>
          ) : (
            <p>Field-data category: {pagespeed.data?.crux.overallCategory}</p>
          )}
        </DataWidget>
      </div>
    </Screen>
  );
}

export function LocalSeoScreen() {
  const snapshot = useSnapshot();
  const grids = snapshot.data?.baseline.localGrids ?? null;
  const listing = snapshot.data?.baseline.listingSnapshot ?? null;
  return (
    <Screen
      title="Local SEO"
      description="Live Google Business Profile is not connected. The grid below is the 2026-10-01 snapshot, not a new paid pull."
    >
      {snapshot.isPending ? <Loading /> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <DataWidget
          title="Google Business Profile API"
          source="Google Business Profile API (free, not connected)"
          refreshedAt={null}
          empty
        />
        <DataWidget
          title="New Maps grids"
          source="DataForSEO"
          refreshedAt={null}
          empty={false}
        >
          <p>Planned (paid). Disabled. This prototype does not buy new grids.</p>
        </DataWidget>
        <DataWidget
          title="Maps listing snapshot"
          source={listing?.source ?? "No baseline export"}
          refreshedAt={listing?.refreshedAt ?? null}
          empty={!listing}
        >
          {listing ? (
            <div className="space-y-1">
              <p>
                {listing.name} · {listing.category} · {listing.claimed ? "Claimed" : "Unclaimed"}
              </p>
              <p>Phone {listing.phone}</p>
              <p>
                Rating {listing.rating} from {listing.reviewCount} reviews
              </p>
              <p>Address: {listing.address ?? "No data"}</p>
              <p>Website {listing.website}</p>
            </div>
          ) : null}
        </DataWidget>
        <DataWidget
          title="Maps rank grids"
          source={grids?.source ?? "No baseline export"}
          refreshedAt={grids?.refreshedAt ?? null}
          empty={!grids}
        >
          {grids ? (
            <div className="space-y-2">
              <p>{grids.note}</p>
              <ul className="space-y-1">
                {grids.rows.map((row) => (
                  <li key={row.keyword}>
                    {row.keyword} · {row.grid} ·{" "}
                    {row.points === null || row.ranked === null
                      ? "No data"
                      : `${row.ranked} of ${row.points} points ranked`}
                    {row.centerLeader ? ` · center #1 ${row.centerLeader}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </DataWidget>
      </div>
    </Screen>
  );
}

export function ActionItemsScreen() {
  const snapshot = useSnapshot();
  const actions = snapshot.data?.actions;
  return (
    <Screen
      title="Action Items"
      description="Read-only list from Real Elite Command. This app does not create or edit issues."
    >
      {snapshot.isPending ? <Loading /> : null}
      <DataWidget
        title="Real Elite SEO project"
        source={actions?.source ?? "http://127.0.0.1:3100/api"}
        refreshedAt={actions?.refreshedAt ?? null}
        empty={!snapshot.isPending && actions?.state !== "ok"}
        note={actions?.state === "ok" ? null : (actions?.detail ?? null)}
      >
        {snapshot.isPending ? (
          <p>Loading issues…</p>
        ) : actions?.state === "ok" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">Issue</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Assignee</th>
                  <th className="py-2 font-medium">Verify step</th>
                </tr>
              </thead>
              <tbody>
                {actions.items.map((item) => (
                  <tr key={item.identifier} className="border-t border-border">
                    <td className="py-2 pr-3">
                      <span className="font-medium">{item.identifier}</span>
                      <span className="mt-0.5 block">{item.title}</span>
                    </td>
                    <td className="py-2 pr-3">{item.status}</td>
                    <td className="py-2 pr-3">{item.assignee}</td>
                    <td className="py-2">{item.verifyStep ?? "No verify step recorded"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{actions?.detail ?? "No data"}</p>
        )}
      </DataWidget>
    </Screen>
  );
}

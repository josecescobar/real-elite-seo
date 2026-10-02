import type { GoogleWidget } from "./parse";

export type GoogleConnectionLookup = {
  connected: boolean;
  label: string | null;
};

export type GoogleQueryResult = {
  rowCount: number;
  refreshedAt: string;
  summary: string;
};

export type GoogleReaders = {
  lookupSearchConsole: (projectId: string) => Promise<GoogleConnectionLookup>;
  querySearchConsole: (projectId: string) => Promise<GoogleQueryResult>;
  lookupGa4: (projectId: string) => Promise<GoogleConnectionLookup>;
  queryGa4: (projectId: string) => Promise<GoogleQueryResult>;
};

const OAUTH_DOES_NOT_CONNECT =
  "Saving an OAuth client in the environment does not attach a property or load query data, and this screen does not start a sign-in.";

function disconnectedWidget(product: string, detail: string): GoogleWidget {
  return {
    state: "disconnected",
    detail,
    refreshedAt: null,
    summary: null,
  };
}

function errorWidget(detail: string): GoogleWidget {
  return {
    state: "error",
    detail,
    refreshedAt: null,
    summary: null,
  };
}

export function googleWidgetFromLookup(input: {
  product: string;
  connection: GoogleConnectionLookup;
  query: GoogleQueryResult | null;
}): GoogleWidget {
  if (!input.connection.connected) {
    const where = input.connection.label
      ? `${input.product} is not connected (${input.connection.label}).`
      : `${input.product} is not connected.`;
    return disconnectedWidget(input.product, `${where} ${OAUTH_DOES_NOT_CONNECT}`);
  }
  const label = input.connection.label ? ` (${input.connection.label})` : "";
  if (!input.query || input.query.rowCount === 0) {
    return {
      state: "no_data",
      detail: `Connected${label}. The query returned no rows.`,
      refreshedAt: input.query?.refreshedAt ?? null,
      summary: null,
    };
  }
  return {
    state: "ok",
    detail: null,
    refreshedAt: input.query.refreshedAt,
    summary: input.query.summary,
  };
}

async function readSurface(
  product: string,
  projectId: string,
  lookup: (projectId: string) => Promise<GoogleConnectionLookup>,
  query: (projectId: string) => Promise<GoogleQueryResult>,
): Promise<GoogleWidget> {
  let connection: GoogleConnectionLookup;
  try {
    connection = await lookup(projectId);
  } catch (error) {
    return errorWidget(
      error instanceof Error
        ? `${product} connection lookup failed: ${error.message}`
        : `${product} connection lookup failed.`,
    );
  }
  if (!connection.connected) {
    return googleWidgetFromLookup({ product, connection, query: null });
  }
  try {
    const result = await query(projectId);
    return googleWidgetFromLookup({ product, connection, query: result });
  } catch (error) {
    return errorWidget(
      error instanceof Error
        ? `${product} query failed: ${error.message}`
        : `${product} query failed.`,
    );
  }
}

async function defaultReaders(): Promise<GoogleReaders> {
  return {
    lookupSearchConsole: async (projectId) => {
      const { GscConnectionRepository } = await import(
        "@/server/features/gsc/repositories/GscConnectionRepository"
      );
      const row = await GscConnectionRepository.getByProjectId(projectId);
      return row
        ? { connected: true, label: row.siteUrl }
        : { connected: false, label: null };
    },
    querySearchConsole: async (projectId) => {
      const { GscService } = await import(
        "@/server/features/gsc/services/GscService"
      );
      const result = await GscService.getPerformance({
        projectId,
        dateRange: "last_28_days",
        dimensions: ["date"],
        rowLimit: 28,
      });
      const clicks = result.rows.reduce((sum, row) => sum + row.clicks, 0);
      const impressions = result.rows.reduce(
        (sum, row) => sum + row.impressions,
        0,
      );
      return {
        rowCount: result.rows.length,
        refreshedAt: new Date().toISOString(),
        summary: `${clicks} clicks · ${impressions} impressions · ${result.siteUrl}`,
      };
    },
    lookupGa4: async (projectId) => {
      const { Ga4ConnectionRepository } = await import(
        "@/server/features/ga4/repositories/Ga4ConnectionRepository"
      );
      const row = await Ga4ConnectionRepository.getByProjectId(projectId);
      return row
        ? { connected: true, label: row.propertyDisplayName }
        : { connected: false, label: null };
    },
    queryGa4: async (projectId) => {
      const { Ga4ReportingService } = await import(
        "@/server/features/ga4/services/Ga4ReportingService"
      );
      const report = await Ga4ReportingService.runReport({
        projectId,
        kind: "traffic_acquisition",
        limit: 10,
      });
      return {
        rowCount: report.rowCount,
        refreshedAt: new Date().toISOString(),
        summary: `${report.rowCount} GA4 rows · ${report.source.propertyDisplayName}`,
      };
    },
  };
}

export async function loadGoogleDashboard(
  env: { REAL_ELITE_OPENSEO_PROJECT_ID?: string },
  readers?: GoogleReaders,
): Promise<{ searchConsole: GoogleWidget; ga4: GoogleWidget }> {
  const projectId = env.REAL_ELITE_OPENSEO_PROJECT_ID?.trim() ?? "";
  if (!projectId) {
    return {
      searchConsole: disconnectedWidget(
        "Search Console",
        `Search Console is not connected. No local OpenSEO project is configured, so this prototype does not query Google. ${OAUTH_DOES_NOT_CONNECT}`,
      ),
      ga4: disconnectedWidget(
        "GA4",
        `GA4 is not connected. No local OpenSEO project is configured, so this prototype does not query Google. ${OAUTH_DOES_NOT_CONNECT}`,
      ),
    };
  }
  const resolved = readers ?? (await defaultReaders());
  const [searchConsole, ga4] = await Promise.all([
    readSurface(
      "Search Console",
      projectId,
      resolved.lookupSearchConsole,
      resolved.querySearchConsole,
    ),
    readSurface("GA4", projectId, resolved.lookupGa4, resolved.queryGa4),
  ]);
  return { searchConsole, ga4 };
}

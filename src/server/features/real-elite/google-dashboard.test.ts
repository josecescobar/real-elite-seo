import { describe, expect, it, vi } from "vitest";
import {
  loadGoogleDashboard,
  type GoogleReaders,
} from "./google-dashboard";

function readers(
  partial: Partial<GoogleReaders> & Pick<GoogleReaders, "lookupSearchConsole" | "lookupGa4">,
): GoogleReaders {
  return {
    querySearchConsole: vi.fn(async () => {
      throw new Error("query should not run");
    }),
    queryGa4: vi.fn(async () => {
      throw new Error("query should not run");
    }),
    ...partial,
  };
}

describe("google dashboard state", () => {
  it("stays disconnected when no OpenSEO project is configured and does not query", async () => {
    const querySearchConsole = vi.fn();
    const dashboard = await loadGoogleDashboard(
      { REAL_ELITE_OPENSEO_PROJECT_ID: "  " },
      readers({
        lookupSearchConsole: vi.fn(),
        lookupGa4: vi.fn(),
        querySearchConsole,
      }),
    );
    expect(dashboard.searchConsole.state).toBe("disconnected");
    expect(dashboard.ga4.state).toBe("disconnected");
    expect(dashboard.searchConsole.detail).toMatch(/does not start a sign-in/);
    expect(querySearchConsole).not.toHaveBeenCalled();
  });

  it("does not query a disconnected property", async () => {
    const querySearchConsole = vi.fn();
    const queryGa4 = vi.fn();
    const dashboard = await loadGoogleDashboard(
      { REAL_ELITE_OPENSEO_PROJECT_ID: "project-1" },
      readers({
        lookupSearchConsole: async () => ({ connected: false, label: null }),
        lookupGa4: async () => ({ connected: false, label: null }),
        querySearchConsole,
        queryGa4,
      }),
    );
    expect(dashboard.searchConsole.state).toBe("disconnected");
    expect(dashboard.ga4.state).toBe("disconnected");
    expect(querySearchConsole).not.toHaveBeenCalled();
    expect(queryGa4).not.toHaveBeenCalled();
  });

  it("reports no data when a connected property query returns no rows", async () => {
    const dashboard = await loadGoogleDashboard(
      { REAL_ELITE_OPENSEO_PROJECT_ID: "project-1" },
      readers({
        lookupSearchConsole: async () => ({
          connected: true,
          label: "sc-domain:realelitecontracting.com",
        }),
        lookupGa4: async () => ({
          connected: true,
          label: "Real Elite",
        }),
        querySearchConsole: async () => ({
          rowCount: 0,
          refreshedAt: "2026-10-02T00:00:00.000Z",
          summary: "",
        }),
        queryGa4: async () => ({
          rowCount: 0,
          refreshedAt: "2026-10-02T00:00:00.000Z",
          summary: "",
        }),
      }),
    );
    expect(dashboard.searchConsole.state).toBe("no_data");
    expect(dashboard.searchConsole.detail).toMatch(/no rows/);
    expect(dashboard.ga4.state).toBe("no_data");
  });

  it("returns query summaries when the connected property has rows", async () => {
    const dashboard = await loadGoogleDashboard(
      { REAL_ELITE_OPENSEO_PROJECT_ID: "project-1" },
      readers({
        lookupSearchConsole: async () => ({
          connected: true,
          label: "sc-domain:realelitecontracting.com",
        }),
        lookupGa4: async () => ({ connected: true, label: "Real Elite" }),
        querySearchConsole: async () => ({
          rowCount: 3,
          refreshedAt: "2026-10-02T12:00:00.000Z",
          summary: "5 clicks · 100 impressions",
        }),
        queryGa4: async () => ({
          rowCount: 2,
          refreshedAt: "2026-10-02T12:00:00.000Z",
          summary: "2 GA4 rows",
        }),
      }),
    );
    expect(dashboard.searchConsole).toMatchObject({
      state: "ok",
      summary: "5 clicks · 100 impressions",
      refreshedAt: "2026-10-02T12:00:00.000Z",
    });
    expect(dashboard.ga4.state).toBe("ok");
    expect(dashboard.ga4.summary).toBe("2 GA4 rows");
  });
});

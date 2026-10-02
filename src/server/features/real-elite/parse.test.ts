import { describe, expect, it } from "vitest";
import bundled from "./bundled-baseline.json";
import {
  extractVerifyStep,
  googleOauthStatus,
  mapActionItems,
  parseBaseline,
  plannedPaidFeatures,
} from "./parse";

describe("real elite baseline", () => {
  it("parses the bundled export without dropping sections", () => {
    const parsed = parseBaseline(bundled);
    expect(parsed.crawl?.pagesCrawled).toBe(226);
    expect(parsed.crawl?.missingTitles).toBe(0);
    expect(parsed.localGrids?.rows).toHaveLength(5);
    expect(parsed.localGrids?.rows[0]?.ranked).toBe(0);
    expect(parsed.localGrids?.rows[4]?.ranked).toBeNull();
    expect(parsed.listingSnapshot?.reviewCount).toBe(6);
    expect(parsed.searchConsoleMobileFrozen?.clicks).toBe(5);
    expect(parsed.searchConsoleMobileFrozen?.impressions).toBe(3667);
  });

  it("drops a section that contains a non-numeric metric", () => {
    const parsed = parseBaseline({
      crawl: { ...bundled.crawl, pagesCrawled: "50" },
    });
    expect(parsed.crawl).toBeNull();
  });
});

describe("action items", () => {
  it("reads an explicit verify step and leaves other descriptions empty", () => {
    expect(extractVerifyStep("Verify: curl the homepage and expect 200")).toBe(
      "curl the homepage and expect 200",
    );
    expect(
      extractVerifyStep("Turn findings into tasks with a clear way to verify."),
    ).toBeNull();
  });

  it("maps title, status, assignee, and verify step", () => {
    const items = mapActionItems(
      [
        {
          identifier: "REA-1",
          title: "Fix titles",
          status: "todo",
          assigneeAgentId: "agent-1",
          description: "Verify: titles are 30 to 60 characters",
        },
        {
          identifier: "REA-2",
          title: "Missing pieces",
          status: "blocked",
          description: "No explicit step yet.",
        },
      ],
      new Map([["agent-1", "Cursor"]]),
    );
    expect(items).toEqual([
      {
        identifier: "REA-1",
        title: "Fix titles",
        status: "todo",
        assignee: "Cursor",
        verifyStep: "titles are 30 to 60 characters",
      },
      {
        identifier: "REA-2",
        title: "Missing pieces",
        status: "blocked",
        assignee: "Unassigned",
        verifyStep: null,
      },
    ]);
  });
});

describe("google oauth status", () => {
  it("names the missing env vars and never echoes values", () => {
    expect(
      googleOauthStatus({
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "secret",
        BETTER_AUTH_SECRET: undefined,
      }),
    ).toEqual({
      oauth: "missing",
      missingEnv: ["GOOGLE_CLIENT_ID", "BETTER_AUTH_SECRET"],
    });
  });
});

describe("planned paid features", () => {
  it("labels DataForSEO and OpenRouter as disabled", () => {
    const titles = plannedPaidFeatures().map((item) => item.title);
    expect(titles).toContain("Keyword research");
    expect(titles).toContain("SAM in-app agent");
    expect(plannedPaidFeatures().every((item) => item.detail.includes("Disabled"))).toBe(
      true,
    );
  });
});

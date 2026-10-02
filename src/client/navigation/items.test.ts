import { describe, expect, it } from "vitest";
import { getProjectNavGroups } from "./items";

describe("Real Elite navigation", () => {
  it("shows the five local sections and hides paid research", () => {
    const labels = getProjectNavGroups("project-1").flatMap((group) =>
      group.items.map((item) => item.label),
    );
    expect(labels).toEqual([
      "Overview",
      "Google Search Performance",
      "Website Health",
      "Local SEO",
      "Action Items",
    ]);
  });
});

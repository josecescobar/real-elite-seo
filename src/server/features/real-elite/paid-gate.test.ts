import { afterEach, describe, expect, it, vi } from "vitest";
import { dataforseoPost } from "@/server/lib/dataforseo/core";
import { buildChatAgentModel } from "@/server/lib/openrouter";
import {
  realEliteV1BlockedPaidRoute,
  runUnlessRealEliteV1PaidDisabled,
} from "./paid-gate";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Real Elite v1 paid gate", () => {
  it("does not fetch DataForSEO when a dummy key is configured", async () => {
    vi.stubEnv("DATAFORSEO_API_KEY", "dummy-key");
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      dataforseoPost("/v3/serp/google/organic/live/advanced", []),
    ).rejects.toMatchObject({
      name: "RealEliteV1PaidDisabledError",
      code: "REAL_ELITE_V1_PAID_DISABLED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not construct an OpenRouter request when a dummy key is passed", () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    expect(() => buildChatAgentModel("dummy-openrouter-key")).toThrow(
      /openrouter is disabled/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks SAM and MCP routes and leaves the snapshot route alone", async () => {
    const sam = realEliteV1BlockedPaidRoute("/agents/sam");
    const mcp = realEliteV1BlockedPaidRoute("/mcp");
    expect(sam?.status).toBe(403);
    expect(mcp?.status).toBe(403);
    expect(realEliteV1BlockedPaidRoute("/api/real-elite/snapshot")).toBeNull();

    const run = vi.fn(async () => "ran");
    await expect(runUnlessRealEliteV1PaidDisabled(run)).resolves.toEqual({
      skipped: "real-elite-v1-paid-disabled",
    });
    expect(run).not.toHaveBeenCalled();
  });
});

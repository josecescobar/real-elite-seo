/**
 * Real Elite v1 paid-provider switch.
 *
 * Upstream DataForSEO, OpenRouter, MCP, SAM, and scheduled rank-check code
 * stays in the tree so this fork can still take upstream updates. While this
 * constant is true, those paths stop before a provider fetch even if a dummy
 * key is configured. Set it to false only when Jose approves that spend.
 */
export const REAL_ELITE_V1_PAID_DISABLED = true;

export class RealEliteV1PaidDisabledError extends Error {
  readonly code = "REAL_ELITE_V1_PAID_DISABLED";

  constructor(provider: "dataforseo" | "openrouter") {
    super(
      `${provider} is disabled in the Real Elite v1 prototype, including when an API key is configured.`,
    );
    this.name = "RealEliteV1PaidDisabledError";
  }
}

export function realEliteV1PaidProvidersDisabled(): boolean {
  return REAL_ELITE_V1_PAID_DISABLED;
}

export function assertRealEliteV1PaidAllowed(
  provider: "dataforseo" | "openrouter",
): void {
  if (REAL_ELITE_V1_PAID_DISABLED) {
    throw new RealEliteV1PaidDisabledError(provider);
  }
}

export function realEliteV1BlockedPaidRoute(
  pathname: string,
  mcpRoute = "/mcp",
): Response | null {
  if (!REAL_ELITE_V1_PAID_DISABLED) return null;
  if (pathname.startsWith("/agents/") || pathname === mcpRoute) {
    return Response.json(
      {
        error: "real_elite_v1_paid_disabled",
        detail:
          "SAM, MCP, and paid provider routes are disabled in the Real Elite v1 prototype.",
      },
      { status: 403 },
    );
  }
  return null;
}

/** Scheduled rank checks are the paid cron. Other cron work can still run. */
export async function runUnlessRealEliteV1PaidDisabled<T>(
  run: () => Promise<T>,
): Promise<T | { skipped: "real-elite-v1-paid-disabled" }> {
  if (REAL_ELITE_V1_PAID_DISABLED) {
    return { skipped: "real-elite-v1-paid-disabled" };
  }
  return run();
}

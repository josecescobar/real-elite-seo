import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import https from "node:https";
import bundled from "./bundled-baseline.json";
import {
  googleOauthStatus,
  mapActionItems,
  parseBaseline,
  plannedPaidFeatures,
  type BaselineFile,
} from "./parse";

const DEFAULT_COMPANY_ID = "08528ec7-7c5a-4c79-bc1e-e7a8f9e99e0a";
const DEFAULT_PROJECT_ID = "939c4466-db4b-4981-8c89-199cd7a8c626";
const DEFAULT_COMMAND_API = "http://127.0.0.1:3100";
const DEFAULT_BASELINE_DIR = "/Volumes/Silver T7/AI-SHARED/seo";
const DEFAULT_SITE = "https://www.realelitecontracting.com";

export type RealEliteEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  CRUX_API_KEY?: string;
  REAL_ELITE_COMMAND_API?: string;
  REAL_ELITE_COMPANY_ID?: string;
  REAL_ELITE_PROJECT_ID?: string;
  REAL_ELITE_BASELINE_DIR?: string;
  REAL_ELITE_SITE_URL?: string;
};

function read(env: RealEliteEnv, name: keyof RealEliteEnv, fallback: string) {
  const value = env[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function getText(url: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        resolve(body);
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

export function readBaselineFromDir(dir: string): {
  baseline: BaselineFile;
  file: string | null;
  readError: string | null;
} {
  try {
    const names = readdirSync(dir)
      .filter((name) => /^baseline.*\.json$/i.test(name))
      .sort();
    const name = names.at(-1);
    if (!name) {
      return {
        baseline: parseBaseline(bundled),
        file: null,
        readError: null,
      };
    }
    const file = join(dir, name);
    const parsed = parseBaseline(JSON.parse(readFileSync(file, "utf8")));
    return { baseline: parsed, file, readError: null };
  } catch (error) {
    return {
      baseline: parseBaseline(bundled),
      file: null,
      readError: error instanceof Error ? error.message : "unreadable",
    };
  }
}

async function loadActionItems(env: RealEliteEnv) {
  const api = read(env, "REAL_ELITE_COMMAND_API", DEFAULT_COMMAND_API).replace(
    /\/$/,
    "",
  );
  const companyId = read(env, "REAL_ELITE_COMPANY_ID", DEFAULT_COMPANY_ID);
  const projectId = read(env, "REAL_ELITE_PROJECT_ID", DEFAULT_PROJECT_ID);
  const source = `${api}/api/companies/${companyId}/issues?projectId=${projectId}`;
  try {
    const [issueText, agentText] = await Promise.all([
      getText(`${source}`),
      getText(`${api}/api/companies/${companyId}/agents`),
    ]);
    const issues = JSON.parse(issueText) as unknown;
    const agents = JSON.parse(agentText) as unknown;
    const names = new Map<string, string>();
    if (Array.isArray(agents)) {
      for (const agent of agents) {
        if (
          agent &&
          typeof agent === "object" &&
          typeof (agent as { id?: unknown }).id === "string" &&
          typeof (agent as { name?: unknown }).name === "string"
        ) {
          names.set(
            (agent as { id: string }).id,
            (agent as { name: string }).name,
          );
        }
      }
    }
    return {
      state: "ok" as const,
      source,
      refreshedAt: new Date().toISOString(),
      items: mapActionItems(issues, names),
    };
  } catch (error) {
    return {
      state: "no_data" as const,
      source,
      refreshedAt: null,
      detail: error instanceof Error ? error.message : "Command API unreachable",
      items: [],
    };
  }
}

export async function loadRealEliteSnapshot(env: RealEliteEnv) {
  const baselineDir = read(env, "REAL_ELITE_BASELINE_DIR", DEFAULT_BASELINE_DIR);
  const baselineRead = readBaselineFromDir(baselineDir);
  const google = googleOauthStatus(env);
  const actions = await loadActionItems(env);
  return {
    generatedAt: new Date().toISOString(),
    site: read(env, "REAL_ELITE_SITE_URL", DEFAULT_SITE),
    google: {
      ...google,
      searchConsole: {
        state: "no_data" as const,
        detail:
          google.oauth === "missing"
            ? `OAuth client is not configured. Add ${google.missingEnv.join(", ")} to the local .env. Do not commit them.`
            : "OAuth client is configured. Search Console is not connected in this local database yet, so there is no live query data.",
      },
      ga4: {
        state: "no_data" as const,
        detail:
          google.oauth === "missing"
            ? "GA4 uses the same free Google OAuth client. It is not configured."
            : "OAuth client is configured. GA4 is not connected in this local database yet.",
      },
    },
    baselineFile: baselineRead.file,
    baselineDir,
    baselineReadError: baselineRead.readError,
    baseline: baselineRead.baseline,
    actions,
    planned: plannedPaidFeatures(),
    costs: {
      ongoingUsd: 0,
      detail:
        "Local Docker Postgres, Search Console, GA4, PageSpeed, and CrUX are free. DataForSEO and OpenRouter stay off.",
    },
  };
}

type PageSpeedPayload = {
  lighthouseResult?: {
    categories?: { performance?: { score?: number } };
    fetchTime?: string;
  };
  loadingExperience?: {
    overall_category?: string;
    initial_url?: string;
  };
  analysisUTCTimestamp?: string;
};

export async function loadPageSpeed(env: RealEliteEnv) {
  const site = read(env, "REAL_ELITE_SITE_URL", DEFAULT_SITE);
  const key = env.CRUX_API_KEY?.trim();
  const url = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
  );
  url.searchParams.set("url", site);
  url.searchParams.set("strategy", "mobile");
  url.searchParams.set("category", "performance");
  if (key) url.searchParams.set("key", key);
  const source = "PageSpeed Insights API (free)";
  try {
    const body = await getText(url.toString(), 45000);
    const payload = JSON.parse(body) as PageSpeedPayload;
    const score = payload.lighthouseResult?.categories?.performance?.score;
    const refreshedAt =
      payload.analysisUTCTimestamp ??
      payload.lighthouseResult?.fetchTime ??
      new Date().toISOString();
    const category = payload.loadingExperience?.overall_category;
    return {
      state: typeof score === "number" ? ("ok" as const) : ("no_data" as const),
      source,
      strategy: "mobile",
      url: site,
      refreshedAt: typeof score === "number" ? refreshedAt : null,
      performanceScore: typeof score === "number" ? score : null,
      crux: category
        ? {
            state: "ok" as const,
            source: "Chrome UX Report field data via PageSpeed Insights",
            overallCategory: category,
            refreshedAt,
          }
        : {
            state: "no_data" as const,
            source: "Chrome UX Report",
            detail: key
              ? "PageSpeed returned no field-data category for this URL."
              : "No Chrome UX Report field data in the PageSpeed response. A free CRUX_API_KEY in the local .env raises quota; it is not set.",
            refreshedAt: null,
          },
      detail:
        typeof score === "number"
          ? null
          : "PageSpeed response did not include a performance score.",
    };
  } catch (error) {
    return {
      state: "no_data" as const,
      source,
      strategy: "mobile",
      url: site,
      refreshedAt: null,
      performanceScore: null,
      crux: {
        state: "no_data" as const,
        source: "Chrome UX Report",
        detail: "PageSpeed request failed, so field data was not read.",
        refreshedAt: null,
      },
      detail: error instanceof Error ? error.message : "PageSpeed request failed",
    };
  }
}

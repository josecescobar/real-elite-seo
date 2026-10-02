import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import {
  loadPageSpeed,
  loadRealEliteSnapshot,
  type RealEliteEnv,
} from "@/server/features/real-elite/load";

function realEliteEnv(): RealEliteEnv {
  const source = env as unknown as RealEliteEnv & Record<string, unknown>;
  const read = (name: keyof RealEliteEnv) => {
    const fromBinding = source[name];
    if (typeof fromBinding === "string" && fromBinding.trim() !== "") {
      return fromBinding;
    }
    const fromProcess = process.env[name];
    return typeof fromProcess === "string" ? fromProcess : undefined;
  };
  return {
    GOOGLE_CLIENT_ID: read("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: read("GOOGLE_CLIENT_SECRET"),
    BETTER_AUTH_SECRET: read("BETTER_AUTH_SECRET"),
    CRUX_API_KEY: read("CRUX_API_KEY"),
    REAL_ELITE_COMMAND_API: read("REAL_ELITE_COMMAND_API"),
    REAL_ELITE_COMPANY_ID: read("REAL_ELITE_COMPANY_ID"),
    REAL_ELITE_PROJECT_ID: read("REAL_ELITE_PROJECT_ID"),
    REAL_ELITE_BASELINE_DIR: read("REAL_ELITE_BASELINE_DIR"),
    REAL_ELITE_SITE_URL: read("REAL_ELITE_SITE_URL"),
  };
}

export const Route = createFileRoute("/api/real-elite/snapshot")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const section = new URL(request.url).searchParams.get("section");
        if (section === "pagespeed") {
          return Response.json(await loadPageSpeed(realEliteEnv()));
        }
        return Response.json(await loadRealEliteSnapshot(realEliteEnv()));
      },
    },
  },
});

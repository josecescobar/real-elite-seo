# Real Elite SEO — local prototype

Fork of every-app/open-seo. License and copyright stay in `LICENSE`. This copy runs on the Mac only. Do not run `alchemy deploy`, `wrangler deploy`, or merge this branch to `main`.

Ongoing cost of this prototype: **$0**. Search Console, GA4, PageSpeed, and Chrome UX Report are free. DataForSEO and OpenRouter are disabled and labeled Planned (paid).

## What Jose fills in

Copy `.env.example` to `.env.local` and set these when the Google Cloud OAuth client exists. Do not commit that file.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BETTER_AUTH_SECRET` (32+ characters; encrypts stored tokens)
- Optional `CRUX_API_KEY` (free Chrome UX Report key)

Search Console access for realelitecontracting.com has to be on the Google account that completes the OAuth consent screen. Redirect URI for this local app: `http://localhost:3001/api/gsc/oauth/callback`.

## Run

Postgres (throwaway local password from `docs/LOCAL_POSTGRES.md`):

```sh
docker run --name real-elite-seo-postgres \
  -e POSTGRES_USER=openseo \
  -e POSTGRES_PASSWORD=openseo \
  -e POSTGRES_DB=openseo \
  -p 127.0.0.1:5433:5432 \
  -d postgres:16
```

`.env.local`:

```sh
AUTH_MODE=local_noauth
DATABASE_PROVIDER=postgres
OPENSEO_TELEMETRY_DISABLED=1
DO_NOT_TRACK=1
POSTGRES_DATABASE_URL=postgres://openseo:openseo@127.0.0.1:5433/openseo
VITE_SHOW_DEVTOOLS=false
```

```sh
pnpm install --frozen-lockfile
POSTGRES_DATABASE_URL=postgres://openseo:openseo@127.0.0.1:5433/openseo pnpm db:migrate:pg
pnpm dev
```

Open http://127.0.0.1:3001.

Docker self-host (builds this fork, local Postgres, no Cloudflare deploy):

```sh
cp .env.example .env
docker compose up -d --build
```

The compose file publishes the app on 127.0.0.1:3001 and Postgres on 127.0.0.1:5433. Stop the standalone Postgres container first if that port is already taken.

## Screens

Overview, Google Search Performance, Website Health, Local SEO, Action Items.

Widgets show the data source and last refreshed time. Missing live data says No data. Crawl and the 2026-10-01 Maps snapshot are read from `REAL_ELITE_BASELINE_DIR` (default `/Volumes/Silver T7/AI-SHARED/seo`, newest `baseline*.json`). A copy of that export is bundled so the screens still render if the directory is not mounted.

Action Items reads Real Elite Command at `http://127.0.0.1:3100/api` for the Real Elite SEO project. Read-only.

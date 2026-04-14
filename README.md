# Charm Client Health Dashboard

Multi-client analytics, campaign management, and infrastructure health monitoring dashboard. One codebase, one repo — each client gets their own branch and Coolify deployment.

## Deployed Clients

| Client | Domain | Branch | Coolify UUID |
|--------|--------|--------|--------------|
| SearchAtlas | https://searchatlas.hirecharm.com | `client/searchatlas` | `b4804kg4wk0gkss8o08ws040` |
| LinkGraph | https://linkgraph.hirecharm.com | `client/linkgraph` | `xccss0cokssowsw4s40k4ook` |
| Guardare | https://guardare.hirecharm.com | `client/guardare` | `e8k408g8o4gw8o8cw8cc4480` |
| Stable Kernel | https://skmr.hirecharm.com | `client/stablekernel` | `joc000wkko4wow8wo80kcw0k` |

All deployments are on server `82.180.160.120`, Coolify panel at `http://82.180.160.120:8000`.

## Tech Stack

- **Next.js 16.1** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **Recharts** for data visualizations
- **shadcn/ui** (Radix UI) for accessible components
- **Dark theme** with per-client brand tokens

## Dashboard Tabs

### Analytics — Email

Three-phase progressive data loading powers the main analytics view:

- **Hero metrics** — top-level KPIs at a glance
- **Conversion funnel** — full-funnel visualization from sends to conversions
- **Campaign comparison** — sortable table with expandable rows for per-campaign detail
- **Sequence step performance** — breakdown by outreach step
- **Sender and domain performance** — deliverability by sender/domain
- **AI-powered response intelligence** — sentiment analysis, theme extraction, buying-signal detection
- **Copy analysis** — subject line and body performance insights
- **Lead deep-dive** — filterable lead-level data explorer
- **Cycle-based filtering** — parses "Cycle N" from campaign names for cycle-level analysis

### Analytics — Social (LinkedIn via HeyReach)

LinkedIn outreach analytics powered by the HeyReach API. Data is synced into a local SQLite database via an ETL pipeline, then served to the dashboard UI.

- **Outreach funnel** — Total Leads → Connections Sent → Accepted → Replied
- **Campaign table** — sortable by status, leads, acceptance rate, replies
- **Outreach volume chart** — daily connections sent, accepted, and replies over time
- **Sender cards** — per-sender metrics with live connection status from HeyReach
- **Reply feed** — searchable list of leads who replied, expandable for detail + LinkedIn profile link
- **Period filter** — This Week / 7 Days / 30 Days / All Time

See the **HeyReach Social Tab Setup** section below for configuration and deployment steps.

### Infrastructure

- Inbox health status (live / dead / warming)
- Provider breakdown (Google / Microsoft / Other)
- Kill velocity tracking
- Domain authentication status
- At-risk inbox forecasting

### Settings & Login

Password-protected access and dashboard configuration.

## Quick Start

### 1. Install Dependencies

```bash
cd client-analytics-dashboard
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

See the **Environment Variables** section below for required values.

### 3. Build & Run

```bash
npm run build
npm start
```

The dashboard will be available at `http://localhost:3000`.

### Development

```bash
npm run dev
```

## Docker Deployment

The application produces a standalone Next.js build for containerised deployment.

```bash
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAILBISON_API_URL` | Yes | EmailBison API endpoint |
| `EMAILBISON_API_TOKEN` | Yes | EmailBison API token |
| `WORKSPACE_ID` | Yes | Workspace identifier |
| `WORKSPACE_NAME` | Yes | Display name for the workspace |
| `INFRASTRUCTURE_API_URL` | Yes | Infrastructure health API endpoint |
| `INFRASTRUCTURE_CLIENT_ID` | Yes | Client UUID in the infrastructure database |
| `DASHBOARD_PASSWORD` | Yes | Password for dashboard login |
| `NEXT_PUBLIC_CLIENT_LOGO` | Yes | Path to logo file in `/public` (e.g. `/client-logo.svg`) |
| `NEXT_PUBLIC_CLIENT_NAME` | Yes | Client display name — shown in sidebar and login |
| `NEXT_PUBLIC_DASHBOARD_TITLE` | Yes | Browser tab title (e.g. `SearchAtlas Dashboard`) |
| `NEXT_PUBLIC_AUTO_REFRESH_MS` | No | Dashboard auto-refresh interval in ms (default: 300000) |
| `HEYREACH_API_KEY` | For Social tab | HeyReach API key (Integrations → HeyReach API) |
| `HEYREACH_CAMPAIGN_IDS` | For Social tab | Comma-separated campaign IDs for this client |
| `HEYREACH_SENDER_IDS` | For Social tab | Comma-separated sender account IDs for this client |
| `ANTHROPIC_API_KEY` | No | Enables AI-powered response intelligence features |
| `AI_ARK_API_KEY` | No | Enables lead enrichment features |

## Multi-Tenant Deployment

The same codebase is deployed once per client. Each deployment uses its own set of environment variables (workspace ID, API credentials, etc.) to isolate client data.

---

## New Client Onboarding Checklist

Follow these steps every time a new client dashboard is spun up.

### Step 1 — Create a Git Branch

```bash
git checkout main   # always branch from main — NOT from a live client branch
git checkout -b client/<clientname>
git push -u origin client/<clientname>
```

Branch naming convention: `client/<clientname>` (e.g. `client/guardare`, `client/linkgraph`).

> ⚠️ **Branch from `main`, not from a client branch.** Client branches (`client/searchatlas`, `client/guardare`, etc.) contain client-specific branding and must never be used as a base. `main` is the clean template with generic `brand-*` tokens and the `BrandLogo` component. `v2` is an active redesign — do not branch new clients from it.

### Step 2 — Apply Client Branding

The logo and client name are driven entirely by env vars via the shared `BrandLogo` component (`components/layout/BrandLogo.tsx`). No component edits needed for a standard onboarding.

**a) Scan the client's website for brand assets:**
- Logo URL (SVG preferred — look in `<img>` tags or CDN references)
- Primary and accent colors (CSS custom properties on `:root` or DevTools computed styles)
- Font families

**b) Download the logo into `public/`:**

```bash
curl -sL "<logo-url>" -o public/<clientname>-logo.svg
# or for PNG:
curl -sL "<logo-url>" -o public/<clientname>-logo.png
```

**c) Set the branding env vars** (see Step 3 — these are all that's needed for logo + name):

```env
NEXT_PUBLIC_CLIENT_LOGO=/<clientname>-logo.svg
NEXT_PUBLIC_CLIENT_NAME=<ClientName>
NEXT_PUBLIC_DASHBOARD_TITLE=<ClientName> Dashboard
```

The `BrandLogo` component reads these at build time. It renders the logo with `h-X w-auto` so wide SVG wordmarks scale correctly without clipping.

**d) Update `app/globals.css`** (only if the client has distinct brand colors):

Replace color tokens in `@theme inline`, `:root`, and `.dark`:

| Token | What to update |
|-------|---------------|
| `--color-<brand>-*` | Primary, accent, background colors |
| `--chart-1` through `--chart-5` | Chart palette |
| `--primary`, `--ring`, `--sidebar-primary` | Match primary brand color |

> **Rule:** If you rename color tokens, search the full codebase for old token names and replace them. Orphaned tokens silently break charts and UI elements. Key files to check:
> `app/(dashboard)/analytics/page.tsx`, `app/(dashboard)/analytics/social/page.tsx`, `app/(dashboard)/infrastructure/page.tsx`, `components/infrastructure/InfrastructureDashboard.tsx`

### Step 3 — Set Environment Variables

Create `.env.local` from the template (gitignored — never committed):

```env
EMAILBISON_API_TOKEN=<client-eb-token>
WORKSPACE_ID=<client-eb-workspace-id>
WORKSPACE_NAME=<ClientName>
INFRASTRUCTURE_CLIENT_ID=<client-uuid-in-charm-os>
INFRASTRUCTURE_API_URL=http://ccssgc4gowsog04wck400o0w.31.97.142.123.sslip.io
NEXT_PUBLIC_CLIENT_LOGO=/<clientname>-logo.svg
NEXT_PUBLIC_CLIENT_NAME=<ClientName>
NEXT_PUBLIC_DASHBOARD_TITLE=<ClientName> Dashboard
NEXT_PUBLIC_AUTO_REFRESH_MS=300000
DASHBOARD_PASSWORD=<clientname><year>
DATABASE_URL=file:./data/heyreach.db
HEYREACH_API_KEY=                       # only if Social tab is enabled
HEYREACH_CAMPAIGN_IDS=
HEYREACH_SENDER_IDS=
```

> ⚠️ **Always set a unique `DASHBOARD_PASSWORD` per client.** Convention: `<clientname><year>` (e.g. `guardare2026`). Never carry over a password from a previous client's deployment.

### Step 4 — Commit and Push

```bash
# Always commit the logo file — env vars go into Coolify, not git
git add public/<clientname>-logo.svg

# If you updated brand colors in globals.css, add those too:
git add app/globals.css
# And any pages where color tokens were replaced:
git add "app/(dashboard)/analytics/page.tsx" \
        "app/(dashboard)/analytics/social/page.tsx" \
        "app/(dashboard)/infrastructure/page.tsx" \
        "components/infrastructure/InfrastructureDashboard.tsx"

git commit -m "feat: apply <ClientName> brand theme and logo"
git push
```

### Step 5 — Create the Coolify App (via API)

> **Each client should have its own Coolify project.** Create a new project in the Coolify UI first (Projects → New), then use its UUID below. Do not add new clients to an existing client's project.

```bash
curl -X POST "http://82.180.160.120:8000/api/v1/applications/public" \
  -H "Authorization: Bearer <COOLIFY_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_uuid": "<client-project-uuid>",
    "environment_name": "production",
    "server_uuid": "bw40kkoo8kwwc8sssg0sg4ko",
    "destination_uuid": "m084g4s8wk04cc8o88g0owoc",
    "git_repository": "https://github.com/laviefatigue/searchatlas-dashboard",
    "git_branch": "client/<clientname>",
    "build_pack": "dockerfile",
    "ports_exposes": "3000",
    "name": "<clientname>-dashboard",
    "description": "<ClientName> infrastructure and analytics dashboard",
    "redirect": "both",
    "instant_deploy": false
  }'
# → Returns {"uuid":"<APP_UUID>","domains":"http://<APP_UUID>.82.180.160.120.sslip.io"}
```

> ⚠️ **Critical — always patch `dockerfile_location` and `start_command` immediately after creation.**
>
> The public API endpoint does not set `dockerfile_location` automatically. Without this, Coolify falls back to nixpacks and runs `next start` — which breaks `output: "standalone"` builds. The container starts but serves a blank page.

```bash
APP_UUID="<APP_UUID>"
COOLIFY_URL="http://82.180.160.120:8000"
TOKEN="<COOLIFY_API_TOKEN>"

# Required: tell Coolify where the Dockerfile is
curl -X PATCH "$COOLIFY_URL/api/v1/applications/$APP_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dockerfile_location":"/Dockerfile"}'

# Belt-and-suspenders: explicit start command for standalone output
curl -X PATCH "$COOLIFY_URL/api/v1/applications/$APP_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_command":"node server.js"}'
```

### Step 6 — Set Environment Variables in Coolify

```bash
set_env() {
  curl -s -X POST "$COOLIFY_URL/api/v1/applications/$APP_UUID/envs" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$1\",\"value\":\"$2\",\"is_buildtime\":true}"
}

set_env EMAILBISON_API_URL            "https://spellcast.hirecharm.com"
set_env EMAILBISON_API_TOKEN          "<client-eb-token>"
set_env WORKSPACE_ID                  "<id>"
set_env WORKSPACE_NAME                "<ClientName>"
set_env INFRASTRUCTURE_API_URL        "http://ccssgc4gowsog04wck400o0w.31.97.142.123.sslip.io"
set_env INFRASTRUCTURE_CLIENT_ID      "<charm-os-uuid>"
set_env NEXT_PUBLIC_CLIENT_LOGO       "/<clientname>-logo.svg"
set_env NEXT_PUBLIC_CLIENT_NAME       "<ClientName>"
set_env NEXT_PUBLIC_DASHBOARD_TITLE   "<ClientName> Dashboard"
set_env NEXT_PUBLIC_AUTO_REFRESH_MS   "300000"
set_env DASHBOARD_PASSWORD            "<clientname><year>"
set_env DATABASE_URL                  "file:./data/heyreach.db"
```

### Step 7 — Deploy

```bash
# Triggers a deploy and returns the deployment UUID
curl -s -X GET "$COOLIFY_URL/api/v1/deploy?uuid=$APP_UUID" \
  -H "Authorization: Bearer $TOKEN"
# → {"deployments":[{"message":"...queued.","deployment_uuid":"<DEPLOY_UUID>"}]}
```

> ⚠️ **Use `/api/v1/deploy?uuid=` not `/api/v1/applications/$UUID/start`.** The `/start` endpoint returns 404 — the correct trigger endpoint is the deploy one above.

Poll until `finished` or `failed`:

```bash
DEPLOY_UUID="<DEPLOY_UUID>"
while true; do
  STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$COOLIFY_URL/api/v1/deployments/$DEPLOY_UUID" | node -e \
    "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).status))")
  echo "$(date '+%H:%M:%S') — $STATUS"
  [[ "$STATUS" == "finished" || "$STATUS" == "failed" ]] && break
  sleep 15
done
```

### Step 8 — Set Domain + Patch Traefik Labels (after verifying on temp URL)

Test on the auto-generated sslip.io URL first. Once verified, **both** of the following are required — the domain patch alone is not enough.

**8a — Set the domain:**

```bash
curl -X PATCH "$COOLIFY_URL/api/v1/applications/$APP_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domains":"https://<clientname>.hirecharm.com"}'
```

> ⚠️ **Critical — also patch `custom_labels`.**
>
> Setting `domains` via the API updates Coolify's database but does NOT regenerate the running container's Traefik routing labels. The container will still only route the sslip.io URL, and the custom domain returns "no available server". You must manually set the correct labels and redeploy.

**8b — Patch the Traefik labels:**

```bash
DOMAIN="<clientname>.hirecharm.com"

LABELS="traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.routers.http-0-${APP_UUID}.entryPoints=http
traefik.http.routers.http-0-${APP_UUID}.middlewares=redirect-to-https
traefik.http.routers.http-0-${APP_UUID}.rule=Host(\`${DOMAIN}\`) && PathPrefix(\`/\`)
traefik.http.routers.http-0-${APP_UUID}.service=http-0-${APP_UUID}
traefik.http.routers.https-0-${APP_UUID}.entryPoints=https
traefik.http.routers.https-0-${APP_UUID}.middlewares=gzip
traefik.http.routers.https-0-${APP_UUID}.rule=Host(\`${DOMAIN}\`) && PathPrefix(\`/\`)
traefik.http.routers.https-0-${APP_UUID}.service=https-0-${APP_UUID}
traefik.http.routers.https-0-${APP_UUID}.tls.certresolver=letsencrypt
traefik.http.routers.https-0-${APP_UUID}.tls=true
traefik.http.services.http-0-${APP_UUID}.loadbalancer.server.port=3000
traefik.http.services.https-0-${APP_UUID}.loadbalancer.server.port=3000
caddy_0.encode=zstd gzip
caddy_0.handle_path.0_reverse_proxy={{upstreams 3000}}
caddy_0.handle_path=/*
caddy_0.header=-Server
caddy_0.try_files={path} /index.html /index.php
caddy_0=https://${DOMAIN}
caddy_ingress_network=coolify"

ENCODED=$(echo "$LABELS" | base64 -w 0)

curl -X PATCH "$COOLIFY_URL/api/v1/applications/$APP_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"custom_labels\":\"$ENCODED\"}"
```

**8c — Redeploy to apply the new labels:**

```bash
curl -s -X GET "$COOLIFY_URL/api/v1/deploy?uuid=$APP_UUID" \
  -H "Authorization: Bearer $TOKEN"
```

**8d — Add DNS record** (Cloudflare — gray cloud / DNS only, not proxied):

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| `A` | `<clientname>` | `82.180.160.120` | DNS only ☁️ (gray) |

Coolify provisions SSL via Let's Encrypt automatically once the domain is reachable.

### Step 9 — Record the UUID

Add the new app UUID to `.env.coolify.local`:

```env
COOLIFY_<CLIENTNAME>_UUID=<APP_UUID>
```

### Step 10 — Trigger Initial HeyReach Sync and Verify Senders

Once the dashboard is live, trigger the first sync from the Social tab or via API:

```bash
curl -X POST https://<dashboard-url>/api/heyreach/sync
```

After the sync completes, open the Social tab and check for a red warning banner. If it reads:

> **"[Sender Name(s)] are disconnected from HeyReach. Historical data is still shown."**

This means those LinkedIn sender accounts have an expired or revoked session in HeyReach. Historical data still displays correctly, but new outreach activity will not sync until the sender reconnects their LinkedIn account inside HeyReach (Settings → LinkedIn Accounts → Reconnect). Flag this to the client — it is a HeyReach auth issue, not a dashboard issue.

---

## HeyReach Social Tab Setup

The Social tab pulls LinkedIn outreach data from HeyReach's API into a local SQLite database. This section covers how to enable it for a new client.

### Architecture

```
HeyReach API  →  Sync Job  →  SQLite (Prisma)  →  Dashboard API  →  React UI
  (read-only)     /api/heyreach/sync    data/heyreach.db    /api/heyreach/dashboard
```

- **Read-only**: The sync job never writes to HeyReach. All API calls are GET/POST reads.
- **Per-client isolation**: Each deployment has its own SQLite database, filtered to specific campaign and sender IDs via env vars.
- **Prisma + better-sqlite3**: The ORM uses `@prisma/adapter-better-sqlite3` for embedded SQLite. No external database server needed.

### Step 1: Get HeyReach IDs

From the HeyReach dashboard:

1. **API Key** — Go to Integrations → HeyReach API → copy the key
2. **Campaign IDs** — Open each campaign belonging to this client, grab the numeric ID from the URL
3. **Sender IDs** — Go to LinkedIn Accounts, note the account IDs for senders assigned to this client

### Step 2: Configure Environment Variables

Add these to the client's deployment environment (Coolify, `.env.local`, etc.):

```env
HEYREACH_API_KEY=<api-key>
HEYREACH_CAMPAIGN_IDS=123456,789012
HEYREACH_SENDER_IDS=111111,222222
```

`HEYREACH_CAMPAIGN_IDS` controls which campaigns appear. `HEYREACH_SENDER_IDS` controls which sender accounts show up in sender cards and metrics. Both are comma-separated.

### Step 3: Deploy

The Dockerfile handles everything automatically:

1. `npm ci` — installs dependencies (including native `better-sqlite3` build)
2. `npx prisma generate` — generates the Prisma client (gitignored)
3. `npx prisma migrate deploy` — creates an empty SQLite database with all tables
4. `npm run build` — builds Next.js standalone output
5. The schema'd database is copied into the runner image

No manual database setup is needed.

### Step 4: Initial Data Sync

After the first deployment, the database is empty. Trigger the initial sync:

```bash
curl -X POST https://<dashboard-url>/api/heyreach/sync
```

Or click the **"Try Syncing Data"** button on the Social tab. The sync pulls all campaigns, leads, senders, and daily stats from HeyReach. It takes ~30-60 seconds depending on data volume.

### Ongoing Syncs

The sync can be triggered manually or on a schedule. Each sync is logged in the `sync_log` table. The dashboard shows the last sync timestamp.

### Local Development

```bash
# 1. Set up env vars
cp .env.example .env.local
# Fill in HEYREACH_API_KEY, HEYREACH_CAMPAIGN_IDS, HEYREACH_SENDER_IDS

# 2. Generate Prisma client and create database
npx prisma generate
npx prisma migrate deploy

# 3. Start dev server
npm run dev

# 4. Trigger initial sync
curl -X POST http://localhost:3000/api/heyreach/sync
```

### Database Schema

The SQLite database (`data/heyreach.db`) has these tables:

| Table | Purpose |
|-------|---------|
| `campaigns` | Campaign metadata and progress stats |
| `senders` | LinkedIn sender accounts with connection status |
| `campaign_senders` | Many-to-many campaign ↔ sender mapping |
| `leads` | Individual leads with connection/message status |
| `conversations` | LinkedIn conversation metadata |
| `messages` | Individual messages in conversations |
| `stats_daily` | Daily aggregate stats (connections, replies) |
| `sync_log` | Sync job history and error tracking |

### Known Limitations

- **HeyReach API pagination**: The `GetLeadsFromCampaign` endpoint only returns processed leads (InProgress, Finished, Failed). Pending and Excluded leads are not exposed by the API, so `totalLeads` from campaign stats may be higher than the actual lead count in the database.
- **`campaignAccountIds` can be incomplete**: The HeyReach campaign object sometimes omits sender IDs. The sync engine backfills sender mappings from lead data to compensate.
- **Single HeyReach workspace**: All clients share one HeyReach API key (one workspace). Per-client isolation is achieved by filtering to specific campaign and sender IDs.
- **Disconnected senders**: If a LinkedIn sender account's session expires or is revoked in HeyReach, the Social tab displays a red warning banner listing the affected senders. Historical data remains visible. New syncs will not fetch new activity for disconnected accounts. Resolution: sender must reconnect their LinkedIn account in HeyReach (Settings → LinkedIn Accounts → Reconnect). This is a HeyReach auth issue, not a dashboard issue — flag it to the client.

### Coolify Deployment Notes

- **Build pack**: Must use **Dockerfile**, not nixpacks (nixpacks fails to build native dependencies)
- **Build pack switch** (if needed): `PATCH /api/v1/applications/<uuid>` with `{"build_pack":"dockerfile","dockerfile_location":"/Dockerfile"}`
- Env vars set in Coolify are injected as Docker build ARGs automatically

## Brand Colors

Each client has their own color tokens defined in `app/globals.css`. The `BrandLogo` component and all layout components read from these tokens — no hardcoded hex values in components.

| Client | Primary | Background |
|--------|---------|------------|
| SearchAtlas | `#936BDA` (purple) | `#14151A` |
| Guardare | `#A57BEA` (purple) | `#14151A` |
| Stable Kernel | `#1B5FA6` (blue) | `#161D22` |
| LinkGraph | — | — |

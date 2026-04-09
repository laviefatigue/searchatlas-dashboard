# SearchAtlas Client Analytics Dashboard

Real-time analytics, campaign management, and infrastructure health monitoring dashboard for email outreach campaigns.

## Tech Stack

- **Next.js 16.1** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **Recharts** for data visualizations
- **shadcn/ui** (Radix UI) for accessible components
- **Dark theme** with SearchAtlas brand colors

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
| `HEYREACH_API_KEY` | For Social tab | HeyReach API key (Integrations → HeyReach API) |
| `HEYREACH_CAMPAIGN_IDS` | For Social tab | Comma-separated campaign IDs for this client |
| `HEYREACH_SENDER_IDS` | For Social tab | Comma-separated sender account IDs for this client |
| `ANTHROPIC_API_KEY` | No | Enables AI-powered response intelligence features |
| `AI_ARK_API_KEY` | No | Enables lead enrichment features |

## Multi-Tenant Deployment

The same codebase is deployed once per client. Each deployment uses its own set of environment variables (workspace ID, API credentials, etc.) to isolate client data. No code changes are needed between tenants.

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

### Coolify Deployment Notes

- **Build pack**: Must use **Dockerfile**, not nixpacks (nixpacks fails to build native dependencies)
- **Build pack switch** (if needed): `PATCH /api/v1/applications/<uuid>` with `{"build_pack":"dockerfile","dockerfile_location":"/Dockerfile"}`
- Env vars set in Coolify are injected as Docker build ARGs automatically

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#936BDA` | Primary accent |
| Cyan | `#88C2FF` | Secondary accent, links |
| Green | `#9CFFAC` | Positive indicators |
| Pink | `#FFADDB` | Highlights |

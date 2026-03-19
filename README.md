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

### Analytics

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

### Campaigns

Draft campaign management and editing.

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
| `ANTHROPIC_API_KEY` | No | Enables AI-powered response intelligence features |
| `AI_ARK_API_KEY` | No | Enables lead enrichment features |

## Multi-Tenant Deployment

The same codebase is deployed once per client. Each deployment uses its own set of environment variables (workspace ID, API credentials, etc.) to isolate client data. No code changes are needed between tenants.

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#936BDA` | Primary accent |
| Cyan | `#88C2FF` | Secondary accent, links |
| Green | `#9CFFAC` | Positive indicators |
| Pink | `#FFADDB` | Highlights |

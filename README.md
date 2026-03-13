# Selery Client Analytics Dashboard

Real-time analytics and infrastructure health monitoring dashboard for Selery's email campaigns.

## Quick Start (Production Deployment)

### 1. Install Dependencies

```bash
cd client-analytics-dashboard
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` - only the API token needs to be added:

```env
# EmailBison API (Analytics Tab) - pre-configured
EMAILBISON_API_URL=
EMAILBISON_API_TOKEN=<get from team lead>

# Infrastructure API (Infrastructure Tab) - pre-configured for Selery
INFRASTRUCTURE_API_URL=
INFRASTRUCTURE_CLIENT_ID=
```

> **Note**: The infrastructure API and client ID are pre-configured for Selery's production database. Only the `EMAILBISON_API_TOKEN` needs to be provided.

### 3. Build & Run

```bash
# Production build
npm run build

# Start production server
npm start
```

The dashboard will be available at `http://localhost:3000`

---

## Docker Deployment (Pre-Configured)

Infrastructure API is pre-configured to Selery's production database. Just set your token:

```bash
# Set your API token (get from team lead)
export EMAILBISON_API_TOKEN="your_token_here"

# Build and run - infrastructure auto-connects to Selery production
docker-compose up -d --build

# View logs
docker-compose logs -f
```

For local development with localhost Charm API:
```bash
export EMAILBISON_API_TOKEN="your_token_here"
export INFRASTRUCTURE_API_URL="http://host.docker.internal:8000"
docker-compose up -d --build
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAILBISON_API_URL` | Yes | EmailBison API endpoint (default: ``) |
| `EMAILBISON_API_TOKEN` | Yes | Your EmailBison API token |
| `INFRASTRUCTURE_API_URL` | Yes | Charm OS API endpoint |
| `INFRASTRUCTURE_CLIENT_ID` | Yes | Client UUID in Charm OS database |
| `NEXT_PUBLIC_DASHBOARD_TITLE` | No | Dashboard title in header (default: ``) |
| `NEXT_PUBLIC_AUTO_REFRESH_MS` | No | Auto-refresh interval in ms (default: `300000` = 5 min) |

---

## Development

```bash
# Start development server with hot-reload
npm run dev
```

---

## Dashboard Tabs

### Analytics Tab
- Campaign performance metrics
- Reply rates, open rates, bounce analysis
- Sequence step breakdown
- Time-based trends

### Infrastructure Tab
- Inbox health status (live/dead/warming)
- Provider breakdown (Google/Microsoft/Other)
- Kill velocity tracking
- Domain authentication status
- At-risk inbox forecasting

**Data Source**: Charm OS PostgreSQL database via FastAPI
- Endpoint: `GET /api/health/infrastructure/{client_id}`
- Kill data: `GET /api/health/kill-velocity/{client_id}`
- Volume history: `GET /api/health/daily-volume/{client_id}`

---

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **Recharts** for visualizations
- **Radix UI** for accessible components

---

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#1C2655` | Primary, headers |
| Cyan | `#28BFFC` | Accents, links |
| Gold | `#F9B416` | Highlights, CTAs |


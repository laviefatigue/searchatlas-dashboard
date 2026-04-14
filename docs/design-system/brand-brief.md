# Brand Brief

> Framework: Next.js + Tailwind CSS v4 + shadcn/ui
> Project type: Multi-tenant client health dashboard
> Paths: src/ → app/, components/

## Client

- **Template name**: v2
- **Dashboard pages**: Analytics (Email), Analytics (Social/LinkedIn), Infrastructure
- **Audience**: Agency clients — cybersecurity, SEO, marketing teams

## Aesthetic Direction

- **Reference**: Linear.app — precision without coldness, tight type, dense data, minimal chrome
- **Feeling**: Premium, data-dense, trustworthy
- **Anti-patterns**: Generic 4-KPI-card grids, pill buttons on everything, shadcn defaults unchanged

## Token Structure

Brand tokens live in `app/globals.css` under `@theme inline`. Each client deployment overrides:
- `--color-brand-primary` — main accent
- `--color-brand-secondary` — secondary accent
- `--color-brand-dark` — background base
- `--color-sidebar-*` — sidebar colors
- Logo: `public/brand-logo.svg` (swapped per client via `BrandLogo` component)

## Typography

- Display/UI: Space Grotesk or Inter
- Data/metrics: JetBrains Mono
- Weight range: 400–700

## Layout Rules

- Single-screen dashboards — no vertical scroll for core content
- Sidebar: fixed 64px wide collapsed or 256px expanded
- Data density: medium-high, 5 columns max in tables
- Asymmetry welcome, centered-everything banned

## Pages

- [[analytics-email]] — Campaign funnel metrics, sender performance
- [[analytics-social]] — LinkedIn outreach funnel, campaign breakdown, reply feed
- [[infrastructure]] — Email server health via Charm OS API

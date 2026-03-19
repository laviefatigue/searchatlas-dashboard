# Client Analytics Dashboard — Color Map

Use this reference when reskinning the dashboard for a new client. Replace brand colors with the new client's palette. Status and neutral colors typically stay the same.

---

## Brand Colors (CHANGE PER CLIENT)

These are the SearchAtlas identity colors. Replace all instances with the new client's palette.

### Primary Purple — `#A57BEA` / `#936BDA`

The main brand color. Two variants exist (bright and original).

| File | Line(s) | What It Controls |
|------|---------|-----------------|
| `app/globals.css` | 74, 97, 100, 109, 111, 114 | `--primary`, `--ring`, `--chart-1`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-ring` |
| `app/globals.css` | 124, 137, 138, 145, 147, 150 | Same variables in `.dark` block |
| `app/globals.css` | 8 | `--color-searchatlas-purple` (`#936BDA`) |
| `lib/constants.ts` | 29 | Campaign status badge "Launching" (`bg-[#936BDA]`) |
| `lib/constants.ts` | 38 | `CHART_COLORS.sent` |
| `app/(dashboard)/infrastructure/page.tsx` | 145 | Health gauge stroke (score 60-79) |
| `app/(dashboard)/infrastructure/page.tsx` | 269 | Volume tooltip "Sent" legend dot |
| `app/(dashboard)/infrastructure/page.tsx` | 322, 349-350, 393 | Volume chart legend/gradient/line for "Sent" |
| `app/(dashboard)/infrastructure/page.tsx` | 386 | Tooltip cursor stroke (`rgba`) |
| `app/(dashboard)/infrastructure/page.tsx` | 422, 430, 434 | Provider capacity "good" health color; card borders |
| `app/(dashboard)/infrastructure/page.tsx` | 738, 752 | Icon colors; retry button |
| `app/(dashboard)/infrastructure/page.tsx` | 815, 857, 880 | Card hover borders |
| `app/(dashboard)/infrastructure/page.tsx` | 892, 930, 932-933 | Button colors; card accent borders |
| `app/(dashboard)/infrastructure/page.tsx` | 967, 1004, 1007 | More card borders and accents |
| `app/login/page.tsx` | 59-60, 81, 106, 136 | Lock icon bg; input focus ring; submit button; loading spinner |
| `components/layout/Sidebar.tsx` | 69 | User avatar fallback background |
| `components/infrastructure/HealthScoreGauge.tsx` | 23 | Gauge stroke — good (`#936BDA`) |
| `components/infrastructure/VolumeHistoryChart.tsx` | 23-24, 67 | Area gradient & stroke — emails sent (`#936BDA`) |
| `components/infrastructure/ProviderHealthWidget.tsx` | 13, 23, 34, 91 | Provider icon; health color; section icon; progress bar (`#936BDA`) |
| `components/infrastructure/charts/KillBreakdownPie.tsx` | 12 | Pie slice 1 (`#936BDA`) |
| `lib/export-pdf.ts` | 12, 16, 38 | PDF header accent bar; title text; footer line (`#4F46E5` — different, also needs updating) |

**Also update these derived/hover variants:**
- `#9066D8` — login submit hover (`app/login/page.tsx:106`)
- `#a57de6` — retry button hover (`infrastructure/page.tsx:752`)
- `#C4B5FD` — package progress bar gradient end (`infrastructure/page.tsx:901`)
- `rgba(165, 123, 234, 0.15)` — sidebar accent bg (`globals.css:111,147`)
- `rgba(165, 123, 234, 0.2)` — tooltip cursor (`infrastructure/page.tsx:386`)
- `rgba(147, 107, 218, 0.3)` — gauge glow (`infrastructure/page.tsx:152`)

---

### Brand Cyan — `#93C5FD` / `#88C2FF`

Secondary brand color. Used for reserve/capacity indicators and reply metrics.

| File | Line(s) | What It Controls |
|------|---------|-----------------|
| `app/globals.css` | 9 | `--color-searchatlas-cyan` (`#88C2FF`) |
| `app/globals.css` | 101, 139 | `--chart-2` (`#93C5FD`) |
| `lib/constants.ts` | 40 | `CHART_COLORS.replies` |
| `app/(dashboard)/infrastructure/page.tsx` | 443, 484, 516 | Reserve bar legend; Gmail icon; reserve bar fill |
| `app/(dashboard)/infrastructure/page.tsx` | 559, 587-588 | Reserve label; avg daily sent icon |
| `app/(dashboard)/infrastructure/page.tsx` | 959, 969-970 | More reserve indicators |
| `components/infrastructure/VolumeHistoryChart.tsx` | 27-28, 75 | Capacity line gradient & stroke (`#88C2FF`) |
| `components/infrastructure/ProviderHealthWidget.tsx` | 16 | Google/Gmail provider icon (`#88C2FF`) |
| `components/infrastructure/charts/KillBreakdownPie.tsx` | 14 | Pie slice 3 (`#88C2FF`) |

---

### Brand Green — `#86EFAC` / `#9CFFAC`

Used for "healthy" and "live" states. May or may not change per client.

| File | Line(s) | What It Controls |
|------|---------|-----------------|
| `app/globals.css` | 10 | `--color-searchatlas-green` (`#9CFFAC`) |
| `app/globals.css` | 91, 102, 133, 140 | `--success`, `--chart-3` (`#86EFAC`) |
| `lib/constants.ts` | 39 | `CHART_COLORS.opens` |
| `app/(dashboard)/infrastructure/page.tsx` | 144 | Health gauge stroke — healthy |
| `app/(dashboard)/infrastructure/page.tsx` | 276, 293 | Volume tooltip "Replied" dot; reply rate text |
| `app/(dashboard)/infrastructure/page.tsx` | 327, 334, 353-354, 404 | Volume chart legend/gradient/line — replied |
| `app/(dashboard)/infrastructure/page.tsx` | 439, 506, 553, 580 | Live bar legend; live bar fill; live label |
| `app/(dashboard)/infrastructure/page.tsx` | 943, 954, 983, 1022 | More live status dots |

**Derived variants:**
- `#4ade80` — live bar gradient end (`infrastructure/page.tsx:506`)
- `rgba(156, 255, 172, 0.3)` — gauge glow healthy (`infrastructure/page.tsx:151`)

---

### Brand Pink — `#F9A8D4` / `#FFADDB`

Used for warnings, disconnected state, and chart accent.

| File | Line(s) | What It Controls |
|------|---------|-----------------|
| `app/globals.css` | 11 | `--color-searchatlas-pink` (`#FFADDB`) |
| `app/globals.css` | 104, 142 | `--chart-5` (`#F9A8D4`) |
| `lib/constants.ts` | 42 | `CHART_COLORS.interested` |
| `app/(dashboard)/infrastructure/page.tsx` | 146 | Health gauge stroke — warning |
| `app/(dashboard)/infrastructure/page.tsx` | 423, 486 | Provider capacity "warning" health; pink Gmail icon |
| `app/(dashboard)/infrastructure/page.tsx` | 555, 561, 566 | Disconnected text/labels |
| `app/(dashboard)/infrastructure/page.tsx` | 790, 909 | Status messages; provisioning text |

**Derived:** `rgba(255, 173, 219, 0.3)` — gauge glow warning (`infrastructure/page.tsx:153`)

---

### Dark Background Tones (change if client uses a light theme)

| Color | Hex | Files | What It Controls |
|-------|-----|-------|-----------------|
| Page bg | `#14151A` | `globals.css`, `infrastructure/page.tsx`, `login/page.tsx` | `--background`, page backgrounds |
| Card bg | `#1D1E24` | `globals.css`, `infrastructure/page.tsx` | `--card`, `--popover`, card/tooltip backgrounds |
| Secondary bg | `#282A32` | `globals.css` | `--secondary`, `--muted`, `--accent` |
| Sidebar bg | `#0F1014` | `globals.css` | `--sidebar` |
| Border | `#3A3C47` | `globals.css`, `infrastructure/page.tsx` | `--border`, `--input`, all borders |
| Grid lines | `#2A2B35` | `infrastructure/page.tsx`, `login/page.tsx` | Chart grids, card borders |
| Brand dark | `#1D1E22` | `globals.css` | `--color-searchatlas-dark` |

---

## Status Colors (KEEP THE SAME)

These are semantic — they communicate meaning regardless of brand.

| Color | Hex | Meaning |
|-------|-----|---------|
| Critical red | `#ef4444` | Dead/killed/critical score |
| Destructive red | `#F87171` | Bounced, errors |
| Dark red | `#dc2626` / `#991b1b` | Domain-flagged bars |
| Warning amber | `#f59e0b` | Warning (older components) |
| Warning yellow | `#FCD34D` | Warning (CSS variable) |
| Bounced orange | `#FB923C` / `#F97316` | Inbox flagged, bounced |
| Healthy green | `#22c55e` | Healthy (older components) |
| Info blue | `#3b82f6` | Good score (older gauge) |
| Unsubscribed gray | `#9CA3AF` | Unsubscribed metric |

---

## Neutral/UI Colors (USUALLY KEEP)

| Color | Hex | What It Is |
|-------|-----|-----------|
| Foreground text | `#F5F5F7` | Primary text |
| Muted text | `#A1A1AA` | Secondary text |
| Axis labels | `#6B7280` / `#737373` | Chart axis ticks |
| Near-black | `#0F0F11` / `#1a1a1a` | Older component text/tooltips |
| Placeholders | `#5C5E6A` | Input placeholders |
| Subtitle gray | `#8B8D98` | Login subtitle |
| White | `#ffffff` | Text on primary, tooltip bg (light theme) |
| Light border | `#e5e5e5` | Older component borders (light theme) |

---

## Reskin Checklist

1. **Set `.env.local`** — `WORKSPACE_ID`, `WORKSPACE_NAME`, `EMAILBISON_API_TOKEN`
2. **Replace logo** — swap `public/charm-logo-white.svg` with new client logo; update `components/layout/Sidebar.tsx` logo reference
3. **Replace brand colors** — use the tables above to find-and-replace:
   - Primary purple → client primary
   - Brand cyan → client secondary
   - Brand green → client accent (or keep)
   - Brand pink → client accent 2 (or keep)
   - All `rgba` / hover / gradient-end derived variants
4. **Update PDF export** — `lib/export-pdf.ts` uses `#4F46E5` (indigo) instead of brand purple
5. **Update login page** — `app/login/page.tsx` has its own set of brand colors
6. **Update `globals.css`** — change CSS variables AND the `@theme inline` block
7. **Update `lib/constants.ts`** — `CHART_COLORS` and `STATUS_COLORS`
8. **Verify older components** — files in `components/infrastructure/` use the original `#936BDA`/`#88C2FF` palette (may not be actively rendered but should match)

---

## Quick Reference: Files to Touch

| Priority | File | Color Instances |
|----------|------|----------------|
| 1 | `app/globals.css` | ~30 (CSS variables — cascades everywhere) |
| 2 | `app/(dashboard)/infrastructure/page.tsx` | ~80+ (biggest file) |
| 3 | `lib/constants.ts` | ~8 |
| 4 | `app/login/page.tsx` | ~10 |
| 5 | `components/layout/Sidebar.tsx` | 1 |
| 6 | `lib/export-pdf.ts` | 3 |
| 7 | `components/infrastructure/HealthScoreGauge.tsx` | 8 |
| 8 | `components/infrastructure/VolumeHistoryChart.tsx` | 8 |
| 9 | `components/infrastructure/ProviderHealthWidget.tsx` | 6 |
| 10 | `components/infrastructure/charts/*.tsx` | ~20 across 4 files |

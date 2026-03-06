import { NextResponse } from 'next/server';

// Configuration
const INFRASTRUCTURE_API_URL = process.env.INFRASTRUCTURE_API_URL || 'http://localhost:8000';
const INFRASTRUCTURE_CLIENT_ID = process.env.INFRASTRUCTURE_CLIENT_ID || 'e5988a33-ec6c-4b5a-be85-25b8bd0678bb';

// Mock data for demo (based on SearchAtlas infrastructure v2)
const MOCK_DATA = {
  infrastructure: {
    total_inboxes: 847,
    live_inboxes: 712,
    dead_inboxes: 135,
    avg_health_score: 78.5,
    flagged_domains: 3,
    clean_domains: 156,
    connected_inboxes: 698,
    disconnected_inboxes: 14,
    operational_capacity: 27920,
    potential_capacity: 28480,
    health_distribution: {
      healthy: 423,
      good: 189,
      warning: 67,
      critical: 33,
      total: 712,
    },
    lifecycle_distribution: {
      deployed: 534,
      reserve: 89,
      incubating: 56,
      warning: 33,
    },
    warning_distribution: {
      healthy: 645,
      watching: 38,
      warning: 21,
      critical: 8,
      total_at_risk: 67,
    },
    providers: [
      {
        name: 'Google',
        live_count: 412,
        dead_count: 78,
        avg_health_score: 82.3,
        connected_count: 405,
        disconnected_count: 7,
        reply_rate: 4.2,
        bounce_rate: 1.3,
        replied_count: 847,
      },
      {
        name: 'Microsoft',
        live_count: 256,
        dead_count: 45,
        avg_health_score: 76.8,
        connected_count: 249,
        disconnected_count: 7,
        reply_rate: 3.8,
        bounce_rate: 1.7,
        replied_count: 512,
      },
      {
        name: 'Other',
        live_count: 44,
        dead_count: 12,
        avg_health_score: 71.2,
        connected_count: 44,
        disconnected_count: 0,
        reply_rate: 2.9,
        bounce_rate: 2.1,
        replied_count: 89,
      },
    ],
    last_sync: new Date().toISOString(),
    sync_source: 'EmailBison API (Mock Data)',
  },
  killVelocity: {
    totalDeaths7d: 8,
    totalDeaths30d: 23,
    trend: 'down' as const,
    weeklyData: [
      { week: '2026-02-03', deaths: 7 },
      { week: '2026-02-10', deaths: 5 },
      { week: '2026-02-17', deaths: 6 },
      { week: '2026-02-24', deaths: 5 },
      { week: '2026-03-03', deaths: 8 },
    ],
  },
  killBreakdown: {
    total_kills: 23,
    by_trigger: [
      { trigger: 'Spam Complaint', count: 9, percentage: 39.1 },
      { trigger: 'Hard Blocked', count: 6, percentage: 26.1 },
      { trigger: 'Bad Address', count: 5, percentage: 21.7 },
      { trigger: 'Fresh Bounce', count: 3, percentage: 13.1 },
    ],
  },
  volumeHistory: {
    snapshots: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const baseVolume = 18000 + Math.random() * 4000;
      return {
        date: date.toISOString().split('T')[0],
        emails_sent: Math.round(baseVolume * (0.7 + Math.random() * 0.3)),
        daily_capacity_available: Math.round(baseVolume),
        live_inboxes: 700 + Math.round(Math.random() * 20),
      };
    }),
  },
  alerts: [
    {
      id: 'alert-1',
      type: 'warning' as const,
      title: '14 inboxes need reconnection',
      message: 'OAuth tokens expired - capacity reduced by 560 emails/day',
      entity_type: 'inbox' as const,
      created_at: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      type: 'info' as const,
      title: '8 critical inboxes approaching kill threshold',
      message: 'Review at-risk forecast for details',
      entity_type: 'inbox' as const,
      created_at: new Date().toISOString(),
    },
  ],
  warmupPipeline: {
    warming_count: 56,
    avg_days_to_ready: 12,
    capacity_next_week: 840,
    capacity_next_month: 2240,
    inboxes: [
      { email: 'john.marketing@acme-corp.io', days_warming: 18, warmup_score: 85, estimated_ready_date: '2026-03-08' },
      { email: 'sales.team@brandx.com', days_warming: 14, warmup_score: 72, estimated_ready_date: '2026-03-12' },
      { email: 'outreach@newdomain.co', days_warming: 9, warmup_score: 55, estimated_ready_date: '2026-03-18' },
    ],
  },
  dnsAuthStatus: {
    total_domains: 159,
    spf_configured: 156,
    dkim_configured: 154,
    dmarc_configured: 151,
    mx_configured: 159,
    fully_authenticated: 148,
    domains_missing_auth: [
      { domain: 'newbrand-email.io', missing: ['DKIM', 'DMARC'] },
      { domain: 'acme-outreach.com', missing: ['DMARC'] },
      { domain: 'marketing-hub.net', missing: ['SPF', 'DMARC'] },
    ],
  },
  atRiskForecast: {
    total_at_risk: 67,
    watching: 38,
    warning: 21,
    critical: 8,
    inboxes: [
      { email: 'sales1@flagged-domain.io', risk_level: 'critical' as const, bounces_24h: 2, bounces_7d: 5, next_bounce_kills: true },
      { email: 'marketing@risky-sender.com', risk_level: 'critical' as const, bounces_24h: 1, bounces_7d: 4, next_bounce_kills: true },
      { email: 'outreach@warm-inbox.net', risk_level: 'warning' as const, bounces_24h: 1, bounces_7d: 3, next_bounce_kills: false },
    ],
  },
  client: {
    id: INFRASTRUCTURE_CLIENT_ID,
    name: 'Selery',
    created_at: '2024-06-15T00:00:00Z',
  },
  package: {
    name: 'Enterprise',
    inbox_target: 850,
  },
};

export async function GET() {
  const clientId = INFRASTRUCTURE_CLIENT_ID;
  const apiUrl = INFRASTRUCTURE_API_URL;

  try {
    // Try to fetch from live API first
    const infraResponse = await fetch(`${apiUrl}/api/health/infrastructure/${clientId}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!infraResponse.ok) {
      throw new Error('API not available');
    }

    // If API is available, fetch all data
    const [
      killVelocityResponse,
      killBreakdownResponse,
      volumeResponse,
      clientResponse
    ] = await Promise.all([
      fetch(`${apiUrl}/api/health/kill-velocity/${clientId}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/health/kill-breakdown/${clientId}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/health/daily-volume/${clientId}?days=30`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${apiUrl}/api/clients/${clientId}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
    ]);

    const infrastructure = await infraResponse.json();

    let killVelocity = null;
    if (killVelocityResponse.ok) {
      const rawKillVelocity = await killVelocityResponse.json();
      killVelocity = {
        totalDeaths7d: rawKillVelocity.total_deaths_7d,
        totalDeaths30d: rawKillVelocity.total_deaths_30d,
        trend: rawKillVelocity.trend,
        weeklyData: rawKillVelocity.weekly || [],
      };
    }

    let killBreakdown = null;
    if (killBreakdownResponse.ok) {
      killBreakdown = await killBreakdownResponse.json();
    }

    let volumeHistory = null;
    if (volumeResponse.ok) {
      volumeHistory = await volumeResponse.json();
    }

    let client = null;
    if (clientResponse.ok) {
      client = await clientResponse.json();
    }

    // Return live data with empty placeholders for v2 widgets
    // (these would need additional API endpoints to populate)
    return NextResponse.json({
      infrastructure,
      killVelocity,
      killBreakdown,
      volumeHistory,
      alerts: [],
      warmupPipeline: null,
      dnsAuthStatus: null,
      atRiskForecast: null,
      client,
      package: null,
      clientId,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Fall back to mock data for demo
    console.log('Using mock data for infrastructure demo (API unavailable)');

    return NextResponse.json({
      ...MOCK_DATA,
      clientId,
      fetchedAt: new Date().toISOString(),
    });
  }
}

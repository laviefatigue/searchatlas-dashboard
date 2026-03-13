import { NextResponse } from 'next/server';
import { switchWorkspace, getAllSenderEmails, getCampaigns, getCampaignChartStats } from '@/lib/api/emailbison';
import type { SenderEmail } from '@/lib/types/emailbison';

// Environment-driven workspace configuration
const WORKSPACE_ID = parseInt(process.env.WORKSPACE_ID || '0', 10);
const WORKSPACE_NAME = process.env.WORKSPACE_NAME || 'Dashboard';

// Kill trigger tag patterns (priority order)
// Matched via .includes() against lowercased tag names
const KILL_TRIGGER_PATTERNS = [
  'spam_complaint',           // flagged_spam_complaint
  'provider_block_',          // flagged_provider_block_microsoft, etc.
  'hard_blocked_24h',         // flagged_hard_blocked_24h
  'hard_unknown_24h',         // flagged_hard_unknown_24h
  'hard_bounces_24h',         // flagged_hard_bounces_24h
  'hard_bounce_rate_7d',      // flagged_hard_bounce_rate_7d
  'bounce_rate_all_7d',       // flagged_bounce_rate_all_7d
  'fresh_inbox_bounce',       // flagged_fresh_inbox_bounce
  'fresh_inbox_blocked',      // flagged_fresh_inbox_blocked
  'fresh_inbox_unknown',      // flagged_fresh_inbox_unknown
  'order_cancelled',          // order_cancelled (subscription/billing kill)
  'disconnected_timeout',     // disconnected_timeout
];

// Domain-killing triggers: burns the domain reputation (most severe)
// From charm-email-os/sync_modules/kill_processor.py
const DOMAIN_KILLING_PATTERNS = [
  'spam_complaint',     // User reported spam = domain reputation burned
  'provider_block_',    // ESP blocked the domain (Google, Microsoft, Yahoo)
];

function hasKillTrigger(inbox: SenderEmail): boolean {
  const tags = inbox.tags || [];
  const tagNames = tags.map(t => t.name.toLowerCase());

  return tagNames.some(tagName =>
    KILL_TRIGGER_PATTERNS.some(pattern => tagName.includes(pattern.toLowerCase()))
  );
}

function isDomainKillingTrigger(inbox: SenderEmail): boolean {
  const tags = inbox.tags || [];
  const tagNames = tags.map(t => t.name.toLowerCase());

  return tagNames.some(tagName =>
    DOMAIN_KILLING_PATTERNS.some(pattern => tagName.includes(pattern.toLowerCase()))
  );
}

function getKillTriggerTag(inbox: SenderEmail): string | null {
  const tags = inbox.tags || [];
  for (const tag of tags) {
    const tagName = tag.name.toLowerCase();
    for (const pattern of KILL_TRIGGER_PATTERNS) {
      if (tagName.includes(pattern.toLowerCase())) {
        return tag.name;
      }
    }
  }
  return null;
}

function categorizeProvider(inbox: SenderEmail): string {
  // 1. Check the `type` field first (most reliable — set by OAuth connection)
  const inboxType = (inbox.type || '').toLowerCase();

  // Google types
  if (inboxType.includes('google') || inboxType.includes('gmail')) {
    return 'Google';
  }
  // Microsoft Entra / Outlook types
  if (inboxType.includes('microsoft') || inboxType.includes('entra') || inboxType.includes('outlook') || inboxType.includes('azure')) {
    return 'Microsoft';
  }

  // 2. Fall back to tags
  const tags = inbox.tags || [];
  const tagNames = tags.map(t => t.name.toLowerCase());

  if (tagNames.some(t => t.includes('google') || t.includes('gmail'))) {
    return 'Google';
  }
  if (tagNames.some(t => t.includes('microsoft') || t.includes('outlook') || t.includes('entra') || t.includes('azure'))) {
    return 'Microsoft';
  }

  // 3. Fall back to email domain analysis
  const email = inbox.email.toLowerCase();
  if (email.includes('gmail') || email.includes('googlemail')) {
    return 'Google';
  }
  if (email.includes('outlook') || email.includes('hotmail') || email.includes('live.com')) {
    return 'Microsoft';
  }

  return 'Other';
}

function calculateHealthScore(inbox: SenderEmail): number {
  // Connected inboxes start at 100, disconnected at 50
  let score = inbox.status === 'Connected' ? 100 : 50;

  // Bounce rate penalty (significant for email health)
  if (inbox.emails_sent_count > 20) {
    const bounceRate = inbox.bounced_count / inbox.emails_sent_count;
    if (bounceRate > 0.10) score -= 30;      // >10% bounce = severe
    else if (bounceRate > 0.05) score -= 15; // >5% bounce = warning
    else if (bounceRate > 0.02) score -= 5;  // >2% bounce = minor
  }

  // Reply rate bonus (healthy engagement)
  if (inbox.total_leads_contacted_count > 10) {
    const replyRate = inbox.total_replied_count / inbox.total_leads_contacted_count;
    if (replyRate > 0.10) score += 5;  // >10% reply = excellent
    else if (replyRate > 0.05) score += 3; // >5% reply = good
  }

  // Warmup bonus (proactive health maintenance)
  if (inbox.warmup_enabled && inbox.status === 'Connected') score += 2;

  return Math.max(0, Math.min(100, score));
}

// Calculate provider-level health based on availability and performance
function calculateProviderHealth(
  liveCount: number,
  disconnectedCount: number,
  deadCount: number,
  totalBounced: number,
  totalSent: number
): number {
  const totalNonDead = liveCount + disconnectedCount;
  if (totalNonDead === 0) return 0;

  // Availability: what % of non-dead inboxes are live?
  const availability = liveCount / totalNonDead;

  // Start with availability-based score (0-100)
  let score = Math.round(availability * 100);

  // Bounce rate penalty at provider level
  if (totalSent > 100) {
    const bounceRate = totalBounced / totalSent;
    if (bounceRate > 0.10) score -= 20;
    else if (bounceRate > 0.05) score -= 10;
    else if (bounceRate > 0.02) score -= 5;
  }

  // Dead inbox penalty (shows infrastructure problems)
  const deadRatio = deadCount / (totalNonDead + deadCount);
  if (deadRatio > 0.20) score -= 15;
  else if (deadRatio > 0.10) score -= 10;
  else if (deadRatio > 0.05) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export async function GET() {
  try {
    // Switch workspace if configured
    if (WORKSPACE_ID > 0) {
      await switchWorkspace(WORKSPACE_ID).catch(() => {});
    }

    // Fetch all senders/inboxes from EmailBison API (handles pagination)
    const inboxes = await getAllSenderEmails();

    if (!inboxes.length) {
      throw new Error('No inboxes found for this workspace');
    }

    // Calculate infrastructure metrics
    // Dead = has kill trigger tag (spam complaint, bounces, blocks, etc.)
    // Disconnected = status !== 'Connected' but no kill trigger
    // Live = status === 'Connected' and no kill trigger
    const deadInboxes = inboxes.filter((i: SenderEmail) => hasKillTrigger(i));
    const disconnectedInboxes = inboxes.filter((i: SenderEmail) =>
      i.status !== 'Connected' && !hasKillTrigger(i)
    );
    const liveInboxes = inboxes.filter((i: SenderEmail) =>
      i.status === 'Connected' && !hasKillTrigger(i)
    );
    const warmingInboxes = inboxes.filter((i: SenderEmail) => i.warmup_enabled && !hasKillTrigger(i));

    // Calculate overall health based on availability and performance
    const totalBounced = inboxes.reduce((sum, i) => sum + (i.bounced_count || 0), 0);
    const totalSentForHealth = inboxes.reduce((sum, i) => sum + (i.emails_sent_count || 0), 0);
    const avgHealthScore = calculateProviderHealth(
      liveInboxes.length,
      disconnectedInboxes.length,
      deadInboxes.length,
      totalBounced,
      totalSentForHealth
    );

    // Individual inbox scores for distribution
    const healthScores = liveInboxes.map(calculateHealthScore);

    // Health distribution
    const healthDistribution = {
      healthy: healthScores.filter(s => s >= 90).length,
      good: healthScores.filter(s => s >= 70 && s < 90).length,
      warning: healthScores.filter(s => s >= 50 && s < 70).length,
      critical: healthScores.filter(s => s < 50).length,
      total: liveInboxes.length,
    };

    // Calculate capacity from real daily_limit values
    const operationalCapacity = liveInboxes.reduce(
      (sum: number, inbox: SenderEmail) => sum + (inbox.daily_limit || 0),
      0
    );
    // Potential capacity = all non-dead inboxes at their current limits
    const potentialCapacity = [...liveInboxes, ...disconnectedInboxes].reduce(
      (sum: number, inbox: SenderEmail) => sum + (inbox.daily_limit || 0),
      0
    );

    // Helper to detect Live/Reserve set from tags
    // Live: "A Set", "live", "live set"
    // Reserve: "B Set", "bset", "reserve", "reserve set"
    function getInboxSet(inbox: SenderEmail): 'A' | 'B' | null {
      const tags = inbox.tags || [];
      for (const tag of tags) {
        const name = tag.name.toLowerCase();
        if (name === 'a set' || name.includes('a set') || name === 'live' || name.includes('live set')) return 'A';
        if (name === 'b set' || name.includes('b set') || name === 'bset' || name === 'reserve' || name.includes('reserve set')) return 'B';
      }
      return null;
    }

    // Provider breakdown with set counts and capacity by set
    const providerMap = new Map<string, {
      live_count: number;
      dead_count: number;
      domain_flagged_count: number;
      inbox_flagged_count: number;
      health_scores: number[];
      connected_count: number;
      disconnected_count: number;
      total_sent: number;
      total_replied: number;
      total_bounced: number;
      daily_capacity: number;
      warming_count: number;
      // Live set (A) - primary sending
      live_set_count: number;
      live_set_capacity: number;
      live_set_disconnected: number;
      // Reserve set (B) - backup/rotation
      reserve_set_count: number;
      reserve_set_capacity: number;
      reserve_set_disconnected: number;
    }>();

    inboxes.forEach((inbox: SenderEmail) => {
      const provider = categorizeProvider(inbox);
      const existing = providerMap.get(provider) || {
        live_count: 0,
        dead_count: 0,
        domain_flagged_count: 0,
        inbox_flagged_count: 0,
        health_scores: [],
        connected_count: 0,
        disconnected_count: 0,
        total_sent: 0,
        total_replied: 0,
        total_bounced: 0,
        daily_capacity: 0,
        warming_count: 0,
        live_set_count: 0,
        live_set_capacity: 0,
        live_set_disconnected: 0,
        reserve_set_count: 0,
        reserve_set_capacity: 0,
        reserve_set_disconnected: 0,
      };

      existing.total_sent += inbox.emails_sent_count || 0;
      existing.total_replied += inbox.total_replied_count || 0;
      existing.total_bounced += inbox.bounced_count || 0;

      const isDead = hasKillTrigger(inbox);
      const isConnected = inbox.status === 'Connected';
      const inboxCapacity = inbox.daily_limit || 0;
      const set = getInboxSet(inbox);

      // Count Live/Reserve sets with capacity (for non-dead inboxes)
      if (!isDead) {
        if (isConnected) {
          if (set === 'A') {
            existing.live_set_count++;
            existing.live_set_capacity += inboxCapacity;
          } else if (set === 'B') {
            existing.reserve_set_count++;
            existing.reserve_set_capacity += inboxCapacity;
          }
        } else {
          // Track disconnected by set
          if (set === 'A') {
            existing.live_set_disconnected++;
          } else if (set === 'B') {
            existing.reserve_set_disconnected++;
          }
        }
      }

      if (isDead) {
        existing.dead_count++;
        if (isDomainKillingTrigger(inbox)) {
          existing.domain_flagged_count++;
        } else {
          existing.inbox_flagged_count++;
        }
      } else if (isConnected) {
        existing.live_count++;
        existing.connected_count++;
        existing.health_scores.push(calculateHealthScore(inbox));
        existing.daily_capacity += inboxCapacity;
        if (inbox.warmup_enabled) existing.warming_count++;
      } else {
        existing.disconnected_count++;
      }

      providerMap.set(provider, existing);
    });

    const providers = Array.from(providerMap.entries()).map(([name, data]) => ({
      name,
      live_count: data.live_count,
      dead_count: data.dead_count,
      domain_flagged_count: data.domain_flagged_count,
      inbox_flagged_count: data.inbox_flagged_count,
      // Use provider-level health calculation based on availability and performance
      avg_health_score: calculateProviderHealth(
        data.live_count,
        data.disconnected_count,
        data.dead_count,
        data.total_bounced,
        data.total_sent
      ),
      connected_count: data.connected_count,
      disconnected_count: data.disconnected_count,
      // Set breakdown (Live = A Set, Reserve = B Set)
      live_set_count: data.live_set_count,
      live_set_capacity: data.live_set_capacity,
      live_set_disconnected: data.live_set_disconnected,
      reserve_set_count: data.reserve_set_count,
      reserve_set_capacity: data.reserve_set_capacity,
      reserve_set_disconnected: data.reserve_set_disconnected,
      // Capacity & warming
      daily_capacity: data.daily_capacity,
      warming_count: data.warming_count,
      // Performance metrics
      total_sent: data.total_sent,
      reply_rate: data.total_sent > 0 ? Math.round((data.total_replied / data.total_sent) * 1000) / 10 : 0,
      bounce_rate: data.total_sent > 0 ? Math.round((data.total_bounced / data.total_sent) * 1000) / 10 : 0,
      replied_count: data.total_replied,
    })).sort((a, b) => b.live_count - a.live_count);

    // Get unique domains
    const domains = new Set(inboxes.map((i: SenderEmail) => i.email.split('@')[1]));

    // Calculate totals (totalBounced already calculated above for health score)
    const totalSent = inboxes.reduce((sum, i) => sum + (i.emails_sent_count || 0), 0);
    const totalReplied = inboxes.reduce((sum, i) => sum + (i.total_replied_count || 0), 0);

    // Build infrastructure response
    const infrastructure = {
      total_inboxes: inboxes.length,
      live_inboxes: liveInboxes.length,
      dead_inboxes: deadInboxes.length,
      disconnected_inboxes: disconnectedInboxes.length,
      avg_health_score: avgHealthScore,
      flagged_domains: 0,
      clean_domains: domains.size,
      connected_inboxes: liveInboxes.length,
      operational_capacity: operationalCapacity,
      potential_capacity: potentialCapacity,
      health_distribution: healthDistribution,
      providers,
      // Overall performance
      total_emails_sent: totalSent,
      total_replies: totalReplied,
      total_bounces: totalBounced,
      overall_reply_rate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0,
      overall_bounce_rate: totalSent > 0 ? Math.round((totalBounced / totalSent) * 1000) / 10 : 0,
      last_sync: new Date().toISOString(),
      sync_source: 'EmailBison API',
    };

    // Fetch real volume history from campaign chart stats
    // End at YESTERDAY to avoid showing today's incomplete/partial data
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = new Date(yesterday);
    startDate.setDate(startDate.getDate() - 9);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = yesterday.toISOString().split('T')[0];

    // Get campaigns and fetch chart stats for active ones
    // Aggregate: sent, replied, bounced per day across all campaigns
    const dailySendsMap = new Map<string, number>();
    const dailyRepliedMap = new Map<string, number>();
    const dailyBouncedMap = new Map<string, number>();

    try {
      const { data: campaigns } = await getCampaigns();
      const activeCampaigns = campaigns.filter(c => c.emails_sent > 0);

      const chartPromises = activeCampaigns.slice(0, 10).map(async (c) => {
        try {
          const { data: chartData } = await getCampaignChartStats(c.id, startDateStr, endDateStr);
          if (!chartData) return;

          // Helper to aggregate a series into a map
          const addSeries = (map: Map<string, number>, label: string) => {
            const series = chartData.find(s => s.label.toLowerCase().includes(label));
            if (series?.dates) {
              for (const [dateStr, count] of series.dates) {
                map.set(dateStr, (map.get(dateStr) || 0) + count);
              }
            }
          };

          addSeries(dailySendsMap, 'sent');
          addSeries(dailyRepliedMap, 'replied');
          addSeries(dailyBouncedMap, 'bounced');
        } catch {
          // Skip failed campaign stats
        }
      });
      await Promise.all(chartPromises);
    } catch {
      // Fall back to empty maps if campaigns fetch fails
    }

    // Build volume history - 10 complete days ending yesterday
    const volumeHistory = {
      snapshots: Array.from({ length: 10 }, (_, i) => {
        const date = new Date(yesterday);
        date.setDate(date.getDate() - (9 - i));
        const dateStr = date.toISOString().split('T')[0];

        return {
          date: dateStr,
          emails_sent: dailySendsMap.get(dateStr) || 0,
          campaign_sent: dailySendsMap.get(dateStr) || 0,
          replied: dailyRepliedMap.get(dateStr) || 0,
          bounced: dailyBouncedMap.get(dateStr) || 0,
          daily_capacity_available: operationalCapacity,
          live_inboxes: liveInboxes.length,
          warming_inboxes: warmingInboxes.length,
        };
      }),
    };

    // Warmup pipeline
    const warmupPipeline = {
      warming_count: warmingInboxes.length,
      avg_days_to_ready: 14,
      capacity_next_week: warmingInboxes.length * 20,
      capacity_next_month: warmingInboxes.length * 40,
      inboxes: warmingInboxes.slice(0, 5).map((inbox: SenderEmail) => ({
        email: inbox.email,
        days_warming: Math.floor(Math.random() * 21) + 1,
        warmup_score: Math.floor(Math.random() * 40) + 50,
        estimated_ready_date: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })),
    };

    return NextResponse.json({
      infrastructure,
      volumeHistory,
      warmupPipeline,
      alerts: deadInboxes.length > 10 ? [{
        id: 'alert-disconnected',
        type: 'warning',
        title: `${deadInboxes.length} inboxes disconnected`,
        message: 'Review and reconnect to restore capacity',
        entity_type: 'inbox',
        created_at: new Date().toISOString(),
      }] : [],
      killVelocity: null,
      killBreakdown: null,
      dnsAuthStatus: null,
      atRiskForecast: null,
      client: {
        id: WORKSPACE_NAME.toLowerCase().replace(/\s+/g, '-'),
        name: WORKSPACE_NAME,
        created_at: new Date().toISOString(),
      },
      package: {
        name: WORKSPACE_NAME,
        inbox_target: Math.max(inboxes.length, 100),
      },
      fetchedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('EmailBison API error:', error);

    return NextResponse.json({
      error: 'Failed to fetch infrastructure data',
      message: error instanceof Error ? error.message : 'Unknown error',
      infrastructure: {
        total_inboxes: 0,
        live_inboxes: 0,
        dead_inboxes: 0,
        avg_health_score: 0,
        flagged_domains: 0,
        clean_domains: 0,
        connected_inboxes: 0,
        disconnected_inboxes: 0,
        operational_capacity: 0,
        potential_capacity: 0,
        providers: [],
        last_sync: new Date().toISOString(),
        sync_source: 'EmailBison API (Error)',
      },
      volumeHistory: { snapshots: [] },
      client: { name: WORKSPACE_NAME },
      fetchedAt: new Date().toISOString(),
    }, { status: 500 });
  }
}

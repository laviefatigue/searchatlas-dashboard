import { NextResponse } from 'next/server';
import { switchWorkspace, getAllSenderEmails } from '@/lib/api/emailbison';
import type { SenderEmail } from '@/lib/types/emailbison';

// Environment-driven workspace configuration
const WORKSPACE_ID = parseInt(process.env.WORKSPACE_ID || '0', 10);
const WORKSPACE_NAME = process.env.WORKSPACE_NAME || 'Dashboard';

// Kill trigger tag patterns (matched via .includes() against lowercased tag names)
const KILL_TRIGGER_PATTERNS = [
  'spam_complaint',
  'provider_block_',
  'hard_blocked_24h',
  'hard_unknown_24h',
  'hard_bounces_24h',
  'hard_bounce_rate_7d',
  'bounce_rate_all_7d',
  'fresh_inbox_bounce',
  'fresh_inbox_blocked',
  'fresh_inbox_unknown',
  'order_cancelled',
  'disconnected_timeout',
];

function hasKillTrigger(inbox: SenderEmail): boolean {
  const tags = inbox.tags || [];
  const tagNames = tags.map(t => t.name.toLowerCase());
  return tagNames.some(tagName =>
    KILL_TRIGGER_PATTERNS.some(pattern => tagName.includes(pattern.toLowerCase()))
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
  const inboxType = (inbox.type || '').toLowerCase();
  if (inboxType.includes('google') || inboxType.includes('gmail')) return 'Google';
  if (inboxType.includes('microsoft') || inboxType.includes('entra') || inboxType.includes('outlook') || inboxType.includes('azure')) return 'Microsoft';

  const tags = inbox.tags || [];
  const tagNames = tags.map(t => t.name.toLowerCase());
  if (tagNames.some(t => t.includes('google') || t.includes('gmail'))) return 'Google';
  if (tagNames.some(t => t.includes('microsoft') || t.includes('outlook') || t.includes('entra') || t.includes('azure'))) return 'Microsoft';

  const email = inbox.email.toLowerCase();
  if (email.includes('gmail') || email.includes('googlemail')) return 'Google';
  if (email.includes('outlook') || email.includes('hotmail') || email.includes('live.com')) return 'Microsoft';

  return 'Other';
}

function calculateHealthScore(inbox: SenderEmail): number {
  let score = inbox.status === 'Connected' ? 100 : 50;

  if (inbox.emails_sent_count > 20) {
    const bounceRate = inbox.bounced_count / inbox.emails_sent_count;
    if (bounceRate > 0.10) score -= 30;
    else if (bounceRate > 0.05) score -= 15;
    else if (bounceRate > 0.02) score -= 5;
  }

  if (inbox.total_leads_contacted_count > 10) {
    const replyRate = inbox.total_replied_count / inbox.total_leads_contacted_count;
    if (replyRate > 0.10) score += 5;
    else if (replyRate > 0.05) score += 3;
  }

  if (inbox.warmup_enabled && inbox.status === 'Connected') score += 2;

  return Math.max(0, Math.min(100, score));
}

function getInboxSet(inbox: SenderEmail): 'Live' | 'Reserve' | null {
  const tags = inbox.tags || [];
  for (const tag of tags) {
    const name = tag.name.toLowerCase();
    // Match: "a set", "A Set", "live", "Live", "live set"
    if (name === 'a set' || name.includes('a set') || name === 'live' || name.includes('live set')) return 'Live';
    // Match: "b set", "B Set", "bset", "reserve", "Reserve", "reserve set"
    if (name === 'b set' || name.includes('b set') || name === 'bset' || name === 'reserve' || name.includes('reserve set')) return 'Reserve';
  }
  return null;
}

// Domain-killing triggers: burns the domain reputation (most severe)
const DOMAIN_KILLING_PATTERNS = [
  'spam_complaint',
  'provider_block_',
];

function isDomainKillingTrigger(inbox: SenderEmail): boolean {
  const tags = inbox.tags || [];
  const tagNames = tags.map(t => t.name.toLowerCase());
  return tagNames.some(tagName =>
    DOMAIN_KILLING_PATTERNS.some(pattern => tagName.includes(pattern.toLowerCase()))
  );
}

function getInboxStatus(inbox: SenderEmail): string {
  if (hasKillTrigger(inbox)) return 'Flagged';
  if (inbox.status !== 'Connected') return 'Disconnected';
  return 'Live';
}

// Human-readable kill trigger labels for client-facing exports
function formatTriggerName(rawTag: string): string {
  const map: Record<string, string> = {
    'spam_complaint': 'Spam Complaint',
    'provider_block_microsoft': 'Microsoft Block',
    'provider_block_google': 'Google Block',
    'provider_block_yahoo': 'Yahoo Block',
    'hard_blocked_24h': 'Hard Blocked (24h)',
    'hard_unknown_24h': 'Hard Unknown (24h)',
    'hard_bounces_24h': 'Hard Bounces (24h)',
    'hard_bounce_rate_7d': 'High Bounce Rate (7d)',
    'bounce_rate_all_7d': 'Bounce Rate Alert (7d)',
    'fresh_inbox_bounce': 'Fresh Inbox Bounce',
    'fresh_inbox_blocked': 'Fresh Inbox Blocked',
    'fresh_inbox_unknown': 'Fresh Inbox Unknown',
    'order_cancelled': 'Order Cancelled',
    'disconnected_timeout': 'Disconnected Timeout',
  };

  const lower = rawTag.toLowerCase().replace(/^flagged_/, '');
  for (const [pattern, label] of Object.entries(map)) {
    if (lower.includes(pattern)) return label;
  }
  // Fallback: title-case the raw tag
  return rawTag.replace(/^flagged_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function GET() {
  try {
    // Switch workspace if configured
    if (WORKSPACE_ID > 0) {
      await switchWorkspace(WORKSPACE_ID).catch(() => {});
    }

    const inboxes = await getAllSenderEmails();

    if (!inboxes.length) {
      return NextResponse.json({ error: 'No inboxes found' }, { status: 404 });
    }

    // Transform all inboxes for export
    const exportInboxes = inboxes.map((inbox: SenderEmail) => {
      const bounceRate = inbox.emails_sent_count > 0
        ? Math.round((inbox.bounced_count / inbox.emails_sent_count) * 1000) / 10
        : 0;
      const replyRate = inbox.total_leads_contacted_count > 0
        ? Math.round((inbox.total_replied_count / inbox.total_leads_contacted_count) * 1000) / 10
        : 0;

      return {
        email: inbox.email,
        provider: categorizeProvider(inbox),
        status: getInboxStatus(inbox),
        health_score: calculateHealthScore(inbox),
        kill_trigger: getKillTriggerTag(inbox) || '',
        daily_limit: inbox.daily_limit || 0,
        emails_sent: inbox.emails_sent_count || 0,
        bounced: inbox.bounced_count || 0,
        replied: inbox.total_replied_count || 0,
        bounce_rate: bounceRate,
        reply_rate: replyRate,
        warmup: inbox.warmup_enabled ? 'Yes' : 'No',
        set: getInboxSet(inbox) || 'Unassigned',
      };
    });

    // Build kill triggers report with severity and date detected
    // updated_at is the best proxy for when the trigger tag was assigned
    const killTriggerReport = inboxes
      .filter((inbox: SenderEmail) => hasKillTrigger(inbox))
      .map((inbox: SenderEmail) => {
        const triggerTag = getKillTriggerTag(inbox) || '';
        const severity = isDomainKillingTrigger(inbox) ? 'Critical' : 'Flagged';

        return {
          email: inbox.email,
          provider: categorizeProvider(inbox),
          trigger: formatTriggerName(triggerTag),
          severity,
          last_updated: inbox.updated_at
            ? new Date(inbox.updated_at).toISOString().split('T')[0]
            : '',
          domain: inbox.email.split('@')[1] || '',
          daily_limit: inbox.daily_limit || 0,
          emails_sent: inbox.emails_sent_count || 0,
          bounced: inbox.bounced_count || 0,
          bounce_rate: inbox.emails_sent_count > 0
            ? Math.round((inbox.bounced_count / inbox.emails_sent_count) * 1000) / 10
            : 0,
          set: getInboxSet(inbox) || 'Unassigned',
        };
      })
      .sort((a, b) => {
        // Sort: Critical first, then by date descending
        if (a.severity !== b.severity) return a.severity === 'Critical' ? -1 : 1;
        return b.last_updated.localeCompare(a.last_updated);
      });

    // Filter subsets
    const disconnectedInboxes = exportInboxes.filter(i => i.status === 'Disconnected');

    // Summary stats
    const summary = {
      total_inboxes: inboxes.length,
      live_inboxes: exportInboxes.filter(i => i.status === 'Live').length,
      flagged_inboxes: killTriggerReport.length,
      critical_count: killTriggerReport.filter(i => i.severity === 'Critical').length,
      flagged_count: killTriggerReport.filter(i => i.severity === 'Flagged').length,
      disconnected_inboxes: disconnectedInboxes.length,
      total_capacity: exportInboxes.filter(i => i.status === 'Live').reduce((sum, i) => sum + i.daily_limit, 0),
      google_count: exportInboxes.filter(i => i.provider === 'Google').length,
      microsoft_count: exportInboxes.filter(i => i.provider === 'Microsoft').length,
      avg_health_score: Math.round(
        exportInboxes.filter(i => i.status === 'Live').reduce((sum, i) => sum + i.health_score, 0) /
        Math.max(1, exportInboxes.filter(i => i.status === 'Live').length)
      ),
      export_date: new Date().toISOString(),
      workspace: WORKSPACE_NAME,
    };

    return NextResponse.json({
      inboxes: exportInboxes,
      killTriggers: killTriggerReport,
      disconnects: disconnectedInboxes,
      summary,
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

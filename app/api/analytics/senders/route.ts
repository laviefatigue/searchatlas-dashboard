import { NextResponse } from 'next/server';
import { getAllSenderEmails, switchWorkspace } from '@/lib/api/emailbison';
import type {
  SenderEmail,
  EmailProvider,
  ProviderStats,
  DomainStats,
  TopSender,
  SenderAnalytics,
} from '@/lib/types/emailbison';

// Environment-driven workspace configuration
const WORKSPACE_ID = parseInt(process.env.WORKSPACE_ID || '0', 10);

function detectProvider(sender: SenderEmail): EmailProvider {
  const type = sender.type?.toLowerCase() || '';
  if (type.includes('google')) return 'Google';
  if (type.includes('microsoft')) return 'Microsoft';
  const tagNames = sender.tags?.map(t => t.name.toLowerCase()) || [];
  if (tagNames.some(t => t.includes('google') || t.includes('gmail'))) return 'Google';
  if (tagNames.some(t => t.includes('outlook') || t.includes('microsoft'))) return 'Microsoft';
  return 'Other';
}

function rate(num: number, denom: number): number {
  return denom > 0 ? parseFloat(((num / denom) * 100).toFixed(2)) : 0;
}

export async function GET() {
  try {
    if (WORKSPACE_ID > 0) {
      await switchWorkspace(WORKSPACE_ID).catch(() => {});
    }

    const senders = await getAllSenderEmails();

    // Aggregate by provider
    const providerMap = new Map<EmailProvider, Omit<ProviderStats, 'replyRate' | 'bounceRate' | 'interestRate'>>();
    // Aggregate by domain
    const domainMap = new Map<string, Omit<DomainStats, 'replyRate' | 'bounceRate' | 'interestRate'>>();

    let connectedCount = 0;

    for (const s of senders) {
      const provider = detectProvider(s);
      const domain = s.email.split('@')[1] || 'unknown';
      if (s.status?.toLowerCase() === 'connected') connectedCount++;

      // Provider aggregation
      const prov = providerMap.get(provider) || {
        provider, accountCount: 0, emailsSent: 0, contacted: 0, replied: 0, bounced: 0, interested: 0,
      };
      prov.accountCount++;
      prov.emailsSent += s.emails_sent_count;
      prov.contacted += s.total_leads_contacted_count;
      prov.replied += s.unique_replied_count;
      prov.bounced += s.bounced_count;
      prov.interested += s.interested_leads_count;
      providerMap.set(provider, prov);

      // Domain aggregation
      const dom = domainMap.get(domain) || {
        domain, provider, accountCount: 0, emailsSent: 0, contacted: 0, replied: 0, bounced: 0, interested: 0,
      };
      dom.accountCount++;
      dom.emailsSent += s.emails_sent_count;
      dom.contacted += s.total_leads_contacted_count;
      dom.replied += s.unique_replied_count;
      dom.bounced += s.bounced_count;
      dom.interested += s.interested_leads_count;
      domainMap.set(domain, dom);
    }

    const byProvider: ProviderStats[] = Array.from(providerMap.values())
      .map(p => ({
        ...p,
        replyRate: rate(p.replied, p.contacted),
        bounceRate: rate(p.bounced, p.emailsSent),
        interestRate: rate(p.interested, p.contacted),
      }))
      .sort((a, b) => b.emailsSent - a.emailsSent);

    const byDomain: DomainStats[] = Array.from(domainMap.values())
      .map(d => ({
        ...d,
        replyRate: rate(d.replied, d.contacted),
        bounceRate: rate(d.bounced, d.emailsSent),
        interestRate: rate(d.interested, d.contacted),
      }))
      .sort((a, b) => b.emailsSent - a.emailsSent);

    // Top 20 individual senders by emails sent
    const topSenders: TopSender[] = senders
      .filter(s => s.emails_sent_count > 0)
      .sort((a, b) => b.emails_sent_count - a.emails_sent_count)
      .slice(0, 20)
      .map(s => ({
        email: s.email,
        domain: s.email.split('@')[1] || 'unknown',
        provider: detectProvider(s),
        status: s.status,
        emailsSent: s.emails_sent_count,
        replied: s.unique_replied_count,
        bounced: s.bounced_count,
        interested: s.interested_leads_count,
        replyRate: rate(s.unique_replied_count, s.total_leads_contacted_count),
        bounceRate: rate(s.bounced_count, s.emails_sent_count),
      }));

    const result: SenderAnalytics = {
      totalAccounts: senders.length,
      connectedAccounts: connectedCount,
      byProvider,
      byDomain,
      topSenders,
    };

    return NextResponse.json({ data: result }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('[Analytics/Senders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sender analytics' },
      { status: 500 }
    );
  }
}

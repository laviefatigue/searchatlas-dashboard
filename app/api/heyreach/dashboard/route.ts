import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type {
  SocialDashboardData,
  SocialHeroMetrics,
  SocialFunnelData,
  SocialCampaignRow,
  SocialSenderStats,
  SocialReplyItem,
  SocialDailyStats,
} from '@/lib/types/heyreach';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range from period
    const now = new Date();
    let dateFrom: Date;
    switch (period) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'week': {
        // Current week (Monday to now)
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1; // Monday = 0
        dateFrom = new Date(now);
        dateFrom.setDate(now.getDate() - diff);
        dateFrom.setHours(0, 0, 0, 0);
        break;
      }
      case 'all':
        dateFrom = new Date('2020-01-01');
        break;
      case '30d':
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // ── Campaigns ────────────────────────────────────────────────────
    const campaigns = await prisma.campaign.findMany({
      include: {
        campaignSenders: {
          include: { sender: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ── Leads (filtered by date) ─────────────────────────────────────
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: { gte: dateFrom },
      },
    });

    // ── Senders ──────────────────────────────────────────────────────
    const senders = await prisma.sender.findMany({
      include: {
        campaignSenders: true,
      },
    });

    // ── Daily Stats ──────────────────────────────────────────────────
    const statsDaily = await prisma.statsDaily.findMany({
      where: {
        date: { gte: dateFrom },
        campaignId: null, // aggregate stats
      },
      orderBy: { date: 'asc' },
    });

    // ── Last Sync ────────────────────────────────────────────────────
    const lastSync = await prisma.syncLog.findFirst({
      where: { completedAt: { not: null }, error: null },
      orderBy: { completedAt: 'desc' },
    });

    // ── Compute Hero Metrics ─────────────────────────────────────────
    const activeCampaigns = campaigns.filter(
      (c) => c.status === 'IN_PROGRESS'
    );
    const activeSenderIds = new Set<number>();
    for (const c of activeCampaigns) {
      for (const cs of c.campaignSenders) {
        activeSenderIds.add(cs.senderId);
      }
    }

    const accepted = leads.filter(
      (l) => l.connectionStatus === 'ConnectionAccepted'
    ).length;
    const connectionsSent = leads.filter(
      (l) =>
        l.connectionStatus === 'ConnectionSent' ||
        l.connectionStatus === 'ConnectionAccepted'
    ).length;
    const replied = leads.filter(
      (l) =>
        l.messageStatus === 'MessageReply' ||
        l.messageStatus === 'InMailReply'
    ).length;

    const hero: SocialHeroMetrics = {
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaigns.length,
      connectionsSent,
      connectionsAccepted: accepted,
      acceptanceRate:
        connectionsSent > 0
          ? Math.round((accepted / connectionsSent) * 1000) / 10
          : 0,
      totalReplies: replied,
      replyRate:
        accepted > 0
          ? Math.round((replied / accepted) * 1000) / 10
          : 0,
      activeSenders: activeSenderIds.size,
      senderNames: senders
        .filter((s) => activeSenderIds.has(s.id))
        .map((s) => s.fullName),
    };

    // ── Compute Funnel ───────────────────────────────────────────────
    const funnel: SocialFunnelData = {
      totalLeads: leads.length,
      connectionsSent,
      accepted,
      replied,
      interested: 0, // will be enriched with AI later
    };

    // ── Campaign Rows ────────────────────────────────────────────────
    const campaignRows: SocialCampaignRow[] = campaigns.map((c) => {
      const campaignLeads = leads.filter((l) => l.campaignId === c.id);
      const cAccepted = campaignLeads.filter(
        (l) => l.connectionStatus === 'ConnectionAccepted'
      ).length;
      const cSent = campaignLeads.filter(
        (l) =>
          l.connectionStatus === 'ConnectionSent' ||
          l.connectionStatus === 'ConnectionAccepted'
      ).length;
      const cReplied = campaignLeads.filter(
        (l) =>
          l.messageStatus === 'MessageReply' ||
          l.messageStatus === 'InMailReply'
      ).length;

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        senders: c.campaignSenders.map((cs) => ({
          id: cs.sender.id,
          name: cs.sender.fullName,
        })),
        totalLeads: c.totalLeads,
        connectionsSent: cSent,
        accepted: cAccepted,
        acceptanceRate:
          cSent > 0
            ? Math.round((cAccepted / cSent) * 1000) / 10
            : 0,
        replies: cReplied,
        replyRate:
          cAccepted > 0
            ? Math.round((cReplied / cAccepted) * 1000) / 10
            : 0,
        inProgress: c.inProgress,
        pending: c.pending,
        finished: c.finished,
        failed: c.failed,
        stopped: c.stopped,
        excluded: c.excluded,
        startedAt: c.startedAt?.toISOString() ?? null,
      };
    });

    // ── Sender Stats ─────────────────────────────────────────────────
    const senderStats: SocialSenderStats[] = senders.map((s) => {
      const senderLeads = leads.filter((l) => l.senderId === s.id);
      const sAccepted = senderLeads.filter(
        (l) => l.connectionStatus === 'ConnectionAccepted'
      ).length;
      const sSent = senderLeads.filter(
        (l) =>
          l.connectionStatus === 'ConnectionSent' ||
          l.connectionStatus === 'ConnectionAccepted'
      ).length;
      const sReplied = senderLeads.filter(
        (l) =>
          l.messageStatus === 'MessageReply' ||
          l.messageStatus === 'InMailReply'
      ).length;

      return {
        id: s.id,
        name: s.fullName,
        campaignCount: s.campaignSenders.length,
        totalLeads: senderLeads.length,
        connectionsSent: sSent,
        accepted: sAccepted,
        acceptanceRate:
          sSent > 0
            ? Math.round((sAccepted / sSent) * 1000) / 10
            : 0,
        replies: sReplied,
        replyRate:
          sAccepted > 0
            ? Math.round((sReplied / sAccepted) * 1000) / 10
            : 0,
        status: (s.isActive && s.authIsValid) ? 'connected' : ('disconnected' as const),
      };
    });

    // ── Reply Items ──────────────────────────────────────────────────
    const replyLeads = leads
      .filter(
        (l) =>
          l.messageStatus === 'MessageReply' ||
          l.messageStatus === 'InMailReply'
      )
      .sort((a, b) => {
        const aTime = a.lastActionAt?.getTime() ?? 0;
        const bTime = b.lastActionAt?.getTime() ?? 0;
        return bTime - aTime;
      });

    const replies: SocialReplyItem[] = replyLeads.map((l) => {
      const campaign = campaigns.find((c) => c.id === l.campaignId);
      const sender = senders.find((s) => s.id === l.senderId);

      return {
        leadId: l.id,
        firstName: l.firstName || '',
        lastName: l.lastName || '',
        companyName: l.companyName || '',
        position: l.position || '',
        profileUrl: l.profileUrl || '',
        location: l.location || '',
        campaignId: l.campaignId,
        campaignName: campaign?.name || '',
        senderName: sender?.fullName || '',
        messageStatus: l.messageStatus,
        lastActionAt: l.lastActionAt?.toISOString() || '',
      };
    });

    // ── Daily Stats for Chart ────────────────────────────────────────
    let dailyStatsData: SocialDailyStats[];

    if (statsDaily.length > 0) {
      dailyStatsData = statsDaily.map((s) => ({
        date: s.date.toISOString().split('T')[0],
        connectionsSent: s.connectionRequestsSent,
        accepted: s.connectionsAccepted,
        replies: s.replies,
      }));
    } else {
      // Fallback: compute daily stats from lead action dates
      const dailyMap = new Map<string, { sent: number; accepted: number; replies: number }>();

      for (const l of leads) {
        const actionDate = l.lastActionAt ?? l.createdAt;
        const dateKey = actionDate.toISOString().split('T')[0];
        const entry = dailyMap.get(dateKey) || { sent: 0, accepted: 0, replies: 0 };

        if (l.connectionStatus === 'ConnectionSent' || l.connectionStatus === 'ConnectionAccepted') {
          entry.sent++;
        }
        if (l.connectionStatus === 'ConnectionAccepted') {
          entry.accepted++;
        }
        if (l.messageStatus === 'MessageReply' || l.messageStatus === 'InMailReply') {
          entry.replies++;
        }

        dailyMap.set(dateKey, entry);
      }

      dailyStatsData = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
          date,
          connectionsSent: stats.sent,
          accepted: stats.accepted,
          replies: stats.replies,
        }));
    }

    const data: SocialDashboardData = {
      hero,
      funnel,
      campaigns: campaignRows,
      senders: senderStats,
      replies,
      dailyStats: dailyStatsData,
      lastSyncedAt: lastSync?.completedAt?.toISOString() ?? null,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error('Dashboard data error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}

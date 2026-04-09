import { NextResponse } from 'next/server';
import { runFullSync } from '@/lib/heyreach-sync';
import { checkApiKey } from '@/lib/api/heyreach';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for full sync

export async function POST() {
  try {
    // Validate API key first
    const valid = await checkApiKey();
    if (!valid) {
      return NextResponse.json(
        { error: 'HeyReach API key is invalid or not configured' },
        { status: 401 }
      );
    }

    const result = await runFullSync();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // GET returns sync status / last sync info
  try {
    const { prisma } = await import('@/lib/db');
    const lastSync = await prisma.syncLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    const campaignCount = await prisma.campaign.count();
    const leadCount = await prisma.lead.count();
    const senderCount = await prisma.sender.count();

    return NextResponse.json({
      lastSync: lastSync
        ? {
            id: lastSync.id,
            startedAt: lastSync.startedAt,
            completedAt: lastSync.completedAt,
            type: lastSync.type,
            recordsSynced: lastSync.recordsSynced,
            error: lastSync.error,
          }
        : null,
      dbStats: { campaigns: campaignCount, leads: leadCount, senders: senderCount },
      configured: {
        campaignIds: process.env.HEYREACH_CAMPAIGN_IDS || '',
        senderIds: process.env.HEYREACH_SENDER_IDS || '',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

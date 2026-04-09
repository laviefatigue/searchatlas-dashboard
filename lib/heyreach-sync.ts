/**
 * HeyReach → SQLite Sync Engine
 *
 * Pulls data from HeyReach API for configured campaigns/senders
 * and writes to the local SQLite database.
 *
 * READ-ONLY: Never calls any HeyReach endpoint that modifies data.
 */

import { prisma } from '@/lib/db';
import {
  getCampaigns,
  getCampaignById,
  getAllCampaignLeads,
  getSenders,
  getOverallStats,
  getConfiguredCampaignIds,
  getConfiguredSenderIds,
} from '@/lib/api/heyreach';

export interface SyncResult {
  success: boolean;
  type: 'full' | 'incremental';
  campaignsSynced: number;
  sendersSynced: number;
  leadsSynced: number;
  statsDaysSynced: number;
  durationMs: number;
  error?: string;
}

export async function runFullSync(): Promise<SyncResult> {
  const startTime = Date.now();
  const campaignIds = getConfiguredCampaignIds();
  const senderIds = getConfiguredSenderIds();

  if (campaignIds.length === 0) {
    return {
      success: false,
      type: 'full',
      campaignsSynced: 0,
      sendersSynced: 0,
      leadsSynced: 0,
      statsDaysSynced: 0,
      durationMs: Date.now() - startTime,
      error: 'HEYREACH_CAMPAIGN_IDS not configured. Set campaign IDs in env vars.',
    };
  }

  // Create sync log entry
  const syncLog = await prisma.syncLog.create({
    data: { type: 'full' },
  });

  let campaignsSynced = 0;
  let sendersSynced = 0;
  let leadsSynced = 0;
  let statsDaysSynced = 0;

  try {
    // ── Step 1: Sync Senders ─────────────────────────────────────────
    if (senderIds.length > 0) {
      const sendersResult = await getSenders(0, 100);
      const apiSenderMap = new Map(
        sendersResult.items.map((s) => [s.id, s])
      );

      for (const senderId of senderIds) {
        const sender = apiSenderMap.get(senderId);
        const isActive = sender?.isActive ?? false;
        const authIsValid = sender?.authIsValid ?? false;
        const profileUrl = sender?.profileUrl ?? null;

        const name = sender
          ? (sender.fullName ||
              [sender.firstName, sender.lastName].filter(Boolean).join(' ') ||
              `Sender ${senderId}`)
          : undefined; // Don't overwrite name if sender not in API

        const upsertData = {
          isActive,
          authIsValid,
          profileUrl,
          syncedAt: new Date(),
          ...(name ? { fullName: name } : {}),
        };

        await prisma.sender.upsert({
          where: { id: senderId },
          create: {
            id: senderId,
            fullName: name || `Sender ${senderId}`,
            isActive,
            authIsValid,
            profileUrl,
          },
          update: upsertData,
        });
        sendersSynced++;
      }
    }

    // ── Step 2: Sync Campaigns ───────────────────────────────────────
    // Fetch all campaigns from API then filter to configured ones
    const allCampaigns = await getCampaigns(0, 100, campaignIds);

    for (const campaign of allCampaigns.items) {
      // Get fresh campaign details for progress stats
      let details;
      try {
        details = await getCampaignById(campaign.id);
      } catch {
        details = campaign;
      }

      const stats = details.progressStats;

      await prisma.campaign.upsert({
        where: { id: campaign.id },
        create: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          createdAt: new Date(campaign.creationTime),
          startedAt: campaign.startedAt
            ? new Date(campaign.startedAt)
            : null,
          totalLeads: stats?.totalUsers ?? 0,
          inProgress: stats?.totalUsersInProgress ?? 0,
          pending: stats?.totalUsersPending ?? 0,
          finished: stats?.totalUsersFinished ?? 0,
          failed: stats?.totalUsersFailed ?? 0,
          stopped: stats?.totalUsersManuallyStopped ?? 0,
          excluded: stats?.totalUsersExcluded ?? 0,
          listName: campaign.linkedInUserListName ?? null,
          listId: campaign.linkedInUserListId ?? null,
        },
        update: {
          name: campaign.name,
          status: campaign.status,
          startedAt: campaign.startedAt
            ? new Date(campaign.startedAt)
            : null,
          totalLeads: stats?.totalUsers ?? 0,
          inProgress: stats?.totalUsersInProgress ?? 0,
          pending: stats?.totalUsersPending ?? 0,
          finished: stats?.totalUsersFinished ?? 0,
          failed: stats?.totalUsersFailed ?? 0,
          stopped: stats?.totalUsersManuallyStopped ?? 0,
          excluded: stats?.totalUsersExcluded ?? 0,
          listName: campaign.linkedInUserListName ?? null,
          listId: campaign.linkedInUserListId ?? null,
          syncedAt: new Date(),
        },
      });

      // Sync campaign ↔ sender relationships
      const campaignSenderIds = (campaign.campaignAccountIds || []).filter(
        (id) => senderIds.length === 0 || senderIds.includes(id)
      );

      for (const senderId of campaignSenderIds) {
        // Ensure sender exists
        await prisma.sender.upsert({
          where: { id: senderId },
          create: { id: senderId, fullName: `Sender ${senderId}` },
          update: {},
        });

        await prisma.campaignSender.upsert({
          where: {
            campaignId_senderId: {
              campaignId: campaign.id,
              senderId,
            },
          },
          create: { campaignId: campaign.id, senderId },
          update: {},
        });
      }

      campaignsSynced++;
    }

    // ── Step 3: Sync Leads per Campaign ──────────────────────────────
    for (const campaign of allCampaigns.items) {
      try {
        const leads = await getAllCampaignLeads(campaign.id);

        for (const lead of leads) {
          const profile = lead.linkedInUserProfile;
          const senderId = lead.linkedInSenderId;

          // Ensure sender exists and campaign↔sender link is created
          if (senderId) {
            await prisma.sender.upsert({
              where: { id: senderId },
              create: {
                id: senderId,
                fullName:
                  lead.linkedInSenderFullName || `Sender ${senderId}`,
              },
              update: lead.linkedInSenderFullName
                ? { fullName: lead.linkedInSenderFullName }
                : {},
            });

            // Backfill campaign↔sender from lead data (API campaignAccountIds can be incomplete)
            await prisma.campaignSender.upsert({
              where: {
                campaignId_senderId: {
                  campaignId: campaign.id,
                  senderId,
                },
              },
              create: { campaignId: campaign.id, senderId },
              update: {},
            });
          }

          await prisma.lead.upsert({
            where: { id: lead.id },
            create: {
              id: lead.id,
              campaignId: campaign.id,
              senderId: senderId || 0,
              firstName: profile?.firstName ?? null,
              lastName: profile?.lastName ?? null,
              headline: profile?.headline ?? null,
              companyName: profile?.companyName ?? null,
              position: profile?.position ?? null,
              profileUrl: profile?.profileUrl ?? null,
              location: profile?.location ?? null,
              email:
                profile?.emailAddress ??
                profile?.enrichedEmailAddress ??
                profile?.customEmailAddress ??
                null,
              connectionStatus: lead.leadConnectionStatus || 'None',
              messageStatus: lead.leadMessageStatus || 'None',
              campaignStatus: lead.leadCampaignStatus || 'Pending',
              createdAt: new Date(lead.creationTime),
              lastActionAt: lead.lastActionTime
                ? new Date(lead.lastActionTime)
                : null,
              finishedAt: lead.finishedTime
                ? new Date(lead.finishedTime)
                : null,
            },
            update: {
              connectionStatus: lead.leadConnectionStatus || 'None',
              messageStatus: lead.leadMessageStatus || 'None',
              campaignStatus: lead.leadCampaignStatus || 'Pending',
              lastActionAt: lead.lastActionTime
                ? new Date(lead.lastActionTime)
                : null,
              finishedAt: lead.finishedTime
                ? new Date(lead.finishedTime)
                : null,
              syncedAt: new Date(),
            },
          });

          leadsSynced++;
        }
      } catch (err) {
        console.error(
          `Failed to sync leads for campaign ${campaign.id}:`,
          err
        );
      }
    }

    // ── Step 4: Sync Daily Stats ─────────────────────────────────────
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      );

      const statsResult = await getOverallStats({
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
        campaignIds,
      });

      const dailyBreakdown = (statsResult as Record<string, unknown>)
        .dailyBreakdown as Array<Record<string, unknown>> | undefined;

      if (dailyBreakdown && Array.isArray(dailyBreakdown)) {
        for (const day of dailyBreakdown) {
          const dateStr = day.date as string;
          if (!dateStr) continue;

          const date = new Date(dateStr);
          // Normalize to midnight UTC for consistent dedup
          date.setUTCHours(0, 0, 0, 0);

          await prisma.statsDaily.upsert({
            where: {
              date_campaignId: { date, campaignId: null as unknown as number },
            },
            create: {
              date,
              campaignId: null,
              connectionRequestsSent:
                (day.connectionRequestsSent as number) ?? 0,
              connectionsAccepted:
                (day.connectionsAccepted as number) ?? 0,
              messagesSent: (day.messagesSent as number) ?? 0,
              replies: (day.replies as number) ?? 0,
              inmailsSent: (day.inmailSent as number) ?? 0,
              inmailReplies: (day.inmailReplies as number) ?? 0,
            },
            update: {
              connectionRequestsSent:
                (day.connectionRequestsSent as number) ?? 0,
              connectionsAccepted:
                (day.connectionsAccepted as number) ?? 0,
              messagesSent: (day.messagesSent as number) ?? 0,
              replies: (day.replies as number) ?? 0,
              inmailsSent: (day.inmailSent as number) ?? 0,
              inmailReplies: (day.inmailReplies as number) ?? 0,
              syncedAt: new Date(),
            },
          });

          statsDaysSynced++;
        }
      }
    } catch (err) {
      console.error('Failed to sync daily stats:', err);
    }

    // ── Complete sync log ────────────────────────────────────────────
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt: new Date(),
        recordsSynced: campaignsSynced + sendersSynced + leadsSynced,
        details: JSON.stringify({
          campaignsSynced,
          sendersSynced,
          leadsSynced,
          statsDaysSynced,
        }),
      },
    });

    return {
      success: true,
      type: 'full',
      campaignsSynced,
      sendersSynced,
      leadsSynced,
      statsDaysSynced,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt: new Date(),
        error: errorMsg,
        recordsSynced: campaignsSynced + sendersSynced + leadsSynced,
      },
    });

    return {
      success: false,
      type: 'full',
      campaignsSynced,
      sendersSynced,
      leadsSynced,
      statsDaysSynced,
      durationMs: Date.now() - startTime,
      error: errorMsg,
    };
  }
}

import { NextResponse } from 'next/server';
import {
  switchWorkspace,
  getCampaigns,
  getCampaignReplies,
  getConversationThread,
  type ThreadMessage,
} from '@/lib/api/emailbison';

// Response-performance metrics, computed live from EmailBison.
//
// Data path (EB-direct — see analysis): campaign replies (inbound, non-automated)
// → per-reply conversation-thread → the team's outbound responses live in
// `newer_messages` (folder='Sent'). First-touch = first response ts − inbound ts.
//
// NOTE: "time to book" is intentionally null — EmailBison has no booking event;
// that metric needs a Day.AI / calendar source and is stubbed until then.

const WORKSPACE_ID = parseInt(process.env.WORKSPACE_ID || '0', 10);

// "1224" SLA model: first touch ≤ 12h, full resolution ≤ 24h (minutes).
const FIRST_TOUCH_TARGET_MIN = 12 * 60;
const RESOLUTION_TARGET_MIN = 24 * 60;

// Bound the N+1 work so a busy workspace can't stall the request.
const MAX_CAMPAIGNS = 20;
const MAX_THREADS = 120;
const THREAD_CONCURRENCY = 10;

const stripHtml = (s?: string) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const msgTs = (m: ThreadMessage) => m.date_received || m.created_at || '';
const minutesBetween = (fromIso: string, toIso: string) =>
  Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000));

const CACHE_TTL_MS = 600_000; // 10 min — response metrics don't change second-to-second
// In-memory cache. The standalone Next server is a single long-lived process, so
// this persists across requests; the file-based cache does not survive in the container.
let memoryCache: { data: unknown; expires: number } | null = null;

export async function GET() {
  try {
    // Served from the in-memory cache within the TTL — the N+1 thread walk only runs on a miss.
    if (memoryCache && memoryCache.expires > Date.now()) {
      return NextResponse.json(memoryCache.data, { headers: { 'X-Cache': 'HIT' } });
    }

    if (WORKSPACE_ID > 0) await switchWorkspace(WORKSPACE_ID).catch(() => {});

    const { data: campaigns } = await getCampaigns();
    const active = campaigns.filter((c) => (c.replied || 0) > 0).slice(0, MAX_CAMPAIGNS);

    // 1) Gather inbound, human (non-automated) replies across campaigns.
    const inbound: Array<{ reply: Awaited<ReturnType<typeof getCampaignReplies>>['data'][number]; campaignName: string }> = [];
    for (const c of active) {
      if (inbound.length >= MAX_THREADS) break;
      try {
        const { data: replies } = await getCampaignReplies(c.id);
        for (const r of replies) {
          if (r.folder === 'Inbox' && !r.automated_reply) {
            inbound.push({ reply: r, campaignName: c.name });
            if (inbound.length >= MAX_THREADS) break;
          }
        }
      } catch {
        /* skip campaign on error */
      }
    }

    // 2) For each inbound reply, pull the thread and compute timing.
    const threads: Array<Record<string, unknown>> = [];
    for (let i = 0; i < inbound.length; i += THREAD_CONCURRENCY) {
      const batch = inbound.slice(i, i + THREAD_CONCURRENCY);
      const results = await Promise.all(
        batch.map(async ({ reply, campaignName }) => {
          const thread = await getConversationThread(reply.id);
          const inboundAt = msgTs(reply as unknown as ThreadMessage);
          const responses = (thread.newer_messages || [])
            .filter((m) => m.folder === 'Sent' || (m.from_email_address && m.from_email_address !== reply.from_email_address))
            .map((m) => ({ at: msgTs(m), text: stripHtml(m.text_body || m.html_body).slice(0, 500) }))
            .filter((m) => m.at)
            .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

          const firstResponseAt = responses[0]?.at || null;
          const lastResponseAt = responses.length ? responses[responses.length - 1].at : null;

          return {
            replyId: reply.id,
            name: reply.from_name || reply.from_email_address || 'Unknown',
            email: reply.from_email_address || '',
            campaign: campaignName,
            interested: !!reply.interested,
            inboundAt,
            inboundText: stripHtml(reply.text_body || reply.html_body).slice(0, 400),
            responses,
            responded: responses.length > 0,
            firstTouchMinutes: firstResponseAt && inboundAt ? minutesBetween(inboundAt, firstResponseAt) : null,
            resolutionMinutes: lastResponseAt && inboundAt ? minutesBetween(inboundAt, lastResponseAt) : null,
          };
        })
      );
      threads.push(...results);
    }

    // 3) Aggregate clocks.
    const num = (v: unknown) => v as number | null;
    // First-touch is reported over INTERESTED threads (the leads that matter), using
    // the MEDIAN so a single slow thread (e.g. a 7-day reply) doesn't distort it.
    const interestedFirstTouches = threads
      .filter((t) => t.interested && t.firstTouchMinutes != null)
      .map((t) => t.firstTouchMinutes as number)
      .sort((a, b) => a - b);
    const allFirstTouches = threads
      .map((t) => num(t.firstTouchMinutes))
      .filter((n): n is number => n != null)
      .sort((a, b) => a - b);
    const resolutions = threads.map((t) => num(t.resolutionMinutes)).filter((n): n is number => n != null);
    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : null);
    // True median: average the two middle values for even-length arrays.
    const median = (arr: number[]) => {
      if (!arr.length) return null;
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2);
    };
    const responded = threads.filter((t) => t.responded);

    const clocks = {
      firstTouchInterestedMedianMinutes: median(interestedFirstTouches),
      firstTouchAllMedianMinutes: median(allFirstTouches),
      avgResolutionMinutes: avg(resolutions),
      avgTimeToBookMinutes: null as number | null, // no booking source in EmailBison
      totalInbound: threads.length,
      respondedCount: responded.length,
      interestedResponded: interestedFirstTouches.length,
      responseRate: threads.length ? Math.round((responded.length / threads.length) * 1000) / 10 : 0,
      // SLA count scoped to interested threads (matches the primary clock).
      interestedWithinFirstTouchSLA: interestedFirstTouches.filter((m) => m <= FIRST_TOUCH_TARGET_MIN).length,
      firstTouchTargetMinutes: FIRST_TOUCH_TARGET_MIN,
      resolutionTargetMinutes: RESOLUTION_TARGET_MIN,
    };

    // Newest inbound first.
    threads.sort((a, b) => new Date(b.inboundAt as string).getTime() - new Date(a.inboundAt as string).getTime());

    const payload = {
      clocks,
      threads,
      meta: {
        campaignsScanned: active.length,
        generatedAt: new Date().toISOString(),
        source: 'EmailBison',
        timeToBookAvailable: false,
      },
    };
    memoryCache = { data: payload, expires: Date.now() + CACHE_TTL_MS };
    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    // Return an empty payload (200) so the UI shows an empty state, not an error card.
    return NextResponse.json({
      clocks: null,
      threads: [],
      meta: {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'EmailBison',
        timeToBookAvailable: false,
      },
    });
  }
}

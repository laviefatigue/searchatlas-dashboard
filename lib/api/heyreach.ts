/**
 * HeyReach API Client — READ-ONLY
 *
 * IMPORTANT: This client must NEVER call endpoints that mutate data.
 * No Pause, Resume, Stop, Delete, Add, or Send operations.
 * Only GET and POST endpoints that retrieve data.
 */

const BASE_URL = 'https://api.heyreach.io/api/public';

function getApiKey(): string {
  const key = process.env.HEYREACH_API_KEY;
  if (!key) throw new Error('HEYREACH_API_KEY is not set');
  return key;
}

async function heyreachFetch<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'X-API-KEY': getApiKey(),
    Accept: 'application/json',
  };

  const fetchOptions: RequestInit = { method, headers };

  if (body && method === 'POST') {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const text = await response.text().catch(() => 'No body');
    throw new Error(
      `HeyReach API error: ${response.status} ${response.statusText} — ${text}`
    );
  }

  // Some endpoints return empty body on 200
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

// ── Auth ─────────────────────────────────────────────────────────────

export async function checkApiKey(): Promise<boolean> {
  try {
    await heyreachFetch('/auth/CheckApiKey');
    return true;
  } catch {
    return false;
  }
}

// ── Campaigns ────────────────────────────────────────────────────────

import type {
  HeyReachCampaign,
  HeyReachLead,
  HeyReachSender,
  HeyReachConversation,
  HeyReachMessage,
  PaginatedResponse,
} from '@/lib/types/heyreach';

export async function getCampaigns(
  offset = 0,
  limit = 100,
  campaignIds?: number[]
): Promise<PaginatedResponse<HeyReachCampaign>> {
  const body: Record<string, unknown> = { offset, limit };

  const result = await heyreachFetch<PaginatedResponse<HeyReachCampaign>>(
    '/campaign/GetAll',
    { method: 'POST', body }
  );

  // Client-side filter to only return configured campaign IDs
  if (campaignIds && campaignIds.length > 0) {
    result.items = result.items.filter((c) => campaignIds.includes(c.id));
    result.totalCount = result.items.length;
  }

  return result;
}

export async function getCampaignById(
  campaignId: number
): Promise<HeyReachCampaign> {
  return heyreachFetch<HeyReachCampaign>('/campaign/GetById', {
    params: { campaignId: String(campaignId) },
  });
}

export async function getCampaignLeads(
  campaignId: number,
  offset = 0,
  limit = 100,
  timeFrom?: string,
  timeTo?: string
): Promise<PaginatedResponse<HeyReachLead>> {
  const body: Record<string, unknown> = { campaignId, offset, limit };
  if (timeFrom) body.timeFrom = timeFrom;
  if (timeTo) body.timeTo = timeTo;

  return heyreachFetch<PaginatedResponse<HeyReachLead>>(
    '/campaign/GetLeadsFromCampaign',
    { method: 'POST', body }
  );
}

// ── Senders ──────────────────────────────────────────────────────────

export async function getSenders(
  offset = 0,
  limit = 100
): Promise<PaginatedResponse<HeyReachSender>> {
  return heyreachFetch<PaginatedResponse<HeyReachSender>>(
    '/li_account/GetAll',
    { method: 'POST', body: { offset, limit } }
  );
}

export async function getSenderById(
  accountId: number
): Promise<HeyReachSender> {
  return heyreachFetch<HeyReachSender>('/li_account/GetById', {
    params: { accountId: String(accountId) },
  });
}

// ── Conversations ────────────────────────────────────────────────────

export async function getConversations(
  filters: {
    campaignIds?: number[];
    linkedInAccountIds?: number[];
    offset?: number;
    limit?: number;
  } = {}
): Promise<PaginatedResponse<HeyReachConversation>> {
  const { offset = 0, limit = 100, ...rest } = filters;
  const body: Record<string, unknown> = {
    offset,
    limit,
    filters: rest,
  };

  return heyreachFetch<PaginatedResponse<HeyReachConversation>>(
    '/inbox/GetConversationsV2',
    { method: 'POST', body }
  );
}

export async function getChatroom(
  accountId: number,
  conversationId: string
): Promise<{ messages: HeyReachMessage[] }> {
  return heyreachFetch<{ messages: HeyReachMessage[] }>(
    `/inbox/GetChatroom/${accountId}/${conversationId}`
  );
}

// ── Stats ────────────────────────────────────────────────────────────

export async function getOverallStats(options: {
  startDate?: string;
  endDate?: string;
  campaignIds?: number[];
  accountIds?: number[];
} = {}): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {};
  if (options.startDate) body.startDate = options.startDate;
  if (options.endDate) body.endDate = options.endDate;
  if (options.campaignIds) body.campaignIds = options.campaignIds;
  if (options.accountIds) body.accountIds = options.accountIds;

  return heyreachFetch<Record<string, unknown>>('/stats/GetOverallStats', {
    method: 'POST',
    body,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Fetches all pages of campaign leads.
 * HeyReach limits to 100 per request, so we paginate.
 */
export async function getAllCampaignLeads(
  campaignId: number
): Promise<HeyReachLead[]> {
  const allLeads: HeyReachLead[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const page = await getCampaignLeads(campaignId, offset, limit);
    allLeads.push(...page.items);

    if (allLeads.length >= page.totalCount || page.items.length < limit) {
      break;
    }
    offset += limit;

    // Safety: don't loop forever (supports campaigns up to 50k leads)
    if (offset > 50000) break;
  }

  return allLeads;
}

/**
 * Gets configured campaign IDs from env var.
 * Returns empty array if not set (sync won't run without config).
 */
export function getConfiguredCampaignIds(): number[] {
  const raw = process.env.HEYREACH_CAMPAIGN_IDS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

/**
 * Gets configured sender IDs from env var.
 */
export function getConfiguredSenderIds(): number[] {
  const raw = process.env.HEYREACH_SENDER_IDS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

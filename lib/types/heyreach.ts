// ── HeyReach API Response Types ──────────────────────────────────────

export interface HeyReachCampaign {
  id: number;
  name: string;
  status: string; // IN_PROGRESS, PAUSED, DRAFT, FINISHED, FAILED, CANCELED
  creationTime: string;
  startedAt?: string;
  linkedInUserListName?: string;
  linkedInUserListId?: number;
  campaignAccountIds: number[];
  progressStats?: {
    totalUsers: number;
    totalUsersInProgress: number;
    totalUsersPending: number;
    totalUsersFinished: number;
    totalUsersFailed: number;
    totalUsersManuallyStopped: number;
    totalUsersExcluded: number;
  };
  organizationUnitId?: number;
}

export interface HeyReachLeadProfile {
  linkedin_id?: string;
  profileUrl?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  imageUrl?: string;
  location?: string;
  companyName?: string;
  position?: string;
  emailAddress?: string;
  enrichedEmailAddress?: string;
  customEmailAddress?: string;
}

export interface HeyReachLead {
  id: number;
  linkedInUserProfileId?: string;
  linkedInUserProfile?: HeyReachLeadProfile;
  lastActionTime?: string;
  failedTime?: string;
  creationTime: string;
  finishedTime?: string;
  leadCampaignStatus: string; // Finished, Failed, InProgress, Pending, ManuallyStopped, Excluded
  leadConnectionStatus: string; // None, ConnectionRequestSent, Connected
  leadMessageStatus: string; // None, MessageSent, MessageReply, InMailSent, InMailReply
  errorCode?: string;
  linkedInSenderId: number;
  linkedInSenderFullName?: string;
}

export interface HeyReachSender {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  linkedInUrl?: string;
  email?: string;
  isActive?: boolean;
  authIsValid?: boolean;
  activeCampaigns?: number;
  profileUrl?: string;
}

export interface HeyReachConversation {
  conversationId: string;
  linkedInAccountId: number;
  leadProfileUrl?: string;
  leadName?: string;
  leadCompanyName?: string;
  lastMessageTime?: string;
  seen?: boolean;
  campaignId?: number;
}

export interface HeyReachMessage {
  content: string;
  isFromLead: boolean;
  sentAt?: string;
}

export interface HeyReachStatsDay {
  date: string;
  connectionRequestsSent?: number;
  connectionsAccepted?: number;
  messagesSent?: number;
  replies?: number;
  inmailSent?: number;
  inmailReplies?: number;
}

export interface HeyReachOverallStats {
  connectionRequestsSent?: number;
  acceptanceRate?: number;
  messagesSent?: number;
  replyRate?: number;
  inmailSent?: number;
  emailReplyRate?: number;
  dailyBreakdown?: HeyReachStatsDay[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

// ── Dashboard View Types ─────────────────────────────────────────────

export interface SocialHeroMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  connectionsSent: number;
  connectionsAccepted: number;
  acceptanceRate: number;
  totalReplies: number;
  replyRate: number;
  activeSenders: number;
  senderNames: string[];
}

export interface SocialCampaignRow {
  id: number;
  name: string;
  status: string;
  senders: Array<{ id: number; name: string }>;
  totalLeads: number;
  connectionsSent: number;
  accepted: number;
  acceptanceRate: number;
  replies: number;
  replyRate: number;
  inProgress: number;
  pending: number;
  finished: number;
  failed: number;
  stopped: number;
  excluded: number;
  startedAt: string | null;
}

export interface SocialFunnelData {
  totalLeads: number;
  connectionsSent: number;
  accepted: number;
  replied: number;
  interested: number;
}

export interface SocialSenderStats {
  id: number;
  name: string;
  campaignCount: number;
  totalLeads: number;
  connectionsSent: number;
  accepted: number;
  acceptanceRate: number;
  replies: number;
  replyRate: number;
  status: 'connected' | 'disconnected';
}

export interface SocialReplyItem {
  leadId: number;
  firstName: string;
  lastName: string;
  companyName: string;
  position: string;
  profileUrl: string;
  location: string;
  campaignId: number;
  campaignName: string;
  senderName: string;
  messageStatus: string;
  sentiment?: string;
  summary?: string;
  lastActionAt: string;
}

export interface SocialDailyStats {
  date: string;
  connectionsSent: number;
  accepted: number;
  replies: number;
}

export interface SocialDashboardData {
  hero: SocialHeroMetrics;
  funnel: SocialFunnelData;
  campaigns: SocialCampaignRow[];
  senders: SocialSenderStats[];
  replies: SocialReplyItem[];
  dailyStats: SocialDailyStats[];
  lastSyncedAt: string | null;
}

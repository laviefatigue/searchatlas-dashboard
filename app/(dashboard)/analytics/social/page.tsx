'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  MessageSquare,
  TrendingUp,
  UserPlus,
  UserCheck,
  Linkedin,
  Target,
  ArrowRight,
  ChevronDown,
  Search,
  Filter,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type {
  SocialDashboardData,
  SocialCampaignRow,
  SocialReplyItem,
} from '@/lib/types/heyreach';

// ── Period Selector ──────────────────────────────────────────────────

type Period = 'week' | '7d' | '30d' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  all: 'All Time',
};

// ── LinkedIn Outreach Funnel ─────────────────────────────────────────

function LinkedInFunnel({ funnel }: { funnel: SocialDashboardData['funnel'] }) {
  const steps = [
    { label: 'Total Leads', value: funnel.totalLeads, color: 'from-gray-600 to-gray-700' },
    { label: 'Conn. Sent', value: funnel.connectionsSent, color: 'from-searchatlas-cyan/70 to-searchatlas-cyan/50' },
    { label: 'Accepted', value: funnel.accepted, color: 'from-blue-500/70 to-blue-500/50' },
    { label: 'Replied', value: funnel.replied, color: 'from-searchatlas-purple/70 to-searchatlas-purple/50' },
    ...(funnel.interested > 0
      ? [{ label: 'Interested', value: funnel.interested, color: 'from-searchatlas-green/70 to-searchatlas-green/50' }]
      : []),
  ];

  return (
    <div className="rounded-lg border bg-card shadow-sm p-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
        <Target className="h-4 w-4" />
        LinkedIn Outreach Funnel
      </h3>
      <div className="flex items-center gap-2">
        {steps.map((step, i) => {
          const prevValue = i > 0 ? steps[i - 1].value : step.value;
          const convRate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : '0';
          return (
            <div key={step.label} className="flex items-center gap-2 flex-1">
              <div className="flex-1 text-center">
                <div className={`bg-gradient-to-b ${step.color} text-white rounded-xl p-4 shadow-sm`}>
                  <p className="text-2xl font-bold">{step.value.toLocaleString()}</p>
                  <p className="text-xs text-white/80 mt-1">{step.label}</p>
                </div>
                <p className={`text-xs text-muted-foreground mt-1.5 ${i === 0 ? 'invisible' : ''}`}>
                  {i > 0 ? `${convRate}%` : '\u00A0'}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Campaign Performance Table ───────────────────────────────────────

function CampaignPerformance({ campaigns }: { campaigns: SocialCampaignRow[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm p-8 text-center">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No campaigns synced yet. Run a sync to populate data.</p>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-searchatlas-green';
      case 'PAUSED': return 'bg-yellow-500';
      case 'FINISHED': return 'bg-blue-500';
      case 'FAILED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'Active';
      case 'PAUSED': return 'Paused';
      case 'FINISHED': return 'Finished';
      case 'FAILED': return 'Failed';
      case 'CANCELED': return 'Canceled';
      default: return status;
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-searchatlas-cyan/10 to-searchatlas-dark/10 border-b">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Campaign Performance
          <span className="text-xs font-normal text-muted-foreground ml-auto">Click to expand</span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider w-8"></th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Campaign</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Sender(s)</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Leads</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Conn. Sent</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Accepted</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Accept %</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Replies</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Reply %</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Progress</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <React.Fragment key={c.id}>
                <tr
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <td className="py-3 px-4">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor(c.status)}`} />
                      <span className="font-medium truncate max-w-[200px]" title={c.name}>{c.name}</span>
                      {c.status === 'PAUSED' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 uppercase tracking-wider">Paused</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {c.senders.map((s) => s.name).join(', ') || '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{c.totalLeads.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{c.connectionsSent.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{c.accepted.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-medium">{c.acceptanceRate}%</span>
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{c.replies}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-medium">{c.replyRate}%</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-searchatlas-cyan rounded-full transition-all duration-500"
                          style={{ width: `${c.totalLeads > 0 ? ((c.finished / c.totalLeads) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {c.totalLeads > 0 ? Math.round((c.finished / c.totalLeads) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>

                {expandedId === c.id && (
                  <tr className="bg-muted/30">
                    <td colSpan={10} className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-card rounded-lg p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
                          <p className="font-bold text-lg">{c.inProgress}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">Pending</p>
                          <p className="font-bold text-lg">{c.pending}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">Finished</p>
                          <p className="font-bold text-lg">{c.finished}</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border">
                          <p className="text-xs text-muted-foreground mb-1">Failed</p>
                          <p className="font-bold text-lg text-red-400">{c.failed}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Acceptance Rate</span>
                            <span className="font-medium">{c.acceptanceRate}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-searchatlas-cyan rounded-full transition-all duration-500" style={{ width: `${Math.min(c.acceptanceRate, 100)}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Reply Rate</span>
                            <span className="font-medium">{c.replyRate}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-searchatlas-purple rounded-full transition-all duration-500" style={{ width: `${Math.min(c.replyRate, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                      {c.startedAt && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Started: {new Date(c.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Outreach Volume Chart ────────────────────────────────────────────

function OutreachVolumeChart({ data }: { data: SocialDashboardData['dailyStats'] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Outreach Volume
        </h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          No daily stats available. Sync data to see trends.
        </div>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="rounded-lg border bg-card shadow-sm p-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Outreach Volume
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a57bea" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a57bea" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#86efac" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#86efac" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#3A3C47" vertical={false} />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1D1E24', border: '1px solid #3A3C47', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#F5F5F7' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="connectionsSent" name="Connections Sent" stroke="#a57bea" fill="url(#colorSent)" strokeWidth={2} />
            <Area type="monotone" dataKey="accepted" name="Accepted" stroke="#93c5fd" fill="url(#colorAccepted)" strokeWidth={2} />
            <Area type="monotone" dataKey="replies" name="Replies" stroke="#86efac" fill="url(#colorReplies)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Sender Performance Cards ─────────────────────────────────────────

function SenderPerformance({ senders }: { senders: SocialDashboardData['senders'] }) {
  if (senders.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-searchatlas-purple/10 to-searchatlas-dark/10 border-b">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4" />
          Sender Performance
        </h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {senders.map((s) => (
          <div key={s.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-searchatlas-purple/20 flex items-center justify-center">
                  <Linkedin className="h-4 w-4 text-searchatlas-purple" />
                </div>
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.campaignCount} campaign{s.campaignCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                s.status !== 'disconnected'
                  ? 'bg-searchatlas-green/20 text-searchatlas-green'
                  : 'bg-red-950/30 text-red-400'
              }`}>
                {s.status !== 'disconnected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Leads</p>
                <p className="font-bold">{s.totalLeads.toLocaleString()}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Conn. Sent</p>
                <p className="font-bold">{s.connectionsSent.toLocaleString()}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Accepted</p>
                <p className="font-bold">{s.accepted} <span className="text-xs font-normal text-muted-foreground">({s.acceptanceRate}%)</span></p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Replies</p>
                <p className="font-bold">{s.replies} <span className="text-xs font-normal text-muted-foreground">({s.replyRate}%)</span></p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Accept Rate</span>
                  <span className="font-medium">{s.acceptanceRate}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-searchatlas-cyan rounded-full transition-all duration-500" style={{ width: `${Math.min(s.acceptanceRate, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Reply Rate</span>
                  <span className="font-medium">{s.replyRate}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-searchatlas-purple rounded-full transition-all duration-500" style={{ width: `${Math.min(s.replyRate, 100)}%` }} />
                </div>
              </div>
            </div>

            {s.status === 'disconnected' && (
              <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-400">Account disconnected from HeyReach</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reply Feed ───────────────────────────────────────────────────────

function ReplyFeed({ replies, campaigns }: { replies: SocialReplyItem[]; campaigns: SocialCampaignRow[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return replies.filter((r) => {
      if (campaignFilter && r.campaignId !== parseInt(campaignFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fields = [r.firstName, r.lastName, r.companyName, r.position, r.campaignName, r.senderName].join(' ').toLowerCase();
        return fields.includes(q);
      }
      return true;
    });
  }, [replies, searchQuery, campaignFilter]);

  if (replies.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm p-8 text-center">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No replies recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-searchatlas-cyan/10 to-searchatlas-dark/10 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-searchatlas-purple/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold">
              Reply Feed
              <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showFilters ? 'bg-searchatlas-purple text-white border-searchatlas-purple' : 'bg-secondary hover:bg-accent'
              }`}
            >
              <Filter className="h-3 w-3" />
              Filters
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search replies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-9 pl-9 pr-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-searchatlas-cyan/20"
              />
            </div>
          </div>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="h-8 px-3 text-xs rounded-lg border bg-background">
              <option value="">All Campaigns</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {campaignFilter && (
              <button onClick={() => setCampaignFilter('')} className="h-8 px-3 text-xs rounded-lg border bg-secondary text-muted-foreground hover:bg-accent">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b bg-muted/30">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider w-8"></th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Contact</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Company</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Sender</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Campaign</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((reply) => (
              <React.Fragment key={reply.leadId}>
                <tr
                  className="hover:bg-muted/30 border-b border-border/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === reply.leadId ? null : reply.leadId)}
                >
                  <td className="py-3 px-4">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === reply.leadId ? 'rotate-180' : ''}`} />
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">{reply.firstName} {reply.lastName}</p>
                    {reply.position && <p className="text-xs text-searchatlas-cyan">{reply.position}</p>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{reply.companyName || '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{reply.senderName}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium truncate max-w-[150px] inline-block" title={reply.campaignName}>
                      {reply.campaignName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {reply.lastActionAt ? new Date(reply.lastActionAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </td>
                </tr>

                {expandedId === reply.leadId && (
                  <tr className="bg-muted/10 border-b border-border/50">
                    <td className="py-4 px-4"></td>
                    <td colSpan={5} className="py-4 pr-4">
                      <div className="flex items-start gap-6">
                        {/* Detail items */}
                        <div className="flex items-center gap-5 flex-wrap text-sm">
                          {reply.location && (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {reply.location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-searchatlas-green/20 text-searchatlas-green font-medium text-xs">
                            <MessageSquare className="h-3 w-3" />
                            {reply.messageStatus === 'InMailReply' ? 'InMail Reply' : 'Message Reply'}
                          </span>
                          {reply.lastActionAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.lastActionAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* LinkedIn action */}
                        {reply.profileUrl && (
                          <a
                            href={reply.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-secondary hover:bg-accent text-xs font-medium transition-colors flex-shrink-0"
                          >
                            <Linkedin className="h-3.5 w-3.5 text-searchatlas-cyan" />
                            LinkedIn Profile
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Account Alert Banner ─────────────────────────────────────────────

function AccountAlerts({ senders }: { senders: SocialDashboardData['senders'] }) {
  const disconnected = senders.filter((s) => s.status === 'disconnected');
  if (disconnected.length === 0) return null;

  return (
    <div className="bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg p-4 flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">Account Alert</p>
        <p className="text-xs">
          {disconnected.map((s) => s.name).join(', ')}{' '}
          {disconnected.length === 1 ? 'is' : 'are'} disconnected from HeyReach. Historical data is still shown.
        </p>
      </div>
    </div>
  );
}

// ── Sync Status Banner ───────────────────────────────────────────────

function SyncBanner({
  lastSyncedAt,
  onSync,
  syncing,
}: {
  lastSyncedAt: string | null;
  onSync: () => void;
  syncing: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {lastSyncedAt
          ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
          : 'Not synced yet — click Sync to pull data from HeyReach'}
      </span>
      <button
        onClick={onSync}
        disabled={syncing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-secondary hover:bg-accent transition-colors disabled:opacity-50"
      >
        {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────

function SocialSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function SocialAnalyticsPage() {
  const [data, setData] = useState<SocialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [syncing, setSyncing] = useState(false);

  const fetchData = async (p: Period) => {
    try {
      const res = await fetch(`/api/heyreach/dashboard?period=${p}`);
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/heyreach/sync', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        // Refetch dashboard data after sync
        await fetchData(period);
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <PageContainer className="space-y-8 pb-12">
      {/* ── Tab Switcher ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-[3px]">
          <Link
            href="/analytics"
            className="px-4 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Email
          </Link>
          <div className="px-4 py-1.5 text-sm font-medium rounded-md bg-background text-foreground shadow-sm">
            Social
          </div>
        </div>
      </div>

      {loading ? (
        <SocialSkeleton />
      ) : error && !data ? (
        <div className="rounded-lg border bg-card shadow-sm p-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={handleSync}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-searchatlas-purple hover:bg-searchatlas-purple/80 text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Syncing Data
          </button>
        </div>
      ) : data ? (
        <>
          {/* ── Account Alerts ──────────────────────────────────── */}
          <AccountAlerts senders={data.senders} />

          {/* ── Sync Status ─────────────────────────────────────── */}
          <SyncBanner lastSyncedAt={data.lastSyncedAt} onSync={handleSync} syncing={syncing} />

          {/* ── Period Tabs ─────────────────────────────────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  period === p
                    ? 'bg-searchatlas-purple text-white border-searchatlas-purple'
                    : 'bg-secondary hover:bg-accent border-border'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* ── LinkedIn Funnel ──────────────────────────────────── */}
          <LinkedInFunnel funnel={data.funnel} />

          {/* ── Campaign Performance ────────────────────────────── */}
          <CampaignPerformance campaigns={data.campaigns} />

          {/* ── Volume Chart + Sender Performance ───────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OutreachVolumeChart data={data.dailyStats} />
            <SenderPerformance senders={data.senders} />
          </div>

          {/* ── Reply Feed ──────────────────────────────────────── */}
          <ReplyFeed replies={data.replies} campaigns={data.campaigns} />
        </>
      ) : null}
    </PageContainer>
  );
}

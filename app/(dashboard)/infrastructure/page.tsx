'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  TrendingUp,
  Zap,
  Mail,
  Server,
  Loader2,
  Cloud,
  Download,
} from 'lucide-react';
import { exportToCSV } from '@/lib/export-csv';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCHATLAS BRAND COLORS - IMPROVED READABILITY
// Primary: Purple #A57BEA (brighter)
// Secondary: Cyan #93C5FD (brighter)
// Accent: Green #86EFAC, Pink #F9A8D4
// Background: Dark #14151A / Card #1D1E24
// ═══════════════════════════════════════════════════════════════════════════════

// Types
interface VolumeSnapshot {
  date: string;
  emails_sent: number;
  campaign_sent?: number;
  replied?: number;
  bounced?: number;
  daily_capacity_available: number;
  live_inboxes: number;
  warming_inboxes?: number;
}

interface VolumeHistory {
  snapshots: VolumeSnapshot[];
}

interface ProviderMetrics {
  name: string;
  live_count: number;
  dead_count: number;
  domain_flagged_count: number;
  inbox_flagged_count: number;
  avg_health_score: number;
  connected_count: number;
  disconnected_count: number;
  // Set breakdown (Live = A Set, Reserve = B Set)
  live_set_count: number;
  live_set_capacity: number;
  live_set_disconnected: number;
  reserve_set_count: number;
  reserve_set_capacity: number;
  reserve_set_disconnected: number;
  // Capacity & warming
  daily_capacity: number;
  warming_count: number;
  // Performance
  total_sent: number;
  reply_rate: number;
  bounce_rate: number;
  replied_count: number;
}

interface Infrastructure {
  total_inboxes: number;
  avg_health_score: number;
  live_inboxes: number;
  dead_inboxes: number;
  disconnected_inboxes: number;
  connected_inboxes: number;
  operational_capacity: number;
  potential_capacity: number;
  clean_domains: number;
  total_emails_sent: number;
  total_replies: number;
  total_bounces: number;
  overall_reply_rate: number;
  overall_bounce_rate: number;
  sync_source: string;
  providers?: ProviderMetrics[];
}

interface PackageInfo {
  name: string;
  inbox_target: number;
}

interface ClientInfo {
  name: string;
}

interface DashboardData {
  infrastructure: Infrastructure;
  volumeHistory?: VolumeHistory;
  package?: PackageInfo;
  client?: ClientInfo;
}

// Generate deterministic volume history (fallback when API has no data)
function generateVolumeHistory(capacity: number, inboxes: number): VolumeHistory {
  const today = new Date();
  const snapshots: VolumeSnapshot[] = [];

  for (let i = 9; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayNum = date.getDate();
    const variance = ((dayNum % 7) - 3) * 0.05;
    const baseUtilization = isWeekend ? 0.5 : 0.75;
    const utilization = Math.min(0.95, Math.max(0.4, baseUtilization + variance));

    snapshots.push({
      date: date.toISOString().split('T')[0],
      emails_sent: Math.round(capacity * utilization),
      daily_capacity_available: capacity,
      live_inboxes: inboxes,
    });
  }

  return { snapshots };
}

// Health Score Gauge Component
function HealthScoreGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { radius: 50, stroke: 6, fontSize: '1.5rem' },
    md: { radius: 65, stroke: 8, fontSize: '2rem' },
    lg: { radius: 80, stroke: 10, fontSize: '2.5rem' },
  };

  const { radius, stroke, fontSize } = sizes[size];
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStrokeColor = (score: number) => {
    if (score >= 80) return '#86EFAC'; // SearchAtlas green
    if (score >= 60) return '#A57BEA'; // SearchAtlas purple
    if (score >= 40) return '#F9A8D4'; // SearchAtlas pink
    return '#ef4444';
  };

  const getGlowColor = (score: number) => {
    if (score >= 80) return 'rgba(156, 255, 172, 0.3)';
    if (score >= 60) return 'rgba(147, 107, 218, 0.3)';
    if (score >= 40) return 'rgba(255, 173, 219, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  };

  const getStatusText = (score: number) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Warning';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse"
          style={{ backgroundColor: getGlowColor(score) }}
        />
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 relative"
        >
          <circle
            stroke="#3A3C47"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={getStrokeColor(score)}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold"
            style={{ color: getStrokeColor(score), fontSize }}
          >
            {Math.round(score)}
          </span>
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: getStrokeColor(score) }}
          >
            {getStatusText(score)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Volume History Chart Component - Shows Warmup + Campaign sends with Capacity ceiling
// Smart time formatting based on data range
function formatTimeAxis(snapshots: VolumeSnapshot[]): { data: { date: string; rawDate: string }[]; interval: number } {
  const dayCount = snapshots.length;

  // Determine grouping strategy based on range
  if (dayCount <= 14) {
    // Daily: Show each day as "Mar 5"
    return {
      data: snapshots.map(s => ({
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: s.date,
      })),
      interval: 0, // Show all ticks
    };
  } else if (dayCount <= 60) {
    // Weekly: Show week labels
    return {
      data: snapshots.map(s => ({
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: s.date,
      })),
      interval: Math.ceil(dayCount / 8), // Show ~8 ticks
    };
  } else {
    // Monthly: Show month labels
    return {
      data: snapshots.map(s => ({
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: s.date,
      })),
      interval: Math.ceil(dayCount / 6), // Show ~6 ticks
    };
  }
}

// Custom tooltip for the volume chart
function VolumeTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  const sent = payload.find(p => p.dataKey === 'sent')?.value || 0;
  const replied = payload.find(p => p.dataKey === 'replied')?.value || 0;
  const bounced = payload.find(p => p.dataKey === 'bounced')?.value || 0;
  const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0';

  return (
    <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-xl p-4 shadow-2xl min-w-[180px]">
      <p className="text-white font-semibold text-sm mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#A57BEA]" />
            <span className="text-xs text-gray-400">Sent</span>
          </div>
          <span className="text-sm font-medium text-white">{sent.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#86EFAC]" />
            <span className="text-xs text-gray-400">Replied</span>
          </div>
          <span className="text-sm font-medium text-white">{replied.toLocaleString()}</span>
        </div>
        {bounced > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FB923C]" />
              <span className="text-xs text-gray-400">Bounced</span>
            </div>
            <span className="text-sm font-medium text-white">{bounced.toLocaleString()}</span>
          </div>
        )}
        {sent > 0 && (
          <div className="pt-1 border-t border-[#3A3C47] flex items-center justify-between">
            <span className="text-xs text-gray-400">Reply Rate</span>
            <span className="text-sm font-bold text-[#86EFAC]">{replyRate}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function VolumeHistoryChart({ data }: { data: VolumeHistory }) {
  const { interval } = formatTimeAxis(data.snapshots);

  const chartData = data.snapshots.map((snapshot) => ({
    date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sent: snapshot.campaign_sent || snapshot.emails_sent || 0,
    replied: snapshot.replied || 0,
    bounced: snapshot.bounced || 0,
  }));

  const totalSent = chartData.reduce((sum, d) => sum + d.sent, 0);
  const totalReplied = chartData.reduce((sum, d) => sum + d.replied, 0);
  const dayCount = data.snapshots.length;
  const maxSent = Math.max(...chartData.map(d => d.sent));

  return (
    <div>
      {/* Chart Legend */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#A57BEA]" />
            <span className="text-xs text-gray-400">Sent</span>
            <span className="text-xs font-medium text-white ml-1">{totalSent.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#86EFAC]" />
            <span className="text-xs text-gray-400">Replied</span>
            <span className="text-xs font-medium text-white ml-1">{totalReplied.toLocaleString()}</span>
          </div>
          {totalSent > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Reply Rate:</span>
              <span className="text-xs font-bold text-[#86EFAC]">{((totalReplied / totalSent) * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Last {dayCount} days
        </div>
      </div>

      {/* Area + Line Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A57BEA" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#A57BEA" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientReplied" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86EFAC" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#86EFAC" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2A2B35"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              stroke="#2A2B35"
              tickLine={false}
              axisLine={{ stroke: '#2A2B35' }}
              interval={interval}
              dy={8}
            />

            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              stroke="#2A2B35"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
              domain={[0, Math.ceil(maxSent * 1.15)]}
              width={45}
            />

            <Tooltip
              content={<VolumeTooltip />}
              cursor={{ stroke: 'rgba(165, 123, 234, 0.2)' }}
            />

            {/* Sends area (main volume) */}
            <Area
              type="monotone"
              dataKey="sent"
              stroke="#A57BEA"
              strokeWidth={2.5}
              fill="url(#gradientSent)"
              isAnimationActive={true}
              animationDuration={800}
            />

            {/* Replied area (overlaid, much smaller scale) */}
            <Area
              type="monotone"
              dataKey="replied"
              stroke="#86EFAC"
              strokeWidth={2}
              fill="url(#gradientReplied)"
              isAnimationActive={true}
              animationDuration={800}
              animationBegin={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Provider Capacity Pipeline Component - Direction A: Horizontal Stacked Bars
function ProviderCapacityCharts({ providers }: { providers: ProviderMetrics[] }) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return '#86EFAC';
    if (score >= 60) return '#A57BEA';
    if (score >= 40) return '#F9A8D4';
    return '#ef4444';
  };

  const totalKills = providers.reduce((sum, p) => sum + p.dead_count, 0);

  return (
    <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-6 hover:border-[#A57BEA]/50 transition-colors">
      {/* Header with Legend */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-[#A57BEA]" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Capacity Pipeline</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#86EFAC]" />
            <span className="text-gray-300">Live</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#93C5FD]" />
            <span className="text-gray-300">Reserve</span>
          </span>
          {providers.some(p => (p.inbox_flagged_count || 0) > 0) && (
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#FB923C]" />
              <span className="text-gray-300">Flagged</span>
            </span>
          )}
          {providers.some(p => (p.domain_flagged_count || 0) > 0) && (
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#dc2626]" />
              <span className="text-gray-300">Critical</span>
            </span>
          )}
        </div>
      </div>

      {/* Provider Pipelines */}
      <div className="space-y-6">
        {providers.map((provider) => {
          const healthColor = getHealthColor(provider.avg_health_score);
          // Calculate percentages based on ALL INBOXES (connected + disconnected + flagged)
          const liveTotal = provider.live_set_count + (provider.live_set_disconnected || 0);
          const reserveTotal = provider.reserve_set_count + (provider.reserve_set_disconnected || 0);
          const domainFlagged = provider.domain_flagged_count || 0;
          const inboxFlagged = provider.inbox_flagged_count || 0;
          const totalFlagged = domainFlagged + inboxFlagged;
          const totalInboxes = liveTotal + reserveTotal + totalFlagged;

          const livePercent = totalInboxes > 0 ? (liveTotal / totalInboxes) * 100 : 50;
          const reservePercent = totalInboxes > 0 ? (reserveTotal / totalInboxes) * 100 : 50;
          const domainFlaggedPercent = totalInboxes > 0 && domainFlagged > 0 ? (domainFlagged / totalInboxes) * 100 : 0;
          const inboxFlaggedPercent = totalInboxes > 0 && inboxFlagged > 0 ? (inboxFlagged / totalInboxes) * 100 : 0;

          return (
            <div key={provider.name}>
              {/* Provider Header Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {provider.name.toLowerCase().includes('microsoft') ? (
                    <Cloud className="h-5 w-5 text-[#93C5FD]" />
                  ) : (
                    <Mail className="h-5 w-5 text-[#F9A8D4]" />
                  )}
                  <span className="text-lg font-semibold text-white">{provider.name}</span>
                  <span
                    className="text-sm font-bold px-2 py-0.5 rounded"
                    style={{ color: healthColor, backgroundColor: `${healthColor}15` }}
                  >
                    {Math.round(provider.avg_health_score)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">{provider.daily_capacity.toLocaleString()}</span>
                  <span className="text-sm text-gray-400 ml-1">daily cap</span>
                </div>
              </div>

              {/* Stacked Pipeline Bar - proportional by inbox count */}
              <div className="relative h-10 bg-[#14151A] rounded-lg overflow-hidden flex">
                {/* Live Segment */}
                <div
                  className="h-full bg-gradient-to-r from-[#86EFAC] to-[#4ade80] transition-all duration-700 flex items-center justify-center relative overflow-hidden"
                  style={{ width: `${livePercent}%` }}
                >
                  {livePercent >= 15 && (
                    <span className="text-sm font-bold text-[#14151A] whitespace-nowrap">{liveTotal}</span>
                  )}
                </div>

                {/* Reserve Segment */}
                <div
                  className="h-full bg-gradient-to-r from-[#93C5FD] to-[#60a5fa] transition-all duration-700 flex items-center justify-center relative overflow-hidden"
                  style={{ width: `${reservePercent}%` }}
                >
                  {reservePercent >= 15 && (
                    <span className="text-sm font-bold text-[#14151A] whitespace-nowrap">{reserveTotal}</span>
                  )}
                </div>

                {/* Inbox-Flagged Segment (orange - less severe) */}
                {inboxFlagged > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-[#FB923C] to-[#F97316] transition-all duration-700 flex items-center justify-center overflow-hidden"
                    style={{ width: `${inboxFlaggedPercent}%` }}
                  >
                    {inboxFlaggedPercent >= 8 && (
                      <span className="text-sm font-bold text-[#14151A] whitespace-nowrap">{inboxFlagged}</span>
                    )}
                  </div>
                )}

                {/* Domain-Flagged Segment (dark red - most severe) */}
                {domainFlagged > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-[#dc2626] to-[#991b1b] transition-all duration-700 flex items-center justify-center overflow-hidden"
                    style={{ width: `${domainFlaggedPercent}%` }}
                  >
                    {domainFlaggedPercent >= 8 && (
                      <span className="text-sm font-bold text-white whitespace-nowrap">{domainFlagged}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between mt-2 text-xs">
                <div className="flex items-center gap-6">
                  <span className="text-gray-400">
                    <span className="text-[#86EFAC]">Live:</span> {provider.live_set_count} connected
                    {(provider.live_set_disconnected || 0) > 0 && (
                      <span className="text-[#F9A8D4]"> · {provider.live_set_disconnected} disconnected</span>
                    )}
                  </span>
                  <span className="text-gray-400">
                    <span className="text-[#93C5FD]">Reserve:</span> {provider.reserve_set_count} connected
                    {(provider.reserve_set_disconnected || 0) > 0 && (
                      <span className="text-[#F9A8D4]"> · {provider.reserve_set_disconnected} disconnected</span>
                    )}
                  </span>
                </div>
                <span className="text-gray-400">
                  Warming: <span className="text-[#F9A8D4] font-medium">{provider.warming_count}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="mt-6 pt-4 border-t border-[#3A3C47]">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Total Infrastructure</div>
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#86EFAC]" />
              <span className="text-gray-400">Live:</span>
              <span className="text-white font-bold">
                {providers.reduce((sum, p) => sum + p.live_set_count + (p.live_set_disconnected || 0), 0).toLocaleString()}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#93C5FD]" />
              <span className="text-gray-400">Reserve:</span>
              <span className="text-white font-bold">
                {providers.reduce((sum, p) => sum + p.reserve_set_count + (p.reserve_set_disconnected || 0), 0).toLocaleString()}
              </span>
            </span>
            {totalKills > 0 && (
              <>
                {providers.reduce((sum, p) => sum + (p.inbox_flagged_count || 0), 0) > 0 && (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FB923C]" />
                    <span className="text-gray-400">Flagged:</span>
                    <span className="text-white font-bold">{providers.reduce((sum, p) => sum + (p.inbox_flagged_count || 0), 0)}</span>
                  </span>
                )}
                {providers.reduce((sum, p) => sum + (p.domain_flagged_count || 0), 0) > 0 && (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#dc2626]" />
                    <span className="text-gray-400">Critical:</span>
                    <span className="text-white font-bold">{providers.reduce((sum, p) => sum + (p.domain_flagged_count || 0), 0)}</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InfrastructurePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/infrastructure');

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const apiData = await response.json();

      if (!apiData.volumeHistory && apiData.infrastructure) {
        apiData.volumeHistory = generateVolumeHistory(
          apiData.infrastructure.operational_capacity,
          apiData.infrastructure.live_inboxes
        );
      }

      setData(apiData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (type: 'inboxes' | 'kill-triggers') => {
    setExporting(true);
    setExportMenuOpen(false);
    try {
      const response = await fetch('/api/infrastructure/export');
      if (!response.ok) throw new Error('Export failed');

      const exportData = await response.json();
      const date = new Date().toISOString().split('T')[0];

      if (type === 'inboxes') {
        const csvRows = exportData.inboxes.map((inbox: {
          email: string;
          provider: string;
          status: string;
          health_score: number;
          kill_trigger: string;
          daily_limit: number;
          emails_sent: number;
          bounced: number;
          replied: number;
          bounce_rate: number;
          reply_rate: number;
          warmup: string;
          set: string;
        }) => ({
          'Email': inbox.email,
          'Provider': inbox.provider,
          'Status': inbox.status,
          'Health Score': inbox.health_score,
          'Daily Limit': inbox.daily_limit,
          'Emails Sent': inbox.emails_sent,
          'Bounced': inbox.bounced,
          'Replied': inbox.replied,
          'Bounce %': inbox.bounce_rate,
          'Reply %': inbox.reply_rate,
          'Warmup': inbox.warmup,
          'Set': inbox.set,
        }));
        exportToCSV(csvRows, `inbox-report-${date}.csv`);
      } else {
        const csvRows = exportData.killTriggers.map((kt: {
          email: string;
          provider: string;
          trigger: string;
          severity: string;
          last_updated: string;
          domain: string;
          daily_limit: number;
          emails_sent: number;
          bounced: number;
          bounce_rate: number;
          set: string;
        }) => ({
          'Email': kt.email,
          'Domain': kt.domain,
          'Provider': kt.provider,
          'Trigger': kt.trigger,
          'Severity': kt.severity,
          'Last Updated': kt.last_updated,
          'Daily Limit': kt.daily_limit,
          'Emails Sent': kt.emails_sent,
          'Bounced': kt.bounced,
          'Bounce %': kt.bounce_rate,
          'Set': kt.set,
        }));
        exportToCSV(csvRows, `kill-triggers-${date}.csv`);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#14151A] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#A57BEA]" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#14151A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-[#A57BEA] text-white hover:bg-[#a57de6] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { infrastructure, volumeHistory } = data;
  const packageInfo = data.package;

  // Availability: live inboxes out of total (excluding dead)
  const healthyTotal = infrastructure.total_inboxes - infrastructure.dead_inboxes;
  const availabilityPercent = healthyTotal > 0
    ? Math.round((infrastructure.live_inboxes / healthyTotal) * 100)
    : 100;
  // Package fulfillment: live inboxes vs target
  const packagePercent = packageInfo
    ? Math.round((infrastructure.live_inboxes / packageInfo.inbox_target) * 100)
    : 100;

  const recentVolume = volumeHistory?.snapshots.slice(-7) || [];
  const avgDailyVolume = recentVolume.length > 0
    ? Math.round(recentVolume.reduce((sum, s) => sum + s.emails_sent, 0) / recentVolume.length)
    : 0;

  // Calculate Live vs Reserve totals from providers
  const liveCapacity = infrastructure.providers?.reduce((sum, p) => sum + (p.live_set_capacity || 0), 0) || 0;
  const reserveCapacity = infrastructure.providers?.reduce((sum, p) => sum + (p.reserve_set_capacity || 0), 0) || 0;
  const totalCapacity = infrastructure.operational_capacity;
  const livePercent = totalCapacity > 0 ? Math.round((liveCapacity / totalCapacity) * 100) : 0;

  const getStatusMessage = () => {
    if (infrastructure.avg_health_score >= 85) return { text: 'All systems operational', icon: CheckCircle2, color: 'text-[#86EFAC]' };
    if (infrastructure.avg_health_score >= 70) return { text: 'Systems operational with minor issues', icon: CheckCircle2, color: 'text-[#A57BEA]' };
    return { text: 'Some systems need attention', icon: Activity, color: 'text-[#F9A8D4]' };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-[#14151A]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header with Logo and Export */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              {/* SearchAtlas Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://searchatlas.com/wp-content/uploads/2023/12/white.svg"
                alt="SearchAtlas"
                className="h-8 w-auto"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3A3C47] bg-[#1D1E24] text-white hover:border-[#A57BEA] hover:bg-[#A57BEA]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Export CSV</span>
                <svg className="h-3 w-3 ml-1 opacity-60" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-[#3A3C47] bg-[#1D1E24] shadow-xl overflow-hidden">
                    <button
                      onClick={() => handleExport('inboxes')}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#A57BEA]/10 transition-colors border-b border-[#3A3C47]"
                    >
                      <div className="font-medium">All Inboxes</div>
                      <div className="text-xs text-gray-400 mt-0.5">Full inbox health report</div>
                    </button>
                    <button
                      onClick={() => handleExport('kill-triggers')}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#A57BEA]/10 transition-colors"
                    >
                      <div className="font-medium">Kill Triggers</div>
                      <div className="text-xs text-gray-400 mt-0.5">Flagged inboxes with severity &amp; date</div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${status.color}`} />
            <span className={status.color}>{status.text}</span>
          </p>
        </header>

        {/* Hero - Health + Package */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Health Score */}
          <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-6 hover:border-[#A57BEA]/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-6">
                  Infrastructure Health
                </p>
                <div className="flex items-end gap-4">
                  <div className="text-6xl font-bold text-white">
                    {infrastructure.avg_health_score}
                  </div>
                  <div className="pb-2">
                    <p className="text-lg font-medium text-[#86EFAC]">Healthy</p>
                    <p className="text-sm text-gray-400">{availabilityPercent}% available</p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <HealthScoreGauge score={infrastructure.avg_health_score} size="md" />
              </div>
            </div>
          </div>

          {/* Package Status */}
          <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-6 hover:border-[#A57BEA]/50 transition-colors">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
              Your Package
            </p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-white">{packageInfo?.name || 'Custom'}</p>
                <p className="text-sm text-gray-400">
                  {infrastructure.live_inboxes} of {packageInfo?.inbox_target || infrastructure.total_inboxes} inboxes
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#A57BEA]">{Math.min(100, packagePercent)}%</p>
                <p className="text-xs text-gray-400">fulfilled</p>
              </div>
            </div>
            <div className="h-3 bg-[#14151A] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, packagePercent)}%`,
                  background: 'linear-gradient(90deg, #A57BEA, #C4B5FD)'
                }}
              />
            </div>
            {/* Show provisioning or issues */}
            {infrastructure.disconnected_inboxes > 0 || infrastructure.dead_inboxes > 0 ? (
              <div className="flex items-center gap-3 mt-2 text-xs">
                {infrastructure.disconnected_inboxes > 0 && (
                  <span className="text-[#F9A8D4]">
                    +{infrastructure.disconnected_inboxes} inboxes being provisioned
                  </span>
                )}
                {infrastructure.dead_inboxes > 0 && (
                  <span className="text-red-400">
                    {infrastructure.dead_inboxes} killed
                  </span>
                )}
              </div>
            ) : packageInfo && infrastructure.live_inboxes < packageInfo.inbox_target ? (
              <p className="text-xs text-gray-400 mt-2">
                +{packageInfo.inbox_target - infrastructure.live_inboxes} inboxes being provisioned
              </p>
            ) : null}
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Sending Capacity with Live/Reserve Breakdown */}
          <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-5 hover:border-[#A57BEA]/50 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#A57BEA]/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-[#A57BEA]" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Sending Capacity</span>
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              {totalCapacity.toLocaleString()}
            </p>
            {/* Live/Reserve Stacked Bar */}
            <div className="h-2 bg-[#14151A] rounded-full overflow-hidden flex mb-2">
              <div
                className="h-full bg-[#86EFAC] transition-all duration-500"
                style={{ width: `${livePercent}%` }}
              />
              <div
                className="h-full bg-[#93C5FD] transition-all duration-500"
                style={{ width: `${100 - livePercent}%` }}
              />
            </div>
            {/* Live/Reserve Labels */}
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#86EFAC]" />
                <span className="text-gray-400">Live:</span>
                <span className="text-white font-medium">{liveCapacity.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#93C5FD]" />
                <span className="text-gray-400">Reserve:</span>
                <span className="text-white font-medium">{reserveCapacity.toLocaleString()}</span>
              </span>
            </div>
          </div>

          {/* Avg Daily Volume */}
          <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-5 hover:border-[#A57BEA]/50 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#93C5FD]/20 flex items-center justify-center">
                <Mail className="h-4 w-4 text-[#93C5FD]" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Avg. Daily Sent</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {avgDailyVolume.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">last 7 days</p>
          </div>

          {/* Domains */}
          <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-5 hover:border-[#A57BEA]/50 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#86EFAC]/20 flex items-center justify-center">
                <Server className="h-4 w-4 text-[#86EFAC]" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Active Domains</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {infrastructure.clean_domains}
            </p>
            <p className="text-sm text-gray-400">all healthy</p>
          </div>
        </div>

        {/* Provider Health */}
        {infrastructure.providers && infrastructure.providers.length > 0 && (
          <div className="mb-6">
            <ProviderCapacityCharts providers={infrastructure.providers} />
          </div>
        )}

        {/* Volume Chart */}
        {volumeHistory && (
          <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-6 mb-6 hover:border-[#A57BEA]/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#A57BEA]" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Sending Volume
                </span>
              </div>
              <span className="text-xs text-gray-400">Last 10 days</span>
            </div>
            <VolumeHistoryChart data={volumeHistory} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-[#3A3C47] text-center">
          <div className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] animate-pulse inline-block" />
              Live
            </span>
            <span className="text-gray-600">·</span>
            <span>Synced from {infrastructure.sync_source}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

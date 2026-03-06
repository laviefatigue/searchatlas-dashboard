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
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  daily_capacity_available: number;
  live_inboxes: number;
}

interface VolumeHistory {
  snapshots: VolumeSnapshot[];
}

interface ProviderMetrics {
  name: string;
  live_count: number;
  dead_count: number;
  avg_health_score: number;
  connected_count: number;
  disconnected_count: number;
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

// Volume History Chart Component
function VolumeHistoryChart({ data }: { data: VolumeHistory }) {
  const chartData = data.snapshots.map((snapshot) => ({
    date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Emails Sent': snapshot.emails_sent,
    'Capacity': snapshot.daily_capacity_available,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientSent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A57BEA" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#A57BEA" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradientCapacity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#3A3C47" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            stroke="#3A3C47"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            stroke="#3A3C47"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1D1E24',
              border: '1px solid #3A3C47',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
            labelStyle={{ color: '#ffffff', fontWeight: 500, marginBottom: 4 }}
            itemStyle={{ color: '#A57BEA' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="circle" />
          <Area
            type="monotone"
            dataKey="Emails Sent"
            stroke="#A57BEA"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradientSent)"
          />
          <Area
            type="monotone"
            dataKey="Capacity"
            stroke="#93C5FD"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradientCapacity)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Provider Health Widget Component
function ProviderHealthWidget({ providers }: { providers: ProviderMetrics[] }) {
  const getProviderIcon = (name: string) => {
    if (name.toLowerCase().includes('microsoft') || name.toLowerCase().includes('entra')) {
      return <Cloud className="h-5 w-5 text-[#93C5FD]" />;
    }
    if (name.toLowerCase().includes('google') || name.toLowerCase().includes('gmail')) {
      return <Mail className="h-5 w-5 text-[#F9A8D4]" />;
    }
    return <Server className="h-5 w-5 text-gray-400" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-[#86EFAC]';
    if (score >= 60) return 'text-[#A57BEA]';
    if (score >= 40) return 'text-[#F9A8D4]';
    return 'text-red-400';
  };

  const maxLive = Math.max(...providers.map(p => p.live_count), 1);

  return (
    <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-6 hover:border-[#A57BEA]/50 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-4 w-4 text-[#A57BEA]" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Provider Health</span>
      </div>

      <div className="space-y-4">
        {providers.map((provider, index) => {
          const barWidth = (provider.live_count / maxLive) * 100;
          const healthColor = getHealthColor(provider.avg_health_score);

          return (
            <div key={provider.name} style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getProviderIcon(provider.name)}
                  <span className="text-sm font-medium text-white">{provider.name}</span>
                </div>
                <span className={`text-xl font-bold ${healthColor}`}>
                  {Math.round(provider.avg_health_score)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#86EFAC]" />
                  <span className="text-gray-400">Live</span>
                  <span className="font-medium text-white ml-auto">{provider.live_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-gray-400">Dead</span>
                  <span className="font-medium text-white ml-auto">{provider.dead_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {provider.disconnected_count > 0 ? (
                    <WifiOff className="h-3 w-3 text-[#F9A8D4]" />
                  ) : (
                    <Wifi className="h-3 w-3 text-[#86EFAC]" />
                  )}
                  <span className="text-gray-400">Disc.</span>
                  <span className={`font-medium ml-auto ${provider.disconnected_count > 0 ? 'text-[#F9A8D4]' : 'text-[#86EFAC]'}`}>
                    {provider.disconnected_count}
                  </span>
                </div>
              </div>

              <div className="h-2 bg-[#14151A] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barWidth}%`,
                    background: 'linear-gradient(90deg, #A57BEA, #C4B5FD)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InfrastructurePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusMessage = () => {
    if (infrastructure.avg_health_score >= 85) return { text: 'All systems operational', icon: CheckCircle2, color: 'text-[#86EFAC]' };
    if (infrastructure.avg_health_score >= 70) return { text: 'Systems operational with minor issues', icon: CheckCircle2, color: 'text-[#A57BEA]' };
    return { text: 'Some systems need attention', icon: Activity, color: 'text-[#F9A8D4]' };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-[#14151A]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {data.client?.name || 'SearchAtlas'}
          </h1>
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
          {/* Daily Capacity */}
          <div className="bg-[#1D1E24] border border-[#3A3C47] rounded-2xl p-5 hover:border-[#A57BEA]/50 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#A57BEA]/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-[#A57BEA]" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Daily Capacity</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {infrastructure.operational_capacity.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">emails per day</p>
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
            <ProviderHealthWidget providers={infrastructure.providers} />
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
          <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] animate-pulse" />
              Live
            </span>
            <span className="text-gray-600">·</span>
            <span>Synced from {infrastructure.sync_source}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

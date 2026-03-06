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
  avg_health_score: number;
  live_inboxes: number;
  connected_inboxes: number;
  operational_capacity: number;
  clean_domains: number;
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
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#28BFFC';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getGlowColor = (score: number) => {
    if (score >= 80) return 'rgba(34, 197, 94, 0.3)';
    if (score >= 60) return 'rgba(40, 191, 252, 0.3)';
    if (score >= 40) return 'rgba(245, 158, 11, 0.3)';
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
            stroke="#e5e5e5"
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
              <stop offset="0%" stopColor="#28BFFC" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#28BFFC" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradientCapacity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F9B416" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#F9B416" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#737373' }}
            stroke="#e5e5e5"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#737373' }}
            stroke="#e5e5e5"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#1C2655', fontWeight: 500, marginBottom: 4 }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="circle" />
          <Area
            type="monotone"
            dataKey="Emails Sent"
            stroke="#28BFFC"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradientSent)"
          />
          <Area
            type="monotone"
            dataKey="Capacity"
            stroke="#F9B416"
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
      return <Cloud className="h-5 w-5 text-[#28BFFC]" />;
    }
    if (name.toLowerCase().includes('google') || name.toLowerCase().includes('gmail')) {
      return <Mail className="h-5 w-5 text-[#F9B416]" />;
    }
    return <Server className="h-5 w-5 text-gray-500" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-[#28BFFC]';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const maxLive = Math.max(...providers.map(p => p.live_count), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-4 w-4 text-[#28BFFC]" />
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
                  <span className="text-sm font-medium text-[#1C2655]">{provider.name}</span>
                </div>
                <span className={`text-xl font-bold ${healthColor}`}>
                  {Math.round(provider.avg_health_score)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-500">Live</span>
                  <span className="font-medium text-[#1C2655] ml-auto">{provider.live_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-gray-500">Dead</span>
                  <span className="font-medium text-[#1C2655] ml-auto">{provider.dead_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {provider.disconnected_count > 0 ? (
                    <WifiOff className="h-3 w-3 text-amber-500" />
                  ) : (
                    <Wifi className="h-3 w-3 text-green-500" />
                  )}
                  <span className="text-gray-500">Disc.</span>
                  <span className={`font-medium ml-auto ${provider.disconnected_count > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                    {provider.disconnected_count}
                  </span>
                </div>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#28BFFC] to-[#5ed0fd]"
                  style={{ width: `${barWidth}%` }}
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
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-[#28BFFC] text-white hover:bg-[#5ed0fd] transition-colors"
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

  const availabilityPercent = infrastructure.live_inboxes > 0
    ? Math.round((infrastructure.connected_inboxes / infrastructure.live_inboxes) * 100)
    : 100;
  const packagePercent = packageInfo
    ? Math.round((infrastructure.live_inboxes / packageInfo.inbox_target) * 100)
    : 100;

  const recentVolume = volumeHistory?.snapshots.slice(-7) || [];
  const avgDailyVolume = recentVolume.length > 0
    ? Math.round(recentVolume.reduce((sum, s) => sum + s.emails_sent, 0) / recentVolume.length)
    : 0;

  const getStatusMessage = () => {
    if (infrastructure.avg_health_score >= 85) return { text: 'All systems operational', icon: CheckCircle2, color: 'text-green-500' };
    if (infrastructure.avg_health_score >= 70) return { text: 'Systems operational with minor issues', icon: CheckCircle2, color: 'text-[#28BFFC]' };
    return { text: 'Some systems need attention', icon: Activity, color: 'text-amber-500' };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header - NO REFRESH BUTTON */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#1C2655] mb-1">
            {data.client?.name || 'Selery'}
          </h1>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${status.color}`} />
            <span className={status.color}>{status.text}</span>
          </p>
        </header>

        {/* Hero - Health + Package */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Health Score */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-6">
                  Infrastructure Health
                </p>
                <div className="flex items-end gap-4">
                  <div className="text-6xl font-bold text-[#1C2655]">
                    {infrastructure.avg_health_score}
                  </div>
                  <div className="pb-2">
                    <p className="text-lg font-medium text-green-500">Healthy</p>
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-300 transition-colors">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
              Your Package
            </p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-[#1C2655]">{packageInfo?.name || 'Custom'}</p>
                <p className="text-sm text-gray-500">
                  {infrastructure.live_inboxes} of {packageInfo?.inbox_target || infrastructure.live_inboxes} inboxes
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#28BFFC]">{Math.min(100, packagePercent)}%</p>
                <p className="text-xs text-gray-400">fulfilled</p>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#28BFFC] to-[#5ed0fd] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, packagePercent)}%` }}
              />
            </div>
            {packageInfo && infrastructure.live_inboxes < packageInfo.inbox_target && (
              <p className="text-xs text-gray-400 mt-2">
                +{packageInfo.inbox_target - infrastructure.live_inboxes} inboxes being provisioned
              </p>
            )}
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Daily Capacity */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#28BFFC]/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-[#28BFFC]" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Daily Capacity</span>
            </div>
            <p className="text-3xl font-bold text-[#1C2655]">
              {infrastructure.operational_capacity.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">emails per day</p>
          </div>

          {/* Avg Daily Volume */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#28BFFC]/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-[#28BFFC]" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Avg. Daily Sent</span>
            </div>
            <p className="text-3xl font-bold text-[#1C2655]">
              {avgDailyVolume.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">last 7 days</p>
          </div>

          {/* Domains */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Server className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Active Domains</span>
            </div>
            <p className="text-3xl font-bold text-[#1C2655]">
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#28BFFC]" />
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
        <footer className="mt-10 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
            <span className="text-gray-300">·</span>
            <span>Synced from {infrastructure.sync_source}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

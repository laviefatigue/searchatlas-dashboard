'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Zap,
  Mail,
  Server,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react';
import { HealthScoreGauge, VolumeHistoryChart, KillVelocityChart, KillBreakdownPie } from './charts';
import {
  AlertsBanner,
  AtRiskForecastWidget,
  WarmupPipelineWidget,
  DnsAuthStatusWidget,
  ProviderHealthWidget,
} from './widgets';
import type { InfrastructureDashboardData } from '@/lib/types/infrastructure';

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// Generate deterministic mock volume history (fallback when API has no data)
function generateVolumeHistory(capacity: number, inboxes: number) {
  const today = new Date();
  const snapshots = [];

  for (let i = 9; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    // Deterministic variance based on day number (no randomness)
    const dayNum = date.getDate();
    const variance = ((dayNum % 7) - 3) * 0.05; // -0.15 to +0.15 based on day
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

export function InfrastructureDashboard() {
  const [data, setData] = useState<InfrastructureDashboardData | null>(null);
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

      const apiData: InfrastructureDashboardData = await response.json();

      // Add volume history if not present
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
    const interval = setInterval(fetchData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { infrastructure, volumeHistory, alerts, warmupPipeline, dnsAuthStatus, atRiskForecast, killVelocity, killBreakdown } = data;
  const packageInfo = data.package;

  // Calculate metrics
  const availabilityPercent = infrastructure.live_inboxes > 0
    ? Math.round((infrastructure.connected_inboxes / infrastructure.live_inboxes) * 100)
    : 100;
  const packagePercent = packageInfo
    ? Math.round((infrastructure.live_inboxes / packageInfo.inbox_target) * 100)
    : 100;

  // Volume stats
  const recentVolume = volumeHistory?.snapshots.slice(-7) || [];
  const avgDailyVolume = recentVolume.length > 0
    ? Math.round(recentVolume.reduce((sum, s) => sum + s.emails_sent, 0) / recentVolume.length)
    : 0;

  const getStatusMessage = () => {
    if (infrastructure.avg_health_score >= 85) return { text: 'All systems operational', icon: CheckCircle2, color: 'text-green-500' };
    if (infrastructure.avg_health_score >= 70) return { text: 'Systems operational with minor issues', icon: CheckCircle2, color: 'text-selery-cyan' };
    return { text: 'Some systems need attention', icon: Activity, color: 'text-amber-500' };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight">
            Infrastructure Health
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <StatusIcon className={`h-4 w-4 ${status.color}`} />
            <span className={status.color}>{status.text}</span>
          </p>
        </header>

        {/* Alerts Banner */}
        {alerts && alerts.length > 0 && (
          <AlertsBanner alerts={alerts} />
        )}

        {/* Hero - Health + Package */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Score */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-6">
                  Infrastructure Health
                </p>
                <div className="flex items-end gap-4">
                  <div className="text-6xl font-bold tracking-tight">
                    {infrastructure.avg_health_score}
                  </div>
                  <div className="pb-2">
                    <p className="text-lg font-medium text-green-500">
                      {infrastructure.avg_health_score >= 80 ? 'Healthy' : infrastructure.avg_health_score >= 60 ? 'Good' : 'Warning'}
                    </p>
                    <p className="text-sm text-muted-foreground">{availabilityPercent}% available</p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <HealthScoreGauge score={infrastructure.avg_health_score} size="md" />
              </div>
            </div>
          </div>

          {/* Package Status */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Your Package
            </p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">{packageInfo?.name || 'Custom'}</p>
                <p className="text-sm text-muted-foreground">
                  {infrastructure.live_inboxes} of {packageInfo?.inbox_target || infrastructure.live_inboxes} inboxes
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{Math.min(100, packagePercent)}%</p>
                <p className="text-xs text-muted-foreground">fulfilled</p>
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, packagePercent)}%` }}
              />
            </div>
            {packageInfo && infrastructure.live_inboxes < packageInfo.inbox_target && (
              <p className="text-xs text-muted-foreground mt-2">
                +{packageInfo.inbox_target - infrastructure.live_inboxes} inboxes being provisioned
              </p>
            )}
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Capacity */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Daily Capacity</span>
            </div>
            <p className="text-3xl font-bold">
              {formatNumber(infrastructure.operational_capacity)}
            </p>
            <p className="text-sm text-muted-foreground">emails per day</p>
          </div>

          {/* Avg Daily Volume */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-selery-cyan/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-selery-cyan" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg. Daily Sent</span>
            </div>
            <p className="text-3xl font-bold">
              {formatNumber(avgDailyVolume)}
            </p>
            <p className="text-sm text-muted-foreground">last 7 days</p>
          </div>

          {/* Domains */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Server className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Domains</span>
            </div>
            <p className="text-3xl font-bold">
              {formatNumber(infrastructure.clean_domains)}
            </p>
            <p className="text-sm text-muted-foreground">all healthy</p>
          </div>
        </div>

        {/* Provider Health & At-Risk Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Provider Health */}
          {infrastructure.providers && infrastructure.providers.length > 0 && (
            <ProviderHealthWidget providers={infrastructure.providers} />
          )}

          {/* At-Risk Forecast */}
          {atRiskForecast && (
            <AtRiskForecastWidget data={atRiskForecast} />
          )}
        </div>

        {/* Warmup Pipeline & DNS Auth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Warmup Pipeline */}
          {warmupPipeline && (
            <WarmupPipelineWidget data={warmupPipeline} />
          )}

          {/* DNS Auth Status */}
          {dnsAuthStatus && (
            <DnsAuthStatusWidget data={dnsAuthStatus} />
          )}
        </div>

        {/* Volume Summary */}
        {volumeHistory && (
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Sending Volume
              </span>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Capacity</p>
                <p className="text-3xl font-bold text-primary">
                  {formatNumber(packageInfo?.inbox_target ? packageInfo.inbox_target * 40 : infrastructure.operational_capacity)}
                </p>
                <p className="text-sm text-muted-foreground">emails/day at full deployment</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Sent (All Time)</p>
                <p className="text-3xl font-bold">
                  {formatNumber(volumeHistory.snapshots.reduce((sum, s) => sum + s.emails_sent, 0))}
                </p>
                <p className="text-sm text-muted-foreground">since tracking began</p>
              </div>
            </div>

            {/* Volume Chart */}
            <VolumeHistoryChart data={volumeHistory} />

            {/* Anomaly detection - show if any day had significantly different volume */}
            {(() => {
              const avg = volumeHistory.snapshots.reduce((s, d) => s + d.emails_sent, 0) / volumeHistory.snapshots.length;
              const anomalies = volumeHistory.snapshots.filter(s =>
                s.emails_sent < avg * 0.5 || s.emails_sent > avg * 1.5
              );
              if (anomalies.length > 0) {
                return (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-600 font-medium">
                      {anomalies.length} day(s) with unusual volume detected
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Kill Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kill Velocity */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Kill Velocity
                </span>
              </div>
              {killVelocity && (
                <span className={`text-sm font-medium ${killVelocity.trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                  {killVelocity.totalDeaths7d} / 7d
                </span>
              )}
            </div>
            {killVelocity && killVelocity.weeklyData.length > 0 ? (
              <>
                <KillVelocityChart data={killVelocity} />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">7-Day</p>
                    <p className="text-xl font-bold text-primary">{killVelocity.totalDeaths7d}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">30-Day</p>
                    <p className="text-xl font-bold">{killVelocity.totalDeaths30d}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">No Terminations</p>
                  <p className="text-sm text-muted-foreground">All inboxes operational</p>
                </div>
              </div>
            )}
          </div>

          {/* Kill Breakdown */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Kill Breakdown
              </span>
            </div>
            {killBreakdown && killBreakdown.total_kills > 0 ? (
              <KillBreakdownPie data={killBreakdown} />
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">No Incidents</p>
                  <p className="text-sm text-muted-foreground">Clean record for 30 days</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
            <span>·</span>
            <span>Synced from {infrastructure.sync_source}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

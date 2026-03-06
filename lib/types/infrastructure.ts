// Infrastructure Dashboard Types v2
// Modular types for email infrastructure health monitoring

export interface Infrastructure {
  total_inboxes: number;
  live_inboxes: number;
  dead_inboxes: number;
  avg_health_score: number;
  flagged_domains: number;
  clean_domains: number;
  connected_inboxes: number;
  disconnected_inboxes: number;
  operational_capacity: number;
  potential_capacity: number;
  health_distribution: HealthDistribution;
  lifecycle_distribution: LifecycleDistribution;
  warning_distribution: WarningDistribution;
  providers: ProviderMetrics[];
  last_sync: string;
  sync_source: string;
}

export interface HealthDistribution {
  healthy: number;
  good: number;
  warning: number;
  critical: number;
  total: number;
}

export interface LifecycleDistribution {
  deployed: number;
  reserve: number;
  incubating: number;
  warning: number;
}

export interface WarningDistribution {
  healthy: number;
  watching: number;
  warning: number;
  critical: number;
  total_at_risk: number;
}

export interface ProviderMetrics {
  name: string;
  live_count: number;
  dead_count: number;
  avg_health_score: number;
  connected_count: number;
  disconnected_count: number;
  reply_rate: number;
  bounce_rate: number;
  replied_count: number;
}

export interface KillVelocity {
  totalDeaths7d: number;
  totalDeaths30d: number;
  trend: 'up' | 'down' | 'stable';
  weeklyData: Array<{
    week: string;
    deaths: number;
  }>;
}

export interface KillBreakdown {
  total_kills: number;
  by_trigger: Array<{
    trigger: string;
    count: number;
    percentage: number;
  }>;
}

export interface VolumeHistory {
  snapshots: Array<{
    date: string;
    emails_sent: number;
    daily_capacity_available: number;
    live_inboxes: number;
  }>;
}

// v2 Widget Types

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  entity_type?: 'inbox' | 'domain' | 'campaign';
  entity_name?: string;
  created_at: string;
}

export interface WarmupPipeline {
  warming_count: number;
  avg_days_to_ready: number;
  capacity_next_week: number;
  capacity_next_month: number;
  inboxes: Array<{
    email: string;
    days_warming: number;
    warmup_score: number;
    estimated_ready_date: string;
  }>;
}

export interface DnsAuthStatus {
  total_domains: number;
  spf_configured: number;
  dkim_configured: number;
  dmarc_configured: number;
  mx_configured: number;
  fully_authenticated: number;
  domains_missing_auth: Array<{
    domain: string;
    missing: string[];
  }>;
}

export interface AtRiskForecast {
  total_at_risk: number;
  watching: number;
  warning: number;
  critical: number;
  inboxes: Array<{
    email: string;
    risk_level: 'watching' | 'warning' | 'critical';
    bounces_24h: number;
    bounces_7d: number;
    next_bounce_kills: boolean;
  }>;
}

export interface InfrastructureClient {
  id: string;
  name: string;
  created_at: string;
}

export interface Package {
  name: string;
  inbox_target: number;
}

export interface InfrastructureDashboardData {
  infrastructure: Infrastructure;
  killVelocity: KillVelocity | null;
  killBreakdown: KillBreakdown | null;
  volumeHistory: VolumeHistory | null;
  alerts: Alert[];
  warmupPipeline: WarmupPipeline | null;
  dnsAuthStatus: DnsAuthStatus | null;
  atRiskForecast: AtRiskForecast | null;
  client: InfrastructureClient | null;
  clientId: string;
  fetchedAt: string;
  package: Package | null;
}

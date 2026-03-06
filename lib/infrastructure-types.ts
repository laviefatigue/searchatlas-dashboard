// Type definitions for Infrastructure Dashboard

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

export interface VolumeHistory {
  snapshots: Array<{
    date: string;
    emails_sent: number;
    daily_capacity_available: number;
    live_inboxes: number;
  }>;
}

export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface Package {
  name: string;
  inbox_target: number;
}

export interface DashboardData {
  infrastructure: Infrastructure;
  volumeHistory: VolumeHistory | null;
  client: Client | null;
  clientId: string;
  fetchedAt: string;
  package: Package | null;
}

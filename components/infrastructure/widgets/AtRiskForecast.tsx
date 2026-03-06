'use client';

import { AlertTriangle, TrendingDown, Eye, Skull } from 'lucide-react';
import type { AtRiskForecast } from '@/lib/types/infrastructure';

interface AtRiskForecastProps {
  data: AtRiskForecast;
}

export function AtRiskForecastWidget({ data }: AtRiskForecastProps) {
  const riskLevels = [
    {
      level: 'watching',
      label: 'Watching',
      count: data.watching,
      description: '1-2 bounces in 7d',
      colorClass: 'text-selery-cyan',
      bgClass: 'bg-selery-cyan/20',
      icon: Eye,
    },
    {
      level: 'warning',
      label: 'Warning',
      count: data.warning,
      description: '1 bounce in 24h',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/20',
      icon: AlertTriangle,
    },
    {
      level: 'critical',
      label: 'Critical',
      count: data.critical,
      description: 'At kill threshold',
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/20',
      icon: Skull,
    },
  ];

  const maxCount = Math.max(data.watching, data.warning, data.critical, 1);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-amber-500" />
          At-Risk Forecast
        </h3>
        <span className="text-2xl font-bold text-amber-500">
          {data.total_at_risk}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Inboxes approaching kill thresholds
      </p>

      <div className="space-y-4">
        {riskLevels.map((risk, index) => {
          const Icon = risk.icon;
          const barWidth = (risk.count / maxCount) * 100;

          return (
            <div key={risk.level}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${risk.colorClass}`} />
                  <span className={`text-sm font-medium ${risk.colorClass}`}>
                    {risk.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({risk.description})
                  </span>
                </div>
                <span className={`text-lg font-semibold ${risk.colorClass}`}>
                  {risk.count}
                </span>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${risk.bgClass}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {data.critical > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 flex items-center gap-2">
            <Skull className="h-3.5 w-3.5" />
            <span className="font-medium">
              {data.critical} inbox{data.critical > 1 ? 'es' : ''} will die on next bounce
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { Server, Wifi, WifiOff, Cloud, Mail } from 'lucide-react';
import type { ProviderMetrics } from '@/lib/types/infrastructure';

interface ProviderHealthProps {
  providers: ProviderMetrics[];
}

export function ProviderHealthWidget({ providers }: ProviderHealthProps) {
  const getProviderIcon = (name: string) => {
    if (name.toLowerCase().includes('microsoft') || name.toLowerCase().includes('entra')) {
      return <Cloud className="h-5 w-5 text-selery-cyan" />;
    }
    if (name.toLowerCase().includes('google') || name.toLowerCase().includes('gmail')) {
      return <Mail className="h-5 w-5 text-selery-gold" />;
    }
    return <Server className="h-5 w-5 text-muted-foreground" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-selery-cyan';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const maxLive = Math.max(...providers.map(p => p.live_count), 1);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Server className="h-4 w-4 text-selery-cyan" />
          Provider Health
        </h3>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => {
          const barWidth = (provider.live_count / maxLive) * 100;
          const healthColor = getHealthColor(provider.avg_health_score);

          return (
            <div key={provider.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getProviderIcon(provider.name)}
                  <span className="text-sm font-medium">
                    {provider.name}
                  </span>
                </div>
                <span className={`text-xl font-bold ${healthColor}`}>
                  {Math.round(provider.avg_health_score)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Live</span>
                  <span className="font-medium ml-auto">{provider.live_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Dead</span>
                  <span className="font-medium ml-auto">{provider.dead_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {provider.disconnected_count > 0 ? (
                    <WifiOff className="h-3 w-3 text-warning" />
                  ) : (
                    <Wifi className="h-3 w-3 text-success" />
                  )}
                  <span className="text-muted-foreground">Disc.</span>
                  <span className={`font-medium ml-auto ${provider.disconnected_count > 0 ? 'text-warning' : 'text-success'}`}>
                    {provider.disconnected_count}
                  </span>
                </div>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-primary to-primary/70"
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

'use client';

import { Server, Wifi, WifiOff, Cloud, Mail } from 'lucide-react';
import type { ProviderMetrics } from '@/lib/infrastructure-types';

interface ProviderHealthProps {
  providers: ProviderMetrics[];
}

export function ProviderHealthWidget({ providers }: ProviderHealthProps) {
  const getProviderIcon = (name: string) => {
    if (name.toLowerCase().includes('microsoft') || name.toLowerCase().includes('entra')) {
      return <Cloud className="h-5 w-5 text-[#FF2D84]" />;
    }
    if (name.toLowerCase().includes('google') || name.toLowerCase().includes('gmail')) {
      return <Mail className="h-5 w-5 text-[#FF644D]" />;
    }
    return <Server className="h-5 w-5 text-gray-500" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-[#FF2D84]';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const maxLive = Math.max(...providers.map(p => p.live_count), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Server className="h-4 w-4 text-[#FF2D84]" />
          Provider Health
        </h3>
      </div>

      <div className="space-y-4">
        {providers.map((provider, index) => {
          const barWidth = (provider.live_count / maxLive) * 100;
          const healthColor = getHealthColor(provider.avg_health_score);

          return (
            <div
              key={provider.name}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getProviderIcon(provider.name)}
                  <span className="text-sm font-medium text-[#0F0F11]">
                    {provider.name}
                  </span>
                </div>
                <span className={`text-xl font-bold ${healthColor}`}>
                  {Math.round(provider.avg_health_score)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-500">Live</span>
                  <span className="font-medium text-[#0F0F11] ml-auto">{provider.live_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-gray-500">Dead</span>
                  <span className="font-medium text-[#0F0F11] ml-auto">{provider.dead_count}</span>
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
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, #FF2D84, #FD8460)`,
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

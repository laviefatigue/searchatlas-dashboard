'use client';

import { Flame, Clock, TrendingUp, Calendar } from 'lucide-react';
import type { WarmupPipeline } from '@/lib/types/infrastructure';

interface WarmupPipelineProps {
  data: WarmupPipeline;
}

export function WarmupPipelineWidget({ data }: WarmupPipelineProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500" />
          Warmup Pipeline
        </h3>
        <span className="text-2xl font-bold text-amber-500">
          {data.warming_count}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Inboxes currently warming up
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Time</span>
          </div>
          <span className="text-xl font-semibold text-selery-cyan">{data.avg_days_to_ready}d</span>
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Next Week</span>
          </div>
          <span className="text-xl font-semibold text-green-500">+{data.capacity_next_week}</span>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">30-day forecast</span>
          </div>
          <span className="text-lg font-semibold text-green-500">
            +{data.capacity_next_month}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          New production-ready inboxes
        </p>
      </div>

      {data.inboxes.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Next Ready
          </p>
          {data.inboxes.slice(0, 3).map((inbox, index) => (
            <div
              key={inbox.email}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground truncate max-w-[140px]">
                {inbox.email}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full"
                    style={{ width: `${inbox.warmup_score}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">
                  {inbox.days_warming}d
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

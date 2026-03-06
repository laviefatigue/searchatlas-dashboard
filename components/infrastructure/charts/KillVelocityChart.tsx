'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { KillVelocity } from '@/lib/types/infrastructure';

interface KillVelocityChartProps {
  data: KillVelocity;
}

export function KillVelocityChart({ data }: KillVelocityChartProps) {
  const chartData = data.weeklyData.map((item) => {
    const date = new Date(item.week);
    return {
      week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      deaths: item.deaths,
    };
  });

  const maxDeaths = Math.max(...chartData.map(d => d.deaths), 0);
  const yAxisMax = Math.ceil(maxDeaths * 1.2) || 10;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientDeaths" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e5e5"
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: '#737373' }}
            stroke="#e5e5e5"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#737373' }}
            stroke="#e5e5e5"
            domain={[0, yAxisMax]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: '#1a1a1a', fontWeight: 500 }}
            formatter={(value: number) => [`${value} terminated`, 'Inboxes']}
          />
          <Area
            type="monotone"
            dataKey="deaths"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradientDeaths)"
            name="Terminations"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { VolumeHistory } from '@/lib/infrastructure-types';

interface VolumeHistoryChartProps {
  data: VolumeHistory;
}

export function VolumeHistoryChart({ data }: VolumeHistoryChartProps) {
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
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e5e5"
            vertical={false}
          />
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
            itemStyle={{ color: '#28BFFC' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            iconType="circle"
          />
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

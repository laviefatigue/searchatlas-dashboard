'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { KillBreakdown } from '@/lib/types/infrastructure';

interface KillBreakdownPieProps {
  data: KillBreakdown;
}

// Selery-themed chart colors
const COLORS = [
  '#28BFFC', // cyan
  '#1C2655', // navy
  '#F9B416', // gold
  '#ef4444', // red
  '#22c55e', // green
];

export function KillBreakdownPie({ data }: KillBreakdownPieProps) {
  const chartData = data.by_trigger.map((item) => ({
    name: item.trigger.charAt(0).toUpperCase() + item.trigger.slice(1),
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
            outerRadius={65}
            innerRadius={35}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: '#1a1a1a', fontWeight: 500 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

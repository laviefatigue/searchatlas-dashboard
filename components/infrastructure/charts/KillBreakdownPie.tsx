'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { KillBreakdown } from '@/lib/types/infrastructure';

interface KillBreakdownPieProps {
  data: KillBreakdown;
}

// SearchAtlas-themed chart colors
const COLORS = [
  '#388FC0', // cyan
  '#6B7A85', // navy
  '#6B8BA0', // gold
  '#E07A62', // red
  '#54A56D', // green
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
              border: '1px solid #E7EAEC',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: '#111A20', fontWeight: 500 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

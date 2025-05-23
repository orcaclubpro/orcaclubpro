'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { distributionData } from './utils/mockData';

export function SystemDistributionChart() {
  return (
    <ChartCard title="system.distribution" height={200}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={distributionData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {distributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontFamily: 'monospace'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
} 
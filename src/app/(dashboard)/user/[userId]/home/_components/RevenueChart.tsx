'use client';

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { revenueData } from './utils/mockData';

export function RevenueChart() {
  return (
    <ChartCard title="revenue.analytics" actions={true}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={revenueData}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF" 
            fontSize={12}
            fontFamily="monospace"
          />
          <YAxis 
            stroke="#9CA3AF" 
            fontSize={12}
            fontFamily="monospace"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontFamily: 'monospace'
            }}
          />
          <Bar 
            dataKey="value" 
            fill="url(#barGradient)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
} 
'use client';

import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { performanceData } from './utils/mockData';

export function PerformanceChart() {
  return (
    <ChartCard title="performance.metrics" actions={true}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={performanceData}>
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
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
          <Area
            type="monotone"
            dataKey="cpu"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#cpuGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="memory"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#memoryGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
} 
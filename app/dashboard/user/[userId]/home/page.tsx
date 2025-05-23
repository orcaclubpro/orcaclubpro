'use client';

import { Suspense } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { DashboardHeader } from './_components/DashboardHeader';
import { containerVariants } from './_components/utils/animations';

// Lazy load heavy components with SSR disabled for client-only features
const MetricsGrid = dynamic(() => import('./_components/MetricsGrid').then(mod => ({ default: mod.MetricsGrid })), {
  loading: () => <MetricsGridSkeleton />
});

const RevenueChart = dynamic(() => import('./_components/RevenueChart').then(mod => ({ default: mod.RevenueChart })), {
  loading: () => <ChartSkeleton title="Revenue Analytics" />
});

const PerformanceChart = dynamic(() => import('./_components/PerformanceChart').then(mod => ({ default: mod.PerformanceChart })), {
  loading: () => <ChartSkeleton title="System Performance" />
});

const SystemDistributionChart = dynamic(() => import('./_components/SystemDistributionChart').then(mod => ({ default: mod.SystemDistributionChart })), {
  loading: () => <ChartSkeleton title="System Distribution" />
});

const TerminalCardWrapper = dynamic(() => import('./_components/TerminalCardWrapper'), {
  loading: () => <TerminalSkeleton />
});

const QuickActions = dynamic(() => import('./_components/QuickActions').then(mod => ({ default: mod.QuickActions })), {
  loading: () => <QuickActionsSkeleton />
});

// Lightweight loading skeletons
function MetricsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2" />
          <div className="h-8 bg-gray-700 rounded mb-2" />
          <div className="h-3 bg-gray-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="h-4 w-16 bg-gray-700 rounded" />
      </div>
      <div className="h-64 bg-gray-800/50 rounded" />
    </div>
  );
}

function TerminalSkeleton() {
  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Live Terminal</h3>
        <div className="h-4 w-16 bg-gray-700 rounded" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-800 rounded" style={{ width: `${Math.random() * 40 + 60}%` }} />
        ))}
      </div>
    </div>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 animate-pulse">
          <div className="h-8 w-8 bg-gray-700 rounded mb-2" />
          <div className="h-4 bg-gray-700 rounded mb-1" />
          <div className="h-3 bg-gray-700 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

// Server Component - handles static content
interface UserHomePageProps {
  params: Promise<{ userId: string }>;
}

export default function UserHomePage({ params }: UserHomePageProps) {
  const { userId } = use(params);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6 min-h-screen"
    >
      {/* Header Section */}
      <DashboardHeader userId={userId} />

      {/* Lazy-loaded metrics with Suspense */}
      <Suspense fallback={<MetricsGridSkeleton />}>
        <MetricsGrid />
      </Suspense>

      {/* Charts grid with lazy loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton title="Revenue Analytics" />}>
          <RevenueChart />
        </Suspense>
        
        <Suspense fallback={<ChartSkeleton title="System Performance" />}>
          <PerformanceChart />
        </Suspense>
      </div>

      {/* Second row of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<TerminalSkeleton />}>
            <TerminalCardWrapper />
          </Suspense>
        </div>
        
        <Suspense fallback={<ChartSkeleton title="System Distribution" />}>
          <SystemDistributionChart />
        </Suspense>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <Suspense fallback={<QuickActionsSkeleton />}>
          <QuickActions />
        </Suspense>
      </div>
    </motion.div>
  );
} 
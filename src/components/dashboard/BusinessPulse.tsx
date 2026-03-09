'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export interface WeekBucket {
  label: string
  revenue: number
  orders: number
}

export interface BusinessPulseProps {
  weeklyRevenue: WeekBucket[]
  orderPipeline: {
    paidAmount: number
    pendingAmount: number
    cancelledAmount: number
    paidCount: number
    pendingCount: number
    cancelledCount: number
  }
  projectStatus: {
    active: number
    pending: number
    completed: number
  }
  kpis: {
    revenue30d: number
    orders30d: number
    activeClients: number
    activeProjects: number
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.12] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-medium">{fmt(payload[0]?.value ?? 0)}</p>
      <p className="text-gray-300">{payload[0]?.payload?.orders} order{payload[0]?.payload?.orders !== 1 ? 's' : ''}</p>
    </div>
  )
}

export function BusinessPulse({ weeklyRevenue, orderPipeline, projectStatus, kpis }: BusinessPulseProps) {
  const maxRevenue = Math.max(...weeklyRevenue.map(w => w.revenue), 1)

  const pipelineTotal = orderPipeline.paidAmount + orderPipeline.pendingAmount + orderPipeline.cancelledAmount
  const paidPct = pipelineTotal > 0 ? (orderPipeline.paidAmount / pipelineTotal) * 100 : 0
  const pendingPct = pipelineTotal > 0 ? (orderPipeline.pendingAmount / pipelineTotal) * 100 : 0
  const cancelledPct = pipelineTotal > 0 ? (orderPipeline.cancelledAmount / pipelineTotal) * 100 : 0

  const projectTotal = projectStatus.active + projectStatus.pending + projectStatus.completed
  const activePct = projectTotal > 0 ? (projectStatus.active / projectTotal) * 100 : 0
  const pendingProjPct = projectTotal > 0 ? (projectStatus.pending / projectTotal) * 100 : 0
  const completedPct = projectTotal > 0 ? (projectStatus.completed / projectTotal) * 100 : 0

  const kpiItems = [
    { label: 'Revenue', value: fmt(kpis.revenue30d), accent: true },
    { label: 'Orders', value: String(kpis.orders30d) },
    { label: 'Clients', value: String(kpis.activeClients) },
    { label: 'Projects', value: String(kpis.activeProjects) },
  ]

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">30-Day Pulse</h2>
          <p className="text-xs text-gray-300 mt-0.5">Revenue · Pipeline · Projects</p>
        </div>
        <span className="text-xs tracking-widest uppercase gradient-text font-medium">Last 30 days</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {kpiItems.map((k) => (
          <div key={k.label} className="flex-1 space-y-1 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] min-w-0">
            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold truncate">{k.label}</p>
            <p className={`text-xl font-bold tabular-nums tracking-tight ${k.accent ? 'text-intelligence-cyan' : 'text-white'}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly revenue chart */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyRevenue} barSize={28} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
              {weeklyRevenue.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.revenue === maxRevenue && entry.revenue > 0 ? '#67e8f9' : 'rgba(103,232,249,0.2)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pipeline + Projects breakdown */}
      <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/[0.05]">

        {/* Order pipeline */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest gradient-text font-medium">Order Pipeline</p>
          <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-white/[0.06]">
            {paidPct > 0 && (
              <div style={{ width: `${paidPct}%` }} className="bg-emerald-400/70 transition-all duration-500" />
            )}
            {pendingPct > 0 && (
              <div style={{ width: `${pendingPct}%` }} className="bg-amber-400/70 transition-all duration-500" />
            )}
            {cancelledPct > 0 && (
              <div style={{ width: `${cancelledPct}%` }} className="bg-red-400/40 transition-all duration-500" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-300">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400/70 inline-block" />
              Paid {fmt(orderPipeline.paidAmount)}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-400/70 inline-block" />
              Pending {fmt(orderPipeline.pendingAmount)}
            </span>
          </div>
        </div>

        {/* Project health */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest gradient-text font-medium">Project Health</p>
          <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-white/[0.06]">
            {activePct > 0 && (
              <div style={{ width: `${activePct}%` }} className="bg-cyan-400/70 transition-all duration-500" />
            )}
            {pendingProjPct > 0 && (
              <div style={{ width: `${pendingProjPct}%` }} className="bg-amber-400/50 transition-all duration-500" />
            )}
            {completedPct > 0 && (
              <div style={{ width: `${completedPct}%` }} className="bg-white/20 transition-all duration-500" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-300">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-cyan-400/70 inline-block" />
              Active {projectStatus.active}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-white/20 inline-block" />
              Done {projectStatus.completed}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

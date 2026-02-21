'use client'

import { useState } from 'react'
import { X, BarChart2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { BusinessPulseProps } from './BusinessPulse'

// ─── Formatter ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c1c1c] border border-white/[0.12] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-medium">{fmt(payload[0]?.value ?? 0)}</p>
      <p className="text-gray-500">
        {payload[0]?.payload?.orders} order
        {payload[0]?.payload?.orders !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ─── Sidebar content (shared between desktop panel + mobile sheet) ─────────────

function SidebarContent({
  weeklyRevenue,
  orderPipeline,
  projectStatus,
  kpis,
}: BusinessPulseProps) {
  const maxRevenue = Math.max(...weeklyRevenue.map((w) => w.revenue), 1)

  const pipelineTotal =
    orderPipeline.paidAmount +
    orderPipeline.pendingAmount +
    orderPipeline.cancelledAmount
  const paidPct =
    pipelineTotal > 0 ? (orderPipeline.paidAmount / pipelineTotal) * 100 : 0
  const pendingPct =
    pipelineTotal > 0 ? (orderPipeline.pendingAmount / pipelineTotal) * 100 : 0
  const cancelledPct =
    pipelineTotal > 0
      ? (orderPipeline.cancelledAmount / pipelineTotal) * 100
      : 0

  const projectTotal =
    projectStatus.active + projectStatus.pending + projectStatus.completed
  const activePct =
    projectTotal > 0 ? (projectStatus.active / projectTotal) * 100 : 0
  const pendingProjPct =
    projectTotal > 0 ? (projectStatus.pending / projectTotal) * 100 : 0
  const completedPct =
    projectTotal > 0 ? (projectStatus.completed / projectTotal) * 100 : 0

  return (
    <div className="space-y-7">

      {/* KPI 2×2 grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-intelligence-cyan/20 bg-gradient-to-b from-cyan-950/40 to-[#080808] p-4">
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-medium">
            30d Revenue
          </p>
          <p className="text-xl font-bold text-intelligence-cyan tabular-nums mt-1.5">
            {fmt(kpis.revenue30d)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#0f0f0f] p-4">
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-medium">
            Orders
          </p>
          <p className="text-xl font-bold text-white tabular-nums mt-1.5">
            {kpis.orders30d}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#0f0f0f] p-4">
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-medium">
            Active Clients
          </p>
          <p className="text-xl font-bold text-white tabular-nums mt-1.5">
            {kpis.activeClients}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#0f0f0f] p-4">
          <p className="text-[9px] uppercase tracking-widest text-gray-600 font-medium">
            Projects
          </p>
          <p className="text-xl font-bold text-white tabular-nums mt-1.5">
            {kpis.activeProjects}
          </p>
        </div>
      </div>

      {/* Weekly revenue chart */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium mb-3">
          Weekly Revenue
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyRevenue}
              barSize={22}
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                {weeklyRevenue.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.revenue === maxRevenue && entry.revenue > 0
                        ? '#67e8f9'
                        : 'rgba(103,232,249,0.18)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order pipeline */}
      <div className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
          Order Pipeline
        </p>
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-white/[0.06]">
          {paidPct > 0 && (
            <div
              style={{ width: `${paidPct}%` }}
              className="bg-emerald-400/70 transition-all duration-500"
            />
          )}
          {pendingPct > 0 && (
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-amber-400/70 transition-all duration-500"
            />
          )}
          {cancelledPct > 0 && (
            <div
              style={{ width: `${cancelledPct}%` }}
              className="bg-red-400/40 transition-all duration-500"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-[10px] text-gray-500">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400/70 inline-block shrink-0" />
              Paid
            </span>
            <span className="tabular-nums text-gray-400">{fmt(orderPipeline.paidAmount)}</span>
          </span>
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400/70 inline-block shrink-0" />
              Pending
            </span>
            <span className="tabular-nums text-gray-400">{fmt(orderPipeline.pendingAmount)}</span>
          </span>
          {orderPipeline.cancelledCount > 0 && (
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-red-400/40 inline-block shrink-0" />
                Cancelled
              </span>
              <span className="tabular-nums text-gray-400">{fmt(orderPipeline.cancelledAmount)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Project health */}
      <div className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
          Project Health
        </p>
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-white/[0.06]">
          {activePct > 0 && (
            <div
              style={{ width: `${activePct}%` }}
              className="bg-cyan-400/70 transition-all duration-500"
            />
          )}
          {pendingProjPct > 0 && (
            <div
              style={{ width: `${pendingProjPct}%` }}
              className="bg-amber-400/50 transition-all duration-500"
            />
          )}
          {completedPct > 0 && (
            <div
              style={{ width: `${completedPct}%` }}
              className="bg-white/20 transition-all duration-500"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-[10px] text-gray-500">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-cyan-400/70 inline-block shrink-0" />
              Active
            </span>
            <span className="tabular-nums text-gray-400">{projectStatus.active}</span>
          </span>
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400/50 inline-block shrink-0" />
              Pending
            </span>
            <span className="tabular-nums text-gray-400">{projectStatus.pending}</span>
          </span>
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-white/20 inline-block shrink-0" />
              Completed
            </span>
            <span className="tabular-nums text-gray-400">{projectStatus.completed}</span>
          </span>
        </div>
      </div>

    </div>
  )
}

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
      <div>
        <h2 className="text-sm font-semibold text-white">Analytics</h2>
        <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wider">
          Last 30 days
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-all"
        aria-label="Close analytics"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AnalyticsSidebar(props: BusinessPulseProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Desktop: right-edge vertical tab ─────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40
                   flex-col items-center gap-2.5
                   pl-3 pr-2.5 py-5
                   bg-[#111] border border-r-0 border-white/[0.10]
                   rounded-l-xl
                   hover:border-intelligence-cyan/30 hover:bg-[#181818]
                   transition-all duration-300 group"
        aria-label="Toggle analytics sidebar"
      >
        <BarChart2 className="size-3.5 text-intelligence-cyan" />
        <span
          className="text-[9px] font-semibold text-gray-500 uppercase tracking-[0.18em]
                     group-hover:text-gray-300 transition-colors
                     [writing-mode:vertical-rl] rotate-180"
        >
          Analytics
        </span>
      </button>

      {/* ── Mobile: FAB bottom-left ──────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="md:hidden fixed bottom-8 left-4 z-40
                   flex items-center gap-2
                   px-4 py-2.5 rounded-full
                   bg-[#1c1c1c] border border-white/[0.12]
                   shadow-[0_4px_24px_rgba(0,0,0,0.5)]
                   hover:border-intelligence-cyan/30
                   transition-all duration-300 active:scale-95"
        aria-label="Toggle analytics"
      >
        <BarChart2 className="size-4 text-intelligence-cyan" />
        <span className="text-xs font-medium text-gray-300">Analytics</span>
      </button>

      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]
                    transition-opacity duration-300
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* ── Desktop: slide-in panel from right ──────────────────────────── */}
      <aside
        className={`hidden md:flex fixed top-[65px] right-0 bottom-0 z-40
                    w-[360px] xl:w-[400px] flex-col
                    bg-[#0a0a0a] border-l border-white/[0.08]
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Analytics sidebar"
      >
        <PanelHeader onClose={() => setOpen(false)} />
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <SidebarContent {...props} />
        </div>
      </aside>

      {/* ── Mobile: slide-up bottom sheet ────────────────────────────────── */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50
                    flex flex-col
                    bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-2xl
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '82vh' }}
        aria-label="Analytics panel"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/[0.12]" />
        </div>
        <PanelHeader onClose={() => setOpen(false)} />
        <div className="overflow-y-auto px-6 pb-10 pt-5" style={{ overscrollBehavior: 'contain' }}>
          <SidebarContent {...props} />
        </div>
      </div>
    </>
  )
}

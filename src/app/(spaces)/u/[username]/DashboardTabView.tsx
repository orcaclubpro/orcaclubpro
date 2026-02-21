'use client'

import { useRef } from 'react'
import { AdminHomeView } from './_views/AdminHomeView'
import { ClientHomeView } from './_views/ClientHomeView'
import { ClientsView } from './_views/ClientsView'
import { ProjectsAdminView } from './_views/ProjectsAdminView'
import { ProjectsClientView } from './_views/ProjectsClientView'
import { TasksView } from './_views/TasksView'
import { OrdersView } from './_views/OrdersView'
import { useTabContext } from '../../TabContext'
import type { SerializedProject } from '@/components/dashboard/ProjectsCarousel'
import type { ClientOption } from '@/components/dashboard/CreateProjectModal'
import { useEffect } from 'react'

// ── Tab definitions ───────────────────────────────────────────────────────────

const ADMIN_TABS = ['home', 'clients', 'projects', 'tasks'] as const
const CLIENT_TABS = ['home', 'projects', 'invoices'] as const
type AdminTab = (typeof ADMIN_TABS)[number]
type ClientTab = (typeof CLIENT_TABS)[number]

// ── Data bundles (passed from server page.tsx) ────────────────────────────────

export interface AdminDataBundle {
  firstName?: string | null
  clientAccounts: any[]
  allOrders: any[]
  allProjects: any[]
  allTasks: any[]
  completedTasksCount: number
  completedSprintsCount: number
  serializedProjects: SerializedProject[]
  clientOptions: ClientOption[]
}

export interface ClientDataBundle {
  firstName?: string | null
  clientAccount: any
  clientProjects: any[]
  orders: any[]
  clientSprints: any[]
  serializedClientProjects: SerializedProject[]
}

interface DashboardTabViewProps {
  username: string
  role: string
  timeframe?: '7d' | '30d' | '90d'
  adminData?: AdminDataBundle
  clientData?: ClientDataBundle
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardTabView({
  username,
  role,
  timeframe = '7d',
  adminData,
  clientData,
}: DashboardTabViewProps) {
  const { activeTab, navigate } = useTabContext()
  const tabs = role === 'client' ? CLIENT_TABS : ADMIN_TABS

  // Stable refs so swipe effect doesn't need to re-run
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab

  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  // Swipe handler — set up once
  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startTime = Date.now()
    }

    const onTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX
      const deltaY = e.changedTouches[0].clientY - startY
      if (Date.now() - startTime > 500) return
      if (Math.abs(deltaX) < 80) return
      if (Math.abs(deltaX) < Math.abs(deltaY) * 1.8) return

      const idx = tabs.indexOf(activeTabRef.current as AdminTab & ClientTab)
      const cur = idx === -1 ? 0 : idx
      if (deltaX < 0 && tabs[cur + 1]) navigateRef.current(tabs[cur + 1])
      else if (deltaX > 0 && tabs[cur - 1]) navigateRef.current(tabs[cur - 1])
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, []) // intentionally empty — uses refs for fresh values

  // ── Admin views ──────────────────────────────────────────────────────────────

  if (role === 'admin' || role === 'user') {
    const d = adminData!
    switch (activeTab as AdminTab) {
      case 'clients':
        return (
          <ClientsView
            clientAccounts={d.clientAccounts}
            username={username}
            userRole={role}
          />
        )
      case 'projects':
        return (
          <ProjectsAdminView
            serializedProjects={d.serializedProjects}
            clientOptions={d.clientOptions}
            username={username}
            userRole={role}
          />
        )
      case 'tasks':
        return <TasksView tasks={d.allTasks} />
      default:
        return (
          <AdminHomeView
            user={{ firstName: d.firstName, role }}
            username={username}
            clientAccounts={d.clientAccounts}
            allOrders={d.allOrders}
            allProjects={d.allProjects}
            allTasks={d.allTasks}
            completedTasksCount={d.completedTasksCount}
            completedSprintsCount={d.completedSprintsCount}
            timeframe={timeframe}
          />
        )
    }
  }

  // ── Client views ─────────────────────────────────────────────────────────────

  const d = clientData!
  switch (activeTab as ClientTab) {
    case 'projects':
      return (
        <ProjectsClientView
          serializedProjects={d.serializedClientProjects}
          username={username}
        />
      )
    case 'invoices':
      return <OrdersView allOrders={d.orders as any} clientAccount={d.clientAccount} />
    default:
      return (
        <ClientHomeView
          user={{ firstName: d.firstName }}
          username={username}
          clientAccount={d.clientAccount}
          clientProjects={d.clientProjects}
          orders={d.orders}
          clientSprints={d.clientSprints}
        />
      )
  }
}

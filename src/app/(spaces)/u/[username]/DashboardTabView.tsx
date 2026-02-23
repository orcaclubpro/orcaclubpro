'use client'

import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { usePackageCount } from '@/app/(spaces)/PackageCountContext'
import { AdminHomeView } from './_views/AdminHomeView'
import { ClientHomeView } from './_views/ClientHomeView'
import { ClientsView } from './_views/ClientsView'
import { ProjectsAdminView } from './_views/ProjectsAdminView'
import { ProjectsClientView } from './_views/ProjectsClientView'
import { TasksView } from './_views/TasksView'
import { OrdersView } from './_views/OrdersView'
import { PackagesClientView } from './_views/PackagesClientView'
import { PackagesAdminView } from './_views/PackagesAdminView'
import { useTabContext } from '../../TabContext'
import type { SerializedProject } from '@/components/dashboard/ProjectsCarousel'
import type { ClientOption } from '@/components/dashboard/CreateProjectModal'

// ── Tab order must match MobileBottomNav visual order ─────────────────────────

const ADMIN_TABS = ['home', 'projects', 'clients', 'tasks', 'packages'] as const
const CLIENT_TABS = ['home', 'projects', 'invoices', 'packages'] as const
type AdminTab = (typeof ADMIN_TABS)[number]
type ClientTab = (typeof CLIENT_TABS)[number]
type AnyTab = AdminTab | ClientTab

// Animation duration — keep in sync with the CSS keyframe timing
const ANIM_MS = 260

// ── Data bundles ──────────────────────────────────────────────────────────────

export interface AdminDataBundle {
  firstName?: string | null
  clientAccounts: any[]
  allOrders: any[]
  allProjects: any[]
  allTasks: any[]
  allPackages: any[]
  completedTasksCount: number
  completedSprintsCount: number
  serializedProjects: SerializedProject[]
  clientOptions: ClientOption[]
}

export interface ClientDataBundle {
  firstName?: string | null
  showTips?: boolean
  clientAccount: any
  clientProjects: any[]
  orders: any[]
  clientSprints: any[]
  clientPackages: any[]
  serializedClientProjects: SerializedProject[]
}

interface DashboardTabViewProps {
  username: string
  role: string
  timeframe?: '7d' | '30d' | '90d'
  adminData?: AdminDataBundle
  clientData?: ClientDataBundle
}

// Animation state shape
interface AnimState {
  mode: 'idle' | 'animating'
  exitTab: AnyTab | null
  // Which side the entering view slides in from
  enterFrom: 'left' | 'right'
  // Where the exit animation starts (0 for clicks, deltaX for swipes)
  exitStartX: number
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
  const { setPackageCount } = usePackageCount()
  const tabList = (role === 'client' ? CLIENT_TABS : ADMIN_TABS) as readonly AnyTab[]

  // Sync client package count into context so MobileBottomNav can badge it
  useEffect(() => {
    if (role === 'client' && clientData) {
      setPackageCount(clientData.clientPackages.length)
    }
  }, [role, clientData?.clientPackages.length, setPackageCount])

  // ── Animation state ───────────────────────────────────────────────────────

  const [anim, setAnim] = useState<AnimState>({
    mode: 'idle',
    exitTab: null,
    enterFrom: 'right',
    exitStartX: 0,
  })

  // Stable refs — updated every render, never stale in effects
  const prevTabRef = useRef<string>(activeTab)
  const activeTabRef = useRef<string>(activeTab)
  activeTabRef.current = activeTab
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  const animModeRef = useRef(anim.mode)
  animModeRef.current = anim.mode
  const tabListRef = useRef(tabList)
  tabListRef.current = tabList

  // Direct DOM ref for the current/entering view (used for real-time drag)
  const contentRef = useRef<HTMLDivElement>(null)

  // Counter that makes the exit div key unique even when going A→B→A
  const exitKeyRef = useRef(0)

  // ── Trigger animation before the browser paints ───────────────────────────
  // useLayoutEffect fires synchronously after DOM mutations and before paint,
  // so the user never sees the new content without its slide-in animation.

  useLayoutEffect(() => {
    const prev = prevTabRef.current
    if (activeTab === prev) return

    const prevIdx = tabList.indexOf(prev as AnyTab)
    const nextIdx = tabList.indexOf(activeTab as AnyTab)
    // forward = higher index = entering view slides in from the right
    const forward = nextIdx > prevIdx || nextIdx === -1

    exitKeyRef.current += 1

    setAnim({
      mode: 'animating',
      exitTab: prev as AnyTab,
      enterFrom: forward ? 'right' : 'left',
      // Capture the mid-drag offset so the exit animation starts exactly where
      // the finger left off (0 when navigating via tap/click)
      exitStartX: dragRef.current.currentX,
    })

    prevTabRef.current = activeTab
    dragRef.current.currentX = 0

    const timer = setTimeout(() => {
      setAnim(s => ({ ...s, mode: 'idle', exitTab: null }))
      // Clear any residual inline styles on the entering view
      if (contentRef.current) {
        contentRef.current.style.animation = ''
        contentRef.current.style.transform = ''
      }
    }, ANIM_MS + 30)

    return () => clearTimeout(timer)
    // tabList is derived from role which is a stable prop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ── Real-time swipe tracking ──────────────────────────────────────────────

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    locked: false,
  })

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // Don't start a new drag while an animation is running
      if (animModeRef.current === 'animating') return

      dragRef.current = {
        active: true,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTime: Date.now(),
        currentX: 0,
        locked: false,
      }

      // Clear any pending spring-back transition
      if (contentRef.current) {
        contentRef.current.style.transition = ''
        contentRef.current.style.animation = ''
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const d = dragRef.current
      if (!d.active) return

      const deltaX = e.touches[0].clientX - d.startX
      const deltaY = e.touches[0].clientY - d.startY

      // Determine swipe axis on first significant move
      if (!d.locked) {
        // Vertical gesture → release and let the browser scroll
        if (Math.abs(deltaY) > Math.abs(deltaX) * 0.85) {
          d.active = false
          return
        }
        // Wait for a clear horizontal signal before locking
        if (Math.abs(deltaX) < 6) return
        d.locked = true
      }

      // Prevent vertical scroll once we've locked into a horizontal swipe
      e.preventDefault()

      d.currentX = deltaX

      const tabs = tabListRef.current
      const idx = tabs.indexOf(activeTabRef.current as AnyTab)
      const atStart = deltaX > 0 && idx === 0
      const atEnd = deltaX < 0 && idx === tabs.length - 1

      // Rubber-band: edges resist with ~12% of the drag distance
      const resistance = atStart || atEnd ? 0.12 : 1
      const drag = deltaX * resistance

      if (contentRef.current) {
        contentRef.current.style.transform = `translateX(${drag}px)`
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      const d = dragRef.current
      if (!d.active || !d.locked) {
        d.active = false
        return
      }
      d.active = false

      const deltaX = e.changedTouches[0].clientX - d.startX
      const elapsed = Math.max(1, Date.now() - d.startTime)
      const velocity = Math.abs(deltaX) / elapsed // px/ms

      const tabs = tabListRef.current
      const idx = tabs.indexOf(activeTabRef.current as AnyTab)

      // Navigate if dragged far enough OR flicked quickly
      const shouldNav = Math.abs(deltaX) > 55 || velocity > 0.45

      if (shouldNav && deltaX < 0 && idx < tabs.length - 1) {
        // Swipe left → next tab
        d.currentX = deltaX // useLayoutEffect reads this for the exit start position
        navigateRef.current(tabs[idx + 1])
      } else if (shouldNav && deltaX > 0 && idx > 0) {
        // Swipe right → prev tab
        d.currentX = deltaX
        navigateRef.current(tabs[idx - 1])
      } else {
        // Not far/fast enough — spring back with a slight overshoot
        d.currentX = 0
        if (contentRef.current) {
          contentRef.current.style.transition =
            'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          contentRef.current.style.transform = 'translateX(0)'
          setTimeout(() => {
            if (contentRef.current) contentRef.current.style.transition = ''
          }, 400)
        }
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    // passive: false required so we can preventDefault for horizontal swipes
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, []) // stable — all mutable values accessed via refs

  // ── Horizontal wheel / trackpad swipe ─────────────────────────────────────

  useEffect(() => {
    // Accumulated horizontal delta — resets when scrolling pauses
    let accumulated = 0
    // Prevents multiple navigations from a single sustained swipe
    let inCooldown = false
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    let cooldownTimer: ReturnType<typeof setTimeout> | null = null

    const onWheel = (e: WheelEvent) => {
      // Don't compete with an in-flight tab animation
      if (animModeRef.current === 'animating' || inCooldown) return

      const absX = Math.abs(e.deltaX)
      const absY = Math.abs(e.deltaY)

      // Ignore predominantly vertical scrolls (user is scrolling page content)
      if (absY > absX * 1.2) return
      // Ignore noise — very small horizontal deltas
      if (absX < 3) return

      accumulated += e.deltaX

      // Reset the bucket if the user pauses their gesture
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => { accumulated = 0 }, 200)

      const tabs = tabListRef.current
      const idx  = tabs.indexOf(activeTabRef.current as AnyTab)

      // Require a meaningful swipe before committing to a tab change
      const THRESHOLD = 80

      if (accumulated > THRESHOLD && idx < tabs.length - 1) {
        // Scrolled right (trackpad fingers moved left) → next tab
        accumulated = 0
        inCooldown  = true
        navigateRef.current(tabs[idx + 1])
        if (cooldownTimer) clearTimeout(cooldownTimer)
        cooldownTimer = setTimeout(() => { inCooldown = false }, 700)
      } else if (accumulated < -THRESHOLD && idx > 0) {
        // Scrolled left (trackpad fingers moved right) → previous tab
        accumulated = 0
        inCooldown  = true
        navigateRef.current(tabs[idx - 1])
        if (cooldownTimer) clearTimeout(cooldownTimer)
        cooldownTimer = setTimeout(() => { inCooldown = false }, 700)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      if (resetTimer)   clearTimeout(resetTimer)
      if (cooldownTimer) clearTimeout(cooldownTimer)
    }
  }, []) // stable — all mutable values accessed via refs

  // ── View renderer ─────────────────────────────────────────────────────────

  const renderTab = (tab: string) => {
    if (role === 'admin' || role === 'user') {
      const d = adminData!
      switch (tab as AdminTab) {
        case 'projects':
          return (
            <ProjectsAdminView
              serializedProjects={d.serializedProjects}
              clientOptions={d.clientOptions}
              username={username}
              userRole={role}
            />
          )
        case 'clients':
          return (
            <ClientsView
              clientAccounts={d.clientAccounts}
              username={username}
              userRole={role}
              serializedProjects={d.serializedProjects}
              allOrders={d.allOrders}
            />
          )
        case 'tasks':
          return <TasksView tasks={d.allTasks} />
        case 'packages':
          return <PackagesAdminView allPackages={d.allPackages} username={username} />
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
              serializedProjects={d.serializedProjects}
            />
          )
      }
    }

    const d = clientData!
    switch (tab as ClientTab) {
      case 'projects':
        return (
          <ProjectsClientView
            serializedProjects={d.serializedClientProjects}
            username={username}
          />
        )
      case 'invoices':
        return <OrdersView allOrders={d.orders as any} clientAccount={d.clientAccount} clientPackages={d.clientPackages as any} username={username} />
      case 'packages':
        return <PackagesClientView clientPackages={d.clientPackages} username={username} />
      default:
        return (
          <ClientHomeView
            user={{ firstName: d.firstName }}
            username={username}
            showTips={d.showTips ?? true}
            clientAccount={d.clientAccount}
            clientProjects={d.clientProjects}
            orders={d.orders}
            clientSprints={d.clientSprints}
            clientPackages={d.clientPackages}
          />
        )
    }
  }

  // ── Derived animation names ───────────────────────────────────────────────

  // forward (enterFrom 'right'): current exits LEFT, new enters FROM RIGHT
  // backward (enterFrom 'left'): current exits RIGHT, new enters FROM LEFT
  const exitAnimName =
    anim.enterFrom === 'right' ? 'tabSlideOutLeft' : 'tabSlideOutRight'
  const enterAnimName =
    anim.enterFrom === 'right' ? 'tabSlideInFromRight' : 'tabSlideInFromLeft'
  const timing = `${ANIM_MS}ms cubic-bezier(0.36, 0.66, 0.04, 1) forwards`

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Exiting view — positioned absolute, plays its exit animation */}
      {anim.exitTab && (
        <div
          key={`exit-${anim.exitTab}-${exitKeyRef.current}`}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            // CSS custom property read by tabSlideOut* keyframes
            '--tab-slide-from': `${anim.exitStartX}px`,
            animation: `${exitAnimName} ${timing}`,
          } as React.CSSProperties}
        >
          {renderTab(anim.exitTab)}
        </div>
      )}

      {/* Entering / current view — slides in, then becomes the static view */}
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          zIndex: 1,
          // Only apply the enter animation while transitioning
          ...(anim.mode === 'animating' && {
            animation: `${enterAnimName} ${timing}`,
          }),
        }}
      >
        {renderTab(activeTab)}
      </div>

    </div>
  )
}

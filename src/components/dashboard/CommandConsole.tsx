'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Search, X, Building2, FolderKanban, Zap, Loader2, ArrowRight,
  Package, Clock, Command, CornerDownLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchSearchData } from '@/actions/search'
import type { SearchClient, SearchProject, SearchSprint } from '@/actions/search'
import { PackageBuilderTab } from './PackageBuilderTab'
import { RetainerTab } from './RetainerTab'

// ─── The Console ────────────────────────────────────────────────────────────────
// One surface, three stations. Summoned once (⌘/L), it opens *search-first* — a
// compact command bar — and morphs into a full-canvas workspace when you enter the
// Build or Retainer station. Search is the launchpad: find a client, then act on it
// without ever leaving. Staff-only; mounted preview-aware by the dashboard layout.
//
// Design: the station rail is the throughline — a horizontal strip in compact mode,
// a vertical spine in expanded mode. Boldness lives in that morph; everything else
// stays quiet. All color flows through --space-* tokens so every theme comes for free.

type Station = 'search' | 'builder' | 'retainer'

const STATIONS: { id: Station; label: string; icon: typeof Search }[] = [
  { id: 'search',   label: 'Search',   icon: Search },
  { id: 'retainer', label: 'Retainer', icon: Clock },
  { id: 'builder',  label: 'Build',    icon: Package },
]

// ─── Search types + helpers (ported from GlobalSearchPalette) ───────────────────

type ResultItem =
  | { type: 'client';  data: SearchClient  }
  | { type: 'project'; data: SearchProject }
  | { type: 'sprint';  data: SearchSprint  }

const PROJECT_STATUS_LABEL: Record<string, string> = {
  pending:       'Pending',
  'in-progress': 'In Progress',
  'on-hold':     'On Hold',
  completed:     'Completed',
  cancelled:     'Cancelled',
  active:        'Active',
}

function matches(text: string | null | undefined, query: string): boolean {
  if (!text) return false
  return text.toLowerCase().includes(query.toLowerCase())
}

function buildResults(
  data: { clients: SearchClient[]; projects: SearchProject[]; sprints: SearchSprint[] } | null,
  query: string,
): ResultItem[] {
  if (!data || !query.trim()) return []
  const q = query.trim()
  const out: ResultItem[] = []
  for (const client of data.clients) {
    if (matches(client.name, q) || matches(client.email, q) || matches(client.company, q))
      out.push({ type: 'client', data: client })
  }
  for (const project of data.projects) {
    if (matches(project.name, q) || matches(project.clientName, q) || matches(project.description, q))
      out.push({ type: 'project', data: project })
  }
  for (const sprint of data.sprints) {
    if (matches(sprint.name, q) || matches(sprint.projectName, q) || matches(sprint.clientName, q) || matches(sprint.description, q))
      out.push({ type: 'sprint', data: sprint })
  }
  return out
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface CommandConsoleProps {
  username: string
}

export function CommandConsole({ username }: CommandConsoleProps) {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [isOpen,  setIsOpen]  = useState(false)
  const [station, setStation] = useState<Station>('search')

  // Which heavy stations have been opened at least once. Once visited they stay
  // mounted (hidden) so in-progress build/retainer state survives station switches.
  const [visited, setVisited] = useState<{ builder: boolean; retainer: boolean }>({ builder: false, retainer: false })

  // Client the Build/Retainer stations are scoped to when launched from a search
  // result ("Build for Acme"). Changing it remounts that station on a fresh client.
  const [launchClientId, setLaunchClientId] = useState<string | undefined>(undefined)

  // Search state
  const [query,       setQuery]       = useState('')
  const [data,        setData]        = useState<{ clients: SearchClient[]; projects: SearchProject[]; sprints: SearchSprint[] } | null>(null)
  const [isLoading,   setIsLoading]   = useState(false)
  const [fetchError,  setFetchError]  = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)

  const inputRef       = useRef<HTMLInputElement>(null)
  const listRef        = useRef<HTMLDivElement>(null)
  const dataLoadedRef  = useRef(false)
  const isOpenRef      = useRef(isOpen)
  const stationRef     = useRef(station)
  const selectedIdxRef = useRef(selectedIdx)
  const resultsRef     = useRef<ResultItem[]>([])

  isOpenRef.current      = isOpen
  stationRef.current     = station
  selectedIdxRef.current = selectedIdx

  const expanded = station !== 'search'

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll only while the expanded workspace is up. The compact command
  // bar is an overlay you dismiss in a keystroke — it needn't seize the scroll.
  useEffect(() => {
    if (!isOpen || !expanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen, expanded])

  // ── Data loading ──────────────────────────────────────────────────────────────

  const loadData = async () => {
    if (dataLoadedRef.current) return
    dataLoadedRef.current = true
    setIsLoading(true)
    setFetchError(null)
    const result = await fetchSearchData()
    setIsLoading(false)
    if (result.success && result.data) {
      setData(result.data)
    } else {
      setFetchError(result.error ?? 'Failed to load')
      dataLoadedRef.current = false
    }
  }

  // ── Open / close / navigate ─────────────────────────────────────────────────────

  const openConsole = (target: Station = 'search') => {
    setIsOpen(true)
    setStation(target)
    if (target !== 'search') setVisited((v) => ({ ...v, [target]: true }))
    loadData()
    if (target === 'search') setTimeout(() => inputRef.current?.focus(), 40)
  }

  const closeConsole = () => {
    setIsOpen(false)
    setStation('search')
    setQuery('')
    setSelectedIdx(0)
    setLaunchClientId(undefined)
  }

  const goStation = (target: Station, clientId?: string) => {
    if (target !== 'search') setVisited((v) => ({ ...v, [target]: true }))
    if (clientId !== undefined) setLaunchClientId(clientId)
    setStation(target)
    if (target === 'search') setTimeout(() => inputRef.current?.focus(), 40)
  }

  // ── Event listeners ─────────────────────────────────────────────────────────────

  // External triggers: mobile nav "Search" button, and any future "open builder".
  useEffect(() => {
    const onSearch = () => (isOpenRef.current ? goStation('search') : openConsole('search'))
    const onBuilder = () => openConsole('builder')
    document.addEventListener('orcaclub:open-search', onSearch)
    document.addEventListener('orcaclub:open-builder', onBuilder)
    return () => {
      document.removeEventListener('orcaclub:open-search', onSearch)
      document.removeEventListener('orcaclub:open-builder', onBuilder)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Global launch keys — L: search · K: build · ` : cycle stations. Ignored while typing.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        if (isOpenRef.current && stationRef.current === 'search') closeConsole()
        else if (isOpenRef.current) goStation('search')
        else openConsole('search')
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        if (isOpenRef.current) goStation('retainer')
        else openConsole('retainer')
      } else if (e.key === '`' && !isOpenRef.current) {
        // Backtick opens the console; cycling once open is handled below (fires even
        // while the search input is focused, which this global handler skips).
        e.preventDefault()
        openConsole(STATIONS[0].id)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // In-console keys — search: arrow/enter/esc. Station: esc collapses to search.
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      // Backtick cycles stations in rail order (search → retainer → build → …), from
      // any station — including while the search input is focused.
      if (e.key === '`' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const order = STATIONS.map((s) => s.id)
        const idx = order.indexOf(stationRef.current)
        goStation(order[(idx + 1) % order.length])
        return
      }
      if (stationRef.current !== 'search') {
        if (e.key === 'Escape') { e.preventDefault(); goStation('search') }
        return
      }
      const results = resultsRef.current
      switch (e.key) {
        case 'Escape':
          e.preventDefault(); closeConsole(); break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIdx((i) => { const n = Math.min(results.length - 1, i + 1); selectedIdxRef.current = n; return n })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIdx((i) => { const n = Math.max(0, i - 1); selectedIdxRef.current = n; return n })
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIdxRef.current]) navigateToResult(results[selectedIdxRef.current])
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  useEffect(() => { setSelectedIdx(0) }, [query])

  // ── Results ─────────────────────────────────────────────────────────────────────

  const results = buildResults(data, query)
  resultsRef.current = results

  const navigateToResult = (item: ResultItem) => {
    closeConsole()
    if (item.type === 'client')        router.push(`/u/${username}/clients/${item.data.id}`)
    else if (item.type === 'project')  router.push(`/u/${username}/projects/${item.data.id}`)
    else                               router.push(`/u/${username}/projects/${item.data.projectId}?tab=sprints`)
  }

  const clientResults  = results.filter((r): r is { type: 'client';  data: SearchClient  } => r.type === 'client')
  const projectResults = results.filter((r): r is { type: 'project'; data: SearchProject } => r.type === 'project')
  const sprintResults  = results.filter((r): r is { type: 'sprint';  data: SearchSprint  } => r.type === 'sprint')

  const totalClients  = data?.clients.length  ?? 0
  const totalProjects = data?.projects.length ?? 0
  const totalSprints  = data?.sprints.length  ?? 0

  let globalIdx = 0

  // Build station closes the whole console on save (id present), or drops back to
  // search on cancel — never a dead end, and never a lost draft on a stray click.
  const onBuilderClose = (createdId?: string) => {
    if (createdId) { closeConsole(); router.refresh() }
    else goStation('search')
  }

  if (!mounted) return null

  // ── Floating summon (staff-only mount handled by the layout) ─────────────────────

  const fab = !isOpen && (
    <button
      onClick={() => openConsole('search')}
      aria-label="Open command console"
      className={cn(
        'print:hidden fixed bottom-28 right-4 md:bottom-8 md:right-8 z-[53] size-14 md:size-16 rounded-2xl',
        'bg-[var(--space-accent)] text-black shadow-2xl shadow-[#000000]/40',
        'hover:scale-105 active:scale-95 transition-transform duration-300 flex items-center justify-center group',
      )}
    >
      <Command className="size-6 md:size-7 group-hover:scale-110 transition-transform" />
    </button>
  )

  const overlay = isOpen && (
    <div className="fixed inset-0 z-[70] print:hidden">
      {/* Backdrop — click collapses a workspace to search, or dismisses the bar */}
      <div
        className="absolute inset-0 animate-in fade-in duration-150"
        style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }}
        onClick={() => (expanded ? goStation('search') : closeConsole())}
      />

      {/* Morphing panel — grows from a centered bar to a near-full workspace */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 w-full px-3 transition-[max-width,top,bottom] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          expanded
            ? 'top-3 bottom-3 max-w-[1360px]'
            : 'top-[9vh] max-w-[600px]',
        )}
      >
        <div
          className={cn(
            'flex overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)]',
            expanded ? 'h-full flex-row' : 'flex-col max-h-[74vh]',
          )}
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Vertical station spine (expanded only) ── */}
          {expanded && (
            <aside
              className="shrink-0 w-[76px] flex flex-col items-center gap-1 py-3 border-r border-[var(--space-border-hard)]"
              style={{ background: 'rgba(0,0,0,0.14)' }}
            >
              {STATIONS.map((s) => (
                <RailButton
                  key={s.id}
                  icon={s.icon}
                  label={s.label}
                  active={station === s.id}
                  onClick={() => goStation(s.id)}
                />
              ))}
              <div className="mt-auto" />
              <RailButton icon={X} label="Close" active={false} onClick={closeConsole} />
            </aside>
          )}

          {/* ── Content column ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">

            {/* Compact search chrome — only in the bar */}
            {!expanded && (
              <>
                {/* Input row */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--space-border-hard)]">
                  <div
                    className="size-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--space-accent-soft)', border: '1px solid var(--space-accent-glow)' }}
                  >
                    {isLoading
                      ? <Loader2 className="size-3.5 animate-spin" style={{ color: 'var(--space-accent)' }} />
                      : <Search className="size-3.5" style={{ color: 'var(--space-accent)' }} />}
                  </div>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search clients, projects, sprints…"
                    className="flex-1 bg-transparent text-[var(--space-text-primary)] text-sm placeholder:text-[var(--space-text-muted)] outline-none"
                  />
                  {query ? (
                    <button
                      onClick={() => { setQuery(''); inputRef.current?.focus() }}
                      className="size-5 rounded flex items-center justify-center text-[var(--space-text-tertiary)] hover:text-[var(--space-text-secondary)] transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline text-[10px] text-[var(--space-text-muted)] bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] rounded px-1.5 py-0.5 font-mono tracking-wide">
                      L
                    </kbd>
                  )}
                </div>

                {/* Horizontal station strip */}
                <div className="flex items-center gap-1 px-2.5 py-2 border-b border-[var(--space-border-hard)]">
                  {STATIONS.map((s) => {
                    const Icon = s.icon
                    const active = station === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => (active ? inputRef.current?.focus() : goStation(s.id))}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          active
                            ? 'text-[var(--space-accent)]'
                            : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-base)]',
                        )}
                        style={active ? { background: 'var(--space-accent-soft)' } : undefined}
                      >
                        <Icon className="size-3.5" />
                        {s.label}
                      </button>
                    )
                  })}
                </div>

                {/* Body */}
                <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto">
                  {fetchError && (
                    <div className="px-5 py-10 text-center space-y-3">
                      <p className="text-sm text-red-400/70">{fetchError}</p>
                      <button
                        onClick={() => { dataLoadedRef.current = false; loadData() }}
                        className="text-xs text-[var(--space-text-tertiary)] hover:text-[var(--space-text-secondary)] transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {!fetchError && isLoading && (
                    <div className="px-5 py-12 flex flex-col items-center gap-3">
                      <Loader2 className="size-4 text-[var(--space-text-muted)] animate-spin" />
                      <p className="text-xs text-[var(--space-text-muted)]">Loading workspace…</p>
                    </div>
                  )}

                  {/* Empty query — workspace overview + launchpad */}
                  {!fetchError && !isLoading && !query.trim() && (
                    <div className="px-4 py-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { icon: Building2,    count: totalClients,  label: 'client' },
                          { icon: FolderKanban, count: totalProjects, label: 'project' },
                          { icon: Zap,          count: totalSprints,  label: 'sprint' },
                        ].map(({ icon: Icon, count, label }) => (
                          <div
                            key={label}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                            style={{ background: 'var(--space-bg-base)', border: '1px solid var(--space-border-hard)' }}
                          >
                            <Icon className="size-3.5 shrink-0" style={{ color: 'var(--space-accent-dim)' }} />
                            <div>
                              <p className="text-sm font-semibold text-[var(--space-text-primary)] tabular-nums leading-none">
                                {data ? count : '—'}
                              </p>
                              <p className="text-[9px] text-[var(--space-text-muted)] mt-0.5">
                                {label}{count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] tracking-[0.4em] uppercase text-[var(--space-text-muted)] font-semibold px-1">
                          Jump to a tool
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <LaunchCard icon={Clock}   title="Retainer"        hint="Log hours"        onClick={() => goStation('retainer', undefined)} />
                          <LaunchCard icon={Package} title="Package Builder" hint="Draft a proposal" onClick={() => goStation('builder', undefined)} />
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--space-text-muted)] px-1 leading-relaxed">
                        Start typing to search — then build or open a retainer for any client.
                      </p>
                    </div>
                  )}

                  {!fetchError && !isLoading && query.trim() && results.length === 0 && (
                    <div className="px-5 py-12 text-center">
                      <p className="text-sm text-[var(--space-text-muted)]">
                        No results for{' '}
                        <span className="font-mono text-[var(--space-text-secondary)]">&ldquo;{query}&rdquo;</span>
                      </p>
                    </div>
                  )}

                  {!fetchError && !isLoading && results.length > 0 && (
                    <div className="py-1.5">
                      {clientResults.length > 0 && (
                        <ResultGroup icon={Building2} label="Clients" count={clientResults.length}>
                          {clientResults.map((item) => {
                            const idx = globalIdx++
                            return (
                              <ResultRow
                                key={item.data.id}
                                idx={idx}
                                isSelected={idx === selectedIdx}
                                icon={Building2}
                                primary={item.data.name}
                                secondary={[item.data.company, item.data.email].filter(Boolean).join(' · ')}
                                onClick={() => navigateToResult(item)}
                                actions={[
                                  { icon: Clock,   title: 'Retainer', onClick: () => goStation('retainer', item.data.id) },
                                  { icon: Package, title: 'Build', onClick: () => goStation('builder', item.data.id) },
                                ]}
                              />
                            )
                          })}
                        </ResultGroup>
                      )}

                      {projectResults.length > 0 && (
                        <ResultGroup icon={FolderKanban} label="Projects" count={projectResults.length} divided={clientResults.length > 0}>
                          {projectResults.map((item) => {
                            const idx = globalIdx++
                            return (
                              <ResultRow
                                key={item.data.id}
                                idx={idx}
                                isSelected={idx === selectedIdx}
                                icon={FolderKanban}
                                primary={item.data.name}
                                secondary={[item.data.clientName, PROJECT_STATUS_LABEL[item.data.status] ?? item.data.status].filter(Boolean).join(' · ')}
                                onClick={() => navigateToResult(item)}
                              />
                            )
                          })}
                        </ResultGroup>
                      )}

                      {sprintResults.length > 0 && (
                        <ResultGroup icon={Zap} label="Sprints" count={sprintResults.length} divided={clientResults.length > 0 || projectResults.length > 0}>
                          {sprintResults.map((item) => {
                            const idx = globalIdx++
                            return (
                              <ResultRow
                                key={item.data.id}
                                idx={idx}
                                isSelected={idx === selectedIdx}
                                icon={Zap}
                                primary={item.data.name}
                                secondary={[item.data.projectName, item.data.clientName].filter(Boolean).join(' · ')}
                                onClick={() => navigateToResult(item)}
                              />
                            )
                          })}
                        </ResultGroup>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer — keyboard hints */}
                <div className="px-4 py-2.5 border-t border-[var(--space-border-hard)] flex items-center gap-4">
                  {[
                    { key: '↑↓', label: 'navigate' },
                    { key: '↵',  label: 'open'     },
                    { key: 'K',  label: 'retainer' },
                    { key: 'esc', label: 'close'   },
                  ].map(({ key, label }) => (
                    <span key={key} className="flex items-center gap-1.5 text-[10px] text-[var(--space-text-muted)]">
                      <kbd className="font-mono text-[var(--space-text-tertiary)] bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] rounded px-1.5 py-0.5">
                        {key}
                      </kbd>
                      {label}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Expanded station header + bodies — kept mounted (hidden) to hold state */}
            {expanded && (
              <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 border-b border-[var(--space-border-hard)] shrink-0" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <span className="text-sm font-semibold text-[var(--space-text-primary)]">
                  {station === 'builder' ? 'Package Builder' : 'Retainer'}
                </span>
                <button
                  onClick={() => goStation('search')}
                  className="flex items-center gap-1.5 text-[11px] text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] transition-colors"
                >
                  <CornerDownLeft className="size-3" />
                  Back to search
                </button>
                <button
                  onClick={closeConsole}
                  aria-label="Close"
                  className="ml-auto shrink-0 size-8 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Station bodies — mounted once visited; visibility toggled by station */}
            {(visited.builder || visited.retainer) && (
              <div className={cn('flex-1 min-h-0', expanded ? 'block' : 'hidden')}>
                {visited.builder && (
                  <div className={cn('h-full min-h-0', station === 'builder' ? 'block' : 'hidden')}>
                    <PackageBuilderTab
                      key={`builder-${launchClientId ?? 'blank'}`}
                      mode="create"
                      username={username}
                      clientId={launchClientId}
                      onClose={onBuilderClose}
                    />
                  </div>
                )}
                {visited.retainer && (
                  <div className={cn('h-full min-h-0', station === 'retainer' ? 'block' : 'hidden')}>
                    <RetainerTab
                      key={`retainer-${launchClientId ?? 'blank'}`}
                      clientId={launchClientId}
                      active={station === 'retainer'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(<>{fab}{overlay}</>, document.body)
}

// ─── Sub-components ───────────────────────────────────────────────────────────────

function RailButton({
  icon: Icon, label, active, onClick,
}: { icon: typeof Search; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-[60px] flex flex-col items-center gap-1 py-2 rounded-xl transition-colors group',
        active ? 'text-[var(--space-accent)]' : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-base)]',
      )}
      style={active ? { background: 'var(--space-accent-soft)' } : undefined}
    >
      <Icon className="size-4" />
      <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  )
}

function LaunchCard({
  icon: Icon, title, hint, onClick,
}: { icon: typeof Search; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:border-[var(--space-accent-glow)]"
      style={{ background: 'var(--space-bg-base)', border: '1px solid var(--space-border-hard)' }}
    >
      <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
        <Icon className="size-4" style={{ color: 'var(--space-accent)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--space-text-primary)] leading-tight">{title}</p>
        <p className="text-[10px] text-[var(--space-text-muted)] mt-0.5">{hint}</p>
      </div>
      <ArrowRight className="ml-auto size-3.5 shrink-0 text-[var(--space-text-muted)] opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" />
    </button>
  )
}

function ResultGroup({
  icon: Icon, label, count, divided, children,
}: { icon: typeof Search; label: string; count: number; divided?: boolean; children: React.ReactNode }) {
  return (
    <div className={divided ? 'mt-1 border-t border-[var(--space-border-hard)]' : ''}>
      <div className="flex items-center gap-2 px-4 py-2 mt-1">
        <Icon className="size-2.5 text-[var(--space-text-muted)]" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[var(--space-text-muted)]">{label}</span>
        <span className="ml-auto text-[9px] text-[var(--space-text-muted)] tabular-nums">{count}</span>
      </div>
      {children}
    </div>
  )
}

function ResultRow({
  idx, isSelected, icon: Icon, primary, secondary, onClick, actions,
}: {
  idx: number
  isSelected: boolean
  icon: React.ComponentType<{ className?: string }>
  primary: string
  secondary: string
  onClick: () => void
  actions?: { icon: typeof Search; title: string; onClick: () => void }[]
}) {
  return (
    <div
      data-idx={idx}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-100 group relative',
        isSelected ? 'bg-[var(--space-bg-card-hover)]' : 'hover:bg-[var(--space-bg-base)]',
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full" style={{ background: 'var(--space-accent)', opacity: 0.7 }} />
      )}
      <button type="button" onClick={onClick} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        <Icon className={cn('size-3.5 shrink-0 transition-colors', isSelected ? 'text-[var(--space-accent)]' : 'text-[var(--space-text-muted)]')} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm truncate transition-colors', isSelected ? 'text-[var(--space-text-primary)] font-medium' : 'text-[var(--space-text-secondary)] group-hover:text-[var(--space-text-primary)]')}>
            {primary}
          </p>
          {secondary && (
            <p className="text-[11px] truncate text-[var(--space-text-muted)]">{secondary}</p>
          )}
        </div>
      </button>

      {/* Quick actions — the launchpad: act on this client without leaving */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          {actions.map((a) => {
            const AIcon = a.icon
            return (
              <button
                key={a.title}
                type="button"
                onClick={a.onClick}
                title={a.title}
                aria-label={a.title}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--space-text-muted)] hover:text-[var(--space-accent)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                style={{ background: 'var(--space-bg-base)' }}
              >
                <AIcon className="size-3" />
                <span className="hidden sm:inline">{a.title}</span>
              </button>
            )
          })}
        </div>
      )}

      {!actions && (
        <ArrowRight
          className={cn(
            'size-3 shrink-0 transition-all',
            isSelected ? 'opacity-60' : 'opacity-0 group-hover:opacity-40',
          )}
          style={{ color: isSelected ? 'var(--space-accent)' : 'var(--space-text-muted)' }}
        />
      )}
    </div>
  )
}

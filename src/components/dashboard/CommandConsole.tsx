'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Search, X, Building2, FolderKanban, Zap, Loader2, ArrowRight,
  Package, Clock, Command, CornerDownLeft, Milestone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isTypingTarget } from '@/lib/keyboard'
import { fetchSearchData } from '@/actions/search'
import type {
  SearchClient, SearchProject, SearchSprint, SearchPackage, SearchData,
} from '@/actions/search'
import {
  tokenize, scoreFields, highlightSegments, type SearchField,
} from '@/lib/dashboard/search-ranking'
import { PackageBuilderTab } from './PackageBuilderTab'
import { RetainerTab } from './RetainerTab'
import { MilestonesTab } from './MilestonesTab'

// ─── The Console ────────────────────────────────────────────────────────────────
// One surface, three stations. Summoned once (⌘/L), it opens *search-first* — a
// compact command bar — and morphs into a full-canvas workspace when you enter the
// Build or Retainer station. Search is the launchpad: find a client, then act on it
// without ever leaving. Staff-only; mounted preview-aware by the dashboard layout.
//
// Design: the station rail is the throughline — a horizontal strip in compact mode,
// a vertical spine in expanded mode. Boldness lives in that morph; everything else
// stays quiet. All color flows through --space-* tokens so every theme comes for free.

type Station = 'search' | 'builder' | 'retainer' | 'milestones'

const STATIONS: { id: Station; label: string; icon: typeof Search }[] = [
  { id: 'search',     label: 'Search',     icon: Search },
  { id: 'retainer',   label: 'Retainer',   icon: Clock },
  { id: 'milestones', label: 'Milestones', icon: Milestone },
  { id: 'builder',    label: 'Build',      icon: Package },
]

// ─── Search types + helpers (ported from GlobalSearchPalette) ───────────────────

type ResultKind = 'client' | 'project' | 'package' | 'sprint'

type ResultItem =
  | { type: 'client';  data: SearchClient  }
  | { type: 'project'; data: SearchProject }
  | { type: 'package'; data: SearchPackage }
  | { type: 'sprint';  data: SearchSprint  }

/** A scored result plus the field keys that carried the query. */
type RankedItem = ResultItem & { score: number; matchedKeys: string[] }

interface ResultGroupData {
  kind: ResultKind
  label: string
  icon: typeof Search
  items: RankedItem[]
  /** Matches before the per-group cap, so the row can say "+N more". */
  total: number
  best: number
}

const PROJECT_STATUS_LABEL: Record<string, string> = {
  pending:       'Pending',
  'in-progress': 'In Progress',
  'on-hold':     'On Hold',
  completed:     'Completed',
  cancelled:     'Cancelled',
  active:        'Active',
}

// Enough to answer the query without turning arrow-key nav into a marathon.
// Before this, a one-character query rendered every one of up to 1500 records.
const GROUP_LIMIT = 6

const GROUP_META: Record<ResultKind, { label: string; icon: typeof Search }> = {
  client:  { label: 'Clients',  icon: Building2    },
  project: { label: 'Projects', icon: FolderKanban },
  package: { label: 'Packages', icon: Package      },
  sprint:  { label: 'Sprints',  icon: Zap          },
}

function money(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

/** The headline price for a proposal — one-time if there is one, else the recurring rate. */
function packagePrice(p: SearchPackage): string | null {
  if (p.oneTime > 0) return money(p.oneTime)
  if (p.monthly > 0) return `${money(p.monthly)}/mo`
  if (p.annual > 0)  return `${money(p.annual)}/yr`
  return null
}

/**
 * Score every record, drop the misses, cap each group, then order the groups by
 * their strongest hit — so whichever type actually answers the query leads,
 * rather than clients always winning by virtue of being fetched first.
 */
function buildGroups(data: SearchData | null, query: string): ResultGroupData[] {
  const tokens = tokenize(query)
  if (!data || tokens.length === 0) return []

  const collect = <T,>(
    kind: ResultKind,
    rows: T[],
    fields: (row: T) => SearchField[],
    wrap: (row: T) => ResultItem,
  ): ResultGroupData | null => {
    const scored: RankedItem[] = []
    for (const row of rows) {
      const match = scoreFields(fields(row), tokens)
      if (!match) continue
      scored.push({ ...wrap(row), score: match.score, matchedKeys: match.matchedKeys })
    }
    if (scored.length === 0) return null
    scored.sort((a, b) => b.score - a.score)
    return {
      kind,
      label: GROUP_META[kind].label,
      icon: GROUP_META[kind].icon,
      items: scored.slice(0, GROUP_LIMIT),
      total: scored.length,
      best: scored[0].score,
    }
  }

  const groups = [
    collect<SearchClient>('client', data.clients, (c) => [
      { key: 'name',    label: 'name',    value: c.name,    weight: 10 },
      { key: 'company', label: 'company', value: c.company, weight: 6  },
      { key: 'email',   label: 'email',   value: c.email,   weight: 4  },
    ], (c) => ({ type: 'client', data: c })),

    collect<SearchProject>('project', data.projects, (p) => [
      { key: 'name',        label: 'name',        value: p.name,        weight: 10 },
      { key: 'clientName',  label: 'client',      value: p.clientName,  weight: 6  },
      { key: 'description', label: 'description', value: p.description, weight: 2  },
    ], (p) => ({ type: 'project', data: p })),

    collect<SearchPackage>('package', data.packages ?? [], (p) => [
      { key: 'name',        label: 'name',        value: p.name,        weight: 10 },
      { key: 'clientName',  label: 'client',      value: p.clientName,  weight: 6  },
      { key: 'status',      label: 'status',      value: p.status,      weight: 3  },
      { key: 'description', label: 'description', value: p.description, weight: 2  },
    ], (p) => ({ type: 'package', data: p })),

    collect<SearchSprint>('sprint', data.sprints, (s) => [
      { key: 'name',        label: 'name',        value: s.name,        weight: 10 },
      { key: 'projectName', label: 'project',     value: s.projectName, weight: 6  },
      { key: 'clientName',  label: 'client',      value: s.clientName,  weight: 5  },
      { key: 'description', label: 'description', value: s.description, weight: 2  },
    ], (s) => ({ type: 'sprint', data: s })),
  ].filter((g): g is ResultGroupData => g !== null)

  groups.sort((a, b) => b.best - a.best)
  return groups
}

/**
 * When the query landed somewhere the row doesn't already show — a description,
 * an email — name that field, so a result never looks like it matched nothing.
 */
function matchNote(matchedKeys: string[], shownKeys: string[]): string | null {
  const hidden = matchedKeys.filter((k) => !shownKeys.includes(k))
  if (hidden.length === 0) return null
  return `matched ${hidden.join(' · ')}`
}

/** The text a result row shows, plus a note when the hit was somewhere unseen. */
function rowContent(item: RankedItem): {
  primary: string
  secondary: string
  meta?: string
  note?: string | null
} {
  switch (item.type) {
    case 'client':
      return {
        primary: item.data.name,
        secondary: [item.data.company, item.data.email].filter(Boolean).join(' · '),
        note: matchNote(item.matchedKeys, ['name', 'company', 'email']),
      }
    case 'project':
      return {
        primary: item.data.name,
        secondary: [
          item.data.clientName,
          PROJECT_STATUS_LABEL[item.data.status] ?? item.data.status,
        ].filter(Boolean).join(' · '),
        note: matchNote(item.matchedKeys, ['name', 'clientName', 'status']),
      }
    case 'package':
      return {
        primary: item.data.name,
        secondary: [item.data.clientName, item.data.status].filter(Boolean).join(' · '),
        meta: packagePrice(item.data) ?? undefined,
        note: matchNote(item.matchedKeys, ['name', 'clientName', 'status']),
      }
    case 'sprint':
      return {
        primary: item.data.name,
        secondary: [item.data.projectName, item.data.clientName].filter(Boolean).join(' · '),
        note: matchNote(item.matchedKeys, ['name', 'projectName', 'clientName']),
      }
  }
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
  const [visited, setVisited] = useState<{ builder: boolean; retainer: boolean; milestones: boolean }>({ builder: false, retainer: false, milestones: false })

  // Client the Build/Retainer stations are scoped to when launched from a search
  // result ("Build for Acme"). Changing it remounts that station on a fresh client.
  const [launchClientId, setLaunchClientId] = useState<string | undefined>(undefined)

  // Deep-link target for the Milestones station — set by a scheduled-payment row
  // (see the `orcaclub:open-milestones` listener below), cleared on close.
  const [milestoneTarget, setMilestoneTarget] = useState<{ packageId: string; entryId?: string | null } | null>(null)

  // Search state
  const [query,       setQuery]       = useState('')
  const [data,        setData]        = useState<SearchData | null>(null)
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

  // Serve whatever is cached immediately, then refresh in the background on every
  // open. The console is mounted by the dashboard layout and lives for the whole
  // session, so a load-once cache meant a package built in the Build station was
  // unfindable until a full reload. Only the first, empty load shows a spinner.
  const inFlightRef = useRef(false)

  const loadData = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    const isFirstLoad = !dataLoadedRef.current
    if (isFirstLoad) setIsLoading(true)
    setFetchError(null)
    const result = await fetchSearchData()
    inFlightRef.current = false
    if (isFirstLoad) setIsLoading(false)
    if (result.success && result.data) {
      dataLoadedRef.current = true
      setData(result.data)
    } else if (isFirstLoad) {
      setFetchError(result.error ?? 'Failed to load')
    }
    // A failed *refresh* keeps the cached list on screen rather than blanking it.
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
    // Drop the deep-link target so a later manual open starts on the portfolio board.
    setMilestoneTarget(null)
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

  // Deep link into the Milestones station. Two callers: a scheduled-payment row,
  // which names an entry and lands on the recap/Documents stage; and a freshly built
  // proposal handed over from Build, which has no schedule yet and just opens the
  // package. A missing packageId is still ignored — it would strand the station on
  // nothing to load.
  useEffect(() => {
    const onOpenMilestones = (e: Event) => {
      const detail = (e as CustomEvent).detail as { packageId?: string; entryId?: string } | undefined
      if (!detail?.packageId) return
      setMilestoneTarget({ packageId: detail.packageId, entryId: detail.entryId ?? null })
      if (isOpenRef.current) goStation('milestones')
      else openConsole('milestones')
    }
    window.addEventListener('orcaclub:open-milestones', onOpenMilestones)
    return () => window.removeEventListener('orcaclub:open-milestones', onOpenMilestones)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Global launch keys — L: search · K: retainer · M: milestones · ` : cycle stations.
  // Ignored while typing.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        if (isOpenRef.current && stationRef.current === 'search') closeConsole()
        else if (isOpenRef.current) goStation('search')
        else openConsole('search')
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        if (isOpenRef.current) goStation('retainer')
        else openConsole('retainer')
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        if (isOpenRef.current) goStation('milestones')
        else openConsole('milestones')
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
      // any station — including while the search input is focused. Build is the one
      // exception: there the key opens the service editor (PackageBuilderTab claims it
      // in the capture phase), so leave that station by the rail or Esc.
      if (e.key === '`' && !e.metaKey && !e.ctrlKey && !e.altKey && stationRef.current !== 'builder') {
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

  const tokens = useMemo(() => tokenize(query), [query])
  const groups = useMemo(() => buildGroups(data, query), [data, query])
  // Flat, in render order — this is what the arrow keys walk.
  const results = useMemo(() => groups.flatMap((g) => g.items), [groups])
  resultsRef.current = results

  const navigateToResult = (item: ResultItem) => {
    closeConsole()
    if (item.type === 'client') {
      router.push(`/u/${username}/clients/${item.data.id}`)
    } else if (item.type === 'project') {
      router.push(`/u/${username}/projects/${item.data.id}`)
    } else if (item.type === 'package') {
      // The detail page lives under the owning client; a proposal with no client
      // has nowhere to land there, so fall back to the printable document.
      router.push(
        item.data.clientId
          ? `/u/${username}/clients/${item.data.clientId}/packages/${item.data.id}`
          : `/u/${username}/packages/${item.data.id}/print`,
      )
    } else {
      router.push(`/u/${username}/projects/${item.data.projectId}?tab=sprints`)
    }
  }

  const totalClients  = data?.clients.length  ?? 0
  const totalProjects = data?.projects.length ?? 0
  const totalSprints  = data?.sprints.length  ?? 0
  const totalPackages = data?.packages?.length ?? 0

  // Walks the flattened render order so arrow-key selection and the rendered
  // rows agree on an index. Reset every render.
  let flatIdx = 0

  // Build station hands the saved proposal to Milestones (id present), or drops back
  // to search on cancel — never a dead end, and never a lost draft on a stray click.
  //
  // It used to close the console outright. That was a dead end for the thing staff
  // actually do next: a fresh proposal is a scope, and planning work against it,
  // pricing the schedule, and sending it all live one station over. Milestones now
  // lists drafts, and its deep-link effect lands an entry-less target on Overview.
  const onBuilderClose = (createdId?: string) => {
    if (createdId) {
      setMilestoneTarget({ packageId: createdId, entryId: null })
      goStation('milestones')
      router.refresh()
    } else goStation('search')
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
    <div className="fixed inset-0 z-[70] print:hidden" role="dialog" aria-modal="true">
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
            ? 'top-3 bottom-3 max-w-[85rem]'
            : 'top-[9vh] max-w-[37.5rem]',
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
              className="shrink-0 w-[4.75rem] flex flex-col items-center gap-1 py-3 border-r border-[var(--space-border-hard)]"
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
                <div className="flex items-center gap-3 px-5 py-4">
                  {isLoading
                    ? <Loader2 className="size-4 shrink-0 animate-spin text-[var(--space-text-muted)]" />
                    : <Search className="size-4 shrink-0 text-[var(--space-text-muted)]" />}
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search clients, projects, packages, sprints…"
                    role="combobox"
                    aria-expanded={results.length > 0}
                    aria-controls="command-console-results"
                    aria-activedescendant={results.length > 0 ? `command-result-${selectedIdx}` : undefined}
                    aria-autocomplete="list"
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 bg-transparent text-[var(--space-text-primary)] text-[0.9375rem] placeholder:text-[var(--space-text-muted)] outline-none"
                  />
                  {query ? (
                    <button
                      onClick={() => { setQuery(''); inputRef.current?.focus() }}
                      className="size-5 rounded flex items-center justify-center text-[var(--space-text-tertiary)] hover:text-[var(--space-text-secondary)] transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline text-[0.625rem] text-[var(--space-text-muted)] bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] rounded px-1.5 py-0.5 font-mono tracking-wide">
                      L
                    </kbd>
                  )}
                </div>

                {/* Horizontal station strip */}
                <div className="flex items-center gap-1 px-3.5 pb-2.5 border-b border-[var(--space-border-hard)]">
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

                  {/* Empty query — the workspace at a glance.
                      Borderless numbers in the dashboard-home stat idiom, and
                      nothing else: the station strip directly above already
                      offers Retainer / Milestones / Build, so the launch cards
                      that used to sit here were a second copy of the same three
                      destinations — and the hint below them just restated the
                      placeholder. Both are gone; the panel now sizes to its
                      content instead of scrolling. */}
                  {!fetchError && !isLoading && !query.trim() && (
                    <div className="px-5 py-7">
                      <div className="flex items-start gap-8 sm:gap-10 flex-wrap">
                        {[
                          { count: totalClients,  label: 'clients'  },
                          { count: totalProjects, label: 'projects' },
                          { count: totalPackages, label: 'packages' },
                          { count: totalSprints,  label: 'sprints'  },
                        ].map(({ count, label }) => (
                          <div key={label}>
                            <p className="text-2xl font-bold text-[var(--space-text-primary)] tabular-nums tracking-tight leading-none">
                              {data ? count : '—'}
                            </p>
                            <p className="text-[0.5625rem] text-[var(--space-text-muted)] mt-1.5 uppercase tracking-[0.2em]">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!fetchError && !isLoading && query.trim() && results.length === 0 && (
                    <div className="px-5 py-14 text-center">
                      <p className="text-sm text-[var(--space-text-muted)]">
                        No results for{' '}
                        <span className="font-mono text-[var(--space-text-secondary)]">&ldquo;{query}&rdquo;</span>
                      </p>
                    </div>
                  )}

                  {!fetchError && !isLoading && groups.length > 0 && (
                    <div
                      id="command-console-results"
                      role="listbox"
                      aria-label="Search results"
                      className="py-2 space-y-4"
                    >
                      {groups.map((group) => (
                        <div key={group.kind}>
                          <div className="flex items-center gap-3 px-5 pb-2">
                            <div className="w-px h-3.5 rounded-full shrink-0" style={{ background: 'var(--space-accent)', opacity: 0.4 }} />
                            <h3 className="text-xs font-semibold text-[var(--space-text-primary)]">{group.label}</h3>
                            <span className="ml-auto text-[0.625rem] text-[var(--space-text-muted)] tabular-nums">
                              {group.total}
                            </span>
                          </div>

                          {group.items.map((item) => {
                            const idx = flatIdx++
                            return (
                              <ResultRow
                                key={`${group.kind}-${item.data.id}`}
                                idx={idx}
                                isSelected={idx === selectedIdx}
                                icon={group.icon}
                                tokens={tokens}
                                {...rowContent(item)}
                                onClick={() => navigateToResult(item)}
                                actions={
                                  item.type === 'client'
                                    ? [
                                        { icon: Clock,     title: 'Retainer',   onClick: () => goStation('retainer', item.data.id) },
                                        { icon: Milestone, title: 'Milestones', onClick: () => goStation('milestones', item.data.id) },
                                        { icon: Package,   title: 'Build',      onClick: () => goStation('builder', item.data.id) },
                                      ]
                                    : undefined
                                }
                              />
                            )
                          })}

                          {group.total > group.items.length && (
                            <p className="px-5 pt-2 text-[0.625rem] text-[var(--space-text-muted)]">
                              +{group.total - group.items.length} more {group.label.toLowerCase()} — keep typing to narrow
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer — keyboard hints */}
                <div className="px-5 py-3 border-t border-[var(--space-border-hard)] flex items-center gap-4">
                  {[
                    { key: '↑↓',  label: 'navigate' },
                    { key: '↵',   label: 'open'     },
                    { key: '`',   label: 'stations' },
                    { key: 'esc', label: 'close'    },
                  ].map(({ key, label }) => (
                    <span key={key} className="flex items-center gap-1.5 text-[0.625rem] text-[var(--space-text-muted)]">
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
                  {station === 'builder' ? 'Package Builder' : station === 'milestones' ? 'Milestones' : 'Retainer'}
                </span>
                <button
                  onClick={() => goStation('search')}
                  className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] transition-colors"
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
            {(visited.builder || visited.retainer || visited.milestones) && (
              <div className={cn('flex-1 min-h-0', expanded ? 'block' : 'hidden')}>
                {visited.builder && (
                  <div className={cn('h-full min-h-0', station === 'builder' ? 'block' : 'hidden')}>
                    <PackageBuilderTab
                      key={`builder-${launchClientId ?? 'blank'}`}
                      mode="create"
                      username={username}
                      clientId={launchClientId}
                      onClose={onBuilderClose}
                      active={station === 'builder'}
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
                {visited.milestones && (
                  <div className={cn('h-full min-h-0', station === 'milestones' ? 'block' : 'hidden')}>
                    <MilestonesTab
                      key={`milestones-${launchClientId ?? 'blank'}`}
                      clientId={launchClientId}
                      username={username}
                      initialTarget={milestoneTarget}
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
        'w-[3.75rem] flex flex-col items-center gap-1 py-2 rounded-xl transition-colors group',
        active ? 'text-[var(--space-accent)]' : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-base)]',
      )}
      style={active ? { background: 'var(--space-accent-soft)' } : undefined}
    >
      <Icon className="size-4" />
      <span className="text-[0.5625rem] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  )
}

/** Bolds the run of text the query matched, so a hit is visible at a glance. */
function Highlighted({ text, tokens }: { text: string; tokens: string[] }) {
  if (!text) return null
  return (
    <>
      {highlightSegments(text, tokens).map((seg, i) =>
        seg.hit ? (
          <mark
            key={i}
            className="bg-transparent font-semibold"
            style={{ color: 'var(--space-accent)' }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}

function ResultRow({
  idx, isSelected, icon: Icon, primary, secondary, meta, note, tokens, onClick, actions,
}: {
  idx: number
  isSelected: boolean
  icon: React.ComponentType<{ className?: string }>
  primary: string
  secondary: string
  meta?: string
  note?: string | null
  tokens: string[]
  onClick: () => void
  actions?: { icon: typeof Search; title: string; onClick: () => void }[]
}) {
  return (
    <div
      id={`command-result-${idx}`}
      data-idx={idx}
      role="option"
      aria-selected={isSelected}
      className={cn(
        'w-full flex items-center gap-3 px-5 py-2.5 transition-colors duration-100 group relative',
        isSelected ? 'bg-[var(--space-bg-card-hover)]' : 'hover:bg-[var(--space-bg-base)]',
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-1 bottom-1 w-[0.125rem] rounded-full" style={{ background: 'var(--space-accent)', opacity: 0.7 }} />
      )}
      <button type="button" onClick={onClick} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        <Icon className={cn('size-3.5 shrink-0 transition-colors', isSelected ? 'text-[var(--space-accent)]' : 'text-[var(--space-text-muted)]')} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm truncate transition-colors', isSelected ? 'text-[var(--space-text-primary)] font-medium' : 'text-[var(--space-text-secondary)] group-hover:text-[var(--space-text-primary)]')}>
            <Highlighted text={primary} tokens={tokens} />
          </p>
          {secondary && (
            <p className="text-[0.6875rem] truncate text-[var(--space-text-muted)]">
              <Highlighted text={secondary} tokens={tokens} />
            </p>
          )}
          {note && (
            <p className="text-[0.625rem] truncate text-[var(--space-text-muted)] italic mt-0.5">{note}</p>
          )}
        </div>
      </button>

      {meta && (
        <span className="shrink-0 text-[0.6875rem] font-mono tabular-nums text-[var(--space-text-tertiary)]">
          {meta}
        </span>
      )}

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
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[0.625rem] font-medium text-[var(--space-text-muted)] hover:text-[var(--space-accent)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                style={{ background: 'var(--space-bg-base)' }}
              >
                <AIcon className="size-3" />
                <span className="hidden sm:inline">{a.title}</span>
              </button>
            )
          })}
        </div>
      )}

      {!actions && !meta && (
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

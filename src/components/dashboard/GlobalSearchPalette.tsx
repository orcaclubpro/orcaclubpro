'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Building2, FolderKanban, Zap, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchSearchData } from '@/actions/search'
import type { SearchClient, SearchProject, SearchSprint } from '@/actions/search'

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultItem =
  | { type: 'client';  data: SearchClient  }
  | { type: 'project'; data: SearchProject }
  | { type: 'sprint';  data: SearchSprint  }

// ─── Status labels ────────────────────────────────────────────────────────────

const PROJECT_STATUS_LABEL: Record<string, string> = {
  pending:       'Pending',
  'in-progress': 'In Progress',
  'on-hold':     'On Hold',
  completed:     'Completed',
  cancelled:     'Cancelled',
  active:        'Active',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface GlobalSearchPaletteProps {
  username: string
}

export function GlobalSearchPalette({ username }: GlobalSearchPaletteProps) {
  const router = useRouter()

  const [isOpen,      setIsOpen]      = useState(false)
  const [query,       setQuery]       = useState('')
  const [data,        setData]        = useState<{ clients: SearchClient[]; projects: SearchProject[]; sprints: SearchSprint[] } | null>(null)
  const [isLoading,   setIsLoading]   = useState(false)
  const [fetchError,  setFetchError]  = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)

  const inputRef       = useRef<HTMLInputElement>(null)
  const listRef        = useRef<HTMLDivElement>(null)
  const dataLoadedRef  = useRef(false)
  const isOpenRef      = useRef(isOpen)
  const selectedIdxRef = useRef(selectedIdx)
  const resultsRef     = useRef<ResultItem[]>([])

  isOpenRef.current      = isOpen
  selectedIdxRef.current = selectedIdx

  // ── Data loading ────────────────────────────────────────────────────────────

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

  const openPalette = () => {
    setIsOpen(true)
    setQuery('')
    setSelectedIdx(0)
    loadData()
    setTimeout(() => inputRef.current?.focus(), 40)
  }

  const closePalette = () => {
    setIsOpen(false)
    setQuery('')
    setSelectedIdx(0)
  }

  // ── Event listeners ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => openPalette()
    document.addEventListener('orcaclub:open-search', handler)
    return () => document.removeEventListener('orcaclub:open-search', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        if (isOpenRef.current) closePalette()
        else openPalette()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      const results = resultsRef.current
      switch (e.key) {
        case 'Escape':
          e.preventDefault(); closePalette(); break
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

  // ── Results ─────────────────────────────────────────────────────────────────

  const results = buildResults(data, query)
  resultsRef.current = results

  useEffect(() => { setSelectedIdx(0) }, [query])

  const navigateToResult = (item: ResultItem) => {
    closePalette()
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

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[75] animate-in fade-in duration-150"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={closePalette}
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[10vh] z-[76] w-full max-w-[560px] -translate-x-1/2 px-4 animate-in fade-in slide-in-from-top-2 duration-200">
        <div
          className="overflow-hidden rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1E1E1E]">
            <div className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(103,232,249,0.07)', border: '1px solid rgba(103,232,249,0.12)' }}>
              {isLoading
                ? <Loader2 className="size-3.5 animate-spin" style={{ color: 'var(--space-accent)' }} />
                : <Search className="size-3.5" style={{ color: 'var(--space-accent)' }} />
              }
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, projects, sprints…"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-[#555555] outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              {query ? (
                <button
                  onClick={() => { setQuery(''); inputRef.current?.focus() }}
                  className="size-5 rounded flex items-center justify-center text-[#3A3A3A] hover:text-[#6B6B6B] hover:bg-[#222222] transition-all"
                >
                  <X className="size-3" />
                </button>
              ) : (
                <kbd className="hidden sm:inline text-[10px] text-[#2A2A2A] bg-[#1A1A1A] border border-[#252525] rounded px-1.5 py-0.5 font-mono tracking-wide">
                  L
                </kbd>
              )}
            </div>
          </div>

          {/* Body */}
          <div ref={listRef} className="max-h-[56vh] overflow-y-auto">

            {/* Error */}
            {fetchError && (
              <div className="px-5 py-10 text-center space-y-3">
                <p className="text-sm text-red-400/60">{fetchError}</p>
                <button
                  onClick={() => { dataLoadedRef.current = false; loadData() }}
                  className="text-xs text-[#3A3A3A] hover:text-[#6B6B6B] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {!fetchError && isLoading && (
              <div className="px-5 py-12 flex flex-col items-center gap-3">
                <Loader2 className="size-4 text-[#2A2A2A] animate-spin" />
                <p className="text-xs text-[#2A2A2A]">Loading workspace…</p>
              </div>
            )}

            {/* Empty query — workspace overview */}
            {!fetchError && !isLoading && !query.trim() && (
              <div className="px-4 py-4 space-y-3">
                <p className="text-[9px] tracking-[0.4em] uppercase text-[#555555] font-semibold px-1">
                  Workspace
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Building2,    count: totalClients,  label: 'client' },
                    { icon: FolderKanban, count: totalProjects, label: 'project' },
                    { icon: Zap,          count: totalSprints,  label: 'sprint' },
                  ].map(({ icon: Icon, count, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{ background: '#1A1A1A', border: '1px solid #252525' }}
                    >
                      <Icon className="size-3.5 shrink-0" style={{ color: 'rgba(103,232,249,0.5)' }} />
                      <div>
                        <p className="text-sm font-semibold text-white tabular-nums leading-none">
                          {data ? count : '—'}
                        </p>
                        <p className="text-[9px] text-[#555555] mt-0.5">
                          {label}{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#555555] px-1 leading-relaxed">
                  Start typing to search across clients, projects and sprints.
                </p>
              </div>
            )}

            {/* No results */}
            {!fetchError && !isLoading && query.trim() && results.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-[#2A2A2A]">
                  No results for{' '}
                  <span className="text-[#4A4A4A] font-mono">&ldquo;{query}&rdquo;</span>
                </p>
              </div>
            )}

            {/* Results */}
            {!fetchError && !isLoading && results.length > 0 && (
              <div className="py-1.5">

                {/* ── Clients ── */}
                {clientResults.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 mt-1">
                      <Building2 className="size-2.5 text-[#555555]" />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#555555]">Clients</span>
                      <span className="ml-auto text-[9px] text-[#444444] tabular-nums">{clientResults.length}</span>
                    </div>
                    {clientResults.map((item) => {
                      const idx = globalIdx++
                      const isSelected = idx === selectedIdx
                      return (
                        <ResultRow
                          key={item.data.id}
                          idx={idx}
                          isSelected={isSelected}
                          icon={Building2}
                          primary={item.data.name}
                          secondary={[item.data.company, item.data.email].filter(Boolean).join(' · ')}
                          onClick={() => navigateToResult(item)}
                        />
                      )
                    })}
                  </div>
                )}

                {/* ── Projects ── */}
                {projectResults.length > 0 && (
                  <div className={clientResults.length > 0 ? 'mt-1 border-t border-[#181818]' : ''}>
                    <div className="flex items-center gap-2 px-4 py-2 mt-1">
                      <FolderKanban className="size-2.5 text-[#555555]" />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#555555]">Projects</span>
                      <span className="ml-auto text-[9px] text-[#444444] tabular-nums">{projectResults.length}</span>
                    </div>
                    {projectResults.map((item) => {
                      const idx = globalIdx++
                      const isSelected = idx === selectedIdx
                      return (
                        <ResultRow
                          key={item.data.id}
                          idx={idx}
                          isSelected={isSelected}
                          icon={FolderKanban}
                          primary={item.data.name}
                          secondary={[item.data.clientName, PROJECT_STATUS_LABEL[item.data.status] ?? item.data.status].filter(Boolean).join(' · ')}
                          onClick={() => navigateToResult(item)}
                        />
                      )
                    })}
                  </div>
                )}

                {/* ── Sprints ── */}
                {sprintResults.length > 0 && (
                  <div className={(clientResults.length > 0 || projectResults.length > 0) ? 'mt-1 border-t border-[#181818]' : ''}>
                    <div className="flex items-center gap-2 px-4 py-2 mt-1">
                      <Zap className="size-2.5 text-[#555555]" />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#555555]">Sprints</span>
                      <span className="ml-auto text-[9px] text-[#444444] tabular-nums">{sprintResults.length}</span>
                    </div>
                    {sprintResults.map((item) => {
                      const idx = globalIdx++
                      const isSelected = idx === selectedIdx
                      return (
                        <ResultRow
                          key={item.data.id}
                          idx={idx}
                          isSelected={isSelected}
                          icon={Zap}
                          primary={item.data.name}
                          secondary={[item.data.projectName, item.data.clientName].filter(Boolean).join(' · ')}
                          onClick={() => navigateToResult(item)}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[#1E1E1E] flex items-center gap-4">
            {[
              { key: '↑↓', label: 'navigate' },
              { key: '↵',  label: 'open'     },
              { key: 'esc', label: 'close'   },
            ].map(({ key, label }) => (
              <span key={key} className="flex items-center gap-1.5 text-[10px] text-[#555555]">
                <kbd className="font-mono text-[#888888] bg-[#1A1A1A] border border-[#2A2A2A] rounded px-1.5 py-0.5">
                  {key}
                </kbd>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({
  idx,
  isSelected,
  icon: Icon,
  primary,
  secondary,
  onClick,
}: {
  idx: number
  isSelected: boolean
  icon: React.ComponentType<{ className?: string }>
  primary: string
  secondary: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      data-idx={idx}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100 group relative',
        isSelected ? 'bg-[#161616]' : 'hover:bg-[#141414]',
      )}
    >
      {/* Selected left bar */}
      {isSelected && (
        <div
          className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full"
          style={{ background: 'var(--space-accent)', opacity: 0.6 }}
        />
      )}

      <Icon
        className={cn(
          'size-3.5 shrink-0 transition-colors duration-100',
          isSelected ? 'text-[var(--space-accent)]/70' : 'text-[#444444]',
        )}
      />

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate transition-colors duration-100',
          isSelected ? 'text-white font-medium' : 'text-[#B0B0B0] group-hover:text-[#D0D0D0]',
        )}>
          {primary}
        </p>
        {secondary && (
          <p className={cn(
            'text-[11px] truncate transition-colors duration-100',
            isSelected ? 'text-[#555555]' : 'text-[#444444] group-hover:text-[#555555]',
          )}>
            {secondary}
          </p>
        )}
      </div>

      <ArrowRight
        className={cn(
          'size-3 shrink-0 transition-all duration-150',
          isSelected
            ? 'opacity-60 translate-x-0'
            : 'opacity-0 -translate-x-1 group-hover:opacity-30 group-hover:translate-x-0',
        )}
        style={isSelected ? { color: 'var(--space-accent)' } : { color: '#6B6B6B' }}
      />
    </button>
  )
}

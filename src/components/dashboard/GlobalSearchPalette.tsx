'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Building2, FolderKanban, Zap, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchSearchData } from '@/actions/search'
import type { SearchClient, SearchProject, SearchSprint } from '@/actions/search'

// ─── Status dot colours ───────────────────────────────────────────────────────

const PROJECT_STATUS_DOT: Record<string, string> = {
  pending:       'bg-yellow-400',
  'in-progress': 'bg-cyan-400',
  'on-hold':     'bg-orange-400',
  completed:     'bg-green-400',
  cancelled:     'bg-red-400/70',
  active:        'bg-green-400',
}

const SPRINT_STATUS_DOT: Record<string, string> = {
  pending:       'bg-yellow-400',
  'in-progress': 'bg-cyan-400',
  delayed:       'bg-orange-400',
  finished:      'bg-green-400',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultItem =
  | { type: 'client'; data: SearchClient }
  | { type: 'project'; data: SearchProject }
  | { type: 'sprint'; data: SearchSprint }

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
    if (matches(client.name, q) || matches(client.email, q) || matches(client.company, q)) {
      out.push({ type: 'client', data: client })
    }
  }
  for (const project of data.projects) {
    if (matches(project.name, q) || matches(project.clientName, q) || matches(project.description, q)) {
      out.push({ type: 'project', data: project })
    }
  }
  for (const sprint of data.sprints) {
    if (matches(sprint.name, q) || matches(sprint.projectName, q) || matches(sprint.clientName, q) || matches(sprint.description, q)) {
      out.push({ type: 'sprint', data: sprint })
    }
  }
  return out
}

// ─── Component ────────────────────────────────────────────────────────────────

interface GlobalSearchPaletteProps {
  username: string
}

export function GlobalSearchPalette({ username }: GlobalSearchPaletteProps) {
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [data, setData] = useState<{ clients: SearchClient[]; projects: SearchProject[]; sprints: SearchSprint[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const dataLoadedRef = useRef(false)

  // Mutable refs so keyboard handlers never go stale
  const isOpenRef = useRef(isOpen)
  const selectedIdxRef = useRef(selectedIdx)
  const resultsRef = useRef<ResultItem[]>([])

  isOpenRef.current = isOpen
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
      dataLoadedRef.current = false // allow retry
    }
  }

  // ── Open / close ────────────────────────────────────────────────────────────

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

  // ── Custom DOM event (from nav bar) ─────────────────────────────────────────

  useEffect(() => {
    const handler = () => openPalette()
    document.addEventListener('orcaclub:open-search', handler)
    return () => document.removeEventListener('orcaclub:open-search', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Global L shortcut ────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if modifier keys are held or focus is in an input/textarea
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

  // ── Keyboard navigation inside palette ─────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return

    const handler = (e: KeyboardEvent) => {
      const results = resultsRef.current
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          closePalette()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIdx((i) => {
            const next = Math.min(results.length - 1, i + 1)
            selectedIdxRef.current = next
            return next
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIdx((i) => {
            const next = Math.max(0, i - 1)
            selectedIdxRef.current = next
            return next
          })
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIdxRef.current]) {
            navigateToResult(results[selectedIdxRef.current])
          }
          break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll selected item into view ─────────────────────────────────────────

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  // ── Results ─────────────────────────────────────────────────────────────────

  const results = buildResults(data, query)
  resultsRef.current = results

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  // ── Navigation ──────────────────────────────────────────────────────────────

  const navigateToResult = (item: ResultItem) => {
    closePalette()
    if (item.type === 'client') {
      router.push(`/u/${username}/clients/${item.data.id}`)
    } else if (item.type === 'project') {
      router.push(`/u/${username}/projects/${item.data.id}`)
    } else {
      router.push(`/u/${username}/projects/${item.data.projectId}?tab=sprints`)
    }
  }

  // ── Split results by type for grouped display ───────────────────────────────

  const clientResults = results.filter((r): r is { type: 'client'; data: SearchClient } => r.type === 'client')
  const projectResults = results.filter((r): r is { type: 'project'; data: SearchProject } => r.type === 'project')
  const sprintResults = results.filter((r): r is { type: 'sprint'; data: SearchSprint } => r.type === 'sprint')

  // Global index within the flat `results` array
  let globalIdx = 0

  const totalClients = data?.clients.length ?? 0
  const totalProjects = data?.projects.length ?? 0
  const totalSprints = data?.sprints.length ?? 0

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[75] bg-black/65 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={closePalette}
      />

      {/* Palette */}
      <div
        className="fixed left-1/2 top-[12vh] z-[76] w-full max-w-xl -translate-x-1/2 px-4 animate-in fade-in slide-in-from-top-3 duration-200"
      >
        <div
          className="overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/80"
          style={{ background: 'rgba(8, 8, 8, 0.98)', backdropFilter: 'blur(40px)' }}
        >
          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
            {isLoading ? (
              <Loader2 className="size-4 text-white/25 shrink-0 animate-spin" />
            ) : (
              <Search className="size-4 text-white/25 shrink-0" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, projects and sprints…"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/18 outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              {query ? (
                <button
                  onClick={() => { setQuery(''); inputRef.current?.focus() }}
                  className="text-white/20 hover:text-white/50 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline text-[10px] text-white/18 bg-white/[0.04] border border-white/[0.07] rounded-md px-1.5 py-0.5 font-mono">
                  L
                </kbd>
              )}
            </div>
          </div>

          {/* Body */}
          <div ref={listRef} className="max-h-[54vh] overflow-y-auto">

            {/* Error */}
            {fetchError && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-red-400/70">{fetchError}</p>
                <button
                  onClick={() => { dataLoadedRef.current = false; loadData() }}
                  className="mt-3 text-xs text-white/30 hover:text-white/55 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {!fetchError && isLoading && (
              <div className="px-5 py-10 flex flex-col items-center gap-2.5">
                <Loader2 className="size-5 text-white/20 animate-spin" />
                <p className="text-xs text-white/20">Loading…</p>
              </div>
            )}

            {/* Empty query — overview */}
            {!fetchError && !isLoading && !query.trim() && (
              <div className="px-5 py-5 space-y-4">
                <p className="text-[10px] tracking-[0.35em] uppercase text-white/18 font-light">
                  Workspace
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                    <div className="p-1.5 rounded-lg bg-intelligence-cyan/[0.07] border border-intelligence-cyan/[0.12]">
                      <Building2 className="size-3 text-intelligence-cyan/60" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/50 tabular-nums">
                        {data ? totalClients : '—'}
                      </p>
                      <p className="text-[10px] text-white/20">client{totalClients !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                    <div className="p-1.5 rounded-lg bg-intelligence-cyan/[0.07] border border-intelligence-cyan/[0.12]">
                      <FolderKanban className="size-3 text-intelligence-cyan/60" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/50 tabular-nums">
                        {data ? totalProjects : '—'}
                      </p>
                      <p className="text-[10px] text-white/20">project{totalProjects !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                    <div className="p-1.5 rounded-lg bg-intelligence-cyan/[0.07] border border-intelligence-cyan/[0.12]">
                      <Zap className="size-3 text-intelligence-cyan/60" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/50 tabular-nums">
                        {data ? totalSprints : '—'}
                      </p>
                      <p className="text-[10px] text-white/20">sprint{totalSprints !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-white/15 leading-relaxed">
                  Type to search across all clients, projects and sprints.
                </p>
              </div>
            )}

            {/* No results */}
            {!fetchError && !isLoading && query.trim() && results.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-white/25">
                  No results for{' '}
                  <span className="text-white/40 font-mono">&ldquo;{query}&rdquo;</span>
                </p>
              </div>
            )}

            {/* Results */}
            {!fetchError && !isLoading && results.length > 0 && (
              <div className="py-2">

                {/* Clients group */}
                {clientResults.length > 0 && (
                  <div>
                    <p className="px-5 pt-3 pb-1.5 text-[10px] tracking-[0.35em] uppercase text-white/20 font-light flex items-center gap-1.5">
                      <Building2 className="size-2.5" />
                      Clients
                    </p>
                    {clientResults.map((item) => {
                      const idx = globalIdx++
                      const isSelected = idx === selectedIdx
                      return (
                        <button
                          key={item.data.id}
                          data-idx={idx}
                          onClick={() => navigateToResult(item)}
                          className={cn(
                            'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-100 group',
                            isSelected ? 'bg-white/[0.055]' : 'hover:bg-white/[0.03]',
                          )}
                        >
                          <div className={cn(
                            'size-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-100',
                            isSelected
                              ? 'bg-intelligence-cyan/15 border border-intelligence-cyan/30'
                              : 'bg-white/[0.04] border border-white/[0.08]',
                          )}>
                            <Building2 className={cn('size-3.5 transition-colors', isSelected ? 'text-intelligence-cyan' : 'text-white/30')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium truncate transition-colors', isSelected ? 'text-white' : 'text-white/65')}>
                              {item.data.name}
                            </p>
                            <p className="text-[11px] text-white/28 truncate">
                              {item.data.company ? `${item.data.company} · ` : ''}
                              {item.data.email}
                            </p>
                          </div>
                          <ArrowRight className={cn(
                            'size-3.5 shrink-0 transition-all duration-150',
                            isSelected
                              ? 'text-intelligence-cyan/60'
                              : 'text-white/10 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0',
                          )} />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Projects group */}
                {projectResults.length > 0 && (
                  <div>
                    <p className={cn(
                      'px-5 pb-1.5 text-[10px] tracking-[0.35em] uppercase text-white/20 font-light flex items-center gap-1.5',
                      clientResults.length > 0 ? 'pt-4 mt-1 border-t border-white/[0.04]' : 'pt-3',
                    )}>
                      <FolderKanban className="size-2.5" />
                      Projects
                    </p>
                    {projectResults.map((item) => {
                      const idx = globalIdx++
                      const isSelected = idx === selectedIdx
                      const dotClass = PROJECT_STATUS_DOT[item.data.status] ?? 'bg-white/30'
                      return (
                        <button
                          key={item.data.id}
                          data-idx={idx}
                          onClick={() => navigateToResult(item)}
                          className={cn(
                            'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-100 group',
                            isSelected ? 'bg-white/[0.055]' : 'hover:bg-white/[0.03]',
                          )}
                        >
                          <div className={cn(
                            'size-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-100',
                            isSelected
                              ? 'bg-intelligence-cyan/15 border border-intelligence-cyan/30'
                              : 'bg-white/[0.04] border border-white/[0.08]',
                          )}>
                            <FolderKanban className={cn('size-3.5 transition-colors', isSelected ? 'text-intelligence-cyan' : 'text-white/30')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn('text-sm font-medium truncate transition-colors', isSelected ? 'text-white' : 'text-white/65')}>
                                {item.data.name}
                              </p>
                              <span className={cn('size-1.5 rounded-full shrink-0', dotClass)} />
                            </div>
                            <p className="text-[11px] text-white/28 truncate">
                              {item.data.clientName ? `${item.data.clientName} · ` : ''}
                              {item.data.status}
                            </p>
                          </div>
                          <ArrowRight className={cn(
                            'size-3.5 shrink-0 transition-all duration-150',
                            isSelected
                              ? 'text-intelligence-cyan/60'
                              : 'text-white/10 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0',
                          )} />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Sprints group */}
                {sprintResults.length > 0 && (
                  <div>
                    <p className={cn(
                      'px-5 pb-1.5 text-[10px] tracking-[0.35em] uppercase text-white/20 font-light flex items-center gap-1.5',
                      (clientResults.length > 0 || projectResults.length > 0) ? 'pt-4 mt-1 border-t border-white/[0.04]' : 'pt-3',
                    )}>
                      <Zap className="size-2.5" />
                      Sprints
                    </p>
                    {sprintResults.map((item) => {
                      const idx = globalIdx++
                      const isSelected = idx === selectedIdx
                      const dotClass = SPRINT_STATUS_DOT[item.data.status] ?? 'bg-white/30'
                      return (
                        <button
                          key={item.data.id}
                          data-idx={idx}
                          onClick={() => navigateToResult(item)}
                          className={cn(
                            'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-100 group',
                            isSelected ? 'bg-white/[0.055]' : 'hover:bg-white/[0.03]',
                          )}
                        >
                          <div className={cn(
                            'size-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-100',
                            isSelected
                              ? 'bg-intelligence-cyan/15 border border-intelligence-cyan/30'
                              : 'bg-white/[0.04] border border-white/[0.08]',
                          )}>
                            <Zap className={cn('size-3.5 transition-colors', isSelected ? 'text-intelligence-cyan' : 'text-white/30')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn('text-sm font-medium truncate transition-colors', isSelected ? 'text-white' : 'text-white/65')}>
                                {item.data.name}
                              </p>
                              <span className={cn('size-1.5 rounded-full shrink-0', dotClass)} />
                            </div>
                            <p className="text-[11px] text-white/28 truncate">
                              {item.data.projectName}
                              {item.data.clientName ? ` · ${item.data.clientName}` : ''}
                            </p>
                          </div>
                          <ArrowRight className={cn(
                            'size-3.5 shrink-0 transition-all duration-150',
                            isSelected
                              ? 'text-intelligence-cyan/60'
                              : 'text-white/10 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0',
                          )} />
                        </button>
                      )
                    })}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center gap-4">
            {[
              { key: '↑↓', label: 'navigate' },
              { key: '↵',  label: 'open' },
              { key: 'esc', label: 'close' },
            ].map(({ key, label }) => (
              <span key={key} className="flex items-center gap-1.5 text-[10px] text-white/15">
                <kbd className="font-mono bg-white/[0.04] border border-white/[0.07] rounded px-1.5 py-0.5 text-white/20">
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

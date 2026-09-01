'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toneColor, type StatusTone } from '@/lib/dashboard/status'

// ─── The portal's list-detail shell ──────────────────────────────────────────
// One implementation for Clients and Plan, at every breakpoint. Below `lg` the
// list is the page and the detail slides over it; at `lg` and up both panes are
// visible side by side. There is no separate mobile card component — the row
// that renders in the sidebar is the same row that renders on a phone.
//
// Selection lives in the URL (`?<paramKey>=<id>`) so a selected record is
// linkable, survives refresh, and restores on Back.

export interface ListDetailItem {
  id: string
  /** Primary line. */
  title: string
  /** Secondary line — client name, company, whatever identifies it second. */
  subtitle?: string | null
  /** Dot colour on the left of the row. */
  tone?: StatusTone
  /** Right-aligned value — a balance, a date, a count. Monospaced. */
  trailing?: string | null
  /** Tints `trailing` and marks the row as needing attention. */
  trailingTone?: StatusTone
  /** Free text folded into search alongside title and subtitle. */
  searchText?: string
}

interface ListDetailProps<T extends ListDetailItem> {
  items: T[]
  /** URL search param that holds the selected id. Keep stable — it's linkable. */
  paramKey: string
  /** Pane heading. Must match the nav label for this route. */
  title: string
  searchPlaceholder: string
  /** Rendered under the heading, e.g. "3 outstanding". */
  summary?: React.ReactNode
  /** Create button etc., pinned to the bottom of the list pane. */
  action?: React.ReactNode
  renderDetail: (item: T) => React.ReactNode
  empty: React.ReactNode
}

export function ListDetail<T extends ListDetailItem>({
  items,
  paramKey,
  title,
  searchPlaceholder,
  summary,
  action,
  renderDetail,
  empty,
}: ListDetailProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const listboxId = useId()

  const [query, setQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const urlId = searchParams.get(paramKey)
  const selected = useMemo(
    () => items.find((i) => i.id === urlId) ?? null,
    [items, urlId],
  )

  // With both panes on screen there is no reason to show an empty one, so the
  // first record stands in until the reader picks another. The URL stays clean
  // until they do — only a deliberate click is worth a history entry. Below
  // `lg` the list is the whole page, so there is nothing to stand in for.
  const shown = selected ?? items[0] ?? null
  const activeId = urlId ?? shown?.id ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) =>
      [i.title, i.subtitle, i.searchText]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    )
  }, [items, query])

  // `push` for deliberate clicks so Back returns where the reader expects;
  // `replace` while arrowing so holding a key doesn't bury the history stack.
  const select = useCallback(
    (id: string, mode: 'push' | 'replace') => {
      const next = new URLSearchParams(searchParams.toString())
      next.set(paramKey, id)
      const url = `${pathname}?${next.toString()}`
      if (mode === 'push') router.push(url, { scroll: false })
      else router.replace(url, { scroll: false })
    },
    [router, pathname, searchParams, paramKey],
  )

  const clearSelection = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete(paramKey)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams, paramKey])

  // Arrow keys move the selection, but only while the list itself has focus —
  // the old implementation bound this to `window` and ate page scrolling.
  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const idx = filtered.findIndex((i) => i.id === activeId)
    const next =
      e.key === 'ArrowDown'
        ? Math.min(filtered.length - 1, idx + 1)
        : Math.max(0, idx - 1)
    const target = filtered[idx === -1 ? 0 : next]
    if (target) select(target.id, 'replace')
  }

  // Keep the active row in view when the selection moves by keyboard.
  useEffect(() => {
    if (!urlId) return
    listRef.current
      ?.querySelector(`[data-id="${CSS.escape(urlId)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [urlId])

  if (items.length === 0) {
    return <div className="space-true-scale px-6 py-16">{empty}</div>
  }

  const listPane = (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--space-bg-card)]">
      <div className="shrink-0 px-4 pt-5 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[17px] font-semibold tracking-tight text-[var(--space-text-primary)]">
            {title}
          </h1>
          <span className="shrink-0 text-[14px] tabular-nums text-[var(--space-text-muted)]">
            {items.length}
          </span>
        </div>
        {summary && (
          <div className="mt-1.5 text-[14px] text-[var(--space-text-muted)]">{summary}</div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--space-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            aria-controls={listboxId}
            className="h-8 w-full rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-base)] pl-8 pr-3 text-[15px] text-[var(--space-text-primary)] transition-colors placeholder:text-[var(--space-text-muted)] focus:border-[var(--space-accent)] focus:outline-none"
          />
        </div>
      </div>

      <div
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-label={title}
        aria-activedescendant={activeId ? `${listboxId}-${activeId}` : undefined}
        tabIndex={0}
        onKeyDown={onListKeyDown}
        className="min-h-0 flex-1 overflow-y-auto py-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]"
      >
        {filtered.length === 0 ? (
          <p className="px-5 py-6 text-center text-[15px] text-[var(--space-text-muted)]">
            No matches for “{query.trim()}”.
          </p>
        ) : (
          filtered.map((item) => (
            <Row
              key={item.id}
              id={`${listboxId}-${item.id}`}
              item={item}
              selected={item.id === urlId}
              standIn={item.id === activeId && item.id !== urlId}
              onSelect={() => select(item.id, 'push')}
            />
          ))
        )}
      </div>

      {action && (
        <div className="shrink-0 border-t border-[var(--space-border-hard)] px-4 py-4 [&>button]:w-full">
          {action}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ── Desktop: both panes ─────────────────────────────────────────── */}
      <div className="space-true-scale hidden lg:flex space-panel-h overflow-hidden border-t border-[var(--space-border-hard)]">
        <div className="w-[264px] shrink-0 border-r border-[var(--space-border-hard)] xl:w-[288px]">
          {listPane}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-[var(--space-bg-base)]">
          {shown ? (
            <div key={shown.id} className="h-full animate-in fade-in duration-150">
              {renderDetail(shown)}
            </div>
          ) : (
            <PickOne title={title} />
          )}
        </div>
      </div>

      {/* ── Below lg: one pane at a time ────────────────────────────────── */}
      <div className="space-true-scale lg:hidden">
        {selected ? (
          <div className="animate-in fade-in duration-150">
            <button
              type="button"
              onClick={clearSelection}
              className="flex items-center gap-2 px-4 py-3 text-[15px] text-[var(--space-text-secondary)] transition-colors hover:text-[var(--space-text-primary)]"
            >
              <ArrowLeft className="size-4" />
              All {title.toLowerCase()}
            </button>
            {renderDetail(selected)}
          </div>
        ) : (
          <div className="h-[calc(100svh-var(--space-header)-7rem)]">{listPane}</div>
        )}
      </div>
    </>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({
  id,
  item,
  selected,
  standIn = false,
  onSelect,
}: {
  id: string
  item: ListDetailItem
  selected: boolean
  /** The desktop stand-in: highlighted beside its detail pane, plain on a phone. */
  standIn?: boolean
  onSelect: () => void
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected || standIn}
      data-id={item.id}
      tabIndex={-1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'flex w-full cursor-pointer select-none items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors',
        selected && 'border-l-[var(--space-accent)] bg-[var(--space-bg-card-hover)]',
        standIn &&
          'border-l-transparent lg:border-l-[var(--space-accent)] lg:bg-[var(--space-bg-card-hover)]',
        !selected && !standIn && 'border-l-transparent hover:bg-[var(--space-bg-card-hover)]/60',
      )}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: toneColor(item.tone ?? 'idle') }}
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[15px] leading-tight transition-colors',
            selected
              ? 'font-semibold text-[var(--space-text-primary)]'
              : 'font-medium text-[var(--space-text-tertiary)]',
          )}
        >
          {item.title}
        </p>
        {item.subtitle && (
          <p className="mt-0.5 truncate text-[13px] leading-tight text-[var(--space-text-muted)]">
            {item.subtitle}
          </p>
        )}
      </div>

      {item.trailing && (
        <span
          className="shrink-0 text-[13px] tabular-nums"
          style={{
            color: item.trailingTone
              ? toneColor(item.trailingTone)
              : 'var(--space-text-muted)',
          }}
        >
          {item.trailing}
        </span>
      )}
    </div>
  )
}

// ─── Nothing selected ────────────────────────────────────────────────────────

function PickOne({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center px-8">
      <p className="text-[15px] text-[var(--space-text-muted)]">
        Select from {title.toLowerCase()} to see the details.
      </p>
    </div>
  )
}

// ─── Detail shell ────────────────────────────────────────────────────────────
// Shared chrome for whatever sits in the right pane: a quiet header, a single
// line of facts, then the content. The old panes opened with the record name at
// text-7xl in accent colour, which outshouted every real number on the screen
// and pushed the content below the fold.

export function DetailShell({
  eyebrow,
  name,
  facts,
  actions,
  children,
}: {
  eyebrow?: React.ReactNode
  name: string
  /** One compressed line of facts — replaces a row of stat tiles. */
  facts?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
          <header className="mb-8">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                {eyebrow && <div className="mb-2">{eyebrow}</div>}
                <h2 className="truncate text-[30px] font-semibold leading-tight tracking-tight text-[var(--space-text-primary)]">
                  {name}
                </h2>
              </div>
              {actions && (
                <div className="flex shrink-0 items-center gap-2">{actions}</div>
              )}
            </div>
            {facts && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-[var(--space-text-secondary)]">
                {facts}
              </div>
            )}
          </header>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Separator for `facts` — a hairline dot, never a bullet character in text. */
export function FactDot() {
  return (
    <span aria-hidden className="text-[var(--space-text-muted)]">
      ·
    </span>
  )
}

/** The portal's single eyebrow style. One size, one tracking, one colour. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--space-text-muted)]">
      {children}
    </p>
  )
}

/** Status chip — foreground, soft fill and hairline all from one tone token. */
export function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[13px] font-medium"
      style={{
        color: `var(--space-status-${tone})`,
        background: `var(--space-status-${tone}-soft)`,
        borderColor: `var(--space-status-${tone}-line)`,
      }}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: `var(--space-status-${tone})` }}
      />
      {label}
    </span>
  )
}

/** Section heading inside a detail pane. */
export function Section({
  heading,
  aside,
  children,
}: {
  heading: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[var(--space-text-primary)]">{heading}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Primary action — the one filled button allowed in a detail pane. */
export function PrimaryAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-[var(--space-accent)] px-4 py-2 text-[15px] font-semibold text-[var(--space-bg-base)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--space-accent)]"
    >
      {children}
    </Link>
  )
}

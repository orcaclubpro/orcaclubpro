'use client'

import { useState } from 'react'
import { ChevronRight, Pencil, RotateCcw, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SowFormData, SowScopeItem } from '@/lib/document-generators'
import {
  SOW_CLAUSES,
  STANDARD_EXCLUSIONS,
  clauseHasRenderBlocks,
  clauseStandardText,
  isClauseEnabled,
  isClauseOverridden,
  normalizeSowItems,
} from '@/lib/sow/clauses'
import { SowItemListEditor } from './SowItemListEditor'

const inputCls =
  'w-full bg-[var(--space-bg-base)] border border-[#333] rounded-lg px-3 py-2 text-sm text-[var(--space-text-primary)] placeholder-[var(--space-text-muted)] outline-none focus:border-[var(--space-accent)] transition-colors'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-secondary)] mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-[0.5625rem] text-[var(--space-text-muted)] mt-1 leading-relaxed">{hint}</p>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-[var(--space-accent)] border-b border-[var(--space-border-hard)] pb-1.5 mb-3">
      {children}
    </p>
  )
}

/**
 * The SOW's numbers and its standard text, in one place.
 *
 * Every clause in the agreement can be rewritten for this document or switched
 * off entirely; the wording lives in the clause registry and the edits ride
 * along in the document's saved form data, so reopening a SOW brings them back.
 */
export function SowTermsEditor({
  form,
  onChange,
}: {
  form: SowFormData
  onChange: (updater: (f: SowFormData) => SowFormData) => void
}) {
  const [openClause, setOpenClause] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const overrides = form.clauseOverrides ?? {}
  const usingStandardExclusions = normalizeSowItems(form.exclusions).length === 0
  const exclusions = usingStandardExclusions ? STANDARD_EXCLUSIONS : normalizeSowItems(form.exclusions)

  const setField = <K extends keyof SowFormData>(k: K, v: SowFormData[K]) =>
    onChange(f => ({ ...f, [k]: v }))

  const setOverride = (id: string, text: string) =>
    onChange(f => ({ ...f, clauseOverrides: { ...(f.clauseOverrides ?? {}), [id]: text } }))

  const clearOverride = (id: string) =>
    onChange(f => {
      const next = { ...(f.clauseOverrides ?? {}) }
      delete next[id]
      return { ...f, clauseOverrides: next }
    })

  const toggleClause = (id: string) =>
    onChange(f => {
      const list = f.clauseDisabled ?? []
      return {
        ...f,
        clauseDisabled: list.includes(id) ? list.filter(x => x !== id) : [...list, id],
      }
    })

  return (
    <div className="space-y-5">
      {/* ── Stated numbers ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionLabel>Contract Terms</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Hourly Rate ($/hr)" hint="Named in the revisions and post-warranty clauses.">
            <input
              className={inputCls}
              value={form.hourlyRate ?? ''}
              onChange={e => setField('hourlyRate', e.target.value)}
              placeholder="e.g. 95"
            />
          </Field>
          <Field label="Warranty (days)" hint="Express warranty after acceptance.">
            <input
              className={inputCls}
              value={form.warrantyDays ?? ''}
              onChange={e => setField('warrantyDays', e.target.value)}
              placeholder="30"
            />
          </Field>
          <Field label="Bug Support (hrs)" hint="Blank = no separate allowance.">
            <input
              className={inputCls}
              value={form.bugSupportHours ?? ''}
              onChange={e => setField('bugSupportHours', e.target.value)}
              placeholder="optional"
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Acceptance (days)" hint="Silence past this and delivery is accepted.">
            <input
              className={inputCls}
              value={form.acceptanceDays ?? ''}
              onChange={e => setField('acceptanceDays', e.target.value)}
              placeholder="7"
            />
          </Field>
          <Field label="Inactivity (days)" hint="Client goes dark this long → balance due.">
            <input
              className={inputCls}
              value={form.stallDays ?? ''}
              onChange={e => setField('stallDays', e.target.value)}
              placeholder="30"
            />
          </Field>
          <Field label="Reactivation Fee ($)" hint="Cost to restart a stalled project.">
            <input
              className={inputCls}
              value={form.reactivationFee ?? ''}
              onChange={e => setField('reactivationFee', e.target.value)}
              placeholder="500"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Liability Floor ($)" hint="Cap is the greater of fees paid or this — never $0.">
            <input
              className={inputCls}
              value={form.liabilityFloor ?? ''}
              onChange={e => setField('liabilityFloor', e.target.value)}
              placeholder="1000"
            />
          </Field>
          <Field label="Venue (county)" hint="Named for jurisdiction and attorney's fees.">
            <input
              className={inputCls}
              value={form.venueCounty ?? ''}
              onChange={e => setField('venueCounty', e.target.value)}
              placeholder="Orange County"
            />
          </Field>
        </div>
      </div>

      {/* ── The three lists that define the engagement ────────────────────── */}
      <div className="space-y-5">
        <SowItemListEditor
          label="Scope of Work"
          hint="The services performed. Each line prints as a numbered row; the description sits underneath it."
          items={form.scopeItems}
          placeholder="e.g. Design and build the operations dashboard"
          onChange={next => setField('scopeItems', next)}
        />

        <SowItemListEditor
          label="Deliverables"
          hint="What is actually handed over. Acceptance and the warranty attach to these, so keep them concrete."
          items={form.deliverables}
          placeholder="e.g. Deployed dashboard on Client's infrastructure"
          onChange={next => setField('deliverables', next)}
        />

        <SowItemListEditor
          label="Out of Scope"
          hint="Printed as an explicit exclusion list. Defining out-of-scope only as “anything not listed above” loses arguments."
          items={exclusions}
          placeholder="e.g. Hosting, domains, and infrastructure fees"
          usingDefaults={usingStandardExclusions}
          onChange={next => setField('exclusions', next)}
          onReset={() => setField('exclusions', undefined)}
        />
      </div>

      {/* ── Standard clauses ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionLabel>Standard Text</SectionLabel>
        <p className="text-[0.625rem] text-[var(--space-text-secondary)] -mt-1 mb-2">
          Every clause of the agreement. Rewrite any of them for this document, or switch off the ones that do not apply.
          Section numbers renumber themselves.
        </p>

        {SOW_CLAUSES.map((clause, i) => {
          const enabled = isClauseEnabled(clause, form)
          const overridden = isClauseOverridden(clause, form)
          const open = openClause === clause.id
          const isEditing = editing === clause.id
          const standard = clauseStandardText(clause, form)
          const hasTable = clauseHasRenderBlocks(clause, form)

          return (
            <div
              key={clause.id}
              className={cn(
                'rounded-lg border border-[var(--space-border-hard)] overflow-hidden transition-opacity',
                !enabled && 'opacity-50',
              )}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpenClause(open ? null : clause.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  <ChevronRight
                    className={cn('size-3.5 shrink-0 text-[var(--space-text-secondary)] transition-transform', open && 'rotate-90')}
                  />
                  <span className="text-[0.625rem] text-[var(--space-text-muted)] tabular-nums shrink-0">{i + 1}</span>
                  <span className="text-xs font-semibold text-[var(--space-text-primary)] truncate">{clause.heading}</span>
                  {overridden && (
                    <span className="shrink-0 text-[0.5rem] font-bold uppercase tracking-widest text-[var(--space-accent)]">
                      Edited
                    </span>
                  )}
                </button>

                {overridden && (
                  <button
                    type="button"
                    onClick={() => { clearOverride(clause.id); setEditing(null) }}
                    title="Reset to standard wording"
                    className="shrink-0 p-1 text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] transition-colors"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpenClause(clause.id)
                    setEditing(isEditing ? null : clause.id)
                    if (!isEditing && !overridden) setOverride(clause.id, standard)
                  }}
                  title="Rewrite this clause"
                  className={cn(
                    'shrink-0 p-1 transition-colors',
                    isEditing ? 'text-[var(--space-accent)]' : 'text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)]',
                  )}
                >
                  <Pencil className="size-3.5" />
                </button>

                {clause.required ? (
                  <span
                    title="Required — the agreement is unsound without it"
                    className="shrink-0 text-[0.5rem] font-bold uppercase tracking-widest text-[var(--space-text-muted)]"
                  >
                    Req
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleClause(clause.id)}
                    title={enabled ? 'Remove this clause' : 'Include this clause'}
                    className={cn(
                      'shrink-0 w-8 h-4 rounded-full transition-colors relative',
                      enabled ? 'bg-[var(--space-accent)]' : 'bg-[var(--space-bg-base)] border border-[#333]',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-3 rounded-full bg-white transition-all',
                        enabled ? 'left-4' : 'left-0.5',
                      )}
                    />
                  </button>
                )}
              </div>

              {open && (
                <div className="px-3 pb-3 space-y-2 border-t border-[var(--space-border-hard)] pt-2">
                  {clause.note && (
                    <p className="text-[0.5625rem] text-[var(--space-text-muted)] leading-relaxed italic">{clause.note}</p>
                  )}
                  {hasTable && (
                    <p className="text-[0.5625rem] text-[var(--space-text-muted)] leading-relaxed">
                      This section also prints content built from the form above — the deliverables table, pricing, or the
                      Out of Scope list. Editing the wording here leaves that content alone; change it in the fields above.
                    </p>
                  )}
                  {isEditing ? (
                    <>
                      <textarea
                        value={overrides[clause.id] ?? standard}
                        onChange={e => setOverride(clause.id, e.target.value)}
                        rows={Math.min(24, Math.max(6, (overrides[clause.id] ?? standard).split('\n').length + 2))}
                        className="w-full bg-[var(--space-bg-base)] border border-[#333] rounded-lg px-3 py-2 text-xs leading-relaxed text-[var(--space-text-primary)] outline-none focus:border-[var(--space-accent)] transition-colors resize-y font-mono"
                      />
                      <p className="text-[0.5625rem] text-[var(--space-text-muted)]">
                        Blank line between paragraphs. Start a line with <code>-</code> for a bullet, <code>##</code> for a
                        numbered sub-heading.
                      </p>
                    </>
                  ) : (
                    <p className="text-[0.625rem] text-[var(--space-text-tertiary)] leading-relaxed whitespace-pre-wrap">
                      {overrides[clause.id]?.trim() || standard}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

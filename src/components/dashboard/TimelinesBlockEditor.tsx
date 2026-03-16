'use client'

import { useState, useRef, useCallback } from 'react'
import {
  GripVertical,
  Plus,
  X,
  Save,
  AlertCircle,
  LayoutList,
  Rocket,
  Check,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Timeline } from '@/types/payload-types'

// ── Types ─────────────────────────────────────────────────────────────────────

type PhaseBlock = {
  blockType: 'phase'
  id?: string | null
  blockName?: string | null
  dateRange: string
  tag?: string | null
  tagColor?: ('build' | 'integrate' | 'touchup' | 'prep') | null
  title: string
  items?: { text: string; id?: string | null }[] | null
  dealerPill?: { enabled?: boolean | null; text?: string | null }
}

type ChecklistBlock = {
  blockType: 'checklist'
  id?: string | null
  blockName?: string | null
  dateLabel?: string | null
  tag?: string | null
  title: string
  items?: { text: string; note?: string | null; id?: string | null }[] | null
}

type LaunchBlock = {
  blockType: 'launch'
  id?: string | null
  blockName?: string | null
  dateLabel?: string | null
  label?: string | null
  title?: string | null
  titleEmphasis?: string | null
  subtitle?: string | null
}

type AnyBlock = PhaseBlock | ChecklistBlock | LaunchBlock

// ── Phase color system ────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  build:     '#7BAE9A',
  integrate: '#A88FD4',
  touchup:   '#D4A06B',
  prep:      '#C97A7A',
  checklist: '#6B9FD4',
  launch:    '#C9A84C',
}

function blockColor(block: AnyBlock): string {
  if (block.blockType === 'launch')    return PHASE_COLORS.launch
  if (block.blockType === 'checklist') return PHASE_COLORS.checklist
  const color = (block as PhaseBlock).tagColor ?? 'build'
  return PHASE_COLORS[color] ?? PHASE_COLORS.build
}

function blockLabel(block: AnyBlock): string {
  if (block.blockType === 'launch')    return 'Launch'
  if (block.blockType === 'checklist') return 'Checklist'
  const p = block as PhaseBlock
  return p.tag ?? p.tagColor ?? 'Phase'
}

function blockTitle(block: AnyBlock): string {
  if (block.blockType === 'launch')    return (block as LaunchBlock).title ?? 'Site Launch'
  if (block.blockType === 'checklist') return (block as ChecklistBlock).title
  return (block as PhaseBlock).title
}

function blockDateRange(block: AnyBlock): string | null {
  if (block.blockType === 'phase')     return (block as PhaseBlock).dateRange
  if (block.blockType === 'launch')    return (block as LaunchBlock).dateLabel ?? null
  if (block.blockType === 'checklist') return (block as ChecklistBlock).dateLabel ?? null
  return null
}

// ── Label styles ─────────────────────────────────────────────────────────────

const labelClass = 'block text-[9px] font-bold tracking-[0.2em] uppercase text-[#6B6B6B] mb-1.5'
const inputClass = 'w-full px-3 py-2.5 text-sm bg-[#252525] border border-[#404040] rounded-xl text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#404040] focus:bg-[#2D2D2D] transition-all'

// ── Block row in left panel ───────────────────────────────────────────────────

interface BlockRowProps {
  block: AnyBlock
  index: number
  selected: boolean
  dragIndex: number | null
  overIndex: number | null
  onSelect: () => void
  onDelete: () => void
  onDragStart: (i: number) => void
  onDragOver: (e: React.DragEvent, i: number) => void
  onDrop: (i: number) => void
  onDragEnd: () => void
}

function BlockRow({
  block, index, selected, dragIndex, overIndex,
  onSelect, onDelete, onDragStart, onDragOver, onDrop, onDragEnd,
}: BlockRowProps) {
  const color = blockColor(block)
  const label = blockLabel(block)
  const title = blockTitle(block)
  const dateRange = blockDateRange(block)
  const isDragging = dragIndex === index
  const isOver = overIndex === index && dragIndex !== index

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer',
        'border transition-all duration-150',
        selected
          ? 'bg-[rgba(139,156,182,0.06)] border-[rgba(139,156,182,0.15)]'
          : 'bg-[rgba(255,255,255,0.02)] border-[#404040] hover:bg-[#2D2D2D] hover:border-[#404040]',
        isDragging && 'opacity-40',
        isOver && 'border-t-2 border-t-[rgba(139,156,182,0.60)]',
      )}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 cursor-grab active:cursor-grabbing text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors"
        onMouseDown={e => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </div>

      {/* Colored dot */}
      <div
        className="shrink-0 w-2 h-2 rounded-full"
        style={{ background: color, opacity: 0.8 }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[8px] font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded-full border"
            style={{
              color: `${color}BB`,
              borderColor: `${color}35`,
              background: `${color}0D`,
            }}
          >
            {label}
          </span>
          <span className="text-xs font-medium text-[#A0A0A0] truncate">{title}</span>
        </div>
        {dateRange && (
          <p className="text-[9px] text-[#4A4A4A] mt-0.5 truncate">{dateRange}</p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="shrink-0 size-5 rounded-lg flex items-center justify-center text-transparent group-hover:text-[#4A4A4A] hover:!text-red-400 hover:bg-red-400/10 transition-all"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

// ── Block type picker ─────────────────────────────────────────────────────────

interface BlockTypePickerProps {
  onPick: (type: 'phase' | 'checklist' | 'launch') => void
  onCancel: () => void
}

function BlockTypePicker({ onPick, onCancel }: BlockTypePickerProps) {
  const options: { type: 'phase' | 'checklist' | 'launch'; label: string; desc: string; color: string; Icon: React.ElementType }[] = [
    {
      type: 'phase',
      label: 'Phase Card',
      desc: 'A dated work phase with task items',
      color: PHASE_COLORS.build,
      Icon: LayoutList,
    },
    {
      type: 'checklist',
      label: 'Checklist',
      desc: 'Pre-launch requirements checklist',
      color: PHASE_COLORS.checklist,
      Icon: Check,
    },
    {
      type: 'launch',
      label: 'Launch',
      desc: 'The go-live milestone block',
      color: PHASE_COLORS.launch,
      Icon: Rocket,
    },
  ]

  return (
    <div className="p-3 rounded-xl border border-[#404040] bg-[#252525] space-y-3">
      <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#6B6B6B]">
        Choose block type
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ type, label, desc, color, Icon }) => (
          <button
            key={type}
            onClick={() => onPick(type)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border',
              'border-[#404040] bg-[rgba(255,255,255,0.02)]',
              'hover:bg-[#2D2D2D] hover:border-[#404040]',
              'transition-all duration-150 text-center',
            )}
          >
            <div
              className="size-7 rounded-lg flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}35` }}
            >
              <Icon className="size-3.5" style={{ color: `${color}CC` }} />
            </div>
            <span className="text-[9px] font-bold tracking-[0.06em] uppercase text-[#6B6B6B] leading-tight">
              {label}
            </span>
            <span className="text-[8px] text-[#4A4A4A] leading-tight">{desc}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="w-full text-[10px] text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors py-1"
      >
        Cancel
      </button>
    </div>
  )
}

// ── Phase block editor ────────────────────────────────────────────────────────

function PhaseEditor({
  block,
  onChange,
}: {
  block: PhaseBlock
  onChange: (updated: PhaseBlock) => void
}) {
  const tagColorOptions: { value: 'build' | 'integrate' | 'touchup' | 'prep'; label: string }[] = [
    { value: 'build',     label: 'Build — teal green' },
    { value: 'integrate', label: 'Integrate — purple' },
    { value: 'touchup',   label: 'Touch-Up — orange' },
    { value: 'prep',      label: 'Pre-Launch — red' },
  ]

  const updateItem = (i: number, text: string) => {
    const items = [...(block.items ?? [])]
    items[i] = { ...items[i], text }
    onChange({ ...block, items })
  }

  const removeItem = (i: number) => {
    const items = (block.items ?? []).filter((_, idx) => idx !== i)
    onChange({ ...block, items })
  }

  const addItem = () => {
    const items = [...(block.items ?? []), { text: '' }]
    onChange({ ...block, items })
  }

  return (
    <div className="space-y-4">
      {/* Date range + Tag label */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Date Range</label>
          <input
            value={block.dateRange ?? ''}
            onChange={e => onChange({ ...block, dateRange: e.target.value })}
            placeholder="Mar 2 – 6"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tag Label</label>
          <input
            value={block.tag ?? ''}
            onChange={e => onChange({ ...block, tag: e.target.value })}
            placeholder="Setup"
            className={inputClass}
          />
        </div>
      </div>

      {/* Tag color */}
      <div>
        <label className={labelClass}>Tag Color</label>
        <div className="grid grid-cols-2 gap-2">
          {tagColorOptions.map(opt => {
            const color = PHASE_COLORS[opt.value]
            const selected = (block.tagColor ?? 'build') === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onChange({ ...block, tagColor: opt.value })}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-left',
                  'transition-all duration-150',
                  selected
                    ? 'border-[#404040] bg-[#2D2D2D]'
                    : 'border-[#404040] bg-[rgba(255,255,255,0.02)] hover:border-[#404040] hover:bg-[#2D2D2D]',
                )}
              >
                <div className="size-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[9px] font-semibold text-[#6B6B6B] truncate">{opt.label}</span>
                {selected && <Check className="size-2.5 ml-auto shrink-0" style={{ color: 'var(--space-accent)', opacity: 0.7 }} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>Title <span className="text-[#4A4A4A]">*</span></label>
        <input
          value={block.title ?? ''}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Artist Setup"
          className={inputClass}
        />
      </div>

      {/* Items */}
      <div>
        <label className={labelClass}>Work Items</label>
        <div className="space-y-2">
          {(block.items ?? []).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={item.text}
                onChange={e => updateItem(i, e.target.value)}
                placeholder={`Item ${i + 1}`}
                className={cn(inputClass, 'flex-1')}
              />
              <button
                onClick={() => removeItem(i)}
                className="shrink-0 size-8 rounded-xl border border-[#404040] flex items-center justify-center text-[#4A4A4A] hover:text-red-400 hover:border-red-400/25 hover:bg-red-400/[0.06] transition-all"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed',
              'border-[#404040] text-[#4A4A4A] text-[10px] font-semibold tracking-[0.06em] uppercase',
              'hover:border-[rgba(139,156,182,0.18)] hover:text-[#1E3A6E] hover:bg-[rgba(255,255,255,0.02)]',
              'transition-all duration-150',
            )}
          >
            <Plus className="size-3" />
            Add item
          </button>
        </div>
      </div>

      {/* Dealer pill */}
      <div className="p-3 rounded-xl border border-[#404040] bg-[rgba(255,255,255,0.02)] space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onChange({
                ...block,
                dealerPill: {
                  ...block.dealerPill,
                  enabled: !(block.dealerPill?.enabled ?? false),
                },
              })
            }
            className={cn(
              'relative inline-flex h-4 w-7 shrink-0 rounded-full border transition-colors',
              block.dealerPill?.enabled
                ? 'bg-[rgba(139,156,182,0.25)] border-[rgba(139,156,182,0.25)]'
                : 'bg-[#2D2D2D] border-[#404040]',
            )}
          >
            <span
              className={cn(
                'inline-block size-3 rounded-full bg-white transition-transform mt-[0.5px]',
                block.dealerPill?.enabled ? 'translate-x-3' : 'translate-x-0.5',
              )}
            />
          </button>
          <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#6B6B6B]">
            Notification Pill
          </label>
        </div>
        {block.dealerPill?.enabled && (
          <input
            value={block.dealerPill?.text ?? ''}
            onChange={e =>
              onChange({
                ...block,
                dealerPill: { ...block.dealerPill, text: e.target.value },
              })
            }
            placeholder="End of week — Soft launch to select dealers for testing"
            className={inputClass}
          />
        )}
      </div>
    </div>
  )
}

// ── Checklist block editor ────────────────────────────────────────────────────

function ChecklistEditor({
  block,
  onChange,
}: {
  block: ChecklistBlock
  onChange: (updated: ChecklistBlock) => void
}) {
  const updateItem = (i: number, field: 'text' | 'note', value: string) => {
    const items = [...(block.items ?? [])]
    items[i] = { ...items[i], [field]: value }
    onChange({ ...block, items })
  }

  const removeItem = (i: number) => {
    const items = (block.items ?? []).filter((_, idx) => idx !== i)
    onChange({ ...block, items })
  }

  const addItem = () => {
    const items = [...(block.items ?? []), { text: '' }]
    onChange({ ...block, items })
  }

  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(
    new Set(
      (block.items ?? [])
        .map((item, i) => (item.note ? i : -1))
        .filter(i => i >= 0),
    ),
  )

  const toggleNote = (i: number) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
        // clear the note value
        updateItem(i, 'note', '')
      } else {
        next.add(i)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Date label + tag */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Date Label</label>
          <input
            value={block.dateLabel ?? ''}
            onChange={e => onChange({ ...block, dateLabel: e.target.value })}
            placeholder="Pre-Launch Checklist"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tag Label</label>
          <input
            value={block.tag ?? ''}
            onChange={e => onChange({ ...block, tag: e.target.value })}
            placeholder="Must Complete"
            className={inputClass}
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>Title <span className="text-[#4A4A4A]">*</span></label>
        <input
          value={block.title ?? ''}
          onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="Launch Requirements"
          className={inputClass}
        />
      </div>

      {/* Items */}
      <div>
        <label className={labelClass}>Checklist Items</label>
        <div className="space-y-2">
          {(block.items ?? []).map((item, i) => (
            <div key={i} className="rounded-xl border border-[#404040] bg-[rgba(255,255,255,0.02)] overflow-hidden">
              <div className="flex items-center gap-2 p-2">
                <input
                  value={item.text}
                  onChange={e => updateItem(i, 'text', e.target.value)}
                  placeholder={`Checklist item ${i + 1}`}
                  className="flex-1 px-2 py-1.5 text-sm bg-transparent text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:outline-none"
                />
                <button
                  onClick={() => toggleNote(i)}
                  className={cn(
                    'shrink-0 text-[8px] font-bold tracking-[0.08em] uppercase px-2 py-1 rounded-lg border transition-all',
                    expandedNotes.has(i)
                      ? 'border-amber-400/25 text-amber-400/70 bg-amber-400/[0.06]'
                      : 'border-[#404040] text-[#4A4A4A] hover:text-[#6B6B6B] hover:border-[#404040]',
                  )}
                >
                  {expandedNotes.has(i) ? 'Note ✓' : '+ Note'}
                </button>
                <button
                  onClick={() => removeItem(i)}
                  className="shrink-0 size-7 rounded-lg flex items-center justify-center text-[#4A4A4A] hover:text-red-400 hover:bg-red-400/[0.06] transition-all"
                >
                  <X className="size-3" />
                </button>
              </div>
              {expandedNotes.has(i) && (
                <div className="px-2 pb-2 border-t border-[#404040]">
                  <input
                    value={item.note ?? ''}
                    onChange={e => updateItem(i, 'note', e.target.value)}
                    placeholder="Warning note shown below item"
                    className="w-full px-2 py-1.5 text-xs bg-transparent text-amber-400/60 placeholder:text-[#4A4A4A] focus:outline-none"
                  />
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addItem}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed',
              'border-[#404040] text-[#4A4A4A] text-[10px] font-semibold tracking-[0.06em] uppercase',
              'hover:border-[rgba(139,156,182,0.18)] hover:text-[#1E3A6E] hover:bg-[rgba(255,255,255,0.02)]',
              'transition-all duration-150',
            )}
          >
            <Plus className="size-3" />
            Add checklist item
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Launch block editor ───────────────────────────────────────────────────────

function LaunchEditor({
  block,
  onChange,
}: {
  block: LaunchBlock
  onChange: (updated: LaunchBlock) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Date Label</label>
          <input
            value={block.dateLabel ?? ''}
            onChange={e => onChange({ ...block, dateLabel: e.target.value })}
            placeholder="Early – Mid April"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Label (above title)</label>
          <input
            value={block.label ?? ''}
            onChange={e => onChange({ ...block, label: e.target.value })}
            placeholder="Go Live"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Title</label>
          <input
            value={block.title ?? ''}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="Site"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Title Emphasis <span className="text-[#4A4A4A] normal-case tracking-normal font-normal italic">(italic gold)</span></label>
          <input
            value={block.titleEmphasis ?? ''}
            onChange={e => onChange({ ...block, titleEmphasis: e.target.value })}
            placeholder="Launch"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Subtitle</label>
        <input
          value={block.subtitle ?? ''}
          onChange={e => onChange({ ...block, subtitle: e.target.value })}
          placeholder="Public · Full Release"
          className={inputClass}
        />
      </div>
    </div>
  )
}

// ── Block detail editor dispatcher ───────────────────────────────────────────

function BlockDetailEditor({
  block,
  onChange,
}: {
  block: AnyBlock
  onChange: (updated: AnyBlock) => void
}) {
  const color = blockColor(block)
  const label = blockLabel(block)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#404040]">
        <div
          className="size-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}35` }}
        >
          {block.blockType === 'phase' && <LayoutList className="size-3.5" style={{ color: `${color}CC` }} />}
          {block.blockType === 'checklist' && <Check className="size-3.5" style={{ color: `${color}CC` }} />}
          {block.blockType === 'launch' && <Rocket className="size-3.5" style={{ color: `${color}CC` }} />}
        </div>
        <div>
          <p className="text-[8px] font-bold tracking-[0.18em] uppercase" style={{ color: `${color}80` }}>
            {label} Block
          </p>
          <p className="text-sm font-semibold text-[#A0A0A0] leading-snug mt-0.5">
            {blockTitle(block)}
          </p>
        </div>
      </div>

      {block.blockType === 'phase' && (
        <PhaseEditor block={block as PhaseBlock} onChange={b => onChange(b)} />
      )}
      {block.blockType === 'checklist' && (
        <ChecklistEditor block={block as ChecklistBlock} onChange={b => onChange(b)} />
      )}
      {block.blockType === 'launch' && (
        <LaunchEditor block={block as LaunchBlock} onChange={b => onChange(b)} />
      )}
    </div>
  )
}

// ── Default blocks ────────────────────────────────────────────────────────────

function makeDefaultBlock(type: 'phase' | 'checklist' | 'launch'): AnyBlock {
  if (type === 'phase') {
    return {
      blockType: 'phase',
      dateRange: '',
      tag: '',
      tagColor: 'build',
      title: 'New Phase',
      items: [],
      dealerPill: { enabled: false, text: '' },
    } satisfies PhaseBlock
  }
  if (type === 'checklist') {
    return {
      blockType: 'checklist',
      dateLabel: '',
      tag: 'Must Complete',
      title: 'New Checklist',
      items: [],
    } satisfies ChecklistBlock
  }
  return {
    blockType: 'launch',
    dateLabel: 'Early – Mid April',
    label: 'Go Live',
    title: 'Site',
    titleEmphasis: 'Launch',
    subtitle: 'Public · Full Release',
  } satisfies LaunchBlock
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  timeline: Timeline
  onClose: () => void
  onSave: (updated: Timeline) => void
}

export function TimelinesBlockEditor({ timeline, onClose, onSave }: Props) {
  const [blocks, setBlocks] = useState<AnyBlock[]>(() =>
    ((timeline.phases ?? []) as AnyBlock[]).map(b => ({ ...b })),
  )
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    blocks.length > 0 ? 0 : null,
  )
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragCounter = useRef(0)

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((i: number) => {
    setDragIndex(i)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, i: number) => {
    e.preventDefault()
    setOverIndex(i)
  }, [])

  const handleDrop = useCallback(
    (dropIndex: number) => {
      if (dragIndex === null || dragIndex === dropIndex) return
      const newBlocks = [...blocks]
      const [moved] = newBlocks.splice(dragIndex, 1)
      newBlocks.splice(dropIndex, 0, moved)
      setBlocks(newBlocks)
      // Keep selection on the moved block
      setSelectedIndex(dropIndex)
      setDragIndex(null)
      setOverIndex(null)
    },
    [dragIndex, blocks],
  )

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setOverIndex(null)
  }, [])

  // ── Block mutations ───────────────────────────────────────────────────────

  const updateBlock = useCallback(
    (i: number, updated: AnyBlock) => {
      setBlocks(prev => prev.map((b, idx) => (idx === i ? updated : b)))
    },
    [],
  )

  const deleteBlock = useCallback(
    (i: number) => {
      setBlocks(prev => {
        const next = prev.filter((_, idx) => idx !== i)
        return next
      })
      setSelectedIndex(prev => {
        if (prev === null) return null
        if (prev === i) return blocks.length > 1 ? Math.max(0, i - 1) : null
        if (prev > i) return prev - 1
        return prev
      })
    },
    [blocks.length],
  )

  const addBlock = useCallback(
    (type: 'phase' | 'checklist' | 'launch') => {
      const newBlock = makeDefaultBlock(type)
      setBlocks(prev => [...prev, newBlock])
      setSelectedIndex(blocks.length)
      setShowPicker(false)
    },
    [blocks.length],
  )

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/timelines/${timeline.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phases: blocks }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message ?? `Error ${res.status}`)
      }
      const data = await res.json()
      const updated: Timeline = data?.doc ?? data
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
      onSave(updated)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedBlock = selectedIndex !== null ? blocks[selectedIndex] ?? null : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#1C1C1C' }}>
      {/* ── Top toolbar ── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-[#404040]"
        style={{ background: '#252525' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="size-8 rounded-xl border border-[#404040] flex items-center justify-center text-[#6B6B6B] hover:text-[#F0F0F0] hover:border-[#404040] transition-all"
        >
          <X className="size-4" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-[#4A4A4A]">
            Block Editor
          </p>
          <h2 className="text-sm font-bold text-[#F0F0F0] leading-none truncate">
            {timeline.title}
            {timeline.titleEmphasis && (
              <em className="not-italic font-semibold ml-1.5" style={{ color: 'var(--space-accent)', opacity: 0.65 }}>
                {timeline.titleEmphasis}
              </em>
            )}
          </h2>
        </div>

        {/* Block count badge */}
        <span className="hidden sm:inline text-[8px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border border-[rgba(139,156,182,0.15)] text-[#6B6B6B] bg-[rgba(139,156,182,0.06)]">
          {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
        </span>

        {/* Error indicator */}
        {error && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="size-3.5 shrink-0" />
            <span className="truncate max-w-48">{error}</span>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold',
            'transition-all duration-150',
            saveSuccess
              ? 'bg-emerald-500/[0.15] border border-emerald-500/30 text-emerald-400'
              : 'bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)] text-[#1E3A6E] hover:bg-[rgba(139,156,182,0.10)] hover:border-[rgba(139,156,182,0.22)]',
            'disabled:opacity-40 disabled:pointer-events-none',
          )}
        >
          {saving ? (
            <span className="flex items-center gap-1.5">
              <span className="size-3.5 rounded-full border-2 border-[rgba(139,156,182,0.20)] border-t-[#1E3A6E] animate-spin" />
              Saving…
            </span>
          ) : saveSuccess ? (
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5" />
              Saved
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Save className="size-3.5" />
              Save Changes
            </span>
          )}
        </button>
      </div>

      {/* Mobile error */}
      {error && (
        <div className="sm:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-red-500/15 bg-red-500/[0.06]">
          <AlertCircle className="size-3.5 shrink-0 text-red-400" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}

      {/* ── Body: left panel + right panel ── */}
      <div className="flex-1 flex flex-col sm:flex-row min-h-0">

        {/* ── Left panel: block list ── */}
        <div
          className={cn(
            'flex flex-col border-[#404040]',
            'sm:w-80 sm:shrink-0 sm:border-r',
            // Mobile: fixed height, scrollable
            'h-48 sm:h-auto border-b sm:border-b-0 overflow-y-auto',
          )}
          style={{ background: '#252525' }}
        >
          <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {blocks.length === 0 && !showPicker && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="size-10 rounded-2xl border border-[#404040] bg-[rgba(255,255,255,0.02)] flex items-center justify-center mb-3">
                  <LayoutList className="size-4 text-[#4A4A4A]" />
                </div>
                <p className="text-xs text-[#4A4A4A] mb-1">No blocks yet</p>
                <p className="text-[10px] text-[#4A4A4A]">Add a block below to get started</p>
              </div>
            )}

            {blocks.map((block, i) => (
              <BlockRow
                key={i}
                block={block}
                index={i}
                selected={selectedIndex === i}
                dragIndex={dragIndex}
                overIndex={overIndex}
                onSelect={() => {
                  setSelectedIndex(i)
                  setShowPicker(false)
                }}
                onDelete={() => deleteBlock(i)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            ))}

            {/* Add block / type picker */}
            <div className="pt-1">
              {showPicker ? (
                <BlockTypePicker
                  onPick={addBlock}
                  onCancel={() => setShowPicker(false)}
                />
              ) : (
                <button
                  onClick={() => setShowPicker(true)}
                  className={cn(
                    'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed',
                    'border-[#404040] text-[#4A4A4A] text-[10px] font-semibold tracking-[0.08em] uppercase',
                    'hover:border-[rgba(139,156,182,0.18)] hover:text-[#1E3A6E] hover:bg-[rgba(255,255,255,0.02)]',
                    'transition-all duration-150',
                  )}
                >
                  <Plus className="size-3" />
                  Add Block
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right panel: block detail editor ── */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ background: '#1C1C1C' }}>
          {selectedBlock !== null && selectedIndex !== null ? (
            <div className="max-w-2xl mx-auto p-4 sm:p-6">
              <BlockDetailEditor
                block={selectedBlock}
                onChange={updated => updateBlock(selectedIndex, updated)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
              <div className="size-12 rounded-2xl border border-[#404040] bg-[rgba(255,255,255,0.02)] flex items-center justify-center mb-4">
                <ChevronRight className="size-5 text-[#4A4A4A]" />
              </div>
              <p className="text-sm font-semibold text-[#4A4A4A] mb-1">
                {blocks.length === 0 ? 'Add your first block' : 'Select a block to edit'}
              </p>
              <p className="text-xs text-[#4A4A4A] max-w-xs leading-relaxed">
                {blocks.length === 0
                  ? 'Click "+ Add Block" in the left panel to start building your timeline.'
                  : 'Click any block in the list on the left to edit its details.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

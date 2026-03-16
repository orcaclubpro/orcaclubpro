'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText, FilePen, Search, Trash2, ExternalLink, Plus,
  Loader2, X, ChevronDown, FolderOpen, FileCheck,
  Building2, User, Printer, Save, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createDocument, deleteFileRecord } from '@/actions/files'
import {
  buildPersonalNdaHtml, buildOrcaclubNdaHtml,
  buildPersonalSowHtml, buildOrcaclubSowHtml,
} from '@/lib/document-generators'
import type { NdaFormData, SowFormData } from '@/lib/document-generators'

// ── Types ──────────────────────────────────────────────────────────────────────

interface FileRecord {
  id: string
  name: string
  fileType?: string | null
  description?: string | null
  project?: { id: string; name: string } | string | null
  sprint?: { id: string; name: string } | string | null
  documentTemplate?: 'nda' | 'sow' | null
  documentBrand?: 'personal' | 'orcaclub' | null
  documentData?: any
  file?: any
  createdAt: string
}

interface ProjectOption { id: string; name: string }
interface SprintOption { id: string; name: string; project?: string | { id: string } }

interface FilesViewProps {
  allFiles: FileRecord[]
  allProjects: ProjectOption[]
  allSprints: SprintOption[]
}

// ── Default form states ─────────────────────────────────────────────────────────

const defaultNda = (): NdaFormData => ({
  effectiveDate: new Date().toISOString().split('T')[0],
  clientName: '',
  clientType: 'company',
  clientAddress: '',
})

const defaultSow = (): SowFormData => ({
  providerContact: '',
  clientName: '',
  clientContact: '',
  effectiveDate: new Date().toISOString().split('T')[0],
  projectName: '',
  projectOverview: '',
  scopeItems: ['', ''],
  milestones: [{ name: '', date: '', notes: '' }],
  pricingType: 'project',
  projectItems: [{ desc: '', amount: '' }, { desc: '', amount: '' }],
  retainerItems: [{ desc: '', amount: '' }],
  billingCycle: 'Monthly',
  contractTerm: '3 months',
  netDays: '30',
  depositPct: '50',
  lateFee: '1.5',
  revisionRounds: '2',
  revisionRate: '',
})

// ── Helpers ─────────────────────────────────────────────────────────────────────

function getProjectId(rec: FileRecord): string {
  if (!rec.project) return ''
  return typeof rec.project === 'object' ? rec.project.id : rec.project
}

function getProjectName(rec: FileRecord): string {
  if (!rec.project || typeof rec.project !== 'object') return ''
  return rec.project.name
}

function getSprintName(rec: FileRecord): string {
  if (!rec.sprint || typeof rec.sprint !== 'object') return ''
  return rec.sprint.name
}

function getSprintProjectId(s: SprintOption): string {
  if (!s.project) return ''
  return typeof s.project === 'object' ? s.project.id : s.project
}

function docTypeLabel(t?: string | null) {
  if (t === 'nda') return 'NDA'
  if (t === 'sow') return 'SOW'
  return null
}

function fileTypeIcon(rec: FileRecord) {
  if (rec.documentTemplate) return <FilePen className="size-4 text-[var(--space-accent)]" />
  return <FileText className="size-4 text-gray-500" />
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldGroup({ label, children, col = '' }: { label: string; children: React.ReactNode; col?: string }) {
  return (
    <div className={col}>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#5A5A5A] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function FormInput({
  value, onChange, placeholder, type = 'text', className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#F0F0F0] placeholder-[#4A4A4A] outline-none focus:border-[var(--space-accent)] transition-colors',
        className,
      )}
    />
  )
}

function FormTextarea({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#F0F0F0] placeholder-[#4A4A4A] outline-none focus:border-[var(--space-accent)] transition-colors resize-y"
    />
  )
}

function FormSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#F0F0F0] outline-none focus:border-[var(--space-accent)] transition-colors appearance-none pr-8"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#5A5A5A] pointer-events-none" />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--space-accent)] border-b border-[#222] pb-1.5 mb-3">
      {children}
    </p>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function FilesView({ allFiles, allProjects, allSprints }: FilesViewProps) {
  const [files, setFiles] = useState<FileRecord[]>(allFiles)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  // Generator state
  const [docType, setDocType] = useState<'nda' | 'sow'>('nda')
  const [brand, setBrand] = useState<'personal' | 'orcaclub'>('orcaclub')
  const [ndaForm, setNdaForm] = useState<NdaFormData>(defaultNda())
  const [sowForm, setSowForm] = useState<SowFormData>(defaultSow())
  const [assignProject, setAssignProject] = useState('')
  const [assignSprint, setAssignSprint] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Sprints filtered by selected project
  const availableSprints = useMemo(() => {
    if (!assignProject) return allSprints
    return allSprints.filter(s => getSprintProjectId(s) === assignProject)
  }, [allSprints, assignProject])

  // Filtered file list
  const filtered = useMemo(() => {
    return files.filter(f => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterProject && getProjectId(f) !== filterProject) return false
      if (filterType) {
        if (filterType === 'generated' && !f.documentTemplate) return false
        if (filterType === 'uploaded' && f.documentTemplate) return false
        if (filterType === 'nda' && f.documentTemplate !== 'nda') return false
        if (filterType === 'sow' && f.documentTemplate !== 'sow') return false
      }
      return true
    })
  }, [files, search, filterProject, filterType])

  function openModal() {
    setSaveSuccess(false)
    setAssignProject('')
    setAssignSprint('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSaveSuccess(false)
  }

  function handlePrint() {
    const html = docType === 'nda'
      ? (brand === 'personal' ? buildPersonalNdaHtml(ndaForm) : buildOrcaclubNdaHtml(ndaForm))
      : (brand === 'personal' ? buildPersonalSowHtml(sowForm) : buildOrcaclubSowHtml(sowForm))

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Please allow popups to generate the PDF.'); return }
    win.document.write(html)
    // Clear the title so the browser print header shows nothing on the left
    win.document.title = ''
    win.document.close()
    win.focus()
    setTimeout(() => { try { win.print() } catch { /* noop */ } }, 700)
  }

  function handleSave() {
    const data = docType === 'nda' ? ndaForm : sowForm
    const docName = docType === 'nda'
      ? `NDA — ${ndaForm.clientName || 'Client'} (${brand === 'orcaclub' ? 'ORCACLUB' : 'Personal'})`
      : `SOW — ${sowForm.projectName || sowForm.clientName || 'Project'} (${brand === 'orcaclub' ? 'ORCACLUB' : 'Personal'})`

    startTransition(async () => {
      const result = await createDocument({
        name: docName,
        documentTemplate: docType,
        documentBrand: brand,
        documentData: data,
        projectId: assignProject || undefined,
        sprintId: assignSprint || undefined,
      })

      if (result.success && result.id) {
        const newRecord: FileRecord = {
          id: result.id,
          name: docName,
          fileType: 'document',
          documentTemplate: docType,
          documentBrand: brand,
          documentData: data,
          project: assignProject ? allProjects.find(p => p.id === assignProject) ?? assignProject : null,
          sprint: assignSprint ? availableSprints.find(s => s.id === assignSprint) ?? assignSprint : null,
          createdAt: new Date().toISOString(),
        }
        setFiles(prev => [newRecord, ...prev])
        setSaveSuccess(true)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this file record?')) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteFileRecord(id)
      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== id))
      }
      setDeletingId(null)
    })
  }

  function handleRegenerate(rec: FileRecord) {
    if (!rec.documentTemplate || !rec.documentData) return
    setDocType(rec.documentTemplate)
    setBrand((rec.documentBrand as any) ?? 'orcaclub')
    if (rec.documentTemplate === 'nda') {
      setNdaForm({ ...defaultNda(), ...rec.documentData })
    } else {
      setSowForm({ ...defaultSow(), ...rec.documentData })
    }
    setAssignProject(getProjectId(rec))
    setSaveSuccess(false)
    setModalOpen(true)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#F0F0F0] tracking-tight">Files &amp; Documents</h1>
          <p className="text-xs text-[#5A5A5A] mt-0.5">Generate, manage, and assign documents to projects</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--space-accent)] text-black text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Generate Document</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#5A5A5A]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-[#111] border border-[#282828] rounded-xl pl-8 pr-3 py-2 text-sm text-[#F0F0F0] placeholder-[#4A4A4A] outline-none focus:border-[#333] transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="bg-[#111] border border-[#282828] rounded-xl px-3 py-2 text-sm text-[#A0A0A0] outline-none appearance-none pr-7 focus:border-[#333]"
          >
            <option value="">All Projects</option>
            {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-[#5A5A5A] pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#111] border border-[#282828] rounded-xl px-3 py-2 text-sm text-[#A0A0A0] outline-none appearance-none pr-7 focus:border-[#333]"
          >
            <option value="">All Types</option>
            <option value="generated">Generated Docs</option>
            <option value="uploaded">Uploaded Files</option>
            <option value="nda">NDA</option>
            <option value="sow">SOW</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-[#5A5A5A] pointer-events-none" />
        </div>
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="size-10 text-[#2A2A2A] mb-3" />
          <p className="text-sm text-[#4A4A4A]">No files found</p>
          <button onClick={openModal} className="mt-4 text-xs text-[var(--space-accent)] hover:underline">
            Generate your first document
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E1E1E] overflow-hidden">
          {filtered.map((rec, i) => (
            <div
              key={rec.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors',
                i < filtered.length - 1 && 'border-b border-[#1A1A1A]',
              )}
            >
              <div className="shrink-0">{fileTypeIcon(rec)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#E0E0E0] truncate">{rec.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {rec.documentTemplate && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--space-accent)]">
                      {docTypeLabel(rec.documentTemplate)}
                    </span>
                  )}
                  {rec.documentBrand && (
                    <span className="text-[10px] text-[#4A4A4A]">
                      {rec.documentBrand === 'orcaclub' ? 'ORCACLUB' : 'Personal'}
                    </span>
                  )}
                  {getProjectName(rec) && (
                    <span className="text-[10px] text-[#5A5A5A] flex items-center gap-0.5">
                      <FolderOpen className="size-2.5" />
                      {getProjectName(rec)}
                    </span>
                  )}
                  {getSprintName(rec) && (
                    <span className="text-[10px] text-[#5A5A5A]">· {getSprintName(rec)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {rec.documentTemplate && rec.documentData && (
                  <button
                    onClick={() => handleRegenerate(rec)}
                    title="Edit & regenerate"
                    className="p-1.5 rounded-lg text-[#5A5A5A] hover:text-[var(--space-accent)] hover:bg-[#181818] transition-colors"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                )}
                {rec.file && (
                  <a
                    href={typeof rec.file === 'object' ? rec.file.url : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-[#5A5A5A] hover:text-[#F0F0F0] hover:bg-[#181818] transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(rec.id)}
                  disabled={deletingId === rec.id}
                  className="p-1.5 rounded-lg text-[#5A5A5A] hover:text-red-400 hover:bg-[#181818] transition-colors disabled:opacity-40"
                >
                  {deletingId === rec.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Generator Modal — rendered via portal to escape stacking context */}
      {modalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center px-0 sm:px-4 pb-[76px] sm:pb-4 pt-0 sm:pt-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full sm:max-w-2xl bg-[#0E0E0E] border border-[#222] rounded-2xl flex flex-col max-h-[calc(100dvh-76px)] sm:max-h-[88dvh] overflow-hidden shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1A1A1A] shrink-0">
              <div className="flex items-center gap-3">
                <FilePen className="size-4 text-[var(--space-accent)]" />
                <span className="text-sm font-semibold text-[#F0F0F0]">Document Generator</span>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-[#5A5A5A] hover:text-[#F0F0F0] hover:bg-[#181818] transition-colors">
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

              {/* Doc type + Brand selector */}
              <div className="grid grid-cols-2 gap-3">
                {/* Doc type */}
                <div>
                  <SectionLabel>Document Type</SectionLabel>
                  <div className="flex gap-2">
                    {(['nda', 'sow'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setDocType(t)}
                        className={cn(
                          'flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all',
                          docType === t
                            ? 'bg-[var(--space-accent)]/10 border-[var(--space-accent)]/40 text-[var(--space-accent)]'
                            : 'bg-[#141414] border-[#282828] text-[#5A5A5A] hover:border-[#333]',
                        )}
                      >
                        {t === 'nda' ? 'NDA' : 'Scope of Work'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <SectionLabel>Branding</SectionLabel>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBrand('orcaclub')}
                      className={cn(
                        'flex-1 py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1',
                        brand === 'orcaclub'
                          ? 'bg-[var(--space-accent)]/10 border-[var(--space-accent)]/40 text-[var(--space-accent)]'
                          : 'bg-[#141414] border-[#282828] text-[#5A5A5A] hover:border-[#333]',
                      )}
                    >
                      <Building2 className="size-3" />
                      ORCACLUB
                    </button>
                    <button
                      onClick={() => setBrand('personal')}
                      className={cn(
                        'flex-1 py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1',
                        brand === 'personal'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-[#141414] border-[#282828] text-[#5A5A5A] hover:border-[#333]',
                      )}
                    >
                      <User className="size-3" />
                      Personal
                    </button>
                  </div>
                </div>
              </div>

              {/* NDA Form */}
              {docType === 'nda' && (
                <div className="space-y-3">
                  <SectionLabel>Client Information</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="Effective Date" col="col-span-1">
                      <FormInput type="date" value={ndaForm.effectiveDate} onChange={v => setNdaForm(f => ({ ...f, effectiveDate: v }))} />
                    </FieldGroup>
                    <FieldGroup label="Client Type" col="col-span-1">
                      <FormSelect
                        value={ndaForm.clientType}
                        onChange={v => setNdaForm(f => ({ ...f, clientType: v as any }))}
                        options={[{ value: 'company', label: 'Company / Entity' }, { value: 'individual', label: 'Individual' }]}
                      />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Client Full Name or Business Name">
                    <FormInput value={ndaForm.clientName} onChange={v => setNdaForm(f => ({ ...f, clientName: v }))} placeholder="e.g. Acme Corp or Jane Smith" />
                  </FieldGroup>
                  <FieldGroup label="Client Address">
                    <FormInput value={ndaForm.clientAddress} onChange={v => setNdaForm(f => ({ ...f, clientAddress: v }))} placeholder="Street, City, State, ZIP" />
                  </FieldGroup>
                  {brand === 'personal' && (
                    <p className="text-[10px] text-[#4A4A4A] bg-[#141414] border border-[#222] rounded-lg px-3 py-2">
                      Personal version includes Kawai America employer firewall clauses specific to Chance Noonan.
                    </p>
                  )}
                </div>
              )}

              {/* SOW Form */}
              {docType === 'sow' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <SectionLabel>Parties</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldGroup label="Effective Date">
                        <FormInput type="date" value={sowForm.effectiveDate} onChange={v => setSowForm(f => ({ ...f, effectiveDate: v }))} />
                      </FieldGroup>
                      <FieldGroup label={brand === 'orcaclub' ? 'ORCACLUB Contact' : 'Your Contact (Email/Phone)'}>
                        <FormInput value={sowForm.providerContact} onChange={v => setSowForm(f => ({ ...f, providerContact: v }))} placeholder="e.g. team@orcaclub.pro" />
                      </FieldGroup>
                      <FieldGroup label="Client Name">
                        <FormInput value={sowForm.clientName} onChange={v => setSowForm(f => ({ ...f, clientName: v }))} placeholder="Full legal name or company" />
                      </FieldGroup>
                      <FieldGroup label="Client Contact">
                        <FormInput value={sowForm.clientContact} onChange={v => setSowForm(f => ({ ...f, clientContact: v }))} placeholder="Email / Phone" />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Project Name">
                      <FormInput value={sowForm.projectName} onChange={v => setSowForm(f => ({ ...f, projectName: v }))} placeholder="Short, descriptive project title" />
                    </FieldGroup>
                  </div>

                  <div className="space-y-2">
                    <SectionLabel>Project Overview</SectionLabel>
                    <FormTextarea value={sowForm.projectOverview} onChange={v => setSowForm(f => ({ ...f, projectOverview: v }))} placeholder="Brief description of what this engagement covers, goals, and expected outcomes..." />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel>Scope of Work</SectionLabel>
                      <button
                        onClick={() => setSowForm(f => ({ ...f, scopeItems: [...f.scopeItems, ''] }))}
                        className="text-[10px] text-[var(--space-accent)] hover:underline"
                      >+ Add Item</button>
                    </div>
                    {sowForm.scopeItems.map((item, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-[10px] text-[#4A4A4A] w-4 shrink-0">{i + 1}.</span>
                        <FormInput
                          value={item}
                          onChange={v => setSowForm(f => ({ ...f, scopeItems: f.scopeItems.map((x, j) => j === i ? v : x) }))}
                          placeholder={`Deliverable or task ${i + 1}`}
                        />
                        {sowForm.scopeItems.length > 1 && (
                          <button
                            onClick={() => setSowForm(f => ({ ...f, scopeItems: f.scopeItems.filter((_, j) => j !== i) }))}
                            className="shrink-0 text-[#5A5A5A] hover:text-red-400 transition-colors"
                          ><X className="size-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel>Milestones</SectionLabel>
                      <button
                        onClick={() => setSowForm(f => ({ ...f, milestones: [...f.milestones, { name: '', date: '', notes: '' }] }))}
                        className="text-[10px] text-[var(--space-accent)] hover:underline"
                      >+ Add</button>
                    </div>
                    {sowForm.milestones.map((m, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 items-center">
                        <div className="col-span-2">
                          <FormInput value={m.name} onChange={v => setSowForm(f => ({ ...f, milestones: f.milestones.map((x, j) => j === i ? { ...x, name: v } : x) }))} placeholder="Milestone name" />
                        </div>
                        <FormInput type="date" value={m.date} onChange={v => setSowForm(f => ({ ...f, milestones: f.milestones.map((x, j) => j === i ? { ...x, date: v } : x) }))} />
                        <div className="col-span-1">
                          <FormInput value={m.notes} onChange={v => setSowForm(f => ({ ...f, milestones: f.milestones.map((x, j) => j === i ? { ...x, notes: v } : x) }))} placeholder="Notes" />
                        </div>
                        {sowForm.milestones.length > 1 && (
                          <button onClick={() => setSowForm(f => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }))} className="text-[#5A5A5A] hover:text-red-400 transition-colors justify-self-center">
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <SectionLabel>Pricing</SectionLabel>
                    <div className="flex gap-2">
                      {(['project', 'retainer', 'both'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setSowForm(f => ({ ...f, pricingType: t }))}
                          className={cn(
                            'flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all',
                            sowForm.pricingType === t
                              ? 'bg-[var(--space-accent)]/10 border-[var(--space-accent)]/40 text-[var(--space-accent)]'
                              : 'bg-[#141414] border-[#282828] text-[#5A5A5A] hover:border-[#333]',
                          )}
                        >
                          {t === 'project' ? 'Project' : t === 'retainer' ? 'Retainer' : 'Both'}
                        </button>
                      ))}
                    </div>

                    {(sowForm.pricingType === 'project' || sowForm.pricingType === 'both') && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-[#5A5A5A] uppercase tracking-widest">Project Line Items</p>
                        {sowForm.projectItems.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <FormInput value={item.desc} onChange={v => setSowForm(f => ({ ...f, projectItems: f.projectItems.map((x, j) => j === i ? { ...x, desc: v } : x) }))} placeholder="Description" />
                            <FormInput value={item.amount} onChange={v => setSowForm(f => ({ ...f, projectItems: f.projectItems.map((x, j) => j === i ? { ...x, amount: v } : x) }))} placeholder="$0.00" className="w-24 shrink-0 text-right" />
                            {sowForm.projectItems.length > 1 && (
                              <button onClick={() => setSowForm(f => ({ ...f, projectItems: f.projectItems.filter((_, j) => j !== i) }))} className="shrink-0 text-[#5A5A5A] hover:text-red-400"><X className="size-3.5" /></button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => setSowForm(f => ({ ...f, projectItems: [...f.projectItems, { desc: '', amount: '' }] }))} className="text-[10px] text-[var(--space-accent)] hover:underline">+ Add Line Item</button>
                      </div>
                    )}

                    {(sowForm.pricingType === 'retainer' || sowForm.pricingType === 'both') && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-[#5A5A5A] uppercase tracking-widest">Retainer Line Items</p>
                        {sowForm.retainerItems.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <FormInput value={item.desc} onChange={v => setSowForm(f => ({ ...f, retainerItems: f.retainerItems.map((x, j) => j === i ? { ...x, desc: v } : x) }))} placeholder="Monthly service" />
                            <FormInput value={item.amount} onChange={v => setSowForm(f => ({ ...f, retainerItems: f.retainerItems.map((x, j) => j === i ? { ...x, amount: v } : x) }))} placeholder="$/mo" className="w-24 shrink-0 text-right" />
                            {sowForm.retainerItems.length > 1 && (
                              <button onClick={() => setSowForm(f => ({ ...f, retainerItems: f.retainerItems.filter((_, j) => j !== i) }))} className="shrink-0 text-[#5A5A5A] hover:text-red-400"><X className="size-3.5" /></button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => setSowForm(f => ({ ...f, retainerItems: [...f.retainerItems, { desc: '', amount: '' }] }))} className="text-[10px] text-[var(--space-accent)] hover:underline">+ Add Line Item</button>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <FieldGroup label="Billing Cycle">
                            <FormSelect value={sowForm.billingCycle} onChange={v => setSowForm(f => ({ ...f, billingCycle: v }))} options={[{ value: 'Weekly', label: 'Weekly' }, { value: 'Bi-Weekly', label: 'Bi-Weekly' }, { value: 'Monthly', label: 'Monthly' }]} />
                          </FieldGroup>
                          <FieldGroup label="Contract Term">
                            <FormInput value={sowForm.contractTerm} onChange={v => setSowForm(f => ({ ...f, contractTerm: v }))} placeholder="e.g. 3 months, ongoing" />
                          </FieldGroup>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <SectionLabel>Payment &amp; Revision Terms</SectionLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <FieldGroup label="Net Days"><FormInput value={sowForm.netDays} onChange={v => setSowForm(f => ({ ...f, netDays: v }))} placeholder="30" /></FieldGroup>
                      <FieldGroup label="Deposit %"><FormInput value={sowForm.depositPct} onChange={v => setSowForm(f => ({ ...f, depositPct: v }))} placeholder="50" /></FieldGroup>
                      <FieldGroup label="Late Fee %/mo"><FormInput value={sowForm.lateFee} onChange={v => setSowForm(f => ({ ...f, lateFee: v }))} placeholder="1.5" /></FieldGroup>
                      <FieldGroup label="Revision Rounds"><FormInput value={sowForm.revisionRounds} onChange={v => setSowForm(f => ({ ...f, revisionRounds: v }))} placeholder="2" /></FieldGroup>
                    </div>
                    <FieldGroup label="Extra Revision Rate ($/hr) — optional">
                      <FormInput value={sowForm.revisionRate} onChange={v => setSowForm(f => ({ ...f, revisionRate: v }))} placeholder="e.g. 95" />
                    </FieldGroup>
                  </div>
                </div>
              )}

              {/* Project / Sprint Assignment */}
              <div className="space-y-3 border-t border-[#1A1A1A] pt-4">
                <SectionLabel>Assign to Project &amp; Sprint (Optional)</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Project">
                    <FormSelect
                      value={assignProject}
                      onChange={v => { setAssignProject(v); setAssignSprint('') }}
                      options={allProjects.map(p => ({ value: p.id, label: p.name }))}
                      placeholder="No project"
                    />
                  </FieldGroup>
                  <FieldGroup label="Sprint">
                    <FormSelect
                      value={assignSprint}
                      onChange={setAssignSprint}
                      options={availableSprints.map(s => ({ value: s.id, label: s.name }))}
                      placeholder={assignProject ? 'No sprint' : 'Select project first'}
                    />
                  </FieldGroup>
                </div>
              </div>

              {/* Save success message */}
              {saveSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3">
                  <FileCheck className="size-4 shrink-0" />
                  Document saved to Files. You can still print it below.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-2 px-5 py-4 border-t border-[#1A1A1A] shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#181818] border border-[#282828] text-sm font-medium text-[#E0E0E0] hover:bg-[#222] transition-colors flex-1 justify-center"
              >
                <Printer className="size-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || saveSuccess}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--space-accent)] text-black text-sm font-semibold hover:opacity-90 active:scale-95 transition-all flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {saveSuccess ? 'Saved!' : 'Save to Files'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

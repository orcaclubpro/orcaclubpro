'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText, FilePen, Search, Trash2, ExternalLink, Plus,
  Loader2, X, ChevronDown, FolderOpen, FileCheck,
  Building2, User, Download, Save, Pencil, Mail, Send, CheckCircle2, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createDocument, updateDocument, deleteFileRecord, sendDocumentEmail } from '@/actions/files'
import { createPackageFromSow } from '@/actions/packages'
import type { NdaFormData, SowFormData } from '@/lib/document-generators'
import { buildPersonalNdaPdf, buildOrcaclubNdaPdf, buildPersonalSowPdf, buildOrcaclubSowPdf } from '@/lib/pdf-generators'

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

interface ClientOption { id: string; name: string; email: string }
interface Recipient { email: string; name?: string }

interface FilesViewProps {
  allFiles: FileRecord[]
  allProjects: ProjectOption[]
  allSprints: SprintOption[]
  clientAccounts?: ClientOption[]
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
  paymentSchedule: [
    { label: 'Deposit', pct: '50', note: 'Due before work begins' },
    { label: 'Final Payment', pct: '50', note: 'Due upon project completion' },
  ],
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

export function FilesView({ allFiles, allProjects, allSprints, clientAccounts = [] }: FilesViewProps) {
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
  const [packageCreated, setPackageCreated] = useState(false)
  const [createPackageAlso, setCreatePackageAlso] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)

  // Send modal state
  const [sendModalFile, setSendModalFile] = useState<FileRecord | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sendSuccess, setSendSuccess] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)

  const [viewingId, setViewingId] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Sprints filtered by selected project
  const availableSprints = useMemo(() => {
    if (!assignProject) return allSprints
    return allSprints.filter(s => getSprintProjectId(s) === assignProject)
  }, [allSprints, assignProject])

  // Clients filtered by search for the send modal
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clientAccounts
    const q = clientSearch.toLowerCase()
    return clientAccounts.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [clientAccounts, clientSearch])

  // Filtered file list
  const filtered = useMemo(() => {
    return files.filter(f => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterProject && getProjectId(f) !== filterProject) return false
      if (filterType && f.fileType !== filterType) return false
      return true
    })
  }, [files, search, filterProject, filterType])

  async function handleView(rec: FileRecord) {
    // Uploaded file with a URL — open directly
    if (rec.file && typeof rec.file === 'object' && (rec.file as any).url) {
      window.open((rec.file as any).url, '_blank')
      return
    }
    // Generated document — render client-side and open as blob
    if ((rec.documentTemplate === 'nda' || rec.documentTemplate === 'sow') && rec.documentData) {
      setViewingId(rec.id)
      try {
        const data = rec.documentData as any
        const brand = rec.documentBrand ?? 'orcaclub'
        let bytes: Uint8Array
        if (rec.documentTemplate === 'nda') {
          bytes = brand === 'personal'
            ? await buildPersonalNdaPdf(data)
            : await buildOrcaclubNdaPdf(data)
        } else {
          bytes = brand === 'personal'
            ? await buildPersonalSowPdf(data)
            : await buildOrcaclubSowPdf(data)
        }
        const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 15000)
      } finally {
        setViewingId(null)
      }
    }
  }

  function openSendModal(rec: FileRecord) {
    setSendModalFile(rec)
    setRecipients([])
    setClientSearch('')
    setCustomEmail('')
    setSendMessage('')
    setSendSuccess(false)
  }

  function closeSendModal() {
    setSendModalFile(null)
    setSendSuccess(false)
  }

  function addRecipient(email: string, name?: string) {
    const normalized = email.trim().toLowerCase()
    if (!normalized) return
    if (recipients.some(r => r.email.toLowerCase() === normalized)) return
    setRecipients(prev => [...prev, { email: normalized, name }])
  }

  function removeRecipient(email: string) {
    setRecipients(prev => prev.filter(r => r.email !== email))
  }

  function handleAddCustomEmail() {
    const email = customEmail.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    addRecipient(email)
    setCustomEmail('')
  }

  async function handleSend() {
    if (!sendModalFile || !recipients.length) return
    setIsSending(true)
    const result = await sendDocumentEmail(
      sendModalFile.id,
      recipients,
      sendMessage.trim() || undefined,
    )
    setIsSending(false)
    if (result.success) setSendSuccess(true)
  }

  function openModal() {
    setEditingId(null)
    setDocType('nda')
    setBrand('orcaclub')
    setNdaForm(defaultNda())
    setSowForm(defaultSow())
    setSaveSuccess(false)
    setPackageCreated(false)
    setCreatePackageAlso(false)
    setAssignProject('')
    setAssignSprint('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSaveSuccess(false)
    setPackageCreated(false)
    setCreatePackageAlso(false)
    setEditingId(null)
  }

  async function handleDownload() {
    if (docType !== 'nda') return
    const bytes = brand === 'personal' ? await buildPersonalNdaPdf(ndaForm) : await buildOrcaclubNdaPdf(ndaForm)
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `NDA_${(ndaForm.clientName || 'Client').replace(/\s+/g, '_')}.pdf`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  function handleSave() {
    startTransition(async () => {
      const isNda = docType === 'nda'
      const data  = isNda ? ndaForm : sowForm
      const docName = isNda
        ? `NDA — ${ndaForm.clientName || 'Client'} (${brand === 'orcaclub' ? 'ORCACLUB' : 'Personal'})`
        : `SOW — ${sowForm.projectName || sowForm.clientName || 'Project'}`

      // Always save to Files collection
      if (editingId) {
        const result = await updateDocument(editingId, {
          name: docName,
          documentTemplate: docType,
          documentBrand: isNda ? brand : 'orcaclub',
          documentData: data,
          projectId: assignProject || undefined,
          sprintId: isNda ? (assignSprint || undefined) : undefined,
        })
        if (result.success) {
          setFiles(prev => prev.map(f => f.id !== editingId ? f : {
            ...f,
            name: docName,
            documentTemplate: docType,
            documentBrand: isNda ? brand : 'orcaclub',
            documentData: data,
            project: assignProject ? allProjects.find(p => p.id === assignProject) ?? assignProject : null,
            sprint: isNda && assignSprint ? availableSprints.find(s => s.id === assignSprint) ?? assignSprint : null,
          }))
          setSaveSuccess(true)
        }
      } else {
        const result = await createDocument({
          name: docName,
          documentTemplate: docType,
          documentBrand: isNda ? brand : 'orcaclub',
          documentData: data,
          projectId: assignProject || undefined,
          sprintId: isNda ? (assignSprint || undefined) : undefined,
        })
        if (result.success && result.id) {
          const newRecord: FileRecord = {
            id: result.id,
            name: docName,
            fileType: 'document',
            documentTemplate: docType,
            documentBrand: isNda ? brand : 'orcaclub',
            documentData: data,
            project: assignProject ? allProjects.find(p => p.id === assignProject) ?? assignProject : null,
            sprint: isNda && assignSprint ? availableSprints.find(s => s.id === assignSprint) ?? assignSprint : null,
            createdAt: new Date().toISOString(),
          }
          setFiles(prev => [newRecord, ...prev])
          setSaveSuccess(true)
        }
      }

      // SOW + checkbox → also create Package template
      if (docType === 'sow' && createPackageAlso && !editingId) {
        const pkgResult = await createPackageFromSow(sowForm)
        if (pkgResult.success) setPackageCreated(true)
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

  function handleEdit(rec: FileRecord) {
    if (!rec.documentTemplate || !rec.documentData) return
    setEditingId(rec.id)
    setDocType(rec.documentTemplate)
    setBrand((rec.documentBrand as any) ?? 'orcaclub')
    if (rec.documentTemplate === 'nda') {
      setNdaForm({ ...defaultNda(), ...rec.documentData })
    } else {
      setSowForm({ ...defaultSow(), ...rec.documentData })
    }
    setAssignProject(getProjectId(rec))
    setAssignSprint(rec.documentTemplate === 'nda'
      ? (typeof rec.sprint === 'object' ? rec.sprint?.id ?? '' : rec.sprint ?? '')
      : '')
    setSaveSuccess(false)
    setPackageCreated(false)
    setCreatePackageAlso(false)
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
            <option value="document">Document</option>
            <option value="image">Image</option>
            <option value="spreadsheet">Spreadsheet</option>
            <option value="presentation">Presentation</option>
            <option value="pdf">PDF</option>
            <option value="other">Other</option>
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
              onClick={() => rec.documentTemplate && rec.documentData && handleEdit(rec)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors',
                i < filtered.length - 1 && 'border-b border-[#1A1A1A]',
                rec.documentTemplate && rec.documentData && 'cursor-pointer',
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
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {(rec.documentTemplate || (rec.file && typeof rec.file === 'object' && (rec.file as any).url)) && (
                  <button
                    onClick={() => handleView(rec)}
                    title="View document"
                    disabled={viewingId === rec.id}
                    className="p-1.5 rounded-lg text-[#5A5A5A] hover:text-[#F0F0F0] hover:bg-[#181818] transition-colors disabled:opacity-40"
                  >
                    {viewingId === rec.id ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                  </button>
                )}
                <button
                  onClick={() => openSendModal(rec)}
                  title="Send via email"
                  className="p-1.5 rounded-lg text-[#5A5A5A] hover:text-blue-400 hover:bg-[#181818] transition-colors"
                >
                  <Mail className="size-3.5" />
                </button>
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
                <span className="text-sm font-semibold text-[#F0F0F0]">{editingId ? 'Edit Document' : 'Document Generator'}</span>
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
                        onClick={() => !editingId && setDocType(t)}
                        disabled={!!editingId}
                        title={editingId ? 'Document type cannot be changed when editing' : undefined}
                        className={cn(
                          'flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all',
                          docType === t
                            ? 'bg-[var(--space-accent)]/10 border-[var(--space-accent)]/40 text-[var(--space-accent)]'
                            : 'bg-[#141414] border-[#282828] text-[#5A5A5A]',
                          editingId && docType !== t && 'opacity-30 cursor-not-allowed',
                          editingId && docType === t && 'cursor-default',
                        )}
                      >
                        {t === 'nda' ? 'NDA' : 'Scope of Work'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand — NDA only */}
                {docType === 'nda' && (
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
                )}
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
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <SectionLabel>Payment Schedule</SectionLabel>
                        <button
                          onClick={() => setSowForm(f => ({ ...f, paymentSchedule: [...f.paymentSchedule, { label: '', pct: '', note: '' }] }))}
                          className="text-[10px] text-[var(--space-accent)] hover:underline"
                        >+ Add Payment</button>
                      </div>
                      <p className="text-[10px] text-[#5A5A5A] mb-2">Percentages should add up to 100%</p>
                      <div className="grid grid-cols-[1fr_56px_1fr_28px] gap-1.5 mb-1.5">
                        <span className="text-[10px] text-[#5A5A5A] font-semibold uppercase tracking-widest">Payment Label</span>
                        <span className="text-[10px] text-[#5A5A5A] font-semibold uppercase tracking-widest text-right">%</span>
                        <span className="text-[10px] text-[#5A5A5A] font-semibold uppercase tracking-widest">Trigger / Note</span>
                        <span />
                      </div>
                      {sowForm.paymentSchedule.map((entry, i) => (
                        <div key={i} className="grid grid-cols-[1fr_56px_1fr_28px] gap-1.5 mb-1.5 items-center">
                          <FormInput
                            value={entry.label}
                            onChange={v => setSowForm(f => ({ ...f, paymentSchedule: f.paymentSchedule.map((e, j) => j === i ? { ...e, label: v } : e) }))}
                            placeholder="e.g. Deposit"
                          />
                          <FormInput
                            value={entry.pct}
                            onChange={v => setSowForm(f => ({ ...f, paymentSchedule: f.paymentSchedule.map((e, j) => j === i ? { ...e, pct: v } : e) }))}
                            placeholder="50"
                            className="text-right"
                          />
                          <FormInput
                            value={entry.note}
                            onChange={v => setSowForm(f => ({ ...f, paymentSchedule: f.paymentSchedule.map((e, j) => j === i ? { ...e, note: v } : e) }))}
                            placeholder="e.g. Due before work begins"
                          />
                          {sowForm.paymentSchedule.length > 1 ? (
                            <button
                              onClick={() => setSowForm(f => ({ ...f, paymentSchedule: f.paymentSchedule.filter((_, j) => j !== i) }))}
                              className="text-[#5A5A5A] hover:text-red-400 transition-colors justify-self-center"
                            ><X className="size-3.5" /></button>
                          ) : <span />}
                        </div>
                      ))}
                      {/* Progress bar */}
                      {(() => {
                        const totalPct = sowForm.paymentSchedule.reduce((s, e) => s + (parseFloat(e.pct) || 0), 0)
                        const barColor = totalPct === 100 ? 'bg-[var(--space-accent)]' : totalPct > 100 ? 'bg-red-400' : 'bg-blue-400'
                        return (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${Math.min(totalPct, 100)}%` }} />
                            </div>
                            <span className={cn('text-[10px] font-semibold shrink-0', totalPct === 100 ? 'text-[var(--space-accent)]' : totalPct > 100 ? 'text-red-400' : 'text-[#5A5A5A]')}>
                              {totalPct}% of total
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                    <SectionLabel>Terms</SectionLabel>
                    <div className="grid grid-cols-3 gap-3">
                      <FieldGroup label="Net Days"><FormInput value={sowForm.netDays} onChange={v => setSowForm(f => ({ ...f, netDays: v }))} placeholder="30" /></FieldGroup>
                      <FieldGroup label="Late Fee %/mo"><FormInput value={sowForm.lateFee} onChange={v => setSowForm(f => ({ ...f, lateFee: v }))} placeholder="1.5" /></FieldGroup>
                      <FieldGroup label="Revision Rounds"><FormInput value={sowForm.revisionRounds} onChange={v => setSowForm(f => ({ ...f, revisionRounds: v }))} placeholder="2" /></FieldGroup>
                    </div>
                    <FieldGroup label="Extra Revision Rate ($/hr) — optional">
                      <FormInput value={sowForm.revisionRate} onChange={v => setSowForm(f => ({ ...f, revisionRate: v }))} placeholder="e.g. 95" />
                    </FieldGroup>
                  </div>
                </div>
              )}

              {/* Project / Sprint Assignment — NDA only */}
              {docType === 'nda' && (
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
              )}

              {/* SOW — create package checkbox (new records only) */}
              {docType === 'sow' && !editingId && (
                <label className="flex items-center gap-3 px-1 py-1 cursor-pointer select-none">
                  <div
                    onClick={() => setCreatePackageAlso(v => !v)}
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all',
                      createPackageAlso
                        ? 'bg-[var(--space-accent)] border-[var(--space-accent)]'
                        : 'border-[#444] bg-[#1A1A1A]',
                    )}
                  >
                    {createPackageAlso && (
                      <svg className="size-2.5 text-black" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-[#A0A0A0]">Also create a package template from this SOW</span>
                </label>
              )}

              {/* Success messages */}
              {saveSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3">
                  <FileCheck className="size-4 shrink-0" />
                  {editingId ? 'Document updated.' : 'Saved to Files.'}
                  {packageCreated && ' Package template also created.'}
                </div>
              )}
              {packageCreated && !saveSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Package template created — find it in Packages to assign to a client.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-2 px-5 py-4 border-t border-[#1A1A1A] shrink-0">
              {docType === 'nda' && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#181818] border border-[#282828] text-sm font-medium text-[#E0E0E0] hover:bg-[#222] transition-colors flex-1 justify-center"
                >
                  <Download className="size-3.5" />
                  Download Fillable PDF
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isPending || saveSuccess}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--space-accent)] text-black text-sm font-semibold hover:opacity-90 active:scale-95 transition-all flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {saveSuccess ? 'Saved!' : editingId ? 'Update Document' : 'Save to Files'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Send Document Modal — Redesigned */}
      {sendModalFile && mounted && createPortal(
        <>
          <style>{`
            @keyframes oc-dispatch-backdrop { from { opacity: 0 } to { opacity: 1 } }
            @keyframes oc-dispatch-rise { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
            @keyframes oc-dispatch-chip { from { opacity: 0; transform: scale(0.8) } to { opacity: 1; transform: scale(1) } }
            @keyframes oc-dispatch-success-ring { 0% { opacity: 0.6; transform: scale(0.6) } 100% { opacity: 0; transform: scale(2) } }
            @keyframes oc-dispatch-success-icon { 0% { opacity: 0; transform: scale(0.5) rotate(-10deg) } 60% { transform: scale(1.1) rotate(2deg) } 100% { opacity: 1; transform: scale(1) rotate(0deg) } }
            @keyframes oc-dispatch-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
            @keyframes oc-dispatch-pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }
          `}</style>

          <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
            style={{ paddingBottom: '76px', paddingTop: '16px', paddingLeft: '16px', paddingRight: '16px' }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(103,232,249,0.03) 0%, rgba(0,0,0,0.88) 100%)',
                animation: 'oc-dispatch-backdrop 0.18s ease forwards',
                backdropFilter: 'blur(4px)',
              }}
              onClick={closeSendModal}
            />

            {/* Panel */}
            <div
              className="relative w-full flex flex-col overflow-hidden"
              style={{
                maxWidth: 440,
                maxHeight: 'min(calc(100dvh - 112px), 640px)',
                background: '#090909',
                border: '1px solid #1c1c1c',
                borderRadius: 18,
                boxShadow: '0 0 0 1px rgba(103,232,249,0.05), 0 32px 72px rgba(0,0,0,0.85), 0 0 80px rgba(103,232,249,0.025)',
                animation: 'oc-dispatch-rise 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
              }}
            >
              {/* Top edge glow line */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 5%, rgba(103,232,249,0.25) 35%, rgba(103,232,249,0.18) 65%, transparent 95%)', flexShrink: 0 }} />

              {/* ── Header ─────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px 16px', borderBottom: '1px solid #131313', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {/* Icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(103,232,249,0.1) 0%, rgba(103,232,249,0.03) 100%)',
                    border: '1px solid rgba(103,232,249,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Mail size={14} color="#67e8f9" />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0' }}>Send Document</span>
                      {sendModalFile.documentTemplate && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                          padding: '2px 7px', borderRadius: 4,
                          background: 'rgba(103,232,249,0.07)', border: '1px solid rgba(103,232,249,0.14)',
                          color: '#67e8f9', flexShrink: 0,
                        }}>
                          {sendModalFile.documentTemplate === 'nda' ? 'NDA' : 'SOW'} · PDF
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#3E3E3E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                      {sendModalFile.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeSendModal}
                  style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0, marginTop: 2,
                    background: 'transparent', border: '1px solid #1E1E1E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#3E3E3E', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#161616'; el.style.borderColor = '#2A2A2A'; el.style.color = '#A0A0A0' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.borderColor = '#1E1E1E'; el.style.color = '#3E3E3E' }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* ── Success State ─────────────────────── */}
              {sendSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 32px 48px', gap: 0 }}>
                  <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 22 }}>
                    {/* Animated ring */}
                    <div style={{
                      position: 'absolute', inset: -8, borderRadius: '50%',
                      border: '1px solid rgba(74,222,128,0.4)',
                      animation: 'oc-dispatch-success-ring 1s ease-out 0.15s both',
                    }} />
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(74,222,128,0.1) 0%, rgba(74,222,128,0.03) 100%)',
                      border: '1px solid rgba(74,222,128,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: 'oc-dispatch-success-icon 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
                    }}>
                      <CheckCircle2 size={26} color="#4ade80" strokeWidth={1.75} />
                    </div>
                  </div>

                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                    Dispatched
                  </p>
                  <p style={{ fontSize: 12, color: '#4A4A4A', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.7, maxWidth: 240 }}>
                    {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} received
                    {sendModalFile.documentTemplate === 'nda' ? ' the PDF' : ' the document'}
                  </p>

                  <button
                    onClick={closeSendModal}
                    style={{
                      padding: '8px 22px', borderRadius: 9, fontSize: 12, fontWeight: 500,
                      background: 'transparent', border: '1px solid #1E1E1E', color: '#5A5A5A',
                      cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.02em',
                    }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#2A2A2A'; el.style.color = '#A0A0A0'; el.style.background = '#111' }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#1E1E1E'; el.style.color = '#5A5A5A'; el.style.background = 'transparent' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Body ─────────────────────────── */}
                  <div className="overflow-y-auto flex-1" style={{ padding: '20px 20px 0' }}>

                    {/* TO: compose field */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2E2E2E', flexShrink: 0 }}>To</span>
                        {recipients.length > 0 && (
                          <span style={{ fontSize: 10, color: '#2E2E2E' }}>{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>

                      {/* Chips + input container */}
                      <div
                        style={{
                          minHeight: 46, borderRadius: 12,
                          background: '#0D0D0D', border: '1px solid #1E1E1E',
                          padding: recipients.length > 0 ? '8px 10px' : '0 14px',
                          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                          transition: 'border-color 0.15s', cursor: 'text',
                          position: 'relative',
                        }}
                        onClick={() => (document.getElementById('oc-to-input') as HTMLInputElement)?.focus()}
                      >
                        {/* Recipient chips */}
                        {recipients.map(r => {
                          const initials = (r.name || r.email).split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                          return (
                            <span
                              key={r.email}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '3px 6px 3px 4px', borderRadius: 20,
                                background: 'rgba(103,232,249,0.05)',
                                border: '1px solid rgba(103,232,249,0.13)',
                                animation: 'oc-dispatch-chip 0.15s cubic-bezier(0.16,1,0.3,1) forwards',
                              }}
                            >
                              {/* Avatar */}
                              <span style={{
                                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                                background: 'rgba(103,232,249,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8, fontWeight: 800, color: '#67e8f9', letterSpacing: 0,
                              }}>
                                {initials.charAt(0)}
                              </span>
                              <span style={{ fontSize: 12, color: '#C0C0C0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.name || r.email}
                              </span>
                              <button
                                onClick={e => { e.stopPropagation(); removeRecipient(r.email) }}
                                style={{ background: 'none', border: 'none', padding: '0 0 0 1px', cursor: 'pointer', color: '#3A3A3A', display: 'flex', lineHeight: 1, transition: 'color 0.12s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3A')}
                              >
                                <X size={10} />
                              </button>
                            </span>
                          )
                        })}

                        {/* Unified input */}
                        <input
                          id="oc-to-input"
                          value={clientSearch}
                          onChange={e => {
                            setClientSearch(e.target.value)
                            setCustomEmail(e.target.value)
                            setClientDropdownOpen(true)
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientSearch.trim())) {
                                addRecipient(clientSearch.trim())
                                setClientSearch('')
                                setCustomEmail('')
                                setClientDropdownOpen(false)
                              }
                            }
                            if (e.key === 'Backspace' && !clientSearch && recipients.length > 0) {
                              removeRecipient(recipients[recipients.length - 1].email)
                            }
                          }}
                          onFocus={() => setClientDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setClientDropdownOpen(false), 160)}
                          placeholder={recipients.length === 0 ? 'Search clients or enter an email…' : 'Add more…'}
                          style={{
                            flex: 1, minWidth: 140, background: 'none', border: 'none', outline: 'none',
                            fontSize: 13, color: '#E0E0E0',
                            height: recipients.length === 0 ? 44 : 'auto',
                            padding: recipients.length === 0 ? '0' : '2px 2px',
                            caretColor: '#67e8f9', fontFamily: 'inherit',
                          }}
                        />
                      </div>

                      {/* Dropdown */}
                      {clientDropdownOpen && filteredClients.length > 0 && (
                        <div style={{
                          marginTop: 4, borderRadius: 12,
                          background: '#0C0C0C', border: '1px solid #1E1E1E',
                          overflow: 'hidden',
                          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                          maxHeight: 210, overflowY: 'auto',
                        }}>
                          {filteredClients.slice(0, 7).map((c, i) => {
                            const already = recipients.some(r => r.email === c.email)
                            const initials = c.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                            return (
                              <button
                                key={c.id}
                                onMouseDown={e => {
                                  e.preventDefault()
                                  if (already) return
                                  addRecipient(c.email, c.name)
                                  setClientSearch('')
                                  setCustomEmail('')
                                  setClientDropdownOpen(false)
                                }}
                                disabled={already}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none',
                                  borderBottom: i < Math.min(filteredClients.length, 7) - 1 ? '1px solid #111' : 'none',
                                  cursor: already ? 'not-allowed' : 'pointer', opacity: already ? 0.35 : 1,
                                  transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (!already) e.currentTarget.style.background = '#111' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                              >
                                {/* Avatar */}
                                <div style={{
                                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                  background: 'linear-gradient(135deg, rgba(103,232,249,0.12) 0%, rgba(103,232,249,0.04) 100%)',
                                  border: '1px solid rgba(103,232,249,0.1)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700, color: '#67e8f9',
                                }}>
                                  {initials || c.email.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#E0E0E0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                                  <p style={{ margin: 0, fontSize: 11, color: '#404040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
                                </div>
                                {already && (
                                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#2E2E2E', textTransform: 'uppercase', flexShrink: 0 }}>Added</span>
                                )}
                              </button>
                            )
                          })}
                          {/* Hint: press enter for custom email */}
                          {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientSearch.trim()) && !filteredClients.some(c => c.email === clientSearch.trim()) && (
                            <div style={{ padding: '9px 14px', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, color: '#3A3A3A' }}>Press</span>
                              <kbd style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: '#161616', border: '1px solid #2A2A2A', color: '#5A5A5A', fontFamily: 'monospace' }}>↵ Enter</kbd>
                              <span style={{ fontSize: 11, color: '#3A3A3A' }}>to add <span style={{ color: '#5A5A5A' }}>{clientSearch.trim()}</span></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2E2E2E' }}>Message</span>
                        <span style={{ fontSize: 10, color: '#252525' }}>optional</span>
                      </div>
                      <textarea
                        value={sendMessage}
                        onChange={e => setSendMessage(e.target.value)}
                        placeholder="Add a personal note…"
                        rows={3}
                        style={{
                          width: '100%', borderRadius: 12, padding: '10px 14px',
                          background: '#0D0D0D', border: '1px solid #1E1E1E',
                          fontSize: 13, color: '#E0E0E0', outline: 'none',
                          resize: 'none', lineHeight: 1.65, boxSizing: 'border-box',
                          caretColor: '#67e8f9', fontFamily: 'inherit',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(103,232,249,0.2)')}
                        onBlur={e => (e.target.style.borderColor = '#1E1E1E')}
                      />
                    </div>

                    {/* PDF attachment note */}
                    {sendModalFile.documentTemplate && (
                      <div style={{
                        marginBottom: 20, padding: '9px 12px',
                        borderRadius: 9, background: 'rgba(103,232,249,0.025)',
                        border: '1px solid rgba(103,232,249,0.07)',
                        display: 'flex', alignItems: 'center', gap: 9,
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                          background: '#67e8f9', opacity: 0.5,
                          boxShadow: '0 0 5px rgba(103,232,249,0.4)',
                          animation: 'oc-dispatch-pulse-dot 2s ease-in-out infinite',
                        }} />
                        <p style={{ margin: 0, fontSize: 11, color: '#404040', lineHeight: 1.5 }}>
                          {sendModalFile.documentTemplate === 'nda'
                          ? 'NDA will be generated and attached as a PDF'
                          : 'Scope of Work details will be included in the email'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Footer ─────────────────────────── */}
                  <div style={{ display: 'flex', gap: 8, padding: '14px 20px 20px', borderTop: '1px solid #111', flexShrink: 0 }}>
                    {(sendModalFile.documentTemplate || (sendModalFile.file && typeof sendModalFile.file === 'object' && (sendModalFile.file as any).url)) && (
                      <button
                        onClick={() => handleView(sendModalFile)}
                        disabled={viewingId === sendModalFile.id}
                        title="View document"
                        style={{
                          height: 40, width: 40, borderRadius: 10, flexShrink: 0,
                          background: 'transparent', border: '1px solid #1A1A1A', color: '#5A5A5A',
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#2A2A2A'; el.style.color = '#A0A0A0'; el.style.background = '#0F0F0F' }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#1A1A1A'; el.style.color = '#5A5A5A'; el.style.background = 'transparent' }}
                      >
                        {viewingId === sendModalFile.id
                          ? <Loader2 size={14} style={{ animation: 'oc-dispatch-spin 1s linear infinite' }} />
                          : <Eye size={14} />}
                      </button>
                    )}
                    <button
                      onClick={closeSendModal}
                      style={{
                        height: 40, padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                        background: 'transparent', border: '1px solid #1A1A1A', color: '#5A5A5A',
                        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0, letterSpacing: '0.01em',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#262626'; el.style.color = '#8A8A8A'; el.style.background = '#0F0F0F' }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#1A1A1A'; el.style.color = '#5A5A5A'; el.style.background = 'transparent' }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSend}
                      disabled={isSending || recipients.length === 0}
                      style={{
                        flex: 1, height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600,
                        background: recipients.length === 0
                          ? '#0D0D0D'
                          : 'linear-gradient(135deg, rgba(103,232,249,0.13) 0%, rgba(103,232,249,0.06) 100%)',
                        border: recipients.length === 0 ? '1px solid #181818' : '1px solid rgba(103,232,249,0.2)',
                        color: recipients.length === 0 ? '#272727' : '#67e8f9',
                        cursor: recipients.length === 0 || isSending ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        transition: 'all 0.2s', letterSpacing: '0.01em',
                      }}
                      onMouseEnter={e => {
                        if (recipients.length === 0 || isSending) return
                        const el = e.currentTarget
                        el.style.background = 'linear-gradient(135deg, rgba(103,232,249,0.2) 0%, rgba(103,232,249,0.1) 100%)'
                        el.style.borderColor = 'rgba(103,232,249,0.3)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget
                        el.style.background = recipients.length === 0 ? '#0D0D0D' : 'linear-gradient(135deg, rgba(103,232,249,0.13) 0%, rgba(103,232,249,0.06) 100%)'
                        el.style.borderColor = recipients.length === 0 ? '#181818' : 'rgba(103,232,249,0.2)'
                      }}
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={13} style={{ animation: 'oc-dispatch-spin 1s linear infinite' }} />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>{recipients.length > 0 ? `Send to ${recipients.length}` : 'Add recipients'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

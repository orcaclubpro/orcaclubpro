# Scheduled Payment Work Log & Recap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give fixed-price milestone packages the same documented work loop retainers already have — a package-level work log whose entries are consumed by the next scheduled-payment invoice as $0 line items, a recap PDF, and an itemized work section in the invoice email.

**Architecture:** A new `package-work-entries` collection stores planned/logged work per proposal package. Attribution is **consume-on-invoice**: an entry is pending until `sendScheduledPayment()` stamps `billedOrderId` on it. Pure derivation modules (`src/lib/packages/recap.ts`, `src/lib/packages/workLines.ts`) are shared by the server action, the PDF route, and the client composer — mirroring `src/lib/retainers/recap.ts`. UI is a new Command Console station (`MilestonesTab`) plus a send modal on `ScheduledPaymentsSection`.

**Tech Stack:** Bun · Next.js 15 (App Router, Server Actions) · Payload 3 (mongoose) · Stripe · `bun test` for pure-module unit tests · pdf-lib (via `src/lib/pdf-generators.ts`)

**Source spec:** `docs/superpowers/specs/2026-08-05-scheduled-payment-work-log-design.md`

## Global Constraints

- **Package manager is `bun`** — never npm/yarn/pnpm.
- **Run `bun run payload:generate` after every schema change** (regenerates `src/types/payload-types.ts`).
- **Verify with `bun run tsc --noEmit`** at the end of every task that touches TypeScript.
- **`overrideAccess: false` whenever a `user` is passed to the Local API** inside `(spaces)/`. Server actions in `src/actions/` follow the existing house style: `getCurrentUser()` → reject `role === 'client'` → run Local API without a user (staff-only actions).
- **Pass `req` to nested Payload operations inside hooks.** (This plan adds no hooks; the rule still applies if one is added.)
- **External service calls are non-blocking** — catch, log, never re-throw (emails, PDFs).
- **Dashboard components use `var(--space-*)` CSS variables** — never hardcode `text-white`/`bg-black`.
- **Only pure modules get unit tests.** This repo has no Payload/React test harness. `bun test` (built in, already verified working — no install needed) covers `src/lib/packages/*.ts` and the email template string builders. Server actions, collections, and components are verified by `bun run tsc --noEmit` plus the explicit manual smoke steps in each task.
- **Hours are informational only** — never billed, never used to derive an amount. Work lines are always `price: 0`.
- **`packages.lineItems` stays untouched** — it is the priced proposal scope. Work lines go on the Order and the Stripe invoice only.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/lib/payload/collections/PackageWorkEntries.ts` | The `package-work-entries` schema |
| `src/lib/packages/workLines.ts` | Pure: work entries → $0 invoice/order line shapes |
| `src/lib/packages/workLines.test.ts` | Unit tests for the above |
| `src/lib/packages/recap.ts` | Pure: `PackageRecapData`, `derivePackageRecapDefaults`, `mergePackageRecap` |
| `src/lib/packages/recap.test.ts` | Unit tests for the above |
| `src/actions/packageWork.ts` | Server actions for the work log + portfolio + recap model |
| `src/app/api/packages/[id]/recap/pdf/route.ts` | Recap PDF endpoint (re-derives server-side) |
| `src/components/dashboard/SchedulePaymentInvoiceModal.tsx` | Send-invoice modal for one schedule entry |
| `src/components/dashboard/MilestonesTab.tsx` | Command Console station |

**Modified:**

| File | Change |
|---|---|
| `src/lib/payload/payload.config.ts:34,993` | Import + register `PackageWorkEntries` |
| `src/lib/payload/utils/genericInvoiceEmailTemplate.ts:19-48,114,339,387` | `workLog` field on email data; render section; `sendGenericInvoiceEmail` opts |
| `src/actions/packages.ts:914-950,952-1081` | `releaseWorkEntriesForOrder`; consume-on-invoice in `sendScheduledPayment`; opts object |
| `src/lib/stripe/webhook-handlers.ts:265-273` | Release work entries when an order is cancelled |
| `src/lib/pdf-generators.ts` (append) | `buildPackageRecapPdf` |
| `src/components/dashboard/ScheduledPaymentsSection.tsx` | Work chip, modal wiring, entry-keyed recap drafts |
| `src/app/(spaces)/u/[username]/clients/[client]/page.tsx:53-96` | Fetch per-package work counts |
| `src/app/(spaces)/u/[username]/clients/[client]/ClientDetailTabView.tsx:453` | Pass counts through |
| `src/components/dashboard/CommandConsole.tsx:26,28,199,465,592+` | Register the `milestones` station |
| `package.json` scripts | Add `"test": "bun test"` |

---

## Task 1: `package-work-entries` collection

**Files:**
- Create: `src/lib/payload/collections/PackageWorkEntries.ts`
- Modify: `src/lib/payload/payload.config.ts:34` (import), `:993` (collections array)

**Interfaces:**
- Consumes: nothing
- Produces: collection slug `'package-work-entries'`; generated type `PackageWorkEntry` in `src/types/payload-types.ts`. Field names later tasks rely on: `date`, `status`, `completion`, `category`, `hours`, `description`, `package`, `clientAccount`, `billedOrderId`, `loggedBy`.

- [ ] **Step 1: Create the collection file**

```typescript
// src/lib/payload/collections/PackageWorkEntries.ts
import type { CollectionConfig } from 'payload'
import { adminOrUser, adminOnly } from '../access/index'

/**
 * PackageWorkEntries Collection
 *
 * The work log for fixed-price proposal packages — the milestone counterpart to
 * `retainer-time-entries`. Each entry is either PLANNED future work ("what's left")
 * or LOGGED completed work.
 *
 * Attribution is consume-on-invoice: a logged entry is *pending* until a scheduled
 * payment's invoice consumes it, at which point `billedOrderId` is stamped with the
 * Order that carried it as a $0 line. There is no billing-term snapshot — a milestone
 * payment's price is fixed on the package's `paymentSchedule` entry, and `hours` here
 * are informational only and never billed.
 *
 * `clientAccount` is denormalized from the package so a client's whole log can be
 * queried in one go (see src/actions/packageWork.ts).
 */
const PackageWorkEntries: CollectionConfig = {
  slug: 'package-work-entries',
  admin: {
    useAsTitle: 'description',
    group: 'Clients',
    defaultColumns: ['date', 'status', 'category', 'package', 'billedOrderId'],
    description: 'Planned and completed work logged against a proposal package, consumed by scheduled-payment invoices.',
  },
  access: {
    create: adminOrUser,
    read: adminOrUser,
    update: adminOrUser,
    delete: adminOnly,
  },
  indexes: [
    { fields: ['package', 'date'] },
    { fields: ['package', 'billedOrderId'] },
  ],
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          index: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'hours',
          type: 'number',
          min: 0,
          admin: {
            width: '50%',
            description: 'Optional — informational only. Never billed.',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'logged',
      required: true,
      index: true,
      options: [
        { label: 'Planned', value: 'planned' },
        { label: 'Logged', value: 'logged' },
      ],
      admin: { description: 'Planned = future work ("what\'s left"); Logged = work done, eligible for the next invoice.' },
    },
    {
      name: 'completion',
      type: 'select',
      defaultValue: 'incomplete',
      options: [
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'Complete', value: 'complete' },
      ],
      admin: { description: 'Meaningful on planned entries — flipped to complete when the planned work is logged as a separate entry.' },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'work',
      options: [
        { label: 'Work', value: 'work' },
        { label: 'Design', value: 'design' },
        { label: 'Revision', value: 'revision' },
        { label: 'Meeting', value: 'meeting' },
      ],
      admin: { description: 'Recap bucket this entry rolls up into.' },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'package',
      type: 'relationship',
      relationTo: 'packages',
      required: true,
      index: true,
      admin: { description: 'Must be a proposal package — enforced in src/actions/packageWork.ts.' },
    },
    {
      name: 'clientAccount',
      type: 'relationship',
      relationTo: 'client-accounts',
      required: true,
      index: true,
    },
    {
      name: 'billedOrderId',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'Set when a scheduled-payment invoice consumes this entry. Empty = pending.',
      },
    },
    {
      name: 'loggedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, description: 'Staff member who logged this entry' },
    },
  ],
}

export default PackageWorkEntries
```

- [ ] **Step 2: Register the collection**

In `src/lib/payload/payload.config.ts`, add the import next to the other collection imports (after line 34, `import RetainerTimeEntries from './collections/RetainerTimeEntries'`):

```typescript
import PackageWorkEntries from './collections/PackageWorkEntries'
```

Then add `PackageWorkEntries` to the `collections` array on line 993, immediately after `Packages`:

```typescript
  collections: [Media, Clients, Leads, Categories, Tags, Posts, Solutions, Pages, Users, ClientAccounts, Orders, Packages, PackageWorkEntries, ServiceItems, Retainers, RetainerTimeEntries, WebhookEvents, Projects, Tasks, Sprints, Files, Credentials, Timelines],
```

- [ ] **Step 3: Regenerate types**

Run: `bun run payload:generate`
Expected: completes without error.

- [ ] **Step 4: Verify the generated type exists**

Run: `grep -n "PackageWorkEntry\b" src/types/payload-types.ts | head -5`
Expected: at least one hit — an `export interface PackageWorkEntry` declaration.

- [ ] **Step 5: Typecheck**

Run: `bun run tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/payload/collections/PackageWorkEntries.ts src/lib/payload/payload.config.ts src/types/payload-types.ts
git commit -m "feat: add package-work-entries collection for milestone work logs"
```

---

## Task 2: `buildWorkLines` — pure work-entry → invoice-line derivation

**Files:**
- Create: `src/lib/packages/workLines.ts`
- Test: `src/lib/packages/workLines.test.ts`
- Modify: `package.json` (add `"test": "bun test"` to `scripts`)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type WorkCategory = 'work' | 'design' | 'revision' | 'meeting'`
  - `const WORK_CATEGORY_LABEL: Record<WorkCategory, string>`
  - `interface WorkEntryLineInput { id: string; date: string; description?: string | null; hours?: number | null; category?: WorkCategory | null }`
  - `interface WorkLine { entryId: string; title: string; description: string }`
  - `function buildWorkLines(entries: WorkEntryLineInput[]): WorkLine[]`

  Task 4 uses `buildWorkLines` for the Stripe/Order lines; Tasks 3, 5, 6, 7, 8 import `WorkCategory` / `WORK_CATEGORY_LABEL` from here.

- [ ] **Step 1: Add the test script to package.json**

In `package.json`, inside `"scripts"`, add:

```json
    "test": "bun test",
```

- [ ] **Step 2: Write the failing test**

```typescript
// src/lib/packages/workLines.test.ts
import { expect, test, describe } from 'bun:test'
import { buildWorkLines, WORK_CATEGORY_LABEL } from './workLines'

describe('buildWorkLines', () => {
  test('formats a titled line with hours, category, and source', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Rebuilt inventory sync', hours: 3, category: 'work' },
    ])
    expect(lines).toEqual([
      { entryId: 'a', title: 'May 2 — Rebuilt inventory sync', description: '3h · Work · milestone log' },
    ])
  })

  test('omits hours from the description when absent or zero', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Design review', category: 'design' },
      { id: 'b', date: '2026-05-03T00:00:00.000Z', description: 'Standup', hours: 0, category: 'meeting' },
    ])
    expect(lines[0].description).toBe('Design · milestone log')
    expect(lines[1].description).toBe('Meetings · milestone log')
  })

  test('falls back to the category label when the description is blank', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: '   ', hours: 1.5, category: 'revision' },
    ])
    expect(lines[0].title).toBe('May 2 — Revisions')
  })

  test('defaults a missing category to work', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Thing', hours: 1 },
    ])
    expect(lines[0].description).toBe('1h · Work · milestone log')
  })

  test('sorts entries oldest first regardless of input order', () => {
    const lines = buildWorkLines([
      { id: 'b', date: '2026-05-09T00:00:00.000Z', description: 'Later', category: 'work' },
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Earlier', category: 'work' },
    ])
    expect(lines.map((l) => l.entryId)).toEqual(['a', 'b'])
  })

  test('formats dates in UTC so a day-only date never slips a day', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-01-01T00:00:00.000Z', description: 'New year', category: 'work' },
    ])
    expect(lines[0].title).toBe('Jan 1 — New year')
  })

  test('trims fractional hours to at most two decimals', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Thing', hours: 1.256, category: 'work' },
    ])
    expect(lines[0].description).toBe('1.26h · Work · milestone log')
  })

  test('returns an empty array for no entries', () => {
    expect(buildWorkLines([])).toEqual([])
  })

  test('exposes a label for every category', () => {
    expect(WORK_CATEGORY_LABEL).toEqual({
      work: 'Work',
      design: 'Design',
      revision: 'Revisions',
      meeting: 'Meetings',
    })
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `bun test src/lib/packages/workLines.test.ts`
Expected: FAIL — `Cannot find module './workLines'`.

- [ ] **Step 4: Write the implementation**

```typescript
// src/lib/packages/workLines.ts
/**
 * Milestone work entries → invoice/order line shapes.
 *
 * Consumed work entries ride along on a scheduled-payment invoice as $0 lines:
 * the payment line carries the price, these document what the payment bought.
 * Pure (no server deps) so the action, the send modal, and the email builder can
 * all agree on the exact same wording.
 */

export type WorkCategory = 'work' | 'design' | 'revision' | 'meeting'

export const WORK_CATEGORY_LABEL: Record<WorkCategory, string> = {
  work: 'Work',
  design: 'Design',
  revision: 'Revisions',
  meeting: 'Meetings',
}

export interface WorkEntryLineInput {
  id: string
  /** ISO date — formatted in UTC so a day-only date never slips a day. */
  date: string
  description?: string | null
  /** Informational only — never priced. */
  hours?: number | null
  category?: WorkCategory | null
}

export interface WorkLine {
  entryId: string
  /** "May 2 — Rebuilt inventory sync" */
  title: string
  /** "3h · Work · milestone log" */
  description: string
}

/** Trim to at most 2 decimals — 1.256 → 1.26, 3 → 3. */
function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/**
 * Build one $0 line per work entry, oldest first. Blank descriptions fall back to
 * the category label so a line is never untitled.
 */
export function buildWorkLines(entries: WorkEntryLineInput[]): WorkLine[] {
  return [...entries]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((e) => {
      const category = WORK_CATEGORY_LABEL[(e.category ?? 'work') as WorkCategory] ?? WORK_CATEGORY_LABEL.work
      const hours = round2(e.hours ?? 0)
      return {
        entryId: e.id,
        title: `${fmtDay(e.date)} — ${e.description?.trim() || category}`,
        description: [hours > 0 ? `${hours}h` : null, category, 'milestone log'].filter(Boolean).join(' · '),
      }
    })
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `bun test src/lib/packages/workLines.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 6: Typecheck**

Run: `bun run tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json src/lib/packages/workLines.ts src/lib/packages/workLines.test.ts
git commit -m "feat: add buildWorkLines for milestone work invoice lines"
```

---

## Task 3: Package recap model — `derivePackageRecapDefaults` / `mergePackageRecap`

**Files:**
- Create: `src/lib/packages/recap.ts`
- Test: `src/lib/packages/recap.test.ts`

**Interfaces:**
- Consumes: `WorkCategory`, `WORK_CATEGORY_LABEL` from `src/lib/packages/workLines.ts` (Task 2)
- Produces (imported by Tasks 4, 5, 6, 7, 8):
  - `interface PackageRecapItem { date: string; description: string; hours: number | null; category: WorkCategory }`
  - `interface PackageRecapBucket { label: string; items: PackageRecapItem[]; hours: number; note: string }`
  - `interface PackageRecapRemaining { kind: 'planned' | 'payment'; label: string; amount: number | null; dueDate: string | null }`
  - `interface PackageRecapData { ... }` (full shape below)
  - `interface PackageRecapEntryInput { date: string; description: string; hours: number | null; category: WorkCategory }` — imported by Task 4's `toEntryInput`
  - `interface PackageRecapDeriveInput { ... }`
  - `function derivePackageRecapDefaults(i: PackageRecapDeriveInput): PackageRecapData`
  - `function mergePackageRecap(server: PackageRecapData, client: Partial<PackageRecapData> | null | undefined): PackageRecapData`

This mirrors `src/lib/retainers/recap.ts` exactly in architecture: server owns every number and every entry; the client owns narrative text only, and buckets/items zip **by index** so a client can never fabricate work.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/packages/recap.test.ts
import { expect, test, describe } from 'bun:test'
import { derivePackageRecapDefaults, mergePackageRecap, type PackageRecapDeriveInput } from './recap'

const base: PackageRecapDeriveInput = {
  clientName: 'Steinway',
  clientCompany: 'Steinway & Sons',
  packageName: 'Used Steinway Website Launch',
  paymentLabel: 'Final Payment',
  paymentAmount: 4000,
  paymentDueDate: '2026-06-01T00:00:00.000Z',
  paymentIndex: 2,
  paymentCount: 3,
  packageTotal: 10000,
  amountPaid: 6000,
  loggedEntries: [
    { date: '2026-05-02T00:00:00.000Z', description: 'Rebuilt inventory sync', hours: 3, category: 'work' },
    { date: '2026-05-04T00:00:00.000Z', description: 'Homepage polish', hours: 2, category: 'design' },
    { date: '2026-05-06T00:00:00.000Z', description: 'Copy revisions', hours: null, category: 'design' },
  ],
  plannedOpen: [
    { date: '2026-05-20T00:00:00.000Z', description: 'Launch checklist', hours: null, category: 'work' },
  ],
  remainingPayments: [
    { label: 'Balance', amount: 4000, dueDate: '2026-07-01T00:00:00.000Z' },
  ],
}

describe('derivePackageRecapDefaults', () => {
  test('derives the payment cover facts', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.clientName).toBe('Steinway')
    expect(r.packageName).toBe('Used Steinway Website Launch')
    expect(r.paymentLabel).toBe('Final Payment')
    expect(r.paymentAmount).toBe(4000)
    expect(r.paymentPosition).toBe('Payment 2 of 3')
    expect(r.amountPaid).toBe(6000)
    expect(r.amountRemaining).toBe(4000)
  })

  test('buckets logged entries by category and sums hours', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.buckets.map((b) => b.label)).toEqual(['Work', 'Design'])
    expect(r.buckets[0].hours).toBe(3)
    expect(r.buckets[1].hours).toBe(2)
    expect(r.buckets[1].items).toHaveLength(2)
    expect(r.itemsShipped).toBe(3)
    expect(r.totalHours).toBe(5)
  })

  test('drops empty categories from the buckets', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.buckets.some((b) => b.label === 'Revisions')).toBe(false)
    expect(r.buckets.some((b) => b.label === 'Meetings')).toBe(false)
  })

  test('builds "what is left" from open plans then remaining payments', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.remaining).toEqual([
      { kind: 'planned', label: 'Launch checklist', amount: null, dueDate: '2026-05-20T00:00:00.000Z' },
      { kind: 'payment', label: 'Balance', amount: 4000, dueDate: '2026-07-01T00:00:00.000Z' },
    ])
  })

  test('seeds a headline and leaves narrative fields blank', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.headline).toBe('3 items delivered, 5 hours logged')
    expect(r.accomplishedHeadline).toBe('')
    expect(r.remainingHeadline).toBe('')
    expect(r.notes).toEqual([''])
    expect(r.nextSteps).toEqual([''])
  })

  test('handles a package with no logged work', () => {
    const r = derivePackageRecapDefaults({ ...base, loggedEntries: [] })
    expect(r.buckets).toEqual([])
    expect(r.itemsShipped).toBe(0)
    expect(r.totalHours).toBe(0)
    expect(r.headline).toBe('0 items delivered, 0 hours logged')
  })

  test('singularizes a one-item headline', () => {
    const r = derivePackageRecapDefaults({ ...base, loggedEntries: [base.loggedEntries[0]] })
    expect(r.headline).toBe('1 item delivered, 3 hours logged')
  })
})

describe('mergePackageRecap', () => {
  test('takes narrative text from the client', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      headline: 'A great month',
      accomplishedHeadline: 'Shipped the store',
      notes: ['Client approved the design'],
      nextSteps: ['Launch'],
    })
    expect(merged.headline).toBe('A great month')
    expect(merged.accomplishedHeadline).toBe('Shipped the store')
    expect(merged.notes).toEqual(['Client approved the design'])
    expect(merged.nextSteps).toEqual(['Launch'])
  })

  test('never lets the client change amounts or counts', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      paymentAmount: 999999,
      amountPaid: 0,
      amountRemaining: 0,
      itemsShipped: 100,
      totalHours: 100,
      packageTotal: 1,
    } as any)
    expect(merged.paymentAmount).toBe(4000)
    expect(merged.amountPaid).toBe(6000)
    expect(merged.amountRemaining).toBe(4000)
    expect(merged.itemsShipped).toBe(3)
    expect(merged.totalHours).toBe(5)
    expect(merged.packageTotal).toBe(10000)
  })

  test('zips bucket notes by index, keeping server hours and items', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      buckets: [
        { label: 'Engineering', hours: 999, note: 'Sync rebuilt end to end', items: [] },
        { label: '', hours: 999, note: 'Visual pass', items: [] },
      ] as any,
    })
    expect(merged.buckets[0].label).toBe('Engineering')
    expect(merged.buckets[0].note).toBe('Sync rebuilt end to end')
    expect(merged.buckets[0].hours).toBe(3)
    expect(merged.buckets[0].items).toEqual(server.buckets[0].items)
    // Blank label falls back to the server label.
    expect(merged.buckets[1].label).toBe('Design')
  })

  test('cannot add buckets the server did not derive', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      buckets: [
        { label: 'A', hours: 1, note: '', items: [] },
        { label: 'B', hours: 1, note: '', items: [] },
        { label: 'Fabricated', hours: 50, note: '', items: [] },
      ] as any,
    })
    expect(merged.buckets).toHaveLength(2)
  })

  test('cannot add or edit remaining rows', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      remaining: [{ kind: 'payment', label: 'Free', amount: 0, dueDate: null }] as any,
    })
    expect(merged.remaining).toEqual(server.remaining)
  })

  test('null client input returns the server model unchanged', () => {
    const server = derivePackageRecapDefaults(base)
    expect(mergePackageRecap(server, null)).toEqual(server)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test src/lib/packages/recap.test.ts`
Expected: FAIL — `Cannot find module './recap'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/packages/recap.ts
/**
 * Milestone package recap — shared shapes + default-derivation.
 *
 * A recap is the client-facing summary attached to one scheduled payment: what the
 * payment bought and what remains. Numeric/factual fields are derived from the work
 * log and the payment schedule (`derivePackageRecapDefaults`); narrative fields start
 * blank for staff to fill in the composer.
 *
 * Pure (no server/pdf deps) so the server action, the PDF route, and the client
 * composer can all import it. Mirrors src/lib/retainers/recap.ts.
 */
import { WORK_CATEGORY_LABEL, type WorkCategory } from './workLines'

export interface PackageRecapItem {
  date: string
  description: string
  hours: number | null
  category: WorkCategory
}

export interface PackageRecapBucket {
  label: string // editable — defaults to the category label
  items: PackageRecapItem[] // server-authoritative
  hours: number // server-authoritative
  note: string // narrative — starts blank
}

export interface PackageRecapRemaining {
  kind: 'planned' | 'payment'
  label: string
  amount: number | null
  dueDate: string | null
}

export interface PackageRecapData {
  // ── Cover (auto) ──
  clientName: string
  clientCompany: string | null
  packageName: string
  paymentLabel: string
  paymentAmount: number
  paymentDueDate: string | null
  paymentPosition: string // "Payment 2 of 3"
  paymentIndex: number
  paymentCount: number
  // ── At a glance (auto) ──
  packageTotal: number
  amountPaid: number
  amountRemaining: number
  itemsShipped: number
  totalHours: number
  // ── Narrative ──
  headline: string // editable summary line — seeded
  accomplishedHeadline: string
  remainingHeadline: string
  // ── Accomplished ──
  buckets: PackageRecapBucket[] // auto set + hours + items; labels/notes editable
  // ── What's left ──
  remaining: PackageRecapRemaining[] // auto, non-editable
  // ── Notes ──
  notes: string[]
  nextSteps: string[]
}

export interface PackageRecapEntryInput {
  date: string
  description: string
  hours: number | null
  category: WorkCategory
}

export interface PackageRecapDeriveInput {
  clientName: string
  clientCompany: string | null
  packageName: string
  paymentLabel: string
  paymentAmount: number
  paymentDueDate: string | null
  /** 1-based position of this payment in the schedule. */
  paymentIndex: number
  paymentCount: number
  packageTotal: number
  amountPaid: number
  /** Pending logged entries this payment will consume. */
  loggedEntries: PackageRecapEntryInput[]
  /** Planned entries still marked incomplete. */
  plannedOpen: PackageRecapEntryInput[]
  /** Schedule entries after this one that are still un-invoiced. */
  remainingPayments: { label: string; amount: number; dueDate: string | null }[]
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100
}

/** Category order in the recap — stable regardless of log order. */
const BUCKET_ORDER: WorkCategory[] = ['work', 'design', 'revision', 'meeting']

/**
 * Build the default recap from a package's pending work and its schedule position.
 * Numbers, buckets, and the remaining list come straight from the server; narrative
 * fields start blank (headline is seeded so the composer opens with something).
 */
export function derivePackageRecapDefaults(i: PackageRecapDeriveInput): PackageRecapData {
  const buckets: PackageRecapBucket[] = BUCKET_ORDER.map((cat) => {
    const items = i.loggedEntries.filter((e) => (e.category ?? 'work') === cat)
    return {
      label: WORK_CATEGORY_LABEL[cat],
      items,
      hours: round2(items.reduce((s, e) => s + (e.hours ?? 0), 0)),
      note: '',
    }
  }).filter((b) => b.items.length > 0)

  const itemsShipped = i.loggedEntries.length
  const totalHours = round2(i.loggedEntries.reduce((s, e) => s + (e.hours ?? 0), 0))

  const remaining: PackageRecapRemaining[] = [
    ...i.plannedOpen.map((p) => ({
      kind: 'planned' as const,
      label: p.description,
      amount: null,
      dueDate: p.date ?? null,
    })),
    ...i.remainingPayments.map((p) => ({
      kind: 'payment' as const,
      label: p.label,
      amount: p.amount,
      dueDate: p.dueDate ?? null,
    })),
  ]

  return {
    clientName: i.clientName,
    clientCompany: i.clientCompany,
    packageName: i.packageName,
    paymentLabel: i.paymentLabel,
    paymentAmount: i.paymentAmount,
    paymentDueDate: i.paymentDueDate,
    paymentPosition: `Payment ${i.paymentIndex} of ${i.paymentCount}`,
    paymentIndex: i.paymentIndex,
    paymentCount: i.paymentCount,
    packageTotal: round2(i.packageTotal),
    amountPaid: round2(i.amountPaid),
    amountRemaining: round2(Math.max(0, i.packageTotal - i.amountPaid)),
    itemsShipped,
    totalHours,
    headline: `${itemsShipped} item${itemsShipped === 1 ? '' : 's'} delivered, ${totalHours} hour${totalHours === 1 ? '' : 's'} logged`,
    accomplishedHeadline: '',
    remainingHeadline: '',
    buckets,
    remaining,
    notes: [''],
    nextSteps: [''],
  }
}

/**
 * Merge staff-edited recap text over the server's authoritative model. Every number,
 * every work item, and the whole remaining list come from `server`; only narrative
 * text comes from `client`. Buckets zip by index so client-edited labels/notes attach
 * to server hours and server items — a client can never fabricate work or amounts.
 */
export function mergePackageRecap(
  server: PackageRecapData,
  client: Partial<PackageRecapData> | null | undefined,
): PackageRecapData {
  const c = client ?? {}
  const buckets = server.buckets.map((b, idx) => ({
    label: c.buckets?.[idx]?.label?.trim() || b.label,
    items: b.items, // server-authoritative
    hours: b.hours, // server-authoritative
    note: c.buckets?.[idx]?.note ?? b.note,
  }))
  return {
    // ── server-authoritative ──
    clientName: server.clientName,
    clientCompany: server.clientCompany,
    packageName: server.packageName,
    paymentLabel: server.paymentLabel,
    paymentAmount: server.paymentAmount,
    paymentDueDate: server.paymentDueDate,
    paymentPosition: server.paymentPosition,
    paymentIndex: server.paymentIndex,
    paymentCount: server.paymentCount,
    packageTotal: server.packageTotal,
    amountPaid: server.amountPaid,
    amountRemaining: server.amountRemaining,
    itemsShipped: server.itemsShipped,
    totalHours: server.totalHours,
    buckets,
    remaining: server.remaining,
    // ── staff-editable text ──
    headline: c.headline ?? server.headline,
    accomplishedHeadline: c.accomplishedHeadline ?? server.accomplishedHeadline,
    remainingHeadline: c.remainingHeadline ?? server.remainingHeadline,
    notes: Array.isArray(c.notes) ? c.notes : server.notes,
    nextSteps: Array.isArray(c.nextSteps) ? c.nextSteps : server.nextSteps,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test src/lib/packages/recap.test.ts`
Expected: PASS — 12 tests.

- [ ] **Step 5: Run the whole suite and typecheck**

Run: `bun test && bun run tsc --noEmit`
Expected: all tests pass, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/packages/recap.ts src/lib/packages/recap.test.ts
git commit -m "feat: add package recap model with fabrication-resistant merge"
```

---

## Task 4: Work-log server actions

**Files:**
- Create: `src/actions/packageWork.ts`

**Interfaces:**
- Consumes: collection `'package-work-entries'` (Task 1); `WorkCategory` (Task 2); `derivePackageRecapDefaults`, `PackageRecapData` (Task 3)
- Produces (used by Tasks 5, 7, 8):

```typescript
type WorkEntryStatus = 'planned' | 'logged'
type WorkEntryCompletion = 'incomplete' | 'complete'
interface WorkEntryRow { id, date, status, completion, category, hours, description, billedOrderId, loggedBy }
interface ScheduleRow { id, label, entryType, amount, dueDate, orderId, invoicedAt, paid }
interface MilestonePortfolioRow { clientAccountId, clientName, clientCompany, packageId, packageName, nextEntry, pendingWorkCount, plannedOpenCount, needsRecap }

logPackageWork(input: { packageId: string; date: string; hours?: number; category?: WorkCategory; description: string })
createPackagePlan(input: { packageId: string; date: string; description: string; category?: WorkCategory })
logPlannedWork(input: { planId: string; date?: string; hours?: number; category?: WorkCategory; description?: string })
updateWorkEntry(input: { id: string; date?: string; hours?: number; category?: WorkCategory; completion?: WorkEntryCompletion; description?: string })
deleteWorkEntry(id: string)
getPackageWorkSummary(packageId: string)
getMilestonePortfolio()
getPackageRecapModel(packageId: string, entryId: string)
```

All return the house `{ success: true as const, ... } | { success: false as const, error: string }` shape.

- [ ] **Step 1: Create the actions file**

```typescript
// src/actions/packageWork.ts
'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { buildWorkLines, type WorkCategory } from '@/lib/packages/workLines'
import { derivePackageRecapDefaults, type PackageRecapEntryInput } from '@/lib/packages/recap'

export type WorkEntryStatus = 'planned' | 'logged'
export type WorkEntryCompletion = 'incomplete' | 'complete'

export interface WorkEntryRow {
  id: string
  date: string
  status: WorkEntryStatus
  completion: WorkEntryCompletion
  category: WorkCategory
  hours: number | null
  description: string
  billedOrderId: string | null
  loggedBy: string | null
}

export interface ScheduleRow {
  id: string
  label: string
  entryType: 'deposit' | 'installment' | 'balance' | null
  amount: number
  dueDate: string | null
  orderId: string | null
  invoicedAt: string | null
  paid: boolean
}

/** Normalize a day-only date string to a stable ISO instant (matches retainers' dayToIso). */
function dayToIso(date: string): string {
  const d = date.length === 10 ? `${date}T00:00:00.000Z` : date
  return new Date(d).toISOString()
}

function toRow(e: any): WorkEntryRow {
  return {
    id: e.id,
    date: typeof e.date === 'string' ? e.date : new Date(e.date).toISOString(),
    status: (e.status ?? 'logged') as WorkEntryStatus,
    completion: (e.completion ?? 'incomplete') as WorkEntryCompletion,
    category: (e.category ?? 'work') as WorkCategory,
    hours: e.hours ?? null,
    description: e.description ?? '',
    billedOrderId: e.billedOrderId || null,
    loggedBy: typeof e.loggedBy === 'object' ? e.loggedBy?.id ?? null : e.loggedBy ?? null,
  }
}

function toEntryInput(r: WorkEntryRow): PackageRecapEntryInput {
  return { date: r.date, description: r.description, hours: r.hours, category: r.category }
}

/**
 * Load a proposal package and its client account id. Work entries only ever attach to
 * `type: 'proposal'` packages — enforced here rather than in the collection so the
 * error is a clean action result instead of a validation throw.
 */
async function loadProposal(
  payload: Awaited<ReturnType<typeof getPayload>>,
  packageId: string,
): Promise<{ pkg: any; clientAccountId: string } | null> {
  const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 0 }).catch(() => null)
  if (!pkg || (pkg as any).type !== 'proposal') return null
  const ca = (pkg as any).clientAccount
  const clientAccountId = typeof ca === 'object' && ca ? ca.id : ca
  if (!clientAccountId) return null
  return { pkg, clientAccountId }
}

// ── Writes ───────────────────────────────────────────────────────────────────────

/** Log completed work against a package. Pending until a scheduled-payment invoice consumes it. Staff only. */
export async function logPackageWork(input: {
  packageId: string
  date: string
  hours?: number
  category?: WorkCategory
  description: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.packageId) return { success: false as const, error: 'No package selected' }
    if (!input.date) return { success: false as const, error: 'A date is required' }
    if (!input.description?.trim()) return { success: false as const, error: 'Describe the work' }
    if (input.hours !== undefined && input.hours < 0) return { success: false as const, error: 'Hours cannot be negative' }

    const payload = await getPayload({ config })
    const loaded = await loadProposal(payload, input.packageId)
    if (!loaded) return { success: false as const, error: 'Package proposal not found' }

    const entry = await payload.create({
      collection: 'package-work-entries',
      data: {
        package: input.packageId,
        clientAccount: loaded.clientAccountId,
        date: dayToIso(input.date),
        hours: input.hours ?? undefined,
        status: 'logged',
        completion: 'incomplete',
        category: input.category ?? 'work',
        description: input.description.trim(),
        loggedBy: user.id,
      } as any,
    })

    return { success: true as const, id: entry.id, entry: toRow(entry) }
  } catch (error) {
    console.error('[logPackageWork]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to log work' }
  }
}

/** Create a planned work item — "what's left" until it is logged. Staff only. */
export async function createPackagePlan(input: {
  packageId: string
  date: string
  description: string
  category?: WorkCategory
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.packageId) return { success: false as const, error: 'No package selected' }
    if (!input.date) return { success: false as const, error: 'A date is required' }
    if (!input.description?.trim()) return { success: false as const, error: 'Describe the planned work' }

    const payload = await getPayload({ config })
    const loaded = await loadProposal(payload, input.packageId)
    if (!loaded) return { success: false as const, error: 'Package proposal not found' }

    const entry = await payload.create({
      collection: 'package-work-entries',
      data: {
        package: input.packageId,
        clientAccount: loaded.clientAccountId,
        date: dayToIso(input.date),
        status: 'planned',
        completion: 'incomplete',
        category: input.category ?? 'work',
        description: input.description.trim(),
        loggedBy: user.id,
      } as any,
    })

    return { success: true as const, id: entry.id, entry: toRow(entry) }
  } catch (error) {
    console.error('[createPackagePlan]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to create plan' }
  }
}

/**
 * Log a planned item as done WITHOUT consuming it. Creates a separate logged entry and
 * marks the plan complete, so the plan list keeps a permanent record — same pattern as
 * the retainer's logPlannedHours. Staff only.
 */
export async function logPlannedWork(input: {
  planId: string
  date?: string
  hours?: number
  category?: WorkCategory
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.planId) return { success: false as const, error: 'No planned item selected' }

    const payload = await getPayload({ config })
    const plan = await payload
      .findByID({ collection: 'package-work-entries', id: input.planId, depth: 0 })
      .catch(() => null)
    if (!plan) return { success: false as const, error: 'Planned item not found' }
    if ((plan as any).status !== 'planned') return { success: false as const, error: 'That entry is not a planned item' }

    const packageId = typeof (plan as any).package === 'object' ? (plan as any).package.id : (plan as any).package

    const logged = await logPackageWork({
      packageId,
      date: input.date ?? String((plan as any).date).slice(0, 10),
      hours: input.hours,
      category: input.category ?? ((plan as any).category ?? 'work'),
      description: input.description ?? (plan as any).description ?? '',
    })
    if (!logged.success) return logged

    await payload.update({
      collection: 'package-work-entries',
      id: input.planId,
      data: { completion: 'complete' } as any,
    })

    return { success: true as const, id: logged.id }
  } catch (error) {
    console.error('[logPlannedWork]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to log planned work' }
  }
}

/**
 * Edit an entry in place. Editing never changes an entry's kind: a planned item stays
 * planned even with hours set, and a logged entry stays logged. Entries already consumed
 * by an invoice are frozen — the client has seen them on a document. Staff only.
 */
export async function updateWorkEntry(input: {
  id: string
  date?: string
  hours?: number
  category?: WorkCategory
  completion?: WorkEntryCompletion
  description?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!input.id) return { success: false as const, error: 'No entry selected' }

    const payload = await getPayload({ config })
    const existing = await payload
      .findByID({ collection: 'package-work-entries', id: input.id, depth: 0 })
      .catch(() => null)
    if (!existing) return { success: false as const, error: 'Entry not found' }
    if ((existing as any).billedOrderId) {
      return { success: false as const, error: 'This entry is already on an invoice and cannot be edited' }
    }

    const data: Record<string, unknown> = {}
    if (input.date !== undefined) data.date = dayToIso(input.date)
    if (input.hours !== undefined) data.hours = input.hours
    if (input.category !== undefined) data.category = input.category
    if (input.completion !== undefined) data.completion = input.completion
    if (input.description !== undefined) data.description = input.description

    const updated = await payload.update({ collection: 'package-work-entries', id: input.id, data: data as any })
    return { success: true as const, id: input.id, entry: toRow(updated) }
  } catch (error) {
    console.error('[updateWorkEntry]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to update entry' }
  }
}

/** Delete an unbilled work entry. Billed entries are frozen. Staff only. */
export async function deleteWorkEntry(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!id) return { success: false as const, error: 'No entry selected' }

    const payload = await getPayload({ config })
    const existing = await payload
      .findByID({ collection: 'package-work-entries', id, depth: 0 })
      .catch(() => null)
    if (!existing) return { success: false as const, error: 'Entry not found' }
    if ((existing as any).billedOrderId) {
      return { success: false as const, error: 'This entry is already on an invoice and cannot be deleted' }
    }

    await payload.delete({ collection: 'package-work-entries', id })
    return { success: true as const }
  } catch (error) {
    console.error('[deleteWorkEntry]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to delete entry' }
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────────

/**
 * Everything the Milestones station needs for one package: the work log split into
 * pending / billed / planned, plus the payment schedule joined to order status. Staff only.
 */
export async function getPackageWorkSummary(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!packageId) return { success: false as const, error: 'A package is required' }

    const payload = await getPayload({ config })
    const loaded = await loadProposal(payload, packageId)
    if (!loaded) return { success: false as const, error: 'Package proposal not found' }

    const { docs } = await payload.find({
      collection: 'package-work-entries',
      where: { package: { equals: packageId } },
      depth: 0,
      sort: 'date',
      limit: 1000,
    })
    const rows = (docs as any[]).map(toRow)

    const schedule = (((loaded.pkg as any).paymentSchedule ?? []) as any[]).map((e) => ({
      id: e.id as string,
      label: (e.label ?? '') as string,
      entryType: (e.entryType ?? null) as ScheduleRow['entryType'],
      amount: (e.amount ?? 0) as number,
      dueDate: (e.dueDate ?? null) as string | null,
      orderId: (e.orderId ?? null) as string | null,
      invoicedAt: (e.invoicedAt ?? null) as string | null,
      paid: false,
    }))

    // Join order status so the timeline can show paid ● vs invoiced ●.
    const orderIds = schedule.map((s) => s.orderId).filter(Boolean) as string[]
    if (orderIds.length > 0) {
      const { docs: orders } = await payload.find({
        collection: 'orders',
        where: { id: { in: orderIds } },
        depth: 0,
        limit: orderIds.length,
      })
      const paidById = new Map((orders as any[]).map((o) => [o.id, o.status === 'paid']))
      for (const s of schedule) {
        if (s.orderId) s.paid = paidById.get(s.orderId) ?? false
      }
    }

    const account = await payload
      .findByID({ collection: 'client-accounts', id: loaded.clientAccountId, depth: 0 })
      .catch(() => null)

    return {
      success: true as const,
      package: {
        id: packageId,
        name: ((loaded.pkg as any).name ?? 'Package') as string,
        clientAccountId: loaded.clientAccountId,
        clientName: ((account as any)?.name ?? 'Client') as string,
        clientCompany: (((account as any)?.company ?? null) as string | null),
      },
      pending: rows.filter((r) => r.status === 'logged' && !r.billedOrderId),
      billed: rows.filter((r) => r.status === 'logged' && !!r.billedOrderId),
      planned: rows.filter((r) => r.status === 'planned'),
      schedule,
    }
  } catch (error) {
    console.error('[getPackageWorkSummary]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load work summary' }
  }
}

export interface MilestonePortfolioRow {
  clientAccountId: string
  clientName: string
  clientCompany: string | null
  packageId: string
  packageName: string
  nextEntry: { id: string; label: string; amount: number; dueDate: string | null } | null
  pendingWorkCount: number
  plannedOpenCount: number
  /** A payment is due within 30 days and there is unbilled logged work. */
  needsRecap: boolean
}

/** Every proposal package with a pending scheduled payment, soonest due first. Staff only. */
export async function getMilestonePortfolio() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    const { docs: packages } = await payload.find({
      collection: 'packages',
      where: { type: { equals: 'proposal' } } as any,
      depth: 0,
      limit: 300,
    })

    // Keep only packages with at least one un-invoiced schedule entry.
    const candidates = (packages as any[])
      .map((pkg) => {
        const pending = ((pkg.paymentSchedule ?? []) as any[])
          .filter((e) => !(e.orderId && e.invoicedAt))
          .sort((a, b) => String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999')))
        return { pkg, pending }
      })
      .filter((c) => c.pending.length > 0)

    if (candidates.length === 0) return { success: true as const, rows: [] as MilestonePortfolioRow[] }

    const clientIds = [
      ...new Set(
        candidates
          .map((c) => (typeof c.pkg.clientAccount === 'object' ? c.pkg.clientAccount?.id : c.pkg.clientAccount))
          .filter(Boolean),
      ),
    ] as string[]
    const { docs: accounts } = clientIds.length
      ? await payload.find({ collection: 'client-accounts', where: { id: { in: clientIds } }, depth: 0, limit: clientIds.length })
      : { docs: [] as any[] }
    const acctById = new Map((accounts as any[]).map((a) => [a.id, { name: a.name as string, company: (a.company ?? null) as string | null }]))

    // One query for every candidate package's entries, then bucket in memory.
    const packageIds = candidates.map((c) => c.pkg.id as string)
    const { docs: entries } = await payload.find({
      collection: 'package-work-entries',
      where: { package: { in: packageIds } },
      depth: 0,
      limit: 5000,
    })
    const byPackage = new Map<string, { pending: number; plannedOpen: number }>()
    for (const e of entries as any[]) {
      const pid = typeof e.package === 'object' ? e.package?.id : e.package
      if (!pid) continue
      const bucket = byPackage.get(pid) ?? { pending: 0, plannedOpen: 0 }
      if (e.status === 'logged' && !e.billedOrderId) bucket.pending += 1
      if (e.status === 'planned' && e.completion !== 'complete') bucket.plannedOpen += 1
      byPackage.set(pid, bucket)
    }

    const soon = Date.now() + 30 * 86_400_000
    const rows: MilestonePortfolioRow[] = candidates.map(({ pkg, pending }) => {
      const clientAccountId = (typeof pkg.clientAccount === 'object' ? pkg.clientAccount?.id : pkg.clientAccount) as string
      const acct = acctById.get(clientAccountId)
      const counts = byPackage.get(pkg.id as string) ?? { pending: 0, plannedOpen: 0 }
      const next = pending[0]
      const dueSoon = next?.dueDate ? Date.parse(next.dueDate) <= soon : false
      return {
        clientAccountId,
        clientName: acct?.name ?? 'Client',
        clientCompany: acct?.company ?? null,
        packageId: pkg.id as string,
        packageName: (pkg.name ?? 'Package') as string,
        nextEntry: next
          ? { id: next.id as string, label: (next.label ?? '') as string, amount: (next.amount ?? 0) as number, dueDate: (next.dueDate ?? null) as string | null }
          : null,
        pendingWorkCount: counts.pending,
        plannedOpenCount: counts.plannedOpen,
        needsRecap: dueSoon && counts.pending > 0,
      }
    })

    // Soonest pending due date first; undated entries sort last.
    rows.sort((a, b) => {
      const ad = a.nextEntry?.dueDate ?? '9999'
      const bd = b.nextEntry?.dueDate ?? '9999'
      if (ad !== bd) return ad.localeCompare(bd)
      return a.clientName.localeCompare(b.clientName)
    })

    return { success: true as const, rows }
  } catch (error) {
    console.error('[getMilestonePortfolio]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to load portfolio' }
  }
}

/**
 * The default recap for one scheduled payment — the model the composer opens with.
 * Numbers come from the package's schedule and its pending work log; narrative fields
 * start blank. Staff only.
 */
export async function getPackageRecapModel(packageId: string, entryId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }
    if (!packageId || !entryId) return { success: false as const, error: 'A package and payment are required' }

    const summary = await getPackageWorkSummary(packageId)
    if (!summary.success) return { success: false as const, error: summary.error }

    const idx = summary.schedule.findIndex((s) => s.id === entryId)
    if (idx === -1) return { success: false as const, error: 'Schedule entry not found' }
    const entry = summary.schedule[idx]

    const packageTotal = summary.schedule.reduce((s, e) => s + (e.amount ?? 0), 0)
    const amountPaid = summary.schedule.filter((e) => e.paid).reduce((s, e) => s + (e.amount ?? 0), 0)
    const remainingPayments = summary.schedule
      .slice(idx + 1)
      .filter((e) => !(e.orderId && e.invoicedAt))
      .map((e) => ({ label: e.label, amount: e.amount, dueDate: e.dueDate }))

    const model = derivePackageRecapDefaults({
      clientName: summary.package.clientName,
      clientCompany: summary.package.clientCompany,
      packageName: summary.package.name,
      paymentLabel: entry.label,
      paymentAmount: entry.amount,
      paymentDueDate: entry.dueDate,
      paymentIndex: idx + 1,
      paymentCount: summary.schedule.length,
      packageTotal,
      amountPaid,
      loggedEntries: summary.pending.map(toEntryInput),
      plannedOpen: summary.planned.filter((p) => p.completion !== 'complete').map(toEntryInput),
      remainingPayments,
    })

    return {
      success: true as const,
      model,
      packageId,
      entryId,
      /**
       * The pending entries this recap covers, already formatted as the exact $0 lines
       * the invoice will carry. Date-ordered and id-carrying, so the send modal can show
       * a deselectable list that matches the invoice one-for-one. (The recap's `buckets`
       * regroup the same work by category and carry no ids — do not use them for this.)
       */
      workLines: buildWorkLines(
        summary.pending.map((p) => ({
          id: p.id,
          date: p.date,
          description: p.description,
          hours: p.hours,
          category: p.category,
        })),
      ),
    }
  } catch (error) {
    console.error('[getPackageRecapModel]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to build recap' }
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Smoke-test against a real package**

Start the dev server (`bun run bun:dev`), open the Payload admin at `http://localhost:3000/admin/collections/package-work-entries`, and create one entry by hand against an existing proposal package (any client). Confirm:
- the collection appears under the **Clients** group,
- `billedOrderId` renders read-only,
- saving succeeds with `description` filled and `hours` left empty.

Then delete the test entry.

- [ ] **Step 4: Commit**

```bash
git add src/actions/packageWork.ts
git commit -m "feat: add package work-log server actions"
```

---

## Task 5: Consume-on-invoice — stamp, release, and $0 lines

**Files:**
- Modify: `src/actions/packages.ts:914-950` (`removeScheduleEntry`), `:952-1081` (`sendScheduledPayment`)
- Modify: `src/lib/stripe/webhook-handlers.ts:265-273` (`handleInvoiceVoided`)
- Modify: `src/components/dashboard/ScheduledPaymentsSection.tsx:117` (call-site signature change)

**Interfaces:**
- Consumes: `buildWorkLines` (Task 2); collection `'package-work-entries'` (Task 1)
- Produces:
  - `interface SendScheduledPaymentOpts { skipEmail?: boolean; workLineIds?: string[]; recap?: Partial<PackageRecapData>; attachRecapPdf?: boolean; includeWorkInEmail?: boolean }`
  - `sendScheduledPayment(packageId, entryId, projectId?, opts?: SendScheduledPaymentOpts)` — **breaking**: the 4th parameter was `skipEmail?: boolean`.
  - `export async function releaseWorkEntriesForOrder(orderId: string): Promise<number>` — exported from `src/actions/packages.ts`, returns the number of entries released.

  Task 6 (email) and Task 7 (modal) consume `recap` / `attachRecapPdf` / `includeWorkInEmail`; this task threads them through but leaves email/PDF wiring as a no-op until Task 6 lands. That is deliberate — this task must remain independently shippable.

- [ ] **Step 1: Add the release helper and imports to `src/actions/packages.ts`**

Add to the import block at the top of the file (after line 21, `import { buildPackagePdf, buildOrcaclubSowPdf } from '@/lib/pdf-generators'`):

```typescript
import { buildWorkLines, type WorkCategory } from '@/lib/packages/workLines'
import type { PackageRecapData } from '@/lib/packages/recap'
```

Then add this exported helper immediately **above** `export async function removeScheduleEntry` (line 914):

```typescript
/**
 * Un-stamp every work entry consumed by an order — used when a scheduled payment fails
 * mid-flight, when its schedule entry is removed, or when Stripe voids the invoice. The
 * entries go back to pending so the next invoice can pick them up. Best-effort: a failure
 * here must never block the caller's primary operation. Returns how many were released.
 */
export async function releaseWorkEntriesForOrder(orderId: string): Promise<number> {
  if (!orderId) return 0
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'package-work-entries',
      where: { billedOrderId: { equals: orderId } },
      depth: 0,
      limit: 1000,
    })
    await Promise.all(
      (docs as any[]).map((d) =>
        payload
          .update({ collection: 'package-work-entries', id: d.id, data: { billedOrderId: '' } as any })
          .catch((e) => console.error('[releaseWorkEntriesForOrder] Failed to release entry:', d.id, e)),
      ),
    )
    return docs.length
  } catch (e) {
    console.error('[releaseWorkEntriesForOrder]', e)
    return 0
  }
}
```

- [ ] **Step 2: Release entries in `removeScheduleEntry`**

In `src/actions/packages.ts`, inside `removeScheduleEntry`, replace the pending-order deletion block (lines 929-936):

```typescript
    // Delete the pending order if one was created for this entry
    if (entry.orderId && !entry.invoicedAt) {
      try {
        await payload.delete({ collection: 'orders', id: entry.orderId })
      } catch (e) {
        console.error('[removeScheduleEntry] Failed to delete pending order:', e)
      }
    }
```

with:

```typescript
    // Delete the pending order if one was created for this entry, releasing any work
    // entries it consumed back to pending first.
    if (entry.orderId && !entry.invoicedAt) {
      await releaseWorkEntriesForOrder(entry.orderId)
      try {
        await payload.delete({ collection: 'orders', id: entry.orderId })
      } catch (e) {
        console.error('[removeScheduleEntry] Failed to delete pending order:', e)
      }
    }
```

- [ ] **Step 3: Rewrite `sendScheduledPayment` to consume work entries**

Replace the whole function (`src/actions/packages.ts:952-1081`) with:

```typescript
export interface SendScheduledPaymentOpts {
  /** Create the order + Stripe invoice but send no email. */
  skipEmail?: boolean
  /**
   * Work entries to attach as $0 lines. Omit to attach every pending logged entry;
   * pass [] to attach none.
   */
  workLineIds?: string[]
  /** Staff-composed recap narrative (merged server-side before use). */
  recap?: Partial<PackageRecapData>
  /** Attach the recap PDF to the invoice email. */
  attachRecapPdf?: boolean
  /** Render the itemized work log in the invoice email body. */
  includeWorkInEmail?: boolean
}

export async function sendScheduledPayment(
  packageId: string,
  entryId: string,
  projectId?: string,
  opts?: SendScheduledPaymentOpts,
) {
  let finalizedInvoice: any = null
  let stripe: ReturnType<typeof getStripe> | null = null
  /** Entries stamped in this run — unstamped if anything downstream throws. */
  let stampedEntryIds: string[] = []

  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg || pkg.type !== 'proposal') {
      return { success: false, error: 'Package proposal not found' }
    }

    const currentSchedule = ((pkg as any).paymentSchedule ?? []) as Array<{
      id: string
      label: string
      entryType?: 'deposit' | 'installment' | 'balance' | null
      amount: number
      dueDate?: string | null
      orderId?: string | null
      invoicedAt?: string | null
    }>

    const entry = currentSchedule.find((e) => e.id === entryId)
    if (!entry) return { success: false, error: 'Schedule entry not found' }
    if (entry.orderId) return { success: false, error: 'This entry has already been invoiced' }

    const clientAccount = pkg.clientAccount as any
    if (!clientAccount) return { success: false, error: 'No client account associated with this proposal' }

    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount.id
    const stripeCustomerId = typeof clientAccount === 'object' ? clientAccount.stripeCustomerId : null

    if (!stripeCustomerId) {
      return { success: false, error: 'Client account has no Stripe customer ID — set it in the admin panel first' }
    }

    // ── Pending work this invoice consumes ──────────────────────────────────────
    // Default: every pending logged entry. `workLineIds: []` attaches none.
    const { docs: pendingDocs } = await payload.find({
      collection: 'package-work-entries',
      where: {
        and: [
          { package: { equals: packageId } },
          { status: { equals: 'logged' } },
          { billedOrderId: { exists: false } },
        ],
      },
      depth: 0,
      sort: 'date',
      limit: 500,
    })
    // `exists: false` misses documents stored with an empty string — filter defensively.
    const allPending = (pendingDocs as any[]).filter((d) => !d.billedOrderId)
    const selected = opts?.workLineIds
      ? allPending.filter((d) => opts.workLineIds!.includes(d.id))
      : allPending
    const workLines = buildWorkLines(
      selected.map((d) => ({
        id: d.id as string,
        date: typeof d.date === 'string' ? d.date : new Date(d.date).toISOString(),
        description: d.description ?? null,
        hours: d.hours ?? null,
        category: (d.category ?? 'work') as WorkCategory,
      })),
    )

    const daysUntilDue = entry.dueDate
      ? Math.max(1, Math.round((new Date(entry.dueDate).getTime() - Date.now()) / 86400000))
      : 30

    const invoiceType = resolveInvoiceType(entry)

    stripe = getStripe()

    // The payment line carries the price; work lines ride along at $0 so the invoice
    // documents what the payment bought without changing the total.
    const { invoice: finalized } = await createStripeInvoiceForOrder({
      stripe,
      stripeCustomerId,
      daysUntilDue,
      description: pkg.name,
      invoiceMetadata: {
        orcaclub_package_id: packageId,
        orcaclub_invoice_type: invoiceType,
        orcaclub_schedule_entry_id: entryId,
      },
      lines: [
        { description: `${entry.label} — ${pkg.name}`, amount: entry.amount },
        ...workLines.map((l) => ({ description: l.title, amount: 0 })),
      ],
    })
    finalizedInvoice = finalized
    const orderNumber = finalized.number ?? finalized.id

    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        clientAccount: clientAccountId,
        projectRef: projectId || undefined,
        packageRef: packageId,
        invoiceType,
        invoiceNote: entry.label,
        amount: entry.amount,
        status: 'pending',
        stripeCustomerId,
        stripeInvoiceId: finalizedInvoice.id,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
        lineItems: [
          { title: entry.label, price: entry.amount, quantity: 1 },
          // Itemized work at $0 — covered by the payment line; the amount still balances.
          ...workLines.map((l) => ({ title: l.title, description: l.description, price: 0, quantity: 1 })),
        ],
      } as any,
    })

    // ── Consume: stamp the entries this order carried ───────────────────────────
    for (const l of workLines) {
      try {
        await payload.update({
          collection: 'package-work-entries',
          id: l.entryId,
          data: { billedOrderId: order.id } as any,
        })
        stampedEntryIds.push(l.entryId)
      } catch (e) {
        console.error('[sendScheduledPayment] Failed to stamp work entry:', l.entryId, e)
      }
    }

    const updatedSchedule = currentSchedule.map((e) =>
      e.id === entryId
        ? { ...e, orderId: order.id, invoicedAt: new Date().toISOString() }
        : e
    )

    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { paymentSchedule: updatedSchedule } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)

    // Non-blocking: send "New Invoice" email to client (skipped if skipEmail is true)
    if (!opts?.skipEmail) {
      ;(async () => {
        try {
          const clientUsername = await getClientUsername(payload, clientAccountId)
          const proposalPrintUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : undefined
          await sendGenericInvoiceEmail(payload, order.id, user.id, proposalPrintUrl)
        } catch (e) {
          console.error('[sendScheduledPayment] Invoice email failed:', e)
        }
      })()
    }

    return {
      success: true,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      orderNumber,
      orderId: order.id,
      workLineCount: workLines.length,
    }
  } catch (error) {
    // Release anything stamped before the failure, then void the orphaned invoice.
    if (stampedEntryIds.length > 0) {
      const cleanupPayload = await getPayload({ config }).catch(() => null)
      if (cleanupPayload) {
        await Promise.all(
          stampedEntryIds.map((id) =>
            cleanupPayload
              .update({ collection: 'package-work-entries', id, data: { billedOrderId: '' } as any })
              .catch((e) => console.error('[sendScheduledPayment] Failed to release work entry:', id, e)),
          ),
        )
      }
    }
    if (finalizedInvoice && stripe) {
      stripe.invoices.voidInvoice(finalizedInvoice.id).catch((e: any) =>
        console.error('[sendScheduledPayment] Failed to void orphaned Stripe invoice:', e)
      )
    }
    console.error('[sendScheduledPayment]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send scheduled payment' }
  }
}
```

- [ ] **Step 4: Release on Stripe void/uncollectible**

In `src/lib/stripe/webhook-handlers.ts`, add to the import block at the top:

```typescript
import { releaseWorkEntriesForOrder } from '@/actions/packages'
```

Then in `handleInvoiceVoided`, after the order is marked cancelled (immediately after the `retryOnTransientError` block ending at line 271) and before the `console.log` on line 273, insert:

```typescript
    // A cancelled invoice never billed its work — release those entries back to pending.
    const released = await releaseWorkEntriesForOrder(resolvedOrderId)
    if (released > 0) {
      console.log('[Stripe Webhook] Released work entries back to pending:', released)
    }
```

- [ ] **Step 5: Update the call site in `ScheduledPaymentsSection.tsx`**

In `src/components/dashboard/ScheduledPaymentsSection.tsx`, change line 117 from:

```typescript
    const result = await sendScheduledPayment(pkgId, entryId, undefined, skipEmail)
```

to:

```typescript
    const result = await sendScheduledPayment(pkgId, entryId, undefined, { skipEmail })
```

(`ClientPackagesTab.tsx:569` passes only three arguments and needs no change.)

- [ ] **Step 6: Verify no other caller passes a positional boolean**

Run: `grep -rn "sendScheduledPayment(" src --include='*.ts' --include='*.tsx' | grep -v 'export async function'`
Expected: exactly two call sites — `ClientPackagesTab.tsx:569` (3 args) and `ScheduledPaymentsSection.tsx:117` (now an object).

- [ ] **Step 7: Typecheck**

Run: `bun run tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Smoke-test the consume/release round trip**

With the dev server running and a proposal package that has a pending schedule entry:
1. Add two logged work entries in the admin (`package-work-entries`, `status: logged`, no `billedOrderId`).
2. From the client detail page → Scheduled Payments, click **Send Invoice** on a pending entry.
3. Confirm in Stripe that the invoice has three lines: the payment at its price, two work lines at $0, and a total equal to the payment amount alone.
4. Confirm both work entries now show the new order's id in `billedOrderId`.
5. Void that invoice in the Stripe dashboard, wait for the webhook, and confirm `billedOrderId` is cleared on both entries and the order status is `cancelled`.

- [ ] **Step 9: Commit**

```bash
git add src/actions/packages.ts src/lib/stripe/webhook-handlers.ts src/components/dashboard/ScheduledPaymentsSection.tsx
git commit -m "feat: consume work entries on scheduled-payment invoices with release on failure"
```

---

## Task 6: Recap PDF — generator + route

**Files:**
- Modify: `src/lib/pdf-generators.ts` (append `buildPackageRecapPdf`)
- Create: `src/app/api/packages/[id]/recap/pdf/route.ts`

**Interfaces:**
- Consumes: `PackageRecapData`, `mergePackageRecap` (Task 3); `getPackageRecapModel` (Task 4)
- Produces: `buildPackageRecapPdf(d: PackageRecapData & { generatedOn: string }): Promise<Uint8Array>`; `POST /api/packages/[id]/recap/pdf` accepting `{ entryId: string; recap?: Partial<PackageRecapData> }` and returning `application/pdf`

- [ ] **Step 1: Read the existing recap PDF generator for its layout helpers**

Run: `sed -n '1941,1970p' src/lib/pdf-generators.ts`

`buildRetainerRecapPdf` is the deck this mirrors. Reuse the same page-setup, font, and section helpers it uses (do not invent a second layout system) — read the whole function and the helpers it calls before writing the new one.

- [ ] **Step 2: Append the package recap generator**

At the end of `src/lib/pdf-generators.ts`, add `buildPackageRecapPdf`. It takes `PackageRecapData & { generatedOn: string }` and renders, in order:

1. **Cover** — `clientCompany ?? clientName`, `packageName`, `paymentLabel`, `paymentPosition`, `paymentDueDate`.
2. **At a glance** — `paymentAmount` (this payment), `amountPaid` / `packageTotal` (paid to date), `amountRemaining`, `itemsShipped`, `totalHours` (omit the hours stat entirely when `totalHours === 0`), and `headline`.
3. **Accomplished** — `accomplishedHeadline` if non-empty, then one section per bucket: `label`, `hours` (omit when 0), the bucket `note` if non-empty, and each item as `<Mon D> — <description>` with a trailing `(Nh)` when `hours` is set.
4. **What's left** — `remainingHeadline` if non-empty, then each `remaining` row: `planned` rows as a checkbox line with `label` and its date; `payment` rows as `label · $amount · due <date>`.
5. **Notes & next steps** — `notes` and `nextSteps`, blank strings filtered out; skip each heading entirely when its list is empty after filtering.
6. **Footer** — `Generated <generatedOn>` formatted the same way `buildRetainerRecapPdf` formats its footer.

Match `buildRetainerRecapPdf`'s import list, `PDFDocument` setup, embedded fonts, margins, and color constants exactly. Format all money with the same currency helper that function uses, and all dates in UTC.

- [ ] **Step 3: Create the PDF route**

```typescript
// src/app/api/packages/[id]/recap/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPackageRecapModel } from '@/actions/packageWork'
import { mergePackageRecap, type PackageRecapData } from '@/lib/packages/recap'
import { buildPackageRecapPdf } from '@/lib/pdf-generators'

/**
 * POST /api/packages/[id]/recap/pdf
 *
 * Body: { entryId: string; recap?: Partial<PackageRecapData> }
 *
 * Re-derives the authoritative model server-side (amounts, work items, schedule
 * position) and merges only the staff-edited narrative from the body — staff cannot
 * inject fabricated work or amounts. Returns the recap as a PDF. Staff only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload({ config })

    // ── Auth: staff only ────────────────────────────────────────────────────────
    const { user } = await payload.auth({ headers: await headers() })
    if (!user || user.role === 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      entryId?: string
      recap?: Partial<PackageRecapData>
    }
    if (!body.entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    // ── Re-derive the authoritative model, then overlay staff-edited text ────────
    const model = await getPackageRecapModel(id, body.entryId)
    if (!model.success) {
      return NextResponse.json({ error: model.error }, { status: 400 })
    }
    const merged = mergePackageRecap(model.model, body.recap)

    const pdfBytes = await buildPackageRecapPdf({ ...merged, generatedOn: new Date().toISOString() })

    return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="package-recap.pdf"',
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (err) {
    console.error('[package recap pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `bun run tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Smoke-test the PDF**

With the dev server running and logged in as staff in the browser (so the session cookie exists), open the browser console on any dashboard page and run — substituting a real package id and schedule entry id:

```javascript
const r = await fetch('/api/packages/PACKAGE_ID/recap/pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ entryId: 'ENTRY_ID' }),
})
window.open(URL.createObjectURL(await r.blob()))
```

Expected: a PDF opens showing the cover, at-a-glance amounts, the pending work bucketed by category, and the remaining payments.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pdf-generators.ts "src/app/api/packages/[id]/recap/pdf/route.ts"
git commit -m "feat: add package recap PDF generator and route"
```

---

## Task 7: Invoice email — work-log section + recap attachment

**Files:**
- Modify: `src/lib/payload/utils/genericInvoiceEmailTemplate.ts:19-48` (data shape), `:114` + `:339` (renderers), `:387` (`sendGenericInvoiceEmail` opts)
- Test: `src/lib/payload/utils/genericInvoiceEmailTemplate.test.ts`
- Modify: `src/actions/packages.ts` — `sendScheduledPayment` passes work log + recap PDF into the send

**Interfaces:**
- Consumes: `WorkLine` / `buildWorkLines` (Task 2); `mergePackageRecap` (Task 3); `getPackageRecapModel` (Task 4); `buildPackageRecapPdf` (Task 6); `SendScheduledPaymentOpts` (Task 5)
- Produces:
  - `GenericInvoiceEmailData` gains `workLog?: { title: string; description?: string }[]`
  - `sendGenericInvoiceEmail(payload, orderId, userId, proposalPrintUrl?, opts?: { workLog?: { title: string; description?: string }[]; attachments?: EmailAttachment[] })`

**Design note:** the work section is *not* derived from `order.lineItems` even though the $0 lines are there — it is passed explicitly so the "include work in email" toggle can be off while the invoice still carries the lines.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/payload/utils/genericInvoiceEmailTemplate.test.ts
import { expect, test, describe } from 'bun:test'
import {
  generateGenericInvoiceEmail,
  generateGenericInvoiceEmailText,
  type GenericInvoiceEmailData,
} from './genericInvoiceEmailTemplate'

const base: GenericInvoiceEmailData = {
  orderNumber: '#1042',
  customerName: 'Steinway',
  customerEmail: 'a@b.com',
  lineItems: [{ title: 'Final Payment', quantity: 1, price: 4000 }],
  totalAmount: 4000,
}

describe('work log section', () => {
  test('omits the section entirely when there is no work log', () => {
    expect(generateGenericInvoiceEmail(base)).not.toContain('Work completed')
    expect(generateGenericInvoiceEmailText(base)).not.toContain('Work completed')
  })

  test('omits the section when the work log is empty', () => {
    const html = generateGenericInvoiceEmail({ ...base, workLog: [] })
    expect(html).not.toContain('Work completed')
  })

  test('renders each work item in the HTML body', () => {
    const html = generateGenericInvoiceEmail({
      ...base,
      workLog: [
        { title: 'May 2 — Rebuilt inventory sync', description: '3h · Work · milestone log' },
        { title: 'May 4 — Homepage polish', description: '2h · Design · milestone log' },
      ],
    })
    expect(html).toContain('Work completed')
    expect(html).toContain('May 2 — Rebuilt inventory sync')
    expect(html).toContain('3h · Work · milestone log')
    expect(html).toContain('May 4 — Homepage polish')
  })

  test('renders each work item in the plain text body', () => {
    const text = generateGenericInvoiceEmailText({
      ...base,
      workLog: [{ title: 'May 2 — Rebuilt inventory sync', description: '3h · Work · milestone log' }],
    })
    expect(text).toContain('Work completed')
    expect(text).toContain('May 2 — Rebuilt inventory sync')
  })

  test('escapes HTML in work titles and descriptions', () => {
    const html = generateGenericInvoiceEmail({
      ...base,
      workLog: [{ title: 'May 2 — <script>alert(1)</script>', description: 'a & b' }],
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('a &amp; b')
  })

  test('renders a work item with no description', () => {
    const html = generateGenericInvoiceEmail({
      ...base,
      workLog: [{ title: 'May 2 — Rebuilt inventory sync' }],
    })
    expect(html).toContain('May 2 — Rebuilt inventory sync')
  })

  test('uses inline styles only — no style blocks or class-only styling in the work section', () => {
    const html = generateGenericInvoiceEmail({
      ...base,
      workLog: [{ title: 'May 2 — Thing', description: '1h' }],
    })
    const section = html.slice(html.indexOf('Work completed'))
    expect(section).not.toContain('<style')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test src/lib/payload/utils/genericInvoiceEmailTemplate.test.ts`
Expected: FAIL — the "renders each work item" tests fail because `workLog` is not part of the data shape or the output.

- [ ] **Step 3: Add `workLog` to the email data shape**

In `src/lib/payload/utils/genericInvoiceEmailTemplate.ts`, inside `interface GenericInvoiceEmailData` (line 19-48), add after `plannedWork?: string[]` (line 45):

```typescript
  /**
   * Milestone work log — the $0 work lines this invoice consumed, rendered as a
   * "Work completed" section. Passed explicitly rather than read off lineItems so
   * staff can send the invoice with the lines but without the section.
   */
  workLog?: { title: string; description?: string }[]
```

- [ ] **Step 4: Render the section in the HTML builder**

In `generateGenericInvoiceEmail` (line 114), alongside the existing `plannedItems` computation on line 167, add:

```typescript
  const workItems = (order.workLog ?? []).filter((w) => w.title?.trim())
  const workLogHtml = workItems.length === 0 ? '' : `
              <tr>
                <td style="padding:0 0 8px 0;">
                  <p style="margin:0 0 10px 0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#7a7a7a;font-weight:600;">Work completed</p>
                  ${workItems.map((w) => `
                  <div style="padding:0 0 10px 0;">
                    <p style="margin:0;font-size:13px;color:#2e2e2e;line-height:1.6;font-weight:400;">${esc(w.title)}</p>
                    ${w.description ? `<p style="margin:2px 0 0 0;font-size:11px;color:#7a7a7a;line-height:1.6;font-weight:300;">${esc(w.description)}</p>` : ''}
                  </div>`).join('')}
                </td>
              </tr>`
```

Then insert `${workLogHtml}` into the email's main table immediately **after** the line-items `<tbody>` block (the `${lineItemsHtml}` usage on line 264) and before the totals row — read the surrounding markup and place it so the enclosing `<table>` structure stays valid.

- [ ] **Step 5: Render the section in the text builder**

In `generateGenericInvoiceEmailText` (line 339), alongside `plannedItems` on line 359, add:

```typescript
  const workItems = (order.workLog ?? []).filter((w) => w.title?.trim())
  const workLogText = workItems.length === 0 ? '' : `
Work completed
${workItems.map((w) => `- ${w.title}${w.description ? ` (${w.description})` : ''}`).join('\n')}
`
```

and interpolate `${workLogText}` into the returned template string immediately after `${lineItemsText}` (line 373).

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun test src/lib/payload/utils/genericInvoiceEmailTemplate.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 7: Add the opts parameter to `sendGenericInvoiceEmail`**

In `src/lib/payload/utils/genericInvoiceEmailTemplate.ts`, change the signature (line 387-392) to:

```typescript
export async function sendGenericInvoiceEmail(
  payload: Payload,
  orderId: string,
  userId: string,
  proposalPrintUrl?: string,
  opts?: {
    /** Itemized milestone work rendered as a "Work completed" section. */
    workLog?: { title: string; description?: string }[]
    /** Extra attachments (e.g. a recap PDF) merged with whatever this function already attaches. */
    attachments?: EmailAttachment[]
  },
): Promise<{ success: boolean; message: string; invoice?: any }> {
```

Then inside the function:
- add `workLog: opts?.workLog,` to the `emailData` object built at line 409,
- when building the `payload.sendEmail(...)` call, append `opts.attachments` to whatever attachment array the function already assembles (read lines 409-470 first; if it currently passes no attachments, pass `...(opts?.attachments?.length ? { attachments: opts.attachments } : {})`),
- set `hasPdfAttachment` on the email data to reflect whether any attachment ends up on the send, so the footer copy stays truthful.

- [ ] **Step 8: Wire the email options through `sendScheduledPayment`**

In `src/actions/packages.ts`, add these imports to the existing import block:

```typescript
import { getPackageRecapModel } from '@/actions/packageWork'
import { mergePackageRecap } from '@/lib/packages/recap'
import { buildPackageRecapPdf } from '@/lib/pdf-generators'
```

Then replace the non-blocking email IIFE inside `sendScheduledPayment` (the `if (!opts?.skipEmail) { ... }` block from Task 5) with:

```typescript
    // Non-blocking: send "New Invoice" email to client (skipped if skipEmail is true).
    // The work section and the recap PDF are independently toggleable; either failing
    // must not stop the email, and the email failing must not stop the invoice.
    if (!opts?.skipEmail) {
      ;(async () => {
        try {
          const clientUsername = await getClientUsername(payload, clientAccountId)
          const proposalPrintUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : undefined

          const attachments: EmailAttachment[] = []
          if (opts?.attachRecapPdf) {
            try {
              const model = await getPackageRecapModel(packageId, entryId)
              if (model.success) {
                const merged = mergePackageRecap(model.model, opts.recap)
                const pdf = await buildPackageRecapPdf({ ...merged, generatedOn: new Date().toISOString() })
                attachments.push({
                  filename: `ORCACLUB-Recap-${entry.label.replace(/[^\w-]+/g, '-')}.pdf`,
                  content: Buffer.from(pdf).toString('base64'),
                  encoding: 'base64',
                  contentType: 'application/pdf',
                })
              }
            } catch (e) {
              console.error('[sendScheduledPayment] Recap PDF failed (sending without):', e)
            }
          }

          await sendGenericInvoiceEmail(payload, order.id, user.id, proposalPrintUrl, {
            workLog: opts?.includeWorkInEmail ? workLines.map((l) => ({ title: l.title, description: l.description })) : undefined,
            attachments: attachments.length ? attachments : undefined,
          })
        } catch (e) {
          console.error('[sendScheduledPayment] Invoice email failed:', e)
        }
      })()
    }
```

Note: `getPackageRecapModel` is called **after** the entries were stamped, so `summary.pending` no longer contains them. Fix this by capturing the recap model **before** stamping — move the `getPackageRecapModel` call to just before the `for (const l of workLines)` stamping loop and hold the result in a local `recapModelForEmail` variable that the IIFE closes over.

- [ ] **Step 9: Typecheck and run the full suite**

Run: `bun test && bun run tsc --noEmit`
Expected: all tests pass, no TypeScript errors.

- [ ] **Step 10: Smoke-test the email**

Repeat the Task 5 smoke test, this time calling `sendScheduledPayment` with `{ includeWorkInEmail: true, attachRecapPdf: true }` (temporarily hardcode it in `ScheduledPaymentsSection.handleSend` for the test, then revert). Confirm the received email has a **Work completed** section listing both entries and a recap PDF attached.

- [ ] **Step 11: Commit**

```bash
git add src/lib/payload/utils/genericInvoiceEmailTemplate.ts src/lib/payload/utils/genericInvoiceEmailTemplate.test.ts src/actions/packages.ts
git commit -m "feat: add work-log section and recap attachment to scheduled-payment invoice email"
```

---

## Task 8: `SchedulePaymentInvoiceModal` + schedule-row integration

**Files:**
- Create: `src/components/dashboard/SchedulePaymentInvoiceModal.tsx`
- Modify: `src/components/dashboard/ScheduledPaymentsSection.tsx`
- Modify: `src/app/(spaces)/u/[username]/clients/[client]/page.tsx:53-96`, `src/app/(spaces)/u/[username]/clients/[client]/ClientDetailTabView.tsx:453`

**Interfaces:**
- Consumes: `getPackageRecapModel`, `getPackageWorkSummary` (Task 4); `sendScheduledPayment` + `SendScheduledPaymentOpts` (Task 5); `PackageRecapData` (Task 3)
- Produces: `SchedulePaymentInvoiceModal` with props

```typescript
interface SchedulePaymentInvoiceModalProps {
  packageId: string
  packageName: string
  entry: { id: string; label: string; amount: number; dueDate?: string | null }
  /** Staff-composed recap for THIS entry, or null. Keyed by entry id in the parent. */
  recapDraft: PackageRecapData | null
  onRecapChange: (entryId: string, recap: PackageRecapData) => void
  onClose: () => void
  onSent: () => void
}
```

- [ ] **Step 1: Read `RetainerInvoiceModal` end to end**

Run: `cat src/components/dashboard/RetainerInvoiceModal.tsx`

This modal is the structural template — reuse its `inputCls` / `areaCls` / `numCls` / `accentBtn` / `ghostBtn` / `labelCls` style constants verbatim, its load-model-on-mount `useEffect` pattern, and its outcome/error presentation.

- [ ] **Step 2: Build the modal**

`src/components/dashboard/SchedulePaymentInvoiceModal.tsx`, `'use client'`. On mount it calls `getPackageRecapModel(packageId, entry.id)` and holds the whole success payload as `result`, so the recap model is `result.model` (a `PackageRecapData`) and the selectable rows are `result.workLines` (each `{ entryId, title, description }`). It renders:

1. **Payment summary** (read-only) — `entry.label`, `entry.amount` (currency), `entry.dueDate`, and the computed `days_until_due` (`Math.max(1, Math.round((due - now) / 86400000))`, defaulting to 30 with no due date), plus `result.model.paymentPosition`.
2. **Work lines** — one row per `result.workLines` entry showing its `title` and `description` — the exact text the invoice will carry — each with a checkbox (all checked initially). Selection state is `Set<string>` of `entryId`; deselecting removes that id from the `workLineIds` sent. A "Select all / none" control on the header row. Empty state: "No unbilled work logged for this package."
3. **Recap narrative editor** — inline textareas bound to `headline`, `accomplishedHeadline`, `remainingHeadline`, plus one textarea per bucket `note`, seeded from `recapDraft ?? result.model`. Every edit calls `onRecapChange(entry.id, nextRecap)` so the parent's entry-keyed draft stays current.
4. **Toggles** — `☑ Attach recap PDF` (`attachRecapPdf`), `☑ Include work log in email` (`includeWorkInEmail`), `☐ Skip email` (`skipEmail`). When "Skip email" is checked, disable the other two and grey them out.
5. **Send** — calls

```typescript
await sendScheduledPayment(packageId, entry.id, undefined, {
  skipEmail,
  workLineIds: [...selected],
  recap,
  attachRecapPdf: !skipEmail && attachRecapPdf,
  includeWorkInEmail: !skipEmail && includeWorkInEmail,
})
```

   On success show the hosted invoice URL and call `onSent()`; on failure show `result.error` inline and leave the modal open so nothing is lost.

Every color must come from `var(--space-*)` — copy the exact class strings from `RetainerInvoiceModal`.

- [ ] **Step 3: Fetch per-package work counts in the client detail page**

In `src/app/(spaces)/u/[username]/clients/[client]/page.tsx`, after `const packages = packagesResult.docs` (line 96), add:

```typescript
  // Work-log counts per package — drives the "N logged · M planned open" chip on
  // each scheduled-payment row. One query for all of this client's packages.
  const workCounts: Record<string, { pending: number; plannedOpen: number }> = {}
  if (packages.length > 0) {
    const { docs: workEntries } = await payload
      .find({
        collection: 'package-work-entries',
        where: { package: { in: packages.map((p: any) => p.id) } },
        depth: 0,
        limit: 5000,
      })
      .catch(() => ({ docs: [] as any[] }))
    for (const e of workEntries as any[]) {
      const pid = typeof e.package === 'object' ? e.package?.id : e.package
      if (!pid) continue
      const b = (workCounts[pid] ??= { pending: 0, plannedOpen: 0 })
      if (e.status === 'logged' && !e.billedOrderId) b.pending += 1
      if (e.status === 'planned' && e.completion !== 'complete') b.plannedOpen += 1
    }
  }
```

Then pass `workCounts={workCounts}` to `<ClientDetailTabView ... />` (near line 176 where `packages={packages}` is passed).

- [ ] **Step 4: Thread the counts through `ClientDetailTabView`**

In `src/app/(spaces)/u/[username]/clients/[client]/ClientDetailTabView.tsx`, add `workCounts?: Record<string, { pending: number; plannedOpen: number }>` to the component's props interface, destructure it, and pass it to `ScheduledPaymentsSection` at line 453:

```tsx
            <ScheduledPaymentsSection packages={packages as any} username={username} workCounts={workCounts} />
```

- [ ] **Step 5: Rework `ScheduledPaymentsSection`**

In `src/components/dashboard/ScheduledPaymentsSection.tsx`:

- Add `workCounts?: Record<string, { pending: number; plannedOpen: number }>` to `ScheduledPaymentsSectionProps`.
- Add state: `const [modalTarget, setModalTarget] = useState<{ pkgId: string; pkgName: string; entry: ScheduledEntry } | null>(null)` and `const [recapDrafts, setRecapDrafts] = useState<Record<string, PackageRecapData>>({})` — **keyed by schedule-entry id**, so a draft can never attach to a different payment.
- Render a work chip on each pending row, between the due date and the action buttons, only when the package has counts:

```tsx
                      {(() => {
                        const c = workCounts?.[pkg.id]
                        if (!c || (c.pending === 0 && c.plannedOpen === 0)) return null
                        return (
                          <span className="text-[10px] text-[var(--space-text-secondary)] tabular-nums shrink-0">
                            {c.pending} logged{c.plannedOpen > 0 ? ` · ${c.plannedOpen} planned open` : ''}
                          </span>
                        )
                      })()}
```

- Change the primary **Send Invoice** button's `onClick` from `handleSend(...)` to `setModalTarget({ pkgId: pkg.id, pkgName: pkg.name, entry })`.
- **Delete the split-button chevron and its portal dropdown entirely** (lines 228-235 and 261-298, plus the now-unused `openMenuId` / `menuPos` / `mounted` state, the outside-click effect, `handleToggleMenu`, the `createPortal` import, and the `ChevronDown` / `FilePlus` icon imports). The dropdown's "Create Invoice — no email" item is replaced by the modal's **Skip email** toggle. Give the Send Invoice button `rounded-lg` instead of `rounded-l-lg` now that nothing sits beside it.
- Render the modal when `modalTarget` is set, wiring `recapDraft={recapDrafts[modalTarget.entry.id] ?? null}`, `onRecapChange={(id, r) => setRecapDrafts((p) => ({ ...p, [id]: r }))}`, `onClose={() => setModalTarget(null)}`, and `onSent={() => { setModalTarget(null); router.refresh() }}`.
- Keep `handleRemove`, the 30/60/90/ALL filter, and the "Invoice sent" success link exactly as they are.

- [ ] **Step 6: Typecheck and lint**

Run: `bun run tsc --noEmit && bun run lint`
Expected: no errors.

- [ ] **Step 7: Smoke-test the flow**

With the dev server running, on a client detail page with a proposal package that has pending work and a pending schedule entry:
1. Confirm the work chip reads e.g. "2 logged · 1 planned open".
2. Click **Send Invoice** — the modal opens with the payment summary, both work lines checked, and the recap fields seeded.
3. Deselect one work line, type a headline, leave both toggles on, and send.
4. Confirm the Stripe invoice has exactly one $0 work line, the email has a **Work completed** section with that one item, and the recap PDF is attached.
5. Reopen the modal for a *different* pending entry and confirm the headline field is blank (drafts are entry-keyed, not shared).

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/SchedulePaymentInvoiceModal.tsx src/components/dashboard/ScheduledPaymentsSection.tsx "src/app/(spaces)/u/[username]/clients/[client]/page.tsx" "src/app/(spaces)/u/[username]/clients/[client]/ClientDetailTabView.tsx"
git commit -m "feat: add scheduled-payment invoice modal with work-line selection and recap"
```

---

## Task 9: Milestones Command Console station

**Files:**
- Create: `src/components/dashboard/MilestonesTab.tsx`
- Modify: `src/components/dashboard/CommandConsole.tsx:26` (Station type), `:28` (STATIONS), `:199` (launch key), `:465` (launch card), `:500` (search-result action), `:592+` (station bodies)

**Interfaces:**
- Consumes: `getMilestonePortfolio`, `getPackageWorkSummary`, `getPackageRecapModel`, `logPackageWork`, `createPackagePlan`, `logPlannedWork`, `updateWorkEntry`, `deleteWorkEntry` (Task 4); `SchedulePaymentInvoiceModal` (Task 8)
- Produces: `MilestonesTab` with props

```typescript
interface MilestonesTabProps {
  /** Preselect this client's packages when launched from a search result. */
  clientId?: string
  /** Deep-link straight to a package's recap stage for one schedule entry. */
  initialTarget?: { packageId: string; entryId: string } | null
}
```

- [ ] **Step 1: Read `RetainerTab` for the stage grammar**

Run: `sed -n '1,140p' src/components/dashboard/RetainerTab.tsx` and `sed -n '300,400p' src/components/dashboard/RetainerTab.tsx`

`MilestonesTab` is a structural sibling: same `type Stage` + `const STAGES` shape, same `1–4` numeric jump keys, same Esc-walks-back-one-level behaviour, same autofocused client search on landing, same style constants. Extract a shared subcomponent **only** where extraction is trivial — do not refactor `RetainerTab` (explicitly out of scope in the spec).

- [ ] **Step 2: Build `MilestonesTab`**

`'use client'`. `type Stage = 'overview' | 'plan' | 'log' | 'recap'`; landing state is the portfolio board (no package selected).

- **Portfolio board** — `getMilestonePortfolio()` on mount. One row per package: client name · package name · next pending entry (label, currency amount, due date) · `pendingWorkCount` unbilled · a **needs-recap** badge when `row.needsRecap`. Rows already come sorted soonest-due-first; render in order. Autofocused text input filters rows by client or package name. Selecting a row loads `getPackageWorkSummary(packageId)` and switches to `overview`.
- **Overview** — the schedule timeline (one row per `schedule` entry: `paid ●` when `paid`, `invoiced ●` when `invoicedAt` and not paid, `pending ○` otherwise, with amount and due date), the unbilled entry list, the open-plan count, and a quick-log one-liner (description input + optional hours input, ↵ submits `logPackageWork`, then reloads the summary).
- **Plan stage** — a create form (date · category · description, ↵ submits `createPackagePlan`) above the planned list. Each planned row shows a **Log →** button that opens the log editor pre-filled from the plan and calls `logPlannedWork({ planId, ... })` on submit, plus inline edit (`updateWorkEntry`) and delete (`deleteWorkEntry`).
- **Log stage** — date · hours (optional, `step="0.25"`) · category · description, ↵ submits `logPackageWork`. Below it, the pending list with inline edit/delete. Entries with a `billedOrderId` render greyed with a "billed" tag and no edit/delete controls.
- **Recap stage** — mounts `SchedulePaymentInvoiceModal` inline for the next pending schedule entry, with a selector to switch to another pending entry. Empty state when no pending entry exists: "Every scheduled payment on this package is invoiced."

Keyboard: `1`–`4` jump stages (ignored while an input is focused, same guard `RetainerTab` uses); `Esc` from a stage returns to the portfolio board.

When `initialTarget` is set, skip the board: load that package's summary and open `recap` with that entry preselected.

- [ ] **Step 3: Register the station in `CommandConsole.tsx`**

- Line 26 — extend the union:

```typescript
type Station = 'search' | 'builder' | 'retainer' | 'milestones'
```

- Line 28 — add to `STATIONS` after the `retainer` entry, using the `Milestone` icon from `lucide-react` (add it to the existing `lucide-react` import):

```typescript
  { id: 'milestones', label: 'Milestones', icon: Milestone },
```

- Around line 199 — add a global launch key alongside the existing `retainer` binding. Read lines 186-210 first and follow the exact guard style used there; bind `M`:

```typescript
        if (isOpenRef.current) goStation('milestones')
```

- Line 465 — add a launch card next to the Retainer one:

```tsx
                          <LaunchCard icon={Milestone} title="Milestones" hint="Log package work" onClick={() => goStation('milestones', undefined)} />
```

- Line 500 — add to the per-client search-result actions:

```tsx
                                  { icon: Milestone, title: 'Milestones', onClick: () => goStation('milestones', item.data.id) },
```

- Line 592+ — in the station bodies block, mount `<MilestonesTab clientId={...} />` following the exact same visited-once/visibility pattern the `<RetainerTab>` mount uses (read lines 592-620 before editing).

- Add the import at the top: `import { MilestonesTab } from './MilestonesTab'`.

- [ ] **Step 4: Typecheck and lint**

Run: `bun run tsc --noEmit && bun run lint`
Expected: no errors.

- [ ] **Step 5: Smoke-test the station**

With the dev server running:
1. Open the console (`⌘/L`), press the backtick to cycle — confirm **Milestones** appears in the rail between Retainer and Build.
2. Confirm the portfolio board lists packages with pending payments, soonest first, with needs-recap badges where a payment is due within 30 days and unbilled work exists.
3. Select a package; press `1`–`4` and confirm the stages switch; press Esc and confirm you land back on the board.
4. Quick-log a work item from Overview and confirm it appears in the pending list and increments the row's unbilled count on return to the board.
5. Plan an item, click **Log →**, submit, and confirm a *new* logged entry exists while the plan remains listed and marked complete.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/MilestonesTab.tsx src/components/dashboard/CommandConsole.tsx
git commit -m "feat: add Milestones console station for package work logs"
```

---

## Task 10: Deep-link from the schedule row to the Milestones station

**Files:**
- Modify: `src/components/dashboard/ScheduledPaymentsSection.tsx` (make the work chip a link)
- Modify: `src/components/dashboard/CommandConsole.tsx` (accept an open-with-target signal)

**Interfaces:**
- Consumes: `MilestonesTab`'s `initialTarget` prop (Task 9); `CommandConsole`'s `goStation` (Task 9)
- Produces: a `window` CustomEvent contract — `orcaclub:open-milestones` with `detail: { packageId: string; entryId: string }`

This is the spec's §4 "clicking deep-links into the Milestones station with that package + entry pre-selected (recap stage)". `ScheduledPaymentsSection` and `CommandConsole` are siblings with no shared provider, so a window event is the least invasive channel — `CommandConsole` already listens for global key events in the same file.

- [ ] **Step 1: Dispatch the event from the work chip**

In `src/components/dashboard/ScheduledPaymentsSection.tsx`, wrap the work chip added in Task 8 in a button:

```tsx
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent('orcaclub:open-milestones', {
                                  detail: { packageId: pkg.id, entryId: entry.id },
                                }),
                              )
                            }
                            className="text-[10px] text-[var(--space-text-secondary)] hover:text-[var(--space-accent)] tabular-nums shrink-0 transition-colors"
                            title="Open the work log for this package"
                          >
                            {c.pending} logged{c.plannedOpen > 0 ? ` · ${c.plannedOpen} planned open` : ''}
                          </button>
                        )
```

- [ ] **Step 2: Listen in `CommandConsole`**

In `src/components/dashboard/CommandConsole.tsx`, add state for the target and an effect next to the existing global-key effect:

```typescript
  const [milestoneTarget, setMilestoneTarget] = useState<{ packageId: string; entryId: string } | null>(null)

  // Deep link from a scheduled-payment row → the Milestones station, recap stage.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { packageId: string; entryId: string } | undefined
      if (!detail?.packageId || !detail?.entryId) return
      setMilestoneTarget(detail)
      if (isOpenRef.current) goStation('milestones')
      else openConsole('milestones')
    }
    window.addEventListener('orcaclub:open-milestones', onOpen)
    return () => window.removeEventListener('orcaclub:open-milestones', onOpen)
  }, [])
```

Pass it down at the `MilestonesTab` mount site: `initialTarget={milestoneTarget}`. Clear it when the console closes so a later manual open starts on the portfolio board — add `setMilestoneTarget(null)` inside `closeConsole` (line 159 area).

- [ ] **Step 3: Typecheck and lint**

Run: `bun run tsc --noEmit && bun run lint`
Expected: no errors.

- [ ] **Step 4: Smoke-test the deep link**

With the dev server running, from a client detail page click a work chip on a scheduled-payment row. Expected: the Command Console opens on the **Milestones** station, that package is loaded, the **recap** stage is active, and the selected schedule entry is the one whose row you clicked.

- [ ] **Step 5: Full verification pass**

Run: `bun test && bun run tsc --noEmit && bun run lint`
Expected: all tests pass, no TypeScript errors, no lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/ScheduledPaymentsSection.tsx src/components/dashboard/CommandConsole.tsx
git commit -m "feat: deep-link scheduled-payment rows into the Milestones station"
```

---

## Out of scope (from the spec — do not implement)

- Client-portal visibility of the raw work log.
- Refactoring `RetainerTab` or merging the two flows into one station.
- Hours-based pricing or deriving any billing amount from hours.
- The pre-existing `savePaymentScheduleOnly` index-based merge bug (`src/actions/packages.ts:1275-1281`) — fix separately.
- A standalone recap email send (the recap travels with the invoice email; the PDF route covers standalone needs).

## Deferred decisions worth flagging at review

- **Migrations.** This repo uses the mongoose adapter and `bun run payload:migrate` in the production build. Adding a collection needs no data migration, but existing packages have no work entries — every package's chip and portfolio row correctly reads zero until staff log something. No backfill is planned.
- **`billedOrderId` as `text`, not a `relationship`.** Per spec §1. It is written and cleared by actions and never traversed as a relation, so a plain indexed text field keeps release cheap and avoids cascade semantics. Revisit only if a report needs to join from entries to orders.

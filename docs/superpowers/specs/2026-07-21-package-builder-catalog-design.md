# Package Builder + Service Catalog — Design

**Date:** 2026-07-21
**Status:** Approved (design), pending implementation plan
**Branch:** `package-builder-catalog`

## Problem

The current package system (`src/lib/payload/collections/Packages.ts`, `src/actions/packages.ts`,
`ClientPackagesTab.tsx`, `PackagesAdminView.tsx`) has three structural issues surfaced by an audit of
all 32 live packages:

1. **Templates don't function as a reusable library.** 15 templates exist; each is a 1:1 shadow twin
   of a single client proposal named after that engagement (e.g. "United Defense Tactical Hourly 03/02").
   Only ONE template ("Used Steinway Website Launch") was ever reused to spawn multiple proposals. The
   template→proposal model assumes a curated library that in practice doesn't exist — staff build a
   bespoke package per client and leave a junk template behind.

2. **The real reusable unit is the line item, and it's re-typed by hand every time.** The same items
   recur across packages with identical prices: "Base Site" $2,000 (×3), "SEO Starter Pack" $400 (×3),
   "Asset Creation" $300 (×3), "Piano Inventory Pages" $700 (×3), "Landing Page" $200 (×2), etc. There
   is a de facto service catalog that lives only in the operator's memory.

3. **Billing semantics are smuggled into free-text.** Hourly work encodes hours in the item name
   ("Events Page - 3 Hours", "UI Updates - 11 hr") with price = hours × $40. Retainer terms live in the
   name ("Retainer Agreement (2 month contract)"). `invoiceType` is inferred by string-matching schedule
   labels (`label.includes('deposit')`) in FOUR separate places in `packages.ts`. `stripePriceId` has
   ZERO uses across all 32 packages.

## Goals

- A curated **service catalog** operators pick from instead of re-typing line items.
- A **two-pane full-screen builder** for creating/editing packages directly (no shadow templates).
- Structured **billing types** (fixed / hourly / recurring) replacing free-text encoding.
- Preserve the **snapshot data model** end-to-end: catalog → package line item → order → Stripe invoice
  are all independent copies. Existing orders/invoices are unaffected by any of this.

## Non-Goals

- No change to the order / invoice / Stripe / balance flow. The builder only produces the proposal
  document those flows already consume.
- No Stripe subscription/`stripePriceId` work (dropped from UI; zero current usage).
- No migration of existing 32 packages beyond additive schema (they stay valid and readable).

## Key decisions (from brainstorming)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Builder home | **Full-screen modal**, two-pane | Fast to reach from Packages view + client tab; no new routes |
| Catalog source | **New `service-items` collection** | Curated, editable, archivable, usage counts; snapshots into packages |
| Templates | **Retire** | Only 1 of 15 ever reused; orders/invoices unaffected; add-ons move to per-item flag |

## Data model changes

### New collection: `service-items`

```
slug: 'service-items'
access: create/read/update adminOrUser, delete adminOnly   (matches Packages)
admin: { group: 'Clients', useAsTitle: 'name', defaultColumns: ['name','billingType','defaultPrice','usageCount'] }
fields:
  name            text, required, index
  description     textarea
  billingType     select ['fixed','hourly','recurring']  default 'fixed'
  defaultPrice    number  (fixed: total; recurring: per-interval amount)
  defaultRate     number  (hourly: per-hour rate; default 40)
  defaultInterval select ['month','year']  (recurring only)
  archived        checkbox default false, index
  usageCount      number  read-only, incremented when snapshotted into a package
```

### `Packages.ts` line items — additive fields

```
billingType        select ['fixed','hourly','recurring']  default 'fixed'
hours              number  (hourly only; total = hours × rate stored back into `price`)
contractTermMonths number  (recurring only; replaces "(2 month contract)" in name)
isAddOn            boolean default false  (replaces template-diff add-on menu)
sourceServiceItem  relationship → service-items, optional  (provenance, non-financial)
```

Existing fields kept: `name`, `description`, `price`, `adjustedPrice` (relabeled "Discount / override"
in UI), `quantity`, `isRecurring`, `recurringInterval`. `stripePriceId` kept in schema (backwards compat)
but removed from the builder UI.

`price` remains the source of truth for all totals so existing `computeTotals`, PDF, email, and order
code keep working unchanged. `hours`/`billingType` are presentational + structured metadata.

**`billingType` ↔ `isRecurring` relationship (avoid duplicate sources of truth):** `billingType` is the
new authoritative field the builder writes. To keep every existing consumer working, the builder derives
the legacy fields on save: `billingType === 'recurring'` → `isRecurring = true` and `recurringInterval`
mirrors `defaultInterval`; `billingType` in `('fixed','hourly')` → `isRecurring = false`. `computeTotals`,
PDF, and email code continue reading `isRecurring`/`recurringInterval` unchanged. No consumer reads
`billingType` for money math — it only drives the row UI and the hourly `hours × rate` display.

### `Packages.ts` payment schedule — additive field

```
entryType  select ['deposit','installment','balance']  default 'installment'
```

Defaulted once from the label heuristic at creation; replaces the 4× duplicated string-match logic in
`packages.ts` with a single field read.

## UI: `PackageBuilderModal`

Full-screen overlay over a dimmed dashboard. Single component handles create + edit. Uses existing
`--space-*` design tokens and `computeTotals`.

### Layout (two-pane)

```
┌────────────────────────────────────────────────────────────┐
│  New Package · North Texas Piano            [Save draft] ✕  │
├──────────────────────┬─────────────────────────────────────┤
│ CATALOG              │  Name    [Website Launch          ]  │
│ [search services… ]  │  Client  [North Texas Piano    ▾ ]  │
│                      │  ▸ Cover message · notes (collapsed) │
│ ⊕ Base Site   $2,000 │ ─────────────────────────────────── │
│ ⊕ SEO Pack      $400 │  LINE ITEMS                          │
│ ⊕ Maint.     $40/hr  │  ⠿ Base Site              $2,000  ⋯  │
│ ⊕ Retainer   $500/mo │     ◉ included ○ add-on              │
│ ─────────────────    │  ⠿ Maintenance  6h × $40 = $240  ⋯  │
│ + New service item   │  ⠿ Support   ~~$500~~ → $0       ⋯  │
│                      │  ▸ Payment schedule (optional)       │
│                      ├─────────────────────────────────────┤
│                      │  $2,640 one-time  ·  $40/mo    [→]   │
└──────────────────────┴─────────────────────────────────────┘
```

### Left pane — catalog rail

- Reads `service-items` where `archived != true`, sorted by `name` (or usageCount desc).
- Live search filter on name.
- Click `⊕` appends a **snapshot** of the catalog item into the right pane's line-item array. Catalog
  edits afterward never mutate placed items (same copy pattern as current template→proposal).
- On snapshot, increment the catalog item's `usageCount`.
- `+ New service item`: inline mini-form (name / price / billingType). Checkbox `☑ save to catalog for
  reuse` — checked → writes to `service-items` AND adds line item; unchecked → one-off line item only.

### Right pane — the package

- **Name** (required) + **Client** selector (required for a proposal; reuses `getClientAccountsList`).
- **Cover message / notes** under a collapsed disclosure (used <50% of the time per audit).
- **Line items list**, each row:
  - Drag handle `⠿` to reorder (order matters on PDF/proposal).
  - Name + price inline-editable.
  - Billing type (inherited from catalog, overridable):
    - *Fixed* → price × qty.
    - *Hourly* → `hours × rate` UI (default $40/hr), renders `6h × $40 = $240`, total stored in `price`.
    - *Recurring* → interval (mo/yr) + optional `contractTermMonths`.
  - `⋯` menu → **Discount / override** field (the existing `adjustedPrice`), renders `~~$500~~ → $0`.
  - **Included ◉ / add-on ○** toggle → sets `isAddOn`. Add-on rows excluded from proposal total, surfaced
    in the client's "available add-ons" list.
- **Payment schedule** collapsed disclosure — reuses the existing deposit/installments/frequency builder
  from `ClientPackagesTab`, plus the new `entryType` dropdown per entry.

### Footer

- **Save draft** → persist `type:'proposal'`, `status:'draft'`, created directly for the client. NO shadow
  template. Status only advances on actual send (fixes the current draft→sent auto-flip bug in
  `updatePackage`, `packages.ts:305`).
- **`[→]` Save & continue** → closes to the existing proposal detail modal (`ProposalModal` in
  `PackagesAdminView`) where Email / Create Invoice / View Proposal already live.

## Server action changes (`src/actions/packages.ts`)

- **New:** `createProposal({ clientAccountId, name, ..., lineItems })` — creates a proposal directly,
  no template. Increments `usageCount` for any `sourceServiceItem` references.
- **New:** `getServiceCatalog()` — returns non-archived `service-items` for the rail.
- **New:** `createServiceItem(...)` — for the inline "new service item" form.
- **Deprecate:** `assignPackageToClient` (template→proposal). Keep temporarily for existing data; remove
  once builder ships.
- **Replace:** template add-on diff in `getProposalWithTemplate` / `getClientProposalTemplateItems` — the
  client add-on list now reads line items where `isAddOn === true` instead of diffing against a template.
- **Consolidate (separate cleanup, flagged in audit):** the Stripe create→attach→finalize→order→email
  sequence duplicated across `createOrderFromPackage`, `sendScheduledPayment`,
  `createPartialInvoiceFromPackage`, `_sendScheduleEntryInvoice`, and inline in `acceptPackage` — route
  through the existing `_sendScheduleEntryInvoice` helper. Also dedupe the clientAccount-id /
  stripeCustomerId extraction and the client-ownership check (each duplicated 4×). `entryType` field read
  replaces the 4× `label.includes('deposit')` string-matching.

## Client-side impact (`ClientPackagesTab.tsx`)

- The client's package view add-on menu switches from template-diff (`templateItems` state, populated by
  `getProposalWithTemplate`) to reading `isAddOn` line items directly off the proposal. `requestPackageLineItem`
  (client requests an add-on) is unchanged.

## Data safety

Every layer snapshots the one before it: catalog → line item → order → Stripe invoice are independent
copies. Deleting all 15 templates today leaves every order, invoice, balance, and Stripe record untouched.
Retiring templates is safe. Old proposals retain their `sourcePackage` so their existing add-on menus keep
working during the transition; new proposals use `isAddOn` flags.

## Build order (two shippable stages)

1. **Stage 1 — catalog + schema.** Add `service-items` collection, additive `Packages` fields, run
   `payload:generate`, `getServiceCatalog` / `createServiceItem` actions. No UI change yet; catalog
   manageable via admin panel.
2. **Stage 2 — builder UI.** `PackageBuilderModal`, `createProposal` action, wire launch buttons, switch
   add-on menu to `isAddOn`, deprecate `assignPackageToClient`, consolidate Stripe helpers.

## Testing

- Schema: `bun run payload:generate` clean; existing 32 packages load without error in admin.
- Catalog snapshot: placing an item copies values; editing the catalog item afterward does NOT change the
  placed line item.
- Billing types: hourly total = hours × rate lands in `price`; recurring shows interval; totals via
  `computeTotals` match footer.
- Add-on flag: `isAddOn` rows excluded from proposal total, appear in client add-on list.
- Draft status: saving a draft does NOT flip it to `sent` (regression check on the current bug).
- Invoice path unchanged: create invoice from a builder-made proposal produces the same Order + Stripe
  invoice shape as today.

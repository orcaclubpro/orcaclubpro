# Retainer & Hour-Logging — Design Spec

**Date:** 2026-07-28
**Branch:** `retainer-hour-logging`
**Status:** Approved design, pending implementation plan
**Source material:** `OrcaClub_Retainer_Playbook.pdf` (Internal Retainer Playbook v1, 2026)

## Overview

Add a **Retainer** capability to the staff-side Package Builder. The existing
`PackageBuilderModal` becomes a small **tabbed menu**: the current two-pane
proposal builder is one tab, and a new **Retainer** tab lets staff pick a client,
set up a monthly retainer for them, and log hours against that retainer's monthly
cap — all inside the modal.

This is the real, persisted foundation (new Payload collections + server actions).
**Payment/Stripe is explicitly out of scope for now** — overage is displayed but
never charged.

## Context from the Playbook

The retainer model this feature encodes:

| Tier | Fee | Hours/mo | Overage |
|------|-----|----------|---------|
| Basic | $500/mo | up to 10 | $65/hr |
| Growth | $1,000–2,000/mo | 20–25 | $65/hr |
| Enterprise | Bespoke | Custom | $65/hr |

Rules that shape the UX:

- **Monthly hour cap** per retainer; **no rollover** — each calendar month starts
  fresh and is summed independently against the cap.
- **Hours logged throughout the month**; the month-end "hours-logged report" is a
  core client deliverable.
- Meetings, revisions, and reporting **all count against hours** — hence a
  category field on each entry.
- **Overage** is billed at $65/hr once past the cap. For now it is only computed
  and displayed: `overage = max(0, monthUsed − cap) × overageRate`.
- Retainer is month-to-month; the fee holds whether hours are used or not.

## Decisions (locked during brainstorming)

1. **Real & persisted** — new collections + server actions, no Stripe.
2. **Menu shape** — top tab bar in the existing modal; the two-pane builder is
   untouched and becomes one tab.
3. **Hour entries** — rich: date, hours, category, description. Overage computed
   from the running month total (no per-entry overage flag).
4. **Logging location** — **inside the modal's Retainer tab only.** Setup and
   logging both live there; no separate dashboard tab.
5. **One active retainer per client account.**

## Architecture

### Menu shell

`PackageBuilderModal` gains a header tab strip and a new prop:

```ts
initialTab?: 'builder' | 'retainer'   // default 'builder'
```

- The current two-pane builder body is extracted into a `PackageBuilderTab`
  component — **no behavior change**, purely moved into the shell so the shell can
  swap bodies.
- A new `RetainerTab` component sits beside it.
- Active tab swaps the modal body; header/footer chrome adapts per tab (the
  builder's totals footer is builder-only; the retainer tab has its own footer or
  none).

### Entry points (`PackagesAdminView`)

Each client group header currently renders a **"New Package"** button. Add a
sibling **"Retainer"** button that opens the modal with
`initialTab: 'retainer'` and that client's id preselected. Switching tabs inside
the modal also reaches it.

### Data model — two new collections

Each gets its own file in `src/lib/payload/collections/`, access imported from
`src/lib/payload/access/index.ts`, registered in `payload.config.ts`, followed by
`bun run payload:generate`.

**`retainers`** — one active retainer per client account:

| field | type | notes |
|-------|------|-------|
| `clientAccount` | relationship → `client-accounts` | required, `index: true` |
| `tier` | select: `basic` / `growth` / `enterprise` | drives preset defaults |
| `monthlyFee` | number (min 0) | preset-filled, editable |
| `hoursPerMonth` | number (min 0) | the monthly cap (Enterprise = custom) |
| `overageRate` | number (min 0) | default `65` |
| `status` | select: `active` / `paused` / `cancelled` | default `active` |
| `startDate` | date | |
| `notes` | textarea | internal |

**`retainer-time-entries`** — the hour log:

| field | type | notes |
|-------|------|-------|
| `retainer` | relationship → `retainers` | required, `index: true` |
| `clientAccount` | relationship → `client-accounts` | denormalized for query, `index: true` |
| `date` | date | required |
| `hours` | number (min 0) | required |
| `category` | select: `work` / `meeting` / `revision` / `reporting` | default `work` |
| `description` | textarea | |
| `loggedBy` | relationship → `users` | who logged it |

Monthly period = calendar month of `date`. The summary only ever sums the selected
month against the cap — no rollover logic needed.

### Server actions — `src/actions/retainers.ts`

`'use server'`, all staff-gated (reject `role === 'client'`), mirroring
`src/actions/package-builder.ts`:

- `getClientRetainer(clientAccountId)` → the client's active retainer (or null) +
  the current month's entries.
- `setRetainer(input)` → create the client's retainer, or update the existing one.
- `logHours(input)` → create a `retainer-time-entries` doc (stamps `loggedBy`).
- `deleteTimeEntry(id)` → remove an entry.
- `getRetainerSummary(clientAccountId, month)` → totals for a given `YYYY-MM`:
  `used`, `remaining`, `overage`, and per-category breakdown.

All Local API calls follow the project's security rules. Access matrix mirrors
`ServiceItems`: `create/read/update = adminOrUser`, `delete = adminOnly`.

## UX flow — Retainer tab

```
Client:  [ Acme Co ▾ ]          ← selector; prefilled from modal context

── if no active retainer ──────────────────────────────
  Tier:  ( Basic ) ( Growth ) ( Enterprise )
  Fee $[1500]   Hours/mo [22]   Overage $[65]
  [ Set up retainer ]
  (picking a tier auto-fills fee/hours/overage from the
   playbook; every field stays editable)

── if active retainer ─────────────────────────────────
  GROWTH · $1,500/mo · 22 hrs/mo            [Edit]
  ┌───────────────────────────────────────────┐
  │ July 2026    14.5 / 22 hrs   ▓▓▓▓▓░░░      │
  │ 7.5 remaining · 0 overage                  │
  │ Work 9 · Meeting 3.5 · Reporting 2         │
  └───────────────────────────────────────────┘
  [◂ July ▸]                     ← month switcher

  ── Log hours ──
  [date] [hrs] [category ▾] [note]            [+ Log]

  ── Entries (selected month) ──
  Jul 28 · 2.5h · Meeting  · "Strategy call"   🗑
  Jul 24 · 3h   · Work     · "Landing edits"   🗑
```

- Tier preset picker fills fee/hours/overage from the playbook (Basic 10h/$500,
  Growth 22h/$1.5k default, Enterprise custom); all fields editable before saving.
- Summary card: month-to-date progress bar, remaining, overage
  (`max(0, used − cap) × overageRate`), and category breakdown.
- Month switcher views past months' logs (read-only history); logging defaults to
  the current month.
- Inline "Log hours" row appends an entry optimistically; trash icon deletes.
- Styling reuses the exact `--space-*` tokens of the existing modal — no hardcoded
  colors, so it works across all dashboard themes.

## Security / access

- Retainer tab and all `retainers.ts` actions are **staff-only**; each action
  rejects `role === 'client'`, matching `package-builder.ts`.
- Local API writes pass `req`/context per project rules where hooks are involved
  (none anticipated for these collections initially).
- Collections' access: `adminOrUser` create/read/update, `adminOnly` delete.

## Out of scope (deferred)

- Stripe / invoicing of the monthly fee or overage.
- Client-facing view of the retainer or hour log (the playbook delivers the log to
  clients, but that's a later phase).
- Automated month-end report generation / email.
- Tier-up automation (Growth > 25h two months running → Enterprise).
- Rollover, revision-round counting, ad-spend tracking.

## File-level change list

**New:**
- `src/lib/payload/collections/Retainers.ts`
- `src/lib/payload/collections/RetainerTimeEntries.ts`
- `src/actions/retainers.ts`
- `src/components/dashboard/RetainerTab.tsx`
- `src/components/dashboard/PackageBuilderTab.tsx` (extracted from current modal body)

**Modified:**
- `src/components/dashboard/PackageBuilderModal.tsx` — becomes the tabbed shell;
  adds `initialTab` prop; hosts `PackageBuilderTab` + `RetainerTab`.
- `src/app/(spaces)/u/[username]/_views/PackagesAdminView.tsx` — adds the per-client
  "Retainer" launch button; passes `initialTab`.
- `src/lib/payload/payload.config.ts` — register both new collections.
- `src/types/payload-types.ts` — regenerated via `bun run payload:generate`.

## Verification

- `bun run payload:generate` succeeds; `Retainer` / `RetainerTimeEntry` types exist.
- `bun run tsc --noEmit` clean.
- Manual: open modal → Retainer tab → select client → set a retainer → log an
  entry → reload → retainer and entry persist; summary math (used/remaining/overage)
  is correct across a month boundary.

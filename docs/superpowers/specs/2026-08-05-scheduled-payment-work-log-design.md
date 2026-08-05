# Scheduled Payment Work Log & Recap — Design

**Date:** 2026-08-05
**Status:** Approved for planning

## Problem

Scheduled payments (`packages.paymentSchedule`) carry zero documentation. An entry is
`{ label, entryType, amount, dueDate, orderId, invoicedAt }` — when `sendScheduledPayment()`
fires, the Stripe invoice and Order get a single line that is just the label
("Final Payment — Used Steinway Website Launch"). Nothing records what work the payment
represents, what remains before the next payment, and no recap artifact goes to the client.

The retainer flow already solves this shape of problem: continuous hour logs
(`retainer-time-entries`) feed an auto-derived recap (`src/lib/retainers/recap.ts`),
itemized $0 work lines on the invoice (`src/actions/retainers.ts:1124–1160`), a recap
deck PDF, and a recap email. This design mirrors that loop for fixed-price milestone
packages.

## Decisions made

| Question | Decision |
|---|---|
| Unit of work | Milestone log entries (dated description + optional hours + category + planned/logged status) |
| Log scope | Package-level; attribution to a payment is automatic (consume-on-invoice) |
| Primary UX | New Command Console station mirroring `RetainerTab`, plus affordances on `ScheduledPaymentsSection` rows |
| Data model | New collection `package-work-entries` (sibling of `retainer-time-entries`, no term snapshots) |
| Recap outputs | $0 work lines on Order + Stripe invoice · recap PDF · recap PDF attached to the invoice email · itemized work-log section in the invoice email body |

## 1. Data model — `package-work-entries` collection

New file `src/lib/payload/collections/PackageWorkEntries.ts`, registered in
`payload.config.ts`. Fields:

| Field | Type | Notes |
|---|---|---|
| `date` | date (dayOnly) | indexed |
| `status` | select `planned` \| `logged` | planned = future work ("what's left"); logged = done work |
| `completion` | select `incomplete` \| `complete` | meaningful on planned entries; flipped when the planned work is logged. Planned entries are never consumed/converted — logging planned work creates a separate logged entry and marks the plan complete (same pattern as retainer `logPlannedHours`). |
| `category` | select `work` \| `design` \| `revision` \| `meeting` | recap buckets |
| `hours` | number, **optional** | informational only — shown on lines/recap when present, never billed |
| `description` | textarea, required | |
| `package` | relationship → `packages` | indexed; must be a `type: 'proposal'` package (enforced in actions) |
| `clientAccount` | relationship → `client-accounts` | denormalized from the package, indexed |
| `billedOrderId` | text | set when an invoice consumes the entry (see §2); empty = pending |
| `loggedBy` | relationship → `users` | |

- Compound indexes: `{ package, date }`, `{ package, billedOrderId }`.
- Access: `adminOrUser` for create/read/update, `adminOnly` delete (staff-only log, matching retainer entries).
- No billing-term snapshot fields — the payment price is fixed on the schedule entry.
- Run `bun run payload:generate` after adding.

## 2. Attribution — consume-on-invoice

Retainers slice a continuous log by calendar cycle; milestone packages have no natural
cycle. Rule: **an entry is pending until an invoice consumes it.**

- Pending work = `status: 'logged'` entries with no `billedOrderId`.
- `sendScheduledPayment()` attaches every selected pending logged entry as a $0 line
  and stamps `billedOrderId = order.id` on each, inside the same action.
- "What's left" = planned entries with `completion: 'incomplete'` + the remaining
  un-invoiced schedule entries themselves (label · amount · dueDate).
- **Release on failure/removal:** the existing void-on-error cleanup in
  `sendScheduledPayment` (`packages.ts:1072–1076`) also unstamps any entries it stamped.
  `removeScheduleEntry` (which deletes placeholder orders) and order cancellation
  release entries whose `billedOrderId` matches the removed/cancelled order.

## 3. Primary UX — "Milestones" Command Console station

New station registered in `CommandConsole.tsx` (own hotkey on the rail), implemented as
`src/components/dashboard/MilestonesTab.tsx` — a structural sibling of `RetainerTab`
(same stage grammar, keyboard model, and form layouts; shared subcomponents extracted
only where extraction is trivial).

**Stages:** `portfolio → overview · plan · log · recap` (keys 1–4 jump stages, Esc
walks back one level, autofocused client search on landing).

- **Portfolio board** (`getMilestonePortfolio()` action): all clients with proposal
  packages that have pending schedule entries. Ranked by soonest pending `dueDate`.
  Each row: client · package · next pending entry (label, amount, due date) · unbilled
  logged-entry count · **needs-recap flag** when a payment is due within 30 days and
  unbilled work exists.
- **Overview:** schedule timeline (paid ● / invoiced ● / pending ○ with amounts and
  dates, paid state joined via `entry.orderId → orders.status`), unbilled entry list,
  planned-open count, and a quick-log one-liner (note + optional hours, ↵ to submit).
- **Plan stage:** creates planned entries (date · category · priority-free · description).
  Each planned row has "Log →" which opens the log editor pre-filled, creates a logged
  entry, and marks the plan complete.
- **Log stage:** date · hours (optional, step 0.25) · category · description, ↵-to-submit.
- **Recap stage:** the composer (see §5), scoped to the next pending schedule entry by
  default with a selector for other pending entries.

## 4. Schedule-row integration + send flow

`ScheduledPaymentsSection.tsx` changes:

- Each pending row gains a work chip — e.g. **"6 logged · 2 planned open"** — sourced
  from a count included in the page's data fetch. Clicking deep-links into the
  Milestones station with that package + entry pre-selected (recap stage).
- **Send Invoice** no longer fires immediately. It opens `SchedulePaymentInvoiceModal`
  (mirroring `RetainerInvoiceModal`):
  - Payment summary: label, amount, due date, computed `days_until_due`.
  - Itemized pending work lines that will attach ($0 each) — individually deselectable.
  - Recap narrative editor (inline, or "Edit recap" opening the full composer).
  - Toggles: ☑ attach recap PDF · ☑ include work log in email body · ☐ skip email
    (replaces the current split-button dropdown's "Create Invoice — no email" item).
- Recap drafts are **keyed by schedule-entry id** (`{ entryId, data }` lifted to the
  parent, same pattern as the retainer's cycle-keyed draft) so a stale draft can never
  attach to a different payment.
- Delete and the 30/60/90/ALL filter behave as today.

## 5. Recap model + outputs

**Model:** `src/lib/packages/recap.ts`, same architecture as `src/lib/retainers/recap.ts`:

- `derivePackageRecapDefaults(input)` — auto-derived numbers/lists: package + payment
  cover (name, label, amount, due date, schedule position e.g. "Payment 2 of 3"),
  *Accomplished* (pending logged entries bucketed by category, dates, optional hours),
  *What's Left* (open planned items + remaining schedule entries), narrative fields blank.
- `mergePackageRecap(server, client)` — server-authoritative entries and amounts;
  client-editable narrative text only (entries zip by index so content can't be fabricated).

**Outputs:**

1. **$0 work lines on Order + Stripe invoice.** The payment line carries the price
   (`entry.label — pkg.name`, `entry.amount`); each consumed work entry becomes a $0
   line titled `"May 2 — Rebuilt inventory sync"` with description
   `"3h · Work · milestone log"` (hours omitted when absent). Written to Stripe lines
   and `orders.lineItems` (finally populating `lineItems[].description`, which schedule
   flows currently leave empty). Unlike the retainer flow, work lines are **not**
   written onto the package — `packages.lineItems` is the priced proposal scope and
   stays untouched.
2. **Recap PDF.** `buildPackageRecapPdf` in `pdf-generators.ts` (package variant of the
   retainer deck): cover · at-a-glance (schedule position, amounts paid/remaining) ·
   Accomplished · What's Left · editable narrative. Route:
   `POST /api/packages/[id]/recap/pdf` — re-derives server-side and merges the posted
   body via `mergePackageRecap` (staff cannot inject entries).
3. **Invoice email.** The generic invoice email gains an optional "Work completed"
   itemized section in the body and the recap PDF as an attachment — each independently
   toggleable in the send modal. Email sending stays fire-and-forget/non-blocking.

## 6. Server actions

New file `src/actions/packageWork.ts` (`'use server'`), shaped like the retainer twins:

```
logPackageWork({ packageId, date, hours?, category?, description })
createPackagePlan({ packageId, date, description, category? })
logPlannedWork({ planId, date?, hours?, category?, description? })
updateWorkEntry({ id, date?, hours?, category?, completion?, description? })
deleteWorkEntry(id)
getPackageWorkSummary(packageId)            // entries split pending/billed/planned + schedule join
getMilestonePortfolio()                     // portfolio board data
getPackageRecapModel(packageId, entryId)    // derivePackageRecapDefaults input
```

Extension in `src/actions/packages.ts`:

```
sendScheduledPayment(packageId, entryId, projectId?, opts?: {
  skipEmail?, workLineIds?, recap?, attachRecapPdf?, includeWorkInEmail?
})
```

- Backward compatible: with no `opts`, behaves as today plus consuming zero work lines.
- Stamps `billedOrderId` on consumed entries after order creation; void-on-error path
  unstamps.
- All nested Payload writes inside any hook context pass `req`; all `(spaces)` reads
  use `overrideAccess: false` with the session user.

## Out of scope

- Client-portal visibility of the raw work log (clients see it via invoice lines,
  email, and recap PDF).
- Refactoring `RetainerTab` / merging the two flows into one station.
- Hours-based pricing or any billing-amount derivation from hours.
- The pre-existing `savePaymentScheduleOnly` index-based merge bug
  (`packages.ts:1275–1281`) — fix separately.
- A standalone recap email send (recap travels with the invoice email; the PDF route
  covers standalone document needs).

## Testing

- Unit: `derivePackageRecapDefaults` / `mergePackageRecap` (fabrication resistance,
  bucket math), consume-on-invoice stamping + release on error/removal/cancellation.
- Action-level: `sendScheduledPayment` with work lines (Stripe lines built correctly,
  $0 lines never affect totals, `billedOrderId` set, entry write-back intact).
- Manual: console station keyboard flow, deep-link from schedule row, PDF render,
  email body section on/off.

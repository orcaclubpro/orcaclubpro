/**
 * Pure parsers for the cards DB: what a request card looks like in a new task's
 * description, and which task lines count as progress events. No I/O.
 */
import { lexicalToPlainText } from '@/lib/tasks/richText'
import { NOW_KINDS } from '@/lib/tasks/structure'

export type CardFields = {
  slug: string
  version: number
  discordMessageId: string | null
  threadId: string | null
  promptSha: string
  promptText: string | null
  status: 'approved'
  approvals: Array<{ by: string; channelId: string | null; messageId: string | null }>
}

export type EventKind = 'next' | 'left-off' | 'result' | 'decision'
export type ParsedEvent = { kind: EventKind; text: string }

// The lines qa-react's requestintake.py writes when Chance's ✅ files a card.
const REQUEST_LINE = /^Request:[ \t]*(\S+)[ \t]+v(\d+)[ \t]*\(approved by ([^,\n]+?) in tasks channel (\d+)/m
const IDS_LINE = /^Request message:[ \t]*(\d+)[ \t]*\|[ \t]*Prompt message:[ \t]*\d+[ \t]*\|[ \t]*Prompt sha256:[ \t]*([0-9a-f]{64})/m
const PROMPT_BLOCK = /<<<BUILD-PROMPT sha256=[0-9a-f]{64}\r?\n([\s\S]*?)\r?\nBUILD-PROMPT>>>/

/**
 * Card metadata from a new task's description, or null when it isn't a request
 * card. A request's Discord thread hangs off its request message, so the two
 * share an id; the description carries no separate thread line.
 */
export function parseCard(description: string | null | undefined): CardFields | null {
  const text = description ?? ''
  const request = REQUEST_LINE.exec(text)
  const ids = IDS_LINE.exec(text)
  if (!request || !ids) return null
  return {
    slug: request[1]!,
    version: Number(request[2]),
    discordMessageId: ids[1]!,
    threadId: ids[1]!,
    promptSha: ids[2]!,
    promptText: PROMPT_BLOCK.exec(text)?.[1] ?? null,
    status: 'approved',
    approvals: [{ by: request[3]!.trim(), channelId: request[4]!, messageId: ids[1]! }],
  }
}

const DECISION_LINE = /^[ \t>*-]*decision[ \t]*(?:\[[\w.-]+\])?[ \t]*:[ \t]*\S/i

/** The event one whole task line records, or null. `text` is the full line. */
export function parseEventLine(line: string): ParsedEvent | null {
  const text = line.trim()
  if (DECISION_LINE.test(text)) return { kind: 'decision', text }
  const m = NOW_KINDS.exec(text)
  if (!m || !m[4]!.trim()) return null
  const kind = m[1]!.toLowerCase()
  return { kind: kind === 'left off' ? 'left-off' : (kind as EventKind), text }
}

const linesOf = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

/**
 * Events for the lines a description update added. Counted per line, so a
 * rewrite that keeps existing lines records nothing and the same line appended
 * a second time records once more.
 */
export function eventsAdded(before: unknown, after: string): ParsedEvent[] {
  const seen = new Map<string, number>()
  for (const l of linesOf(lexicalToPlainText(before as never) ?? '')) seen.set(l, (seen.get(l) ?? 0) + 1)
  const out: ParsedEvent[] = []
  for (const l of linesOf(after)) {
    const left = seen.get(l) ?? 0
    if (left > 0) {
      seen.set(l, left - 1)
      continue
    }
    const event = parseEventLine(l)
    if (event) out.push(event)
  }
  return out
}

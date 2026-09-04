// Ranking for the command console's search station.
//
// The old behaviour was substring-OR over whole-query strings: a record matched
// if any one field contained the entire query, and results came back in fetch
// order. That ranked a client matching on its email above a project named
// exactly what you typed, and it failed outright on "acme rebuild" — no single
// field holds both words.
//
// So: split the query into tokens, require every token to land somewhere on the
// record (AND across tokens, OR across fields), and score each hit by how good
// the match is and how important the field is.

/** A searchable field on a record. `weight` is how much a hit here counts. */
export interface SearchField {
  /** Stable id, used to tell the row which field carried the match. */
  key: string
  /** Human label, shown as "matched <label>" when the field isn't on the row. */
  label: string
  value?: string | null
  weight: number
}

export interface ScoredMatch {
  score: number
  /** Field keys that carried at least one token. */
  matchedKeys: string[]
}

// An exact field is worth far more than an incidental substring, so a record
// whose *name* is the query always beats one that merely mentions it.
const EXACT = 8
const PREFIX = 4
const WORD = 2
const SUBSTRING = 1

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 0 when the token is absent, otherwise a quality multiplier. */
function fieldMatchQuality(value: string, token: string): number {
  const v = value.toLowerCase()
  if (!v.includes(token)) return 0
  if (v === token) return EXACT
  if (v.startsWith(token)) return PREFIX
  if (new RegExp(`\\b${escapeRegExp(token)}`).test(v)) return WORD
  return SUBSTRING
}

export function tokenize(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/**
 * Score a record. Returns null when any token fails to match — that AND is what
 * lets a multi-word query span fields ("acme" on the client, "rebuild" on the
 * project name) instead of requiring one field to hold the whole phrase.
 */
export function scoreFields(fields: SearchField[], tokens: string[]): ScoredMatch | null {
  if (tokens.length === 0) return null
  let score = 0
  const matchedKeys = new Set<string>()

  for (const token of tokens) {
    let best = 0
    let bestKey: string | null = null
    for (const field of fields) {
      if (!field.value) continue
      const quality = fieldMatchQuality(field.value, token)
      if (quality === 0) continue
      const weighted = quality * field.weight
      if (weighted > best) {
        best = weighted
        bestKey = field.key
      }
    }
    if (best === 0) return null
    score += best
    if (bestKey) matchedKeys.add(bestKey)
  }

  return { score, matchedKeys: [...matchedKeys] }
}

export interface Segment {
  text: string
  hit: boolean
}

/**
 * Split `text` into hit/miss runs so the row can bold what matched. Ranges from
 * every token are merged, so overlapping tokens don't produce nested spans.
 */
export function highlightSegments(text: string, tokens: string[]): Segment[] {
  if (!text || tokens.length === 0) return [{ text, hit: false }]

  const lower = text.toLowerCase()
  const ranges: Array<[number, number]> = []
  for (const token of tokens) {
    if (!token) continue
    let from = 0
    for (;;) {
      const at = lower.indexOf(token, from)
      if (at === -1) break
      ranges.push([at, at + token.length])
      from = at + token.length
    }
  }
  if (ranges.length === 0) return [{ text, hit: false }]

  ranges.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([range[0], range[1]])
  }

  const out: Segment[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) out.push({ text: text.slice(cursor, start), hit: false })
    out.push({ text: text.slice(start, end), hit: true })
    cursor = end
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), hit: false })
  return out
}

import type { ReactNode } from 'react'

// Per-format right rail. Hidden under 1100px via sonar.css.

/** THE ENGINE — the Desk's human-in-the-loop pipeline + dispatch signup. */
export function EnginePanel() {
  return (
    <aside className="sound rail-engine">
      <div className="cap label">The Engine</div>
      <ol className="pipeline">
        <li className="step done">
          <span className="n mono">01</span>
          <span className="t">Topic + angle</span>
        </li>
        <li className="step on">
          <span className="n mono">02</span>
          <span className="t">AI drafts</span>
        </li>
        <li className="step">
          <span className="n mono">03</span>
          <span className="t">Human take</span>
        </li>
        <li className="step">
          <span className="n mono">04</span>
          <span className="t">Publish</span>
        </li>
      </ol>
      <p className="step-note">Human-in-the-loop · in progress</p>

      <div className="dispatch">
        <div className="dispatch-label label">The dispatch, weekly</div>
        {/* stub — no backend in Phase 1 */}
        <form className="sub-form" action="#">
          <input type="email" placeholder="you@studio.com" aria-label="Email address" />
          <button type="submit">Join</button>
        </form>
      </div>
    </aside>
  )
}

export interface SoundingMark {
  at: string
  label: string
  top: string
  on?: boolean
}

/** SOUNDING — the Decode reading progress gauge. */
export function SoundingLine({
  marks,
  fill,
  percent,
  left,
}: {
  marks: SoundingMark[]
  fill: string
  percent: string
  left: string
}) {
  return (
    <aside className="sound rail-sounding">
      <div className="cap label">Sounding</div>
      <div className="gauge">
        <div className="fill" style={{ height: fill }} />
        {marks.map((m) => (
          <div key={m.label} className={`mark${m.on ? ' on' : ''}`} style={{ top: m.top }}>
            <span className="d">{m.at}</span>
            <span className="t">{m.label}</span>
          </div>
        ))}
      </div>
      <div className="sound-foot">
        <span className="big">
          {percent}
          <span className="label">%</span>
        </span>
        <span className="mono" style={{ color: 'var(--ink-soft)' }}>
          {left}
        </span>
      </div>
    </aside>
  )
}

export interface ProjectSpec {
  k: string
  v: ReactNode
  status?: boolean
}

/** PROJECT — the Field Note fact sheet. */
export function ProjectSheet({ spec }: { spec: ProjectSpec[] }) {
  return (
    <aside className="sound rail-project">
      <div className="cap label">Project</div>
      <ul className="spec">
        {spec.map((s) => (
          <li key={s.k}>
            <span className="k">{s.k}</span>
            <span className={`v${s.status ? ' status' : ''}`}>
              {s.status ? <span className="dot" /> : null}
              {s.v}
            </span>
          </li>
        ))}
      </ul>
      <div className="sound-foot">
        <a href="#">
          Start a project <span className="ar">→</span>
        </a>
      </div>
    </aside>
  )
}

export interface SignalRow {
  k: string
  v: ReactNode
}

/** SIGNAL — the Markets Brief conviction box. */
export function SignalPanel({ rows, foot }: { rows: SignalRow[]; foot: string }) {
  return (
    <aside className="sound rail-signal">
      <div className="cap label">Signal</div>
      <div className="sig-list">
        {rows.map((r, i) => (
          <div className="sig-row" key={r.k}>
            <span className="k">{r.k}</span>
            <span className="v">
              {i === 0 ? <span className="d" /> : null}
              {r.v}
            </span>
          </div>
        ))}
      </div>
      <div className="sig-foot">{foot}</div>
    </aside>
  )
}

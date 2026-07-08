'use client'

import Link from 'next/link'
import { type CSSProperties, type KeyboardEvent, type ReactNode, useState } from 'react'

export interface CarouselChannel {
  slug: string
  name: string
  kind: string
  star?: boolean
  accent: string
  accentDeep: string
  blurb: string
  count: number
  dispatches: { href: string; title: ReactNode; meta: string }[]
}

// The Desk — a tabbed channel carousel. Four tabs (the categories) with a
// sliding accent selector; each tab reveals that channel's panel with its
// latest dispatches and a big "Enter" button. The active accent drives the
// underline, tab, and panel so each category reads as its own space.
export function ChannelCarousel({ channels }: { channels: CarouselChannel[] }) {
  const [active, setActive] = useState(0)
  const current = channels[active]

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setActive((a) => (a + 1) % channels.length)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive((a) => (a - 1 + channels.length) % channels.length)
    }
  }

  return (
    <div
      className="carousel"
      style={
        {
          '--active': active,
          '--active-accent-light': current.accent,
          '--active-accent-deep': current.accentDeep,
        } as CSSProperties
      }
    >
      <div className="cx-tabs" role="tablist" aria-label="SONAR channels" onKeyDown={onKeyDown}>
        {channels.map((c, i) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            className={`cx-tab${i === active ? ' is-active' : ''}`}
            style={{ '--accent-light': c.accent, '--accent-deep': c.accentDeep } as CSSProperties}
            onClick={() => setActive(i)}
          >
            <span className="cx-tab-name">{c.name}</span>
            <span className="cx-tab-sig">
              {c.star ? <span className="star">★</span> : <span className="dot" />}
              {c.count > 0 ? c.count : '—'}
            </span>
          </button>
        ))}
        <span className="cx-tab-underline" aria-hidden="true" />
      </div>

      <div className="cx-viewport">
        <div className="cx-track">
          {channels.map((c, i) => (
            <section
              key={c.slug}
              className="cx-panel"
              role="tabpanel"
              aria-hidden={i !== active}
              style={{ '--accent-light': c.accent, '--accent-deep': c.accentDeep } as CSSProperties}
            >
              <div className="cx-intro">
                <span className="cx-kicker">
                  {c.star ? <span className="star">★</span> : <span className="dot" />}
                  {c.kind}
                </span>
                <h2 className="cx-name">{c.name}</h2>
                <p className="cx-blurb">{c.blurb}</p>
              </div>

              <div className="cx-latest">
                <div className="cx-latest-label">Latest dispatches</div>
                {c.dispatches.length > 0 ? (
                  c.dispatches.map((d) => (
                    <Link key={d.href} className="cx-item" href={d.href} tabIndex={i === active ? 0 : -1}>
                      <span className="cx-item-title">{d.title}</span>
                      <span className="cx-item-meta mono">{d.meta}</span>
                    </Link>
                  ))
                ) : (
                  <div className="cx-empty">No dispatches yet.</div>
                )}
              </div>

              <div className="cx-actions">
                <Link className="cx-enter" href={`/${c.slug}`} tabIndex={i === active ? 0 : -1}>
                  Enter {c.name} <span className="ar">→</span>
                </Link>
                <span className="cx-count mono">
                  {c.count} dispatch{c.count === 1 ? '' : 'es'}
                </span>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

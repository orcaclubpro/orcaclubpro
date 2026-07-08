'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CHANNELS } from './channels'
import { useSonarTheme } from './theme'

/**
 * The spine — SONAR's left sidebar. Brand lockup, grouped channel nav with
 * freshness signals, the surface/depth mode toggle, and the (stub) archive
 * scan. Collapses to a top bar under 720px via sonar.css.
 */
export function Spine() {
  const pathname = usePathname() || '/'
  // The app only renders on the subdomain (middleware redirects /s there and
  // rewrites the clean paths onto /s internally), so links are root-relative.
  const isActive = (slug: string) =>
    pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)

  const channels = CHANNELS.filter((c) => c.group === 'channels')
  const studio = CHANNELS.filter((c) => c.group === 'studio')

  return (
    <nav className="spine">
      <Link className="brand" href="/" aria-label="SONAR by ORCACLUB — home">
        <Image className="orca" src="/sonar/orca.png" alt="" width={50} height={50} priority />
        <Image className="word" src="/sonar/word.png" alt="SONAR" width={128} height={34} priority />
        <span className="subline">
          <span className="rule">
            <span className="by">by orcaclub</span>
          </span>
          <span className="tagline">Signal from beneath the noise</span>
        </span>
      </Link>

      <div className="nav">
        <div className="nav-eyebrow">Channels</div>
        <div className="chapters">
          {channels.map((c, i) => (
            <Link
              key={c.slug}
              className={`chap${isActive(c.slug) ? ' active' : ''}`}
              href={`/${c.slug}`}
              style={{ animationDelay: `${0.2 + i * 0.06}s` }}
            >
              <span className="name">{c.name}</span>
              <span className="sig">
                {c.signal ? (
                  <>
                    <span className="dot" />
                    {c.signal}
                  </>
                ) : null}
              </span>
            </Link>
          ))}
        </div>

        <div className="nav-div" />
        <div className="nav-eyebrow">Studio</div>
        <div className="chapters">
          {studio.map((c, i) => (
            <Link
              key={c.slug}
              className={`chap${isActive(c.slug) ? ' active' : ''}`}
              href={`/${c.slug}`}
              style={{ animationDelay: `${0.2 + (channels.length + i) * 0.06}s` }}
            >
              <span className="name">{c.name}</span>
              <span className="sig">{c.star ? <span className="star">★</span> : null}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="spine-foot">
        <ModeToggle />
        <div className="scan">
          <span className="mono">⌕</span>
          <input placeholder="Scan the archive…" aria-label="Scan the archive" />
          <span className="k">/</span>
        </div>
        <div className="edition">Edition 038 · Jul 2026</div>
      </div>
    </nav>
  )
}

function ModeToggle() {
  const { theme, toggle } = useSonarTheme()
  const deep = theme === 'deep'
  return (
    <button
      className="mode"
      onClick={toggle}
      aria-label="Toggle reading mode"
      aria-pressed={deep}
    >
      <span className="mode-track">
        <span className="mode-thumb" />
      </span>
      <span className="mode-label">{deep ? 'Surface' : 'Depth'}</span>
    </button>
  )
}

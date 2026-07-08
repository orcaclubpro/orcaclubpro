'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

/**
 * SONAR landing — the promo portal at orcaclub.pro/sonar. Paper hero with the
 * orca surfacing out of a settling noise field, a sonar-ping sweep, and two
 * CTAs: "Enter SONAR" (the hub) and "Talk to us" (the studio).
 *
 * "Enter SONAR" points at /s and uses a plain <a>, not next/link: middleware
 * redirects /s to the SONAR subdomain (sonar.orcaclub.pro in prod, sonar.localhost
 * in dev), and <Link> prefetch/soft-nav doesn't work across origins. "Talk to us"
 * is same-origin, so it keeps <Link>. Reduced-motion safe.
 */
export function SonarLanding({ fontClass }: { fontClass: string }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.18 },
    )
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div ref={rootRef} className={`sonar-landing ${fontClass}`}>
      {/* settling noise field */}
      <svg className="noise" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <filter id="sonar-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sonar-noise)" />
      </svg>

      {/* HERO */}
      <section className="hero">
        <div className="stage">
          <div className="ping">
            <span />
            <span />
            <span />
          </div>
          <Image className="orca" src="/sonar/orca.png" alt="" width={118} height={118} priority />
          <Image className="word" src="/sonar/word.png" alt="SONAR" width={290} height={78} priority />
          <div className="tag">
            <span>Signal from beneath the noise</span>
          </div>
          <div className="cta-row">
            <a className="btn primary" href="/s">
              Enter SONAR <span className="ar">→</span>
            </a>
            <Link className="btn ghost" href="/contact">
              Talk to us
            </Link>
          </div>
        </div>
        <a className="scrollcue" href="#learn">
          <span>WHAT IS SONAR</span>
          <span className="chev">▾</span>
        </a>
      </section>

      {/* LEARN MORE */}
      <section className="learn" id="learn">
        <div className="eyebrow reveal">by orcaclub</div>
        <h2 className="reveal">
          A research desk that pushes the frontier out across audiences — and{' '}
          <em>builds what it writes about.</em>
        </h2>
        <p className="lede reveal">
          One desk, four channels. We decode what&apos;s happening, then route the highest-intent
          readers into the work itself.
        </p>

        <div className="channels">
          <div className="ch reveal">
            <div className="k">
              <span className="dot" />
              AI
            </div>
            <p>Models, tooling &amp; findings — the frontier, decoded.</p>
          </div>
          <div className="ch reveal">
            <div className="k">
              <span className="dot" />
              Markets
            </div>
            <p>AI × money — the catalysts, and what&apos;s investable.</p>
          </div>
          <div className="ch reveal">
            <div className="k">
              <span className="dot" />
              Research
            </div>
            <p>Technical deep-dives — the papers, decoded.</p>
          </div>
          <div className="ch star reveal">
            <div className="k">★ Field Notes</div>
            <p>What we&apos;re actually building — the case study, as content.</p>
          </div>
        </div>

        <div className="close reveal">
          <div className="line">&ldquo;We build what we write about.&rdquo;</div>
          <a className="go" href="/s">
            Enter SONAR <span>→</span>
          </a>
        </div>
      </section>
    </div>
  )
}

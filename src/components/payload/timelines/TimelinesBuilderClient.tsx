'use client'

import React from 'react'
import Link from 'next/link'
import type { Timeline } from '@/types/payload-types'

type Props = {
  initialTimelines: Timeline[]
  user: { email?: string | null; name?: string | null; role?: string | null }
}

const GOLD = '#C9A84C'
const GOLD_DIM = 'rgba(201,168,76,0.15)'
const GOLD_MID = 'rgba(201,168,76,0.35)'
const TEXT_PRIMARY = '#F7F4EE'
const TEXT_SECONDARY = 'rgba(247,244,238,0.5)'
const TEXT_TERTIARY = 'rgba(247,244,238,0.3)'
const PAGE_BG = '#0d0d0d'
const CARD_BG = 'rgba(255,255,255,0.03)'
const BORDER = 'rgba(201,168,76,0.15)'

export function TimelinesBuilderClient({ initialTimelines, user }: Props) {
  const timelines = initialTimelines

  const totalPhases = timelines.reduce((acc, t) => acc + (t.phases?.length ?? 0), 0)
  const totalPublished = timelines.length

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: PAGE_BG,
        color: TEXT_PRIMARY,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          borderBottom: `1px solid ${BORDER}`,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 32px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: GOLD,
              }}
            >
              TIMELINES
            </span>
            <span style={{ color: TEXT_TERTIARY, fontSize: 14, fontWeight: 300 }}>/</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: TEXT_PRIMARY,
                letterSpacing: '-0.01em',
              }}
            >
              Builder
            </span>
          </div>

          {/* Right: New Timeline button */}
          <Link
            href="/admin/collections/timelines/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              border: `1px solid ${GOLD}`,
              borderRadius: 6,
              color: GOLD,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              transition: 'background 0.15s',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                'rgba(201,168,76,0.08)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            New Timeline
          </Link>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px' }}>
        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[
            { label: 'Total Timelines', value: timelines.length },
            { label: 'Total Phases', value: totalPhases },
            { label: 'Published', value: totalPublished },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                backgroundColor: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: TEXT_SECONDARY,
                  marginBottom: 8,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline cards or empty state */}
        {timelines.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '120px 32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: `1px solid ${BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                fontSize: 24,
              }}
            >
              ◎
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: TEXT_PRIMARY,
                marginBottom: 8,
              }}
            >
              No timelines yet
            </div>
            <div
              style={{
                fontSize: 14,
                color: TEXT_SECONDARY,
                marginBottom: 28,
              }}
            >
              Build your first client-facing project timeline.
            </div>
            <Link
              href="/admin/collections/timelines/create"
              style={{
                color: GOLD,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              Create your first timeline →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 20,
            }}
          >
            {timelines.map((timeline) => (
              <TimelineCard key={timeline.id} timeline={timeline} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineCard({ timeline }: { timeline: Timeline }) {
  const phaseCount = timeline.phases?.length ?? 0

  return (
    <div
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = GOLD_MID
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = BORDER
      }}
    >
      {/* Eyebrow */}
      {timeline.eyebrow && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: GOLD,
          }}
        >
          {timeline.eyebrow}
        </div>
      )}

      {/* Title block */}
      <div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {timeline.title}
          {timeline.titleEmphasis && (
            <span
              style={{
                fontStyle: 'italic',
                color: GOLD,
                marginLeft: 6,
                fontWeight: 600,
              }}
            >
              {timeline.titleEmphasis}
            </span>
          )}
        </div>

        {/* Slug */}
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            fontFamily: '"SF Mono", "Fira Code", "Fira Mono", monospace',
            color: TEXT_TERTIARY,
            letterSpacing: '0.02em',
          }}
        >
          /timelines/{timeline.slug}
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {/* Phase count badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 20,
            border: `1px solid ${GOLD_DIM}`,
            fontSize: 11,
            fontWeight: 600,
            color: GOLD,
            letterSpacing: '0.04em',
            backgroundColor: 'rgba(201,168,76,0.06)',
          }}
        >
          {phaseCount} {phaseCount === 1 ? 'phase' : 'phases'}
        </span>

        {/* Date range badge */}
        {timeline.dateRange && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: 20,
              border: '1px solid rgba(247,244,238,0.1)',
              fontSize: 11,
              fontWeight: 500,
              color: TEXT_SECONDARY,
              letterSpacing: '0.02em',
            }}
          >
            {timeline.dateRange}
          </span>
        )}
      </div>

      {/* Meta label */}
      {timeline.metaLabel && (
        <div
          style={{
            fontSize: 12,
            color: TEXT_SECONDARY,
            fontStyle: 'italic',
          }}
        >
          {timeline.metaLabel}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: BORDER,
          marginTop: 'auto',
        }}
      />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Link
          href={`/admin/collections/timelines/${timeline.id}`}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 0',
            borderRadius: 6,
            border: `1px solid rgba(247,244,238,0.12)`,
            color: TEXT_PRIMARY,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            backgroundColor: 'transparent',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.backgroundColor = 'rgba(247,244,238,0.06)'
            el.style.borderColor = 'rgba(247,244,238,0.25)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.backgroundColor = 'transparent'
            el.style.borderColor = 'rgba(247,244,238,0.12)'
          }}
        >
          Edit
        </Link>

        <Link
          href={`/timelines/${timeline.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 0',
            borderRadius: 6,
            border: `1px solid ${GOLD_DIM}`,
            color: GOLD,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            backgroundColor: 'transparent',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.backgroundColor = 'rgba(201,168,76,0.08)'
            el.style.borderColor = GOLD
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.backgroundColor = 'transparent'
            el.style.borderColor = GOLD_DIM
          }}
        >
          Preview ↗
        </Link>
      </div>
    </div>
  )
}

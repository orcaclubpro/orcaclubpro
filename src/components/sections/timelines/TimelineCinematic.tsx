'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { Timeline } from '@/types/payload-types'

type TimelinePhase = NonNullable<Timeline['phases']>[number]
type PhaseBlock = Extract<TimelinePhase, { blockType: 'phase' }>
type ChecklistBlock = Extract<TimelinePhase, { blockType: 'checklist' }>
type LaunchBlock = Extract<TimelinePhase, { blockType: 'launch' }>

// ── Color maps ────────────────────────────────────────────────────────────

const TAG_COLOR: Record<string, string> = {
  build: '#7BAE9A',
  integrate: '#A88FD4',
  touchup: '#D4A06B',
  prep: '#C97A7A',
}

const TAG_BORDER_COLOR: Record<string, string> = {
  build: 'rgba(123,174,154,0.6)',
  integrate: 'rgba(168,143,212,0.6)',
  touchup: 'rgba(212,160,107,0.6)',
  prep: 'rgba(201,122,122,0.6)',
}

const CARD_TOP_GRADIENT: Record<string, string> = {
  build: 'linear-gradient(90deg,#7BAE9A,transparent)',
  integrate: 'linear-gradient(90deg,#A88FD4,transparent)',
  touchup: 'linear-gradient(90deg,#D4A06B,transparent)',
  prep: 'linear-gradient(90deg,#C97A7A,transparent)',
}

// ── Sub-components ────────────────────────────────────────────────────────

function Connector() {
  return (
    <div style={{
      width: 56,
      height: 1,
      background: 'linear-gradient(90deg,rgba(201,168,76,0.45),rgba(201,168,76,0.2))',
      flexShrink: 0,
      marginTop: 61,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        right: 0, top: '50%',
        transform: 'translateY(-50%) rotate(45deg)',
        width: 5, height: 5,
        borderRight: '1px solid rgba(201,168,76,0.5)',
        borderTop: '1px solid rgba(201,168,76,0.5)',
        marginRight: 2,
      }} />
    </div>
  )
}

function PhaseCard({ block }: { block: PhaseBlock }) {
  const [hovered, setHovered] = useState(false)
  const color = block.tagColor ?? 'build'

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 232, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Date badge */}
      <div style={{
        background: 'rgba(201,168,76,0.12)',
        border: '1px solid rgba(201,168,76,0.45)',
        padding: '5px 14px',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.12em',
        color: '#E8CC7A',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        marginBottom: 10,
      }}>
        {block.dateRange}
      </div>

      {/* Node */}
      <div style={{
        width: 14, height: 14,
        borderRadius: '50%',
        background: '#1A1714',
        border: `2px solid ${hovered ? '#E8CC7A' : '#C9A84C'}`,
        position: 'relative',
        zIndex: 2,
        transition: 'transform 0.25s ease, border-color 0.25s ease',
        transform: hovered ? 'scale(1.45)' : 'scale(1)',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 2,
          borderRadius: '50%',
          background: '#C9A84C',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }} />
      </div>

      {/* Stem */}
      <div style={{
        width: 1, height: 24,
        background: 'linear-gradient(to bottom,rgba(201,168,76,0.5),rgba(201,168,76,0.1))',
        flexShrink: 0,
      }} />

      {/* Card */}
      <div style={{
        width: 220,
        background: hovered ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.38)' : 'rgba(201,168,76,0.15)'}`,
        padding: '16px 18px 18px',
        position: 'relative',
        transition: 'background 0.3s, border-color 0.3s, transform 0.3s',
        transform: hovered ? 'translateY(4px)' : 'none',
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: CARD_TOP_GRADIENT[color],
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s',
        }} />

        {/* Tag */}
        {block.tag && (
          <div style={{
            display: 'inline-block',
            fontSize: 7.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            padding: '2px 7px',
            border: `1px solid ${TAG_COLOR[color]}`,
            color: TAG_COLOR[color],
            marginBottom: 8,
          }}>
            {block.tag}
          </div>
        )}

        {/* Title */}
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 17,
          fontWeight: 400,
          color: '#F7F4EE',
          marginBottom: 10,
          lineHeight: 1.25,
        }}>
          {block.title}
        </div>

        {/* Items */}
        {block.items && block.items.length > 0 && (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {block.items.map((item, i) => (
              <li key={item.id ?? i} style={{
                fontSize: 9.5,
                color: 'rgba(247,244,238,0.58)',
                letterSpacing: '0.03em',
                lineHeight: 1.5,
                display: 'flex',
                gap: 6,
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#C9A84C', opacity: 0.5, flexShrink: 0, fontSize: 9, marginTop: 1 }}>–</span>
                {item.text}
              </li>
            ))}
          </ul>
        )}

        {/* Dealer pill */}
        {block.dealerPill?.enabled && block.dealerPill.text && (
          <div style={{
            marginTop: 12,
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(107,159,212,0.1)',
            border: '1px solid rgba(107,159,212,0.35)',
            padding: '6px 10px',
          }}>
            <div style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: '#6B9FD4',
              flexShrink: 0,
              animation: 'tl-blink 1.5s ease infinite',
            }} />
            <span style={{
              fontSize: 8.5,
              letterSpacing: '0.1em',
              color: 'rgba(107,159,212,0.9)',
              lineHeight: 1.4,
            }}>
              {block.dealerPill.text}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ChecklistCard({ block }: { block: ChecklistBlock }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [hovered, setHovered] = useState(false)

  const toggle = (i: number) => setChecked(prev => ({ ...prev, [i]: !prev[i] }))

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 260 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Date label badge */}
      {block.dateLabel && (
        <div style={{
          background: 'rgba(107,159,212,0.1)',
          border: '1px solid rgba(107,159,212,0.4)',
          padding: '5px 14px',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.12em',
          color: '#9ec4e8',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          marginBottom: 10,
        }}>
          {block.dateLabel}
        </div>
      )}

      {/* Node */}
      <div style={{
        width: 14, height: 14,
        borderRadius: '50%',
        background: '#1A1714',
        border: '2px solid #6B9FD4',
        position: 'relative',
        zIndex: 2,
        flexShrink: 0,
      }} />

      {/* Card */}
      <div style={{
        width: 248,
        background: hovered ? 'rgba(107,159,212,0.08)' : 'rgba(107,159,212,0.05)',
        border: `1px solid ${hovered ? 'rgba(107,159,212,0.5)' : 'rgba(107,159,212,0.3)'}`,
        padding: '18px 20px 20px',
        position: 'relative',
        transition: 'background 0.3s, border-color 0.3s, transform 0.3s',
        transform: hovered ? 'translateY(4px)' : 'none',
        marginTop: 24,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg,#6B9FD4,transparent)',
        }} />

        {block.tag && (
          <div style={{
            display: 'inline-block',
            fontSize: 7.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            padding: '2px 7px',
            border: '1px solid #6B9FD4',
            color: '#6B9FD4',
            marginBottom: 8,
          }}>
            {block.tag}
          </div>
        )}

        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 17,
          fontWeight: 400,
          color: '#F7F4EE',
          marginBottom: 14,
          lineHeight: 1.25,
        }}>
          {block.title}
        </div>

        {block.items && block.items.length > 0 && (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {block.items.map((item, i) => (
              <li key={item.id ?? i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width: 13, height: 13,
                    border: `1px solid ${checked[i] ? '#6B9FD4' : 'rgba(107,159,212,0.5)'}`,
                    background: checked[i] ? 'rgba(107,159,212,0.18)' : 'transparent',
                    flexShrink: 0,
                    marginTop: 1,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  aria-label={`Toggle: ${item.text}`}
                >
                  {checked[i] && (
                    <div style={{
                      position: 'absolute',
                      left: 2, top: 5,
                      width: 4, height: 2,
                      borderLeft: '1.5px solid #6B9FD4',
                      borderBottom: '1.5px solid #6B9FD4',
                      transform: 'rotate(-45deg) translateY(-2px)',
                    }} />
                  )}
                </button>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggle(i)}
                >
                  <span style={{
                    fontSize: 9.5,
                    color: checked[i] ? 'rgba(247,244,238,0.35)' : 'rgba(247,244,238,0.6)',
                    letterSpacing: '0.03em',
                    lineHeight: 1.5,
                    textDecoration: checked[i] ? 'line-through' : 'none',
                    transition: 'color 0.2s',
                  }}>
                    {item.text}
                  </span>
                  {item.note && (
                    <span style={{
                      display: 'block',
                      fontSize: 8,
                      color: 'rgba(201,168,76,0.6)',
                      letterSpacing: '0.05em',
                      marginTop: 2,
                    }}>
                      {item.note}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function LaunchCard({ block }: { block: LaunchBlock }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 260 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Date badge */}
      {block.dateLabel && (
        <div style={{
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.55)',
          padding: '5px 16px',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.12em',
          color: '#E8CC7A',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          marginBottom: 10,
        }}>
          {block.dateLabel}
        </div>
      )}

      {/* Pulsing node */}
      <div style={{
        width: 20, height: 20,
        borderRadius: '50%',
        border: '2px solid #C9A84C',
        background: '#1A1714',
        position: 'relative',
        zIndex: 2,
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: -7,
          borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.2)',
          animation: 'tl-ringpulse 2s ease infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 4,
          borderRadius: '50%',
          background: '#C9A84C',
          animation: 'tl-corepulse 2s ease infinite',
        }} />
      </div>

      {/* Card */}
      <div style={{
        marginTop: 24,
        width: 248,
        background: 'linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.03))',
        border: '1px solid rgba(201,168,76,0.45)',
        padding: '22px 24px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.3s',
        transform: hovered ? 'translateY(4px)' : 'none',
      }}>
        {/* Top gold line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg,transparent,#C9A84C,transparent)',
        }} />

        {/* Shimmer */}
        <div style={{
          position: 'absolute',
          top: '-50%', left: '-50%',
          width: '200%', height: '200%',
          background: 'radial-gradient(ellipse,rgba(201,168,76,0.07) 0%,transparent 60%)',
          animation: 'tl-shimmer 4s ease infinite',
          pointerEvents: 'none',
        }} />

        {block.label && (
          <div style={{
            fontSize: 8,
            letterSpacing: '0.35em',
            color: '#C9A84C',
            textTransform: 'uppercase',
            marginBottom: 6,
            position: 'relative', zIndex: 1,
          }}>
            {block.label}
          </div>
        )}

        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontWeight: 300,
          letterSpacing: '0.06em',
          color: '#F7F4EE',
          marginBottom: 4,
          position: 'relative', zIndex: 1,
        }}>
          {block.title && <span>{block.title} </span>}
          {block.titleEmphasis && <em style={{ fontStyle: 'italic', color: '#E8CC7A' }}>{block.titleEmphasis}</em>}
        </div>

        {block.subtitle && (
          <div style={{
            fontSize: 9.5,
            color: '#7A756C',
            letterSpacing: '0.15em',
            position: 'relative', zIndex: 1,
            marginBottom: 14,
          }}>
            {block.subtitle}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
          {[0, 250, 500].map(delay => (
            <div key={delay} style={{
              width: 5, height: 5,
              borderRadius: '50%',
              background: '#C9A84C',
              opacity: 0.25,
              animation: `tl-blink 1.5s ease ${delay}ms infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Progress labels ───────────────────────────────────────────────────────

function buildProgressLabels(phases: TimelinePhase[]): string[] {
  return phases.map(p => {
    if (p.blockType === 'phase') return (p as PhaseBlock).dateRange
    if (p.blockType === 'checklist') return (p as ChecklistBlock).dateLabel ?? 'Checklist'
    if (p.blockType === 'launch') return (p as LaunchBlock).dateLabel ?? 'Launch'
    return ''
  })
}

// ── Main component ────────────────────────────────────────────────────────

export default function TimelineCinematic({ timeline }: { timeline: Timeline }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ down: false, startX: 0, scrollLeft: 0 })

  const phases = (timeline.phases ?? []) as TimelinePhase[]
  const progressLabels = buildProgressLabels(phases)

  // ── Drag to scroll ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current
    if (!track) return
    dragRef.current = { down: true, startX: e.pageX - track.offsetLeft, scrollLeft: track.scrollLeft }
    track.style.cursor = 'grabbing'
  }, [])

  useEffect(() => {
    const onUp = () => {
      dragRef.current.down = false
      if (trackRef.current) trackRef.current.style.cursor = 'grab'
    }
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.down || !trackRef.current) return
      e.preventDefault()
      const x = e.pageX - trackRef.current.offsetLeft
      trackRef.current.scrollLeft = dragRef.current.scrollLeft - (x - dragRef.current.startX) * 1.15
    }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('mousemove', onMove)
    return () => {
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  // ── Touch to scroll ──
  const touchRef = useRef({ startX: 0, scrollLeft: 0 })
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { startX: e.touches[0].pageX, scrollLeft: trackRef.current?.scrollLeft ?? 0 }
  }, [])
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!trackRef.current) return
    trackRef.current.scrollLeft = touchRef.current.scrollLeft - (e.touches[0].pageX - touchRef.current.startX)
  }, [])

  // ── Scroll progress ──
  const onScroll = useCallback(() => {
    const track = trackRef.current
    const fill = fillRef.current
    if (!track || !fill) return
    const pct = track.scrollLeft / (track.scrollWidth - track.clientWidth) * 100
    fill.style.width = `${pct}%`
  }, [])

  return (
    <>
      {/* Global keyframes injected once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400;500&display=swap');

        @keyframes tl-fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tl-fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tl-ap {
          0%,100% { opacity: 0; }
          50%      { opacity: 1; }
        }
        @keyframes tl-blink {
          0%,100% { opacity: 0.25; }
          50%     { opacity: 1; }
        }
        @keyframes tl-ringpulse {
          0%,100% { transform: scale(1);   opacity: 0.3; }
          50%     { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes tl-corepulse {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1; }
        }
        @keyframes tl-shimmer {
          0%,100% { opacity: 0.5; transform: scale(0.9); }
          50%     { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#1A1714',
        color: '#F7F4EE',
        fontFamily: "'DM Mono', monospace",
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Grid overlay */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `
            repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(201,168,76,0.025) 59px,rgba(201,168,76,0.025) 60px),
            repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(201,168,76,0.025) 59px,rgba(201,168,76,0.025) 60px)
          `,
        }} />

        {/* ── Header ── */}
        <header style={{
          flexShrink: 0,
          padding: '28px 52px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          position: 'relative', zIndex: 1,
          animation: 'tl-fadeDown 0.7s ease both',
        }}>
          <div>
            <div style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              color: '#C9A84C',
              textTransform: 'uppercase',
              marginBottom: 5,
            }}>
              {timeline.eyebrow}
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 34,
              fontWeight: 300,
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}>
              {timeline.title}
              {timeline.titleEmphasis && (
                <em style={{ fontStyle: 'italic', color: '#E8CC7A' }}> {timeline.titleEmphasis}</em>
              )}
            </div>
          </div>

          {(timeline.dateRange || timeline.metaLabel) && (
            <>
              <div style={{ width: 1, height: 40, background: 'rgba(201,168,76,0.25)' }} />
              <div style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                color: '#7A756C',
                textTransform: 'uppercase',
                lineHeight: 1.9,
              }}>
                {timeline.dateRange && <>{timeline.dateRange}<br /></>}
                {timeline.metaLabel}
              </div>
            </>
          )}

          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(201,168,76,0.3),transparent)' }} />

          <div style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: 'rgba(122,117,108,0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}>
            Drag to scroll
            <span style={{ display: 'flex', gap: 2 }}>
              {[0, 180, 360].map(delay => (
                <i key={delay} style={{
                  display: 'block',
                  width: 5, height: 5,
                  borderRight: '1px solid #C9A84C',
                  borderTop: '1px solid #C9A84C',
                  transform: 'rotate(45deg)',
                  animation: `tl-ap 1.4s ease ${delay}ms infinite`,
                  opacity: 0,
                }} />
              ))}
            </span>
          </div>
        </header>

        {/* ── Scroll track ── */}
        <div
          ref={trackRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onScroll={onScroll}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '0 52px',
            cursor: 'grab',
            userSelect: 'none',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(201,168,76,0.25) transparent',
            display: 'flex',
            alignItems: 'center',
            position: 'relative', zIndex: 1,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0,
            minWidth: 'max-content',
            padding: '16px 0 20px',
            animation: 'tl-fadeUp 0.7s 0.15s ease both',
          }}>
            {phases.map((phase, i) => {
              const isLast = i === phases.length - 1
              const needsConnector = !isLast

              // Connector alignment for checklist/launch blocks has same margin-top as phase
              const connectorStyle = (phase.blockType === 'checklist' || phase.blockType === 'launch')
                ? { marginTop: 61 }
                : {}

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {phase.blockType === 'phase' && <PhaseCard block={phase as PhaseBlock} />}
                  {phase.blockType === 'checklist' && <ChecklistCard block={phase as ChecklistBlock} />}
                  {phase.blockType === 'launch' && <LaunchCard block={phase as LaunchBlock} />}

                  {needsConnector && (
                    <div style={{
                      width: 56, height: 1,
                      background: 'linear-gradient(90deg,rgba(201,168,76,0.45),rgba(201,168,76,0.2))',
                      flexShrink: 0,
                      marginTop: 61,
                      ...connectorStyle,
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', right: 0, top: '50%',
                        transform: 'translateY(-50%) rotate(45deg)',
                        width: 5, height: 5,
                        borderRight: '1px solid rgba(201,168,76,0.5)',
                        borderTop: '1px solid rgba(201,168,76,0.5)',
                        marginRight: 2,
                      }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div style={{
          flexShrink: 0,
          padding: '0 52px 20px',
          position: 'relative', zIndex: 1,
          animation: 'tl-fadeUp 0.7s 0.3s ease both',
        }}>
          <div style={{ height: 2, background: 'rgba(201,168,76,0.08)', position: 'relative' }}>
            <div
              ref={fillRef}
              style={{
                height: '100%',
                width: '0%',
                background: 'linear-gradient(90deg,#7BAE9A,#A88FD4,#D4A06B,#C97A7A,#C9A84C)',
                transition: 'width 0.08s linear',
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 7,
            fontSize: 7.5,
            letterSpacing: '0.2em',
            color: 'rgba(122,117,108,0.4)',
            textTransform: 'uppercase',
          }}>
            {progressLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

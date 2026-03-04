'use client'

import { useEffect, useRef, useState } from 'react'
import type { Timeline } from '@/types/payload-types'

// ── Type aliases ──────────────────────────────────────────────────────────────

type TimelinePhase = NonNullable<Timeline['phases']>[number]
type PhaseBlock = Extract<TimelinePhase, { blockType: 'phase' }>
type ChecklistBlock = Extract<TimelinePhase, { blockType: 'checklist' }>
type LaunchBlock = Extract<TimelinePhase, { blockType: 'launch' }>

// ── Tag color map ─────────────────────────────────────────────────────────────

const TAG_BORDER: Record<string, string> = {
  build:     '#7BAE9A',
  integrate: '#A88FD4',
  touchup:   '#D4A06B',
  prep:      '#C97A7A',
}

// ── Intersection-observer fade hook ──────────────────────────────────────────

function useFadeIn() {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

// ── Phase block ───────────────────────────────────────────────────────────────

function EditorialPhase({
  block,
  index,
}: {
  block: PhaseBlock
  index: number
}) {
  const { ref, visible } = useFadeIn()
  const isDark = index % 2 === 1
  const bg   = isDark ? '#111111' : '#ffffff'
  const fg   = isDark ? '#ffffff' : '#111111'
  const muted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'
  const tagColor = TAG_BORDER[block.tagColor ?? ''] ?? '#999'
  const num = String(index + 1).padStart(2, '0')

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        position:      'relative',
        overflow:      'hidden',
        backgroundColor: bg,
        padding:       '80px 8vw',
        minHeight:     '60vh',
        display:       'flex',
        alignItems:    'center',
        opacity:       visible ? 1 : 0,
        transform:     visible ? 'translateY(0)' : 'translateY(40px)',
        transition:    'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {/* Watermark number */}
      <span style={{
        position:   'absolute',
        left:       '-2vw',
        top:        '50%',
        transform:  'translateY(-50%)',
        fontFamily: "'Unbounded', sans-serif",
        fontWeight: 900,
        fontSize:   'clamp(140px, 28vw, 340px)',
        lineHeight: 1,
        color:      fg,
        opacity:    0.04,
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>
        {num}
      </span>

      {/* Content grid */}
      <div style={{
        position: 'relative',
        zIndex:   1,
        display:  'grid',
        gridTemplateColumns: '120px 1fr',
        gap:      '0 64px',
        width:    '100%',
        maxWidth: '1100px',
        margin:   '0 auto',
        alignItems: 'start',
      }}>
        {/* Left column — vertical number */}
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'flex-start',
          paddingTop:     '6px',
        }}>
          <span style={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 700,
            fontSize:   '11px',
            letterSpacing: '0.2em',
            color:      muted,
            textTransform: 'uppercase',
          }}>
            Phase
          </span>
          <span style={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 900,
            fontSize:   '56px',
            lineHeight: 1,
            color:      fg,
            marginTop:  '4px',
          }}>
            {num}
          </span>
        </div>

        {/* Right column — content */}
        <div>
          {/* Tag pill */}
          {block.tag && (
            <span style={{
              display:        'inline-block',
              fontFamily:     "'Unbounded', sans-serif",
              fontWeight:     300,
              fontSize:       '10px',
              letterSpacing:  '0.25em',
              textTransform:  'uppercase',
              color:          tagColor,
              border:         `1px solid ${tagColor}`,
              padding:        '4px 12px',
              marginBottom:   '20px',
            }}>
              {block.tag}
            </span>
          )}

          {/* Date — right-aligned accent */}
          <div style={{
            fontFamily: 'monospace',
            fontSize:   '11px',
            letterSpacing: '0.1em',
            color:      muted,
            marginBottom: '12px',
          }}>
            {block.dateRange}
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 700,
            fontSize:   'clamp(32px, 5vw, 64px)',
            lineHeight: 1.05,
            color:      fg,
            margin:     '0 0 32px 0',
            letterSpacing: '-0.02em',
          }}>
            {block.title}
          </h2>

          {/* Items */}
          {block.items && block.items.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {block.items.map((item, i) => (
                <li key={item.id ?? i} style={{
                  fontFamily:   "'Lora', serif",
                  fontStyle:    'italic',
                  fontSize:     '17px',
                  lineHeight:   1.75,
                  color:        muted,
                  paddingLeft:  '20px',
                  position:     'relative',
                  marginBottom: '6px',
                }}>
                  <span style={{
                    position:   'absolute',
                    left:       0,
                    top:        '0.55em',
                    width:      '6px',
                    height:     '1px',
                    backgroundColor: tagColor,
                  }} />
                  {item.text}
                </li>
              ))}
            </ul>
          )}

          {/* Dealer pill */}
          {block.dealerPill?.enabled && block.dealerPill.text && (
            <div style={{
              marginTop:    '28px',
              padding:      '14px 20px',
              border:       `1px solid ${tagColor}`,
              fontFamily:   "'Lora', serif",
              fontStyle:    'italic',
              fontSize:     '14px',
              color:        tagColor,
              maxWidth:     '520px',
            }}>
              {block.dealerPill.text}
            </div>
          )}
        </div>
      </div>

      {/* Bottom divider */}
      <div style={{
        position:        'absolute',
        bottom:          0,
        left:            0,
        right:           0,
        height:          '1px',
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      }} />
    </section>
  )
}

// ── Checklist block ───────────────────────────────────────────────────────────

function EditorialChecklist({ block }: { block: ChecklistBlock }) {
  const { ref, visible } = useFadeIn()
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  function toggle(i: number) {
    setChecked(prev => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        backgroundColor: '#ffffff',
        padding:         '80px 8vw',
        opacity:         visible ? 1 : 0,
        transform:       visible ? 'translateY(0)' : 'translateY(40px)',
        transition:      'opacity 0.7s ease, transform 0.7s ease',
        borderBottom:    '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Label */}
        {block.dateLabel && (
          <div style={{
            fontFamily:    "'Unbounded', sans-serif",
            fontWeight:    300,
            fontSize:      '10px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color:         'rgba(0,0,0,0.4)',
            marginBottom:  '16px',
          }}>
            {block.dateLabel}
          </div>
        )}

        {/* Title */}
        <h3 style={{
          fontFamily:    "'Unbounded', sans-serif",
          fontWeight:    700,
          fontSize:      'clamp(24px, 3.5vw, 40px)',
          color:         '#111111',
          margin:        '0 0 36px 0',
          letterSpacing: '-0.02em',
        }}>
          {block.title}
        </h3>

        {/* Items */}
        {block.items && block.items.map((item, i) => (
          <div key={item.id ?? i} style={{ marginBottom: '20px' }}>
            <div
              onClick={() => toggle(i)}
              style={{
                display:    'flex',
                alignItems: 'flex-start',
                gap:        '16px',
                cursor:     'pointer',
              }}
            >
              {/* Checkbox */}
              <div style={{
                flexShrink: 0,
                width:      '22px',
                height:     '22px',
                border:     '2px solid #111111',
                marginTop:  '2px',
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {checked[i] && (
                  <div style={{
                    width:           '10px',
                    height:          '10px',
                    backgroundColor: '#111111',
                  }} />
                )}
              </div>

              {/* Text */}
              <span style={{
                fontFamily:      "'Lora', serif",
                fontSize:        '17px',
                lineHeight:      1.6,
                color:           '#111111',
                textDecoration:  checked[i] ? 'line-through' : 'none',
                opacity:         checked[i] ? 0.4 : 1,
                transition:      'opacity 0.2s',
              }}>
                {item.text}
              </span>
            </div>

            {/* Note */}
            {item.note && (
              <div style={{
                fontFamily:  "'Lora', serif",
                fontStyle:   'italic',
                fontSize:    '13px',
                color:       '#b45309',
                marginTop:   '6px',
                marginLeft:  '38px',
              }}>
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Launch block ──────────────────────────────────────────────────────────────

function EditorialLaunch({ block }: { block: LaunchBlock }) {
  const { ref, visible } = useFadeIn()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        position:        'relative',
        overflow:        'hidden',
        backgroundColor: '#111111',
        minHeight:       '100vh',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '80px 8vw',
        opacity:         visible ? 1 : 0,
        transform:       visible ? 'translateY(0)' : 'translateY(40px)',
        transition:      'opacity 0.9s ease, transform 0.9s ease',
      }}
    >
      {/* Watermark */}
      <span style={{
        position:   'absolute',
        left:       '50%',
        top:        '50%',
        transform:  'translate(-50%, -50%)',
        fontFamily: "'Unbounded', sans-serif",
        fontWeight: 900,
        fontSize:   'clamp(80px, 22vw, 280px)',
        lineHeight: 1,
        color:      '#ffffff',
        opacity:    0.03,
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        letterSpacing: '-0.04em',
      }}>
        {block.label ?? 'LAUNCH'}
      </span>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Label badge */}
        {block.label && (
          <div style={{
            fontFamily:    "'Unbounded', sans-serif",
            fontWeight:    300,
            fontSize:      '11px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.4)',
            marginBottom:  '40px',
          }}>
            {block.label}
          </div>
        )}

        {/* Pulsing dot */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   '32px',
        }}>
          <div style={{
            width:           '12px',
            height:          '12px',
            borderRadius:    '50%',
            backgroundColor: '#ffffff',
            animation:       'editorial-pulse 2s ease-in-out infinite',
          }} />
        </div>

        {/* Title */}
        {(block.title || block.titleEmphasis) && (
          <h2 style={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 700,
            fontSize:   'clamp(36px, 10vw, 120px)',
            lineHeight: 0.95,
            color:      '#ffffff',
            margin:     '0 0 28px 0',
            letterSpacing: '-0.03em',
          }}>
            {block.title}{' '}
            {block.titleEmphasis && (
              <em style={{
                fontFamily: "'Lora', serif",
                fontStyle:  'italic',
                fontWeight: 400,
                color:      'rgba(255,255,255,0.6)',
              }}>
                {block.titleEmphasis}
              </em>
            )}
          </h2>
        )}

        {/* Subtitle */}
        {block.subtitle && (
          <p style={{
            fontFamily: "'Lora', serif",
            fontStyle:  'italic',
            fontSize:   'clamp(16px, 2vw, 22px)',
            color:      'rgba(255,255,255,0.55)',
            margin:     0,
          }}>
            {block.subtitle}
          </p>
        )}
      </div>

      <style>{`
        @keyframes editorial-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.5; }
        }
      `}</style>
    </section>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function EditorialHeader({ timeline }: { timeline: Timeline }) {
  return (
    <section style={{
      backgroundColor: '#111111',
      padding:         '100px 8vw 80px',
      position:        'relative',
      overflow:        'hidden',
    }}>
      {/* Eyebrow */}
      <div style={{
        fontFamily:    "'Unbounded', sans-serif",
        fontWeight:    300,
        fontSize:      '11px',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color:         'rgba(255,255,255,0.4)',
        marginBottom:  '32px',
      }}>
        {timeline.eyebrow}
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily:    "'Unbounded', sans-serif",
        fontWeight:    700,
        fontSize:      'clamp(48px, 9vw, 120px)',
        lineHeight:    0.95,
        color:         '#ffffff',
        margin:        '0 0 16px 0',
        letterSpacing: '-0.03em',
      }}>
        {timeline.title}{' '}
        {timeline.titleEmphasis && (
          <em style={{
            fontFamily: "'Lora', serif",
            fontStyle:  'italic',
            fontWeight: 400,
            color:      'rgba(255,255,255,0.6)',
          }}>
            {timeline.titleEmphasis}
          </em>
        )}
      </h1>

      {/* Thin rule */}
      <div style={{
        width:           '80px',
        height:          '1px',
        backgroundColor: 'rgba(255,255,255,0.25)',
        margin:          '36px 0',
      }} />

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {timeline.dateRange && (
          <div style={{
            fontFamily:    'monospace',
            fontSize:      '12px',
            letterSpacing: '0.1em',
            color:         'rgba(255,255,255,0.4)',
          }}>
            {timeline.dateRange}
          </div>
        )}
        {timeline.metaLabel && (
          <div style={{
            fontFamily: "'Lora', serif",
            fontStyle:  'italic',
            fontSize:   '15px',
            color:      'rgba(255,255,255,0.45)',
          }}>
            {timeline.metaLabel}
          </div>
        )}
      </div>

      {/* Scroll hint */}
      <div style={{
        marginTop:     '60px',
        fontFamily:    "'Unbounded', sans-serif",
        fontWeight:    300,
        fontSize:      '11px',
        letterSpacing: '0.25em',
        color:         'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
      }}>
        Scroll to explore ↓
      </div>
    </section>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

export default function TimelineEditorial({ timeline }: { timeline: Timeline }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;700;900&family=Lora:ital,wght@0,400;1,400;1,500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ fontFamily: "'Unbounded', sans-serif" }}>
        <EditorialHeader timeline={timeline} />

        {(timeline.phases ?? []).map((block, i) => {
          if (block.blockType === 'phase') {
            return <EditorialPhase key={block.id ?? i} block={block} index={i} />
          }
          if (block.blockType === 'checklist') {
            return <EditorialChecklist key={block.id ?? i} block={block} />
          }
          if (block.blockType === 'launch') {
            return <EditorialLaunch key={block.id ?? i} block={block} />
          }
          return null
        })}
      </div>
    </>
  )
}

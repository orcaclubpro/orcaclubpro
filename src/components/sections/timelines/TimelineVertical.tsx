'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { Timeline } from '@/types/payload-types'

type TimelinePhase = NonNullable<Timeline['phases']>[number]
type PhaseBlock = Extract<TimelinePhase, { blockType: 'phase' }>
type ChecklistBlock = Extract<TimelinePhase, { blockType: 'checklist' }>
type LaunchBlock = Extract<TimelinePhase, { blockType: 'launch' }>

const TAG_COLOR: Record<string, string> = {
  build: '#7BAE9A',
  integrate: '#A88FD4',
  touchup: '#D4A06B',
  prep: '#C97A7A',
  checklist: '#6B9FD4',
  launch: '#C9A84C',
}

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes vtl-fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes vtl-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.4); opacity: 0.6; }
  }
  @keyframes vtl-progressFill {
    from { height: 0%; }
    to { height: var(--progress); }
  }
`

interface Props {
  timeline: Timeline
}

export default function TimelineVertical({ timeline }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [scrollProgress, setScrollProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current
      if (!el) return
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0)
    }
    const el = containerRef.current
    if (el) el.addEventListener('scroll', handleScroll, { passive: true })
    return () => { if (el) el.removeEventListener('scroll', handleScroll) }
  }, [])

  const toggleCheck = useCallback((id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const phases = timeline.phases ?? []

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#FAFAF8',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          scrollBehavior: 'smooth',
        }}
      >
        {/* Fixed progress bar */}
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 3,
          height: '100vh',
          background: '#E8E4DC',
          zIndex: 100,
        }}>
          <div style={{
            width: '100%',
            height: `${scrollProgress}%`,
            background: 'linear-gradient(to bottom, #C9A84C, #7BAE9A)',
            transition: 'height 0.1s ease-out',
          }} />
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: '100%',
          paddingLeft: 3,
        }}>
          {/* Left sticky panel */}
          <div style={{
            width: '30%',
            minWidth: 260,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 48px 48px 40px',
            borderRight: '1px solid #E8E4DC',
            background: '#FAFAF8',
            zIndex: 10,
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#7a756c',
              marginBottom: 16,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {timeline.eyebrow}
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 40,
              fontWeight: 700,
              color: '#1a1814',
              lineHeight: 1.15,
              margin: '0 0 4px 0',
            }}>
              {timeline.title}
              {timeline.titleEmphasis && (
                <span style={{
                  display: 'block',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: '#C9A84C',
                }}>
                  {timeline.titleEmphasis}
                </span>
              )}
            </h1>

            {/* Gold rule */}
            <div style={{
              width: 48,
              height: 2,
              background: '#C9A84C',
              margin: '24px 0',
            }} />

            {timeline.dateRange && (
              <div style={{
                fontSize: 13,
                color: '#7a756c',
                fontWeight: 400,
                marginBottom: 4,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                {timeline.dateRange}
              </div>
            )}
            {timeline.metaLabel && (
              <div style={{
                fontSize: 11,
                color: '#b5afa6',
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                {timeline.metaLabel}
              </div>
            )}

            <div style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#b5afa6',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
            }}>
              <span style={{ fontSize: 16 }}>↓</span>
              <span>Scroll to explore</span>
            </div>
          </div>

          {/* Right timeline column */}
          <div style={{
            flex: 1,
            padding: '80px 64px 120px 80px',
            position: 'relative',
          }}>
            {/* Center vertical line */}
            <div style={{
              position: 'absolute',
              left: 40,
              top: 80,
              bottom: 120,
              width: 2,
              background: '#E8E4DC',
              zIndex: 0,
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {phases.map((block, i) => {
                if (block.blockType === 'phase') {
                  return (
                    <PhaseCard
                      key={block.id ?? i}
                      block={block as PhaseBlock}
                      index={i}
                    />
                  )
                }
                if (block.blockType === 'checklist') {
                  return (
                    <ChecklistCard
                      key={block.id ?? i}
                      block={block as ChecklistBlock}
                      index={i}
                      checked={checked}
                      onToggle={toggleCheck}
                    />
                  )
                }
                if (block.blockType === 'launch') {
                  return (
                    <LaunchCard
                      key={block.id ?? i}
                      block={block as LaunchBlock}
                      index={i}
                    />
                  )
                }
                return null
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Phase Card ────────────────────────────────────────────────────────────────

function PhaseCard({ block, index }: { block: PhaseBlock; index: number }) {
  const color = TAG_COLOR[block.tagColor ?? ''] ?? '#7a756c'
  const num = String(index + 1).padStart(2, '0')

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 32,
      marginBottom: 48,
      animation: 'vtl-fadeIn 0.5s ease both',
      animationDelay: `${index * 0.08}s`,
    }}>
      {/* Dot on the line */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
        width: 0,
        display: 'flex',
        justifyContent: 'center',
        marginLeft: -7,
      }}>
        <div style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: color,
          border: '3px solid #FAFAF8',
          boxShadow: `0 0 0 2px ${color}`,
          marginTop: 36,
          zIndex: 1,
        }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, paddingLeft: 24 }}>
        {/* Date above card */}
        <div style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#b5afa6',
          letterSpacing: '0.08em',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          marginBottom: 8,
        }}>
          {block.dateRange}
        </div>

        <div style={{
          background: '#FFFFFF',
          borderLeft: `4px solid ${color}`,
          borderRadius: '0 8px 8px 0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '24px 28px 24px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Faded phase number */}
          <div style={{
            position: 'absolute',
            top: -8,
            right: 16,
            fontSize: 72,
            fontWeight: 700,
            fontFamily: "'Playfair Display', Georgia, serif",
            color: 'rgba(0,0,0,0.04)',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
            {num}
          </div>

          {/* Tag */}
          {block.tag && (
            <div style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: color,
              marginBottom: 8,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {block.tag}
            </div>
          )}

          {/* Title */}
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: '#1a1814',
            margin: '0 0 16px 0',
          }}>
            {block.title}
          </h3>

          {/* Items */}
          {block.items && block.items.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {block.items.map((item, j) => (
                <li key={item.id ?? j} style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  fontSize: 14,
                  color: '#4a4540',
                  marginBottom: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: 400,
                  lineHeight: 1.5,
                }}>
                  <span style={{ color: color, flexShrink: 0, fontSize: 16 }}>•</span>
                  {item.text}
                </li>
              ))}
            </ul>
          )}

          {/* Dealer pill */}
          {block.dealerPill?.enabled && block.dealerPill.text && (
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              background: `${color}14`,
              border: `1px solid ${color}40`,
              borderRadius: 6,
              fontSize: 12,
              color: color,
              fontWeight: 500,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {block.dealerPill.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Checklist Card ────────────────────────────────────────────────────────────

function ChecklistCard({
  block,
  index,
  checked,
  onToggle,
}: {
  block: ChecklistBlock
  index: number
  checked: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  const color = TAG_COLOR.checklist

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 32,
      marginBottom: 48,
      animation: 'vtl-fadeIn 0.5s ease both',
      animationDelay: `${index * 0.08}s`,
    }}>
      {/* Dot */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
        width: 0,
        display: 'flex',
        justifyContent: 'center',
        marginLeft: -7,
      }}>
        <div style={{
          width: 14,
          height: 14,
          borderRadius: 2,
          background: color,
          border: '3px solid #FAFAF8',
          boxShadow: `0 0 0 2px ${color}`,
          marginTop: 36,
          zIndex: 1,
        }} />
      </div>

      <div style={{ flex: 1, paddingLeft: 24 }}>
        {/* Date label */}
        {block.dateLabel && (
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#b5afa6',
            letterSpacing: '0.08em',
            marginBottom: 8,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {block.dateLabel}
          </div>
        )}

        <div style={{
          background: 'rgba(107,159,212,0.05)',
          border: '1px solid rgba(107,159,212,0.2)',
          borderRadius: 8,
          padding: '24px 28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          {/* Tag */}
          {block.tag && (
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: color,
              marginBottom: 8,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {block.tag}
            </div>
          )}

          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20,
            fontWeight: 700,
            color: '#1a1814',
            margin: '0 0 16px 0',
          }}>
            {block.title}
          </h3>

          {block.items && block.items.map((item, j) => {
            const itemId = item.id ?? `${index}-${j}`
            const isChecked = Boolean(checked[itemId])

            return (
              <div key={itemId} style={{ marginBottom: 12 }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  cursor: 'pointer',
                }}>
                  <div
                    onClick={() => onToggle(itemId)}
                    style={{
                      width: 18,
                      height: 18,
                      flexShrink: 0,
                      border: `2px solid ${isChecked ? color : '#C8C3BB'}`,
                      borderRadius: 3,
                      background: isChecked ? color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    {isChecked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: 14,
                    color: isChecked ? '#b5afa6' : '#4a4540',
                    textDecoration: isChecked ? 'line-through' : 'none',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    transition: 'all 0.15s ease',
                  }}>
                    {item.text}
                  </span>
                </label>

                {item.note && (
                  <div style={{
                    marginTop: 4,
                    marginLeft: 30,
                    fontSize: 11,
                    color: '#C9A84C',
                    fontWeight: 500,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span>⚠</span>
                    {item.note}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Launch Card ───────────────────────────────────────────────────────────────

function LaunchCard({ block, index }: { block: LaunchBlock; index: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 32,
      marginBottom: 48,
      animation: 'vtl-fadeIn 0.5s ease both',
      animationDelay: `${index * 0.08}s`,
    }}>
      {/* Pulsing dot */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
        width: 0,
        marginLeft: -10,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#C9A84C',
          border: '3px solid #FAFAF8',
          boxShadow: '0 0 0 2px #C9A84C',
          marginTop: 40,
          zIndex: 1,
          animation: 'vtl-pulse 2s ease-in-out infinite',
        }} />
      </div>

      <div style={{ flex: 1, paddingLeft: 24 }}>
        {block.dateLabel && (
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#b5afa6',
            letterSpacing: '0.08em',
            marginBottom: 8,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {block.dateLabel}
          </div>
        )}

        <div style={{
          background: 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 50%, #C9A84C 100%)',
          borderRadius: 12,
          padding: '40px 48px',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(201,168,76,0.25)',
        }}>
          {block.label && (
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 12,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {block.label}
            </div>
          )}

          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 36,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {block.title}
            {block.titleEmphasis && (
              <em style={{
                fontStyle: 'italic',
                fontWeight: 400,
                display: 'block',
              }}>
                {block.titleEmphasis}
              </em>
            )}
          </h2>

          {block.subtitle && (
            <p style={{
              marginTop: 12,
              fontSize: 14,
              color: 'rgba(255,255,255,0.8)',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 400,
            }}>
              {block.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

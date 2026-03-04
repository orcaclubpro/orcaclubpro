'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type TimelineData = {
  slug?: string
  title?: string
}

export default function TimelinePreviewTab() {
  const { id } = useDocumentInfo()
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchTimeline = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/timelines/${id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTimeline(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimeline()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const previewUrl = timeline?.slug ? `/timelines/${timeline.slug}` : null

  // No id yet — unsaved document
  if (!id) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 120px)',
          background: '#0d0d0d',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
          Save the document first, then refresh to preview.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        background: '#0d0d0d',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: '#0d0d0d',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
          }}
        >
          Live Preview
        </span>

        <button
          onClick={fetchTimeline}
          disabled={loading}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 500,
            color: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Loading...' : 'Refresh Preview'}
        </button>

        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#67e8f9',
              background: 'rgba(103,232,249,0.08)',
              border: '1px solid rgba(103,232,249,0.2)',
              borderRadius: '6px',
              textDecoration: 'none',
              marginLeft: 'auto',
            }}
          >
            Open Full Page ↗
          </a>
        )}
      </div>

      {/* Content area */}
      {error || (!loading && !previewUrl) ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d0d0d',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
            Save the document first, then refresh to preview.
          </p>
        </div>
      ) : loading && !previewUrl ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d0d0d',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 }}>
            Loading preview...
          </p>
        </div>
      ) : (
        <iframe
          key={previewUrl}
          src={previewUrl ?? undefined}
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
          }}
          title="Timeline Preview"
        />
      )}
    </div>
  )
}

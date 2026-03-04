'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TimelinesNavLink() {
  const pathname = usePathname()
  const isActive = pathname?.includes('/timelines-builder')

  return (
    <div style={{ padding: '0 16px', marginTop: 2 }}>
      <Link
        href="/admin/timelines-builder"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 6,
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? '#C9A84C' : 'rgba(247,244,238,0.65)',
          background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
          border: `1px solid ${isActive ? 'rgba(201,168,76,0.25)' : 'transparent'}`,
          transition: 'color 0.15s, background 0.15s, border-color 0.15s',
        }}
      >
        {/* Timeline icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }}
        >
          <circle cx="2" cy="7" r="1.5" stroke="#C9A84C" strokeWidth="1" />
          <circle cx="7" cy="7" r="1.5" stroke="#C9A84C" strokeWidth="1" />
          <circle cx="12" cy="7" r="1.5" stroke="#C9A84C" strokeWidth="1" />
          <line x1="3.5" y1="7" x2="5.5" y2="7" stroke="#C9A84C" strokeWidth="1" />
          <line x1="8.5" y1="7" x2="10.5" y2="7" stroke="#C9A84C" strokeWidth="1" />
        </svg>
        Timelines
      </Link>
    </div>
  )
}

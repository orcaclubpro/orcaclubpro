import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'OrcaClub - Custom Web Development & AI Automation Services'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(103,232,249,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 300,
              color: '#ffffff',
              marginBottom: 40,
              letterSpacing: '0.05em',
              display: 'flex',
            }}
          >
            ORCA<span style={{ fontWeight: 500, color: '#67e8f9' }}>CLUB</span>
          </div>

          {/* Main headline */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: 32,
              maxWidth: '1000px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex' }}>Custom Web Development &</span>
            <span
              style={{
                background: 'linear-gradient(90deg, #67e8f9 0%, #3b82f6 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'flex',
              }}
            >
              AI Automation
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: '#94a3b8',
              marginBottom: 48,
              fontWeight: 300,
              display: 'flex',
            }}
          >
            Tailored Solutions for Modern Businesses • 2-4 Week Delivery
          </div>

          {/* Services */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontSize: 20,
              color: '#67e8f9',
              fontWeight: 400,
            }}
          >
            <span style={{ display: 'flex' }}>React & Next.js</span>
            <span style={{ color: '#475569', display: 'flex' }}>•</span>
            <span style={{ display: 'flex' }}>AI Automation</span>
            <span style={{ color: '#475569', display: 'flex' }}>•</span>
            <span style={{ display: 'flex' }}>SEO Services</span>
            <span style={{ color: '#475569', display: 'flex' }}>•</span>
            <span style={{ display: 'flex' }}>Digital Marketing</span>
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6 0%, #67e8f9 50%, #3b82f6 100%)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}

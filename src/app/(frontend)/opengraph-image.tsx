import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const alt = 'ORCACLUB | Built to Surface'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const logoBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'orcaclubpro.png'))
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Orca logo */}
        <img
          src={logoSrc}
          width={280}
          height={280}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}

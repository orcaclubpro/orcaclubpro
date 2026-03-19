"use client"

import dynamic from 'next/dynamic'

const GlobalSearchPalette = dynamic(
  () => import('@/components/dashboard/GlobalSearchPalette').then(m => ({ default: m.GlobalSearchPalette })),
  { ssr: false }
)

export function GlobalSearchPaletteLoader({ username }: { username: string }) {
  return <GlobalSearchPalette username={username} />
}

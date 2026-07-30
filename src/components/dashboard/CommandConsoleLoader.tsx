"use client"

import dynamic from 'next/dynamic'

// Client-only: the console owns keyboard shortcuts, a portal, and the two heavy
// tool tabs — none of which should touch SSR.
const CommandConsole = dynamic(
  () => import('@/components/dashboard/CommandConsole').then(m => ({ default: m.CommandConsole })),
  { ssr: false }
)

export function CommandConsoleLoader({ username }: { username: string }) {
  return <CommandConsole username={username} />
}

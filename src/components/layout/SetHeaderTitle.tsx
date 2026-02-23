'use client'

import { useEffect } from 'react'
import { useHeaderTitle } from '@/app/(spaces)/HeaderTitleContext'

export function SetHeaderTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { setTitle, setSubtitle } = useHeaderTitle()

  useEffect(() => {
    setTitle(title)
    setSubtitle(subtitle ?? null)
    return () => { setTitle(null); setSubtitle(null) }
  }, [title, subtitle, setTitle, setSubtitle])

  return null
}

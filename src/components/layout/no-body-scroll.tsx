"use client"

import { useEffect } from "react"

/**
 * Prevents the body from scrolling while this component is mounted.
 * Used on full-viewport pages (e.g. /contact) that have their own internal scroll.
 */
export function NoBodyScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return null
}

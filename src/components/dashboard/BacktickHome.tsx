'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Backtick, anywhere in the portal → back to the dashboard home tab.
 *
 * Renders nothing. Backtick is a real character, so the gesture stands down
 * wherever it would be typed — inputs, textareas, selects, contenteditable — and
 * whenever a modifier is held (Ctrl+` and friends belong to the OS and the
 * browser). Everywhere else it's an inert key, so claiming it costs nothing.
 *
 * Same destination as {@link DoubleSpaceHome} — one gesture for the mouse hand,
 * one for the keyboard hand.
 */
export function BacktickHome({ homeHref }: { homeHref: string }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function isTypingTarget(el: HTMLElement | null): boolean {
      if (!el) return false
      if (el.isContentEditable) return true
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      return Boolean(el.closest('[contenteditable="true"], [data-no-space-shortcut]'))
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '`') return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.repeat) return
      if (isTypingTarget(e.target as HTMLElement | null)) return
      // A modal owns the keyboard while it's up.
      if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return
      // Already home — nothing to do.
      if (pathname === homeHref) return

      e.preventDefault()
      router.push(homeHref)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [homeHref, pathname, router])

  return null
}

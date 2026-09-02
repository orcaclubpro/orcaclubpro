'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/** How close together the two presses have to be to count as one gesture. */
const WINDOW_MS = 400

/**
 * Space, twice, anywhere in the portal → back to the dashboard home tab.
 *
 * Renders nothing. The gesture only fires when space would otherwise do nothing
 * useful: not while typing, not while a control that space activates has focus
 * (buttons, links, checkboxes), and not while a dialog is open. Those cases fall
 * through untouched, so space still types, still presses buttons, and still works
 * inside every form in the portal.
 *
 * Qualifying presses call preventDefault, which does trade away space-to-scroll on
 * dashboard routes — otherwise the page would lurch down a screen before navigating.
 */
export function DoubleSpaceHome({ homeHref }: { homeHref: string }) {
  const router = useRouter()
  const pathname = usePathname()
  /** Timestamp of the last qualifying space press, or 0. */
  const lastPress = useRef(0)

  useEffect(() => {
    function isTypingTarget(el: HTMLElement | null): boolean {
      if (!el) return false
      if (el.isContentEditable) return true
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      // Space is the activation key for these — never steal it from them.
      return Boolean(
        el.closest(
          'button, a, [role="button"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="tab"], [contenteditable="true"], [data-no-space-shortcut]',
        ),
      )
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== ' ' && e.key !== 'Spacebar') return
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (e.repeat) return
      if (isTypingTarget(e.target as HTMLElement | null)) return
      // A modal owns the keyboard while it's up.
      if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return
      // Already home — let space behave normally rather than re-navigate.
      if (pathname === homeHref) return

      e.preventDefault()

      const now = Date.now()
      if (now - lastPress.current <= WINDOW_MS) {
        lastPress.current = 0
        router.push(homeHref)
      } else {
        lastPress.current = now
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [homeHref, pathname, router])

  return null
}

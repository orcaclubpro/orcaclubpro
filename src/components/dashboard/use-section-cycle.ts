'use client'

import { useEffect, useRef } from 'react'

// ─── Tab-key section cycling ──────────────────────────────────────────────────
// Tab walks the ledger's sections; Shift+Tab walks them backwards. Both wrap.
//
// This deliberately takes Tab away from the browser's focus-order duty on the
// page that opts in, so it is guarded rather than absolute. It stands down when
// taking the key would break something the user is in the middle of:
//
//   • a text field, textarea, select or contenteditable has focus — Tab there
//     is either typing or moving between fields
//   • a dialog is open anywhere in the document — every modal in the portal is
//     a Radix `Dialog` (portalled, `role="dialog"`) or hand-rolled with the
//     same attributes, so one query catches all of them
//   • a modifier is held, or an IME composition is running
//   • focus sits inside a subtree marked `data-tab-cycle="off"` — the escape
//     hatch for any future region that needs ordinary Tab behaviour
//
// After cycling, focus lands on the nav entry that just opened, so the ring
// tracks the change and screen readers announce it. `preventScroll` keeps that
// from yanking the page — the nav is sticky and already on screen.

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function takesTabItself(node: EventTarget | null): boolean {
  if (!(node instanceof HTMLElement)) return false
  if (TYPING_TAGS.has(node.tagName)) return true
  if (node.isContentEditable) return true
  return Boolean(node.closest('[contenteditable="true"],[data-tab-cycle="off"]'))
}

export function useSectionCycle<T extends string>(
  sections: readonly T[],
  value: T,
  onChange: (id: T) => void,
  navRef: React.RefObject<HTMLElement | null>,
) {
  // Set when a cycle fires, read by the effect below once React has committed
  // the new active entry — the button to focus does not exist until then.
  const pendingFocus = useRef(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return
      if (e.isComposing) return
      if (takesTabItself(e.target) || takesTabItself(document.activeElement)) return
      if (document.querySelector('[role="dialog"],[aria-modal="true"]')) return

      const i = sections.indexOf(value)
      if (i === -1) return

      e.preventDefault()
      const last = sections.length - 1
      const next = e.shiftKey ? (i === 0 ? last : i - 1) : (i === last ? 0 : i + 1)
      pendingFocus.current = true
      onChange(sections[next])
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sections, value, onChange])

  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.focus({ preventScroll: true })
  }, [value, navRef])
}

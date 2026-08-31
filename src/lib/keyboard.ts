// src/lib/keyboard.ts
/**
 * Is this event's target something the user is typing into, or otherwise driving with
 * the keyboard?
 *
 * Every global single-key shortcut has to ask before it fires, or it steals the
 * keystroke from whatever the user is actually doing. Five handlers grew their own
 * copy of this check and all five tested only INPUT/TEXTAREA — so a focused `<select>`,
 * which has native first-letter type-ahead, let "l" through to the console launcher
 * instead of jumping to the option that starts with L.
 *
 * One place, so the next shortcut inherits the whole list rather than the first two
 * cases someone remembered.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false

  const tag = el.tagName
  // SELECT belongs here: letters are type-ahead, arrows change the value.
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true

  // ARIA widgets that own the keyboard. Headless combobox/listbox implementations
  // render a plain button as the trigger, so the tag name says nothing useful.
  const role = el.getAttribute?.('role')
  if (role === 'textbox' || role === 'searchbox' || role === 'combobox' || role === 'listbox' || role === 'spinbutton') {
    return true
  }

  // An open popover listbox (Radix Select and friends) is driving the keyboard even
  // while focus still reads as the trigger. Nothing in this app renders a listbox
  // outside of one, so its presence is a reliable "a menu is capturing keys" signal.
  if (typeof document !== 'undefined' && document.querySelector('[role="listbox"]')) return true

  return false
}

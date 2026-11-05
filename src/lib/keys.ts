/**
 * Whether a keydown should trigger a single-key app shortcut (f, m, c, /, Escape). Not while the user is typing, not
 * for browser/OS combos (Ctrl+C, Ctrl+F, Cmd+M…), and not for auto-repeat from a held key.
 */
export function isShortcut(
  e: Pick<KeyboardEvent, 'target' | 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>,
): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return false
  const t = e.target as { tagName?: string; isContentEditable?: boolean } | null
  if (!t) return true
  return !(t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName ?? ''))
}

import { describe, expect, it } from 'vitest'
import { isShortcut } from './keys'

const key = (over: Partial<Parameters<typeof isShortcut>[0]> = {}) => ({
  target: { tagName: 'BODY' } as unknown as EventTarget,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  ...over,
})

describe('isShortcut', () => {
  it('accepts a plain key pressed on the page', () => {
    expect(isShortcut(key())).toBe(true)
  })

  it('ignores typing in form fields and editable content', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT'])
      expect(isShortcut(key({ target: { tagName } as unknown as EventTarget }))).toBe(false)
    const editable = { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget
    expect(isShortcut(key({ target: editable }))).toBe(false)
  })

  it('leaves browser combos alone (Ctrl+C must not check a marker off)', () => {
    expect(isShortcut(key({ ctrlKey: true }))).toBe(false)
    expect(isShortcut(key({ metaKey: true }))).toBe(false)
    expect(isShortcut(key({ altKey: true }))).toBe(false)
  })

  it('ignores auto-repeat from a held key', () => {
    expect(isShortcut(key({ repeat: true }))).toBe(false)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY, useProgress } from './progress'

beforeEach(() => {
  localStorage.clear()
  useProgress.getState().reset()
})

describe('progress store', () => {
  it('toggles and persists to localStorage', () => {
    expect(useProgress.getState().toggle('a')).toBe(true)
    expect('a' in useProgress.getState().completed).toBe(true)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect('a' in saved.state.completed).toBe(true)
    expect(useProgress.getState().toggle('a')).toBe(false)
  })
  it('merge keeps existing timestamps; replace overwrites', () => {
    useProgress.getState().setCompleted('a', true)
    const t = useProgress.getState().completed.a
    useProgress.getState().mergeIn({ completed: { a: 1, b: 2 }, notes: {} })
    expect(useProgress.getState().completed).toEqual({ a: t, b: 2 })
    useProgress.getState().replaceAll({ completed: { c: 3 }, notes: {} })
    expect(useProgress.getState().completed).toEqual({ c: 3 })
  })
  it('drops empty notes and tracks changes since export', () => {
    useProgress.getState().setNote('a', 'hi')
    useProgress.getState().setNote('a', '  ')
    expect(useProgress.getState().notes).toEqual({})
    expect(useProgress.getState().changesSinceExport).toBe(2)
    useProgress.getState().markExported()
    expect(useProgress.getState().changesSinceExport).toBe(0)
  })
})

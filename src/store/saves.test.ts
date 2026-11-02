import { beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from './progress'
import { initialSaves, MAX_SAVES, useSaves } from './saves'

const done = () => Object.keys(useProgress.getState().completed).sort()

beforeEach(() => {
  localStorage.clear()
  useProgress.getState().reset()
  useSaves.setState(initialSaves())
})

describe('saves', () => {
  it('starts with one active save that adopts the existing progress', () => {
    useProgress.getState().setCompleted('a', true)
    const { activeId, order } = useSaves.getState()
    expect(order).toEqual([activeId])
    expect(done()).toEqual(['a'])
  })

  it('keeps each save’s progress separate when switching', () => {
    const regular = useSaves.getState().activeId
    useProgress.getState().setCompleted('a', true)
    const master = useSaves.getState().create('Master Mode')!
    expect(useSaves.getState().activeId).toBe(master)
    expect(done()).toEqual([]) // new saves start empty
    useProgress.getState().setCompleted('b', true)

    useSaves.getState().switchTo(regular)
    expect(done()).toEqual(['a'])
    useSaves.getState().switchTo(master)
    expect(done()).toEqual(['b'])
  })

  it('can start a save from existing progress (e.g. an import)', () => {
    useSaves.getState().create('Imported', { completed: { x: 1 }, notes: { x: 'hi' } })
    expect(done()).toEqual(['x'])
    expect(useProgress.getState().notes).toEqual({ x: 'hi' })
  })

  it('does not keep a stale copy of the active save', () => {
    const { activeId } = useSaves.getState()
    expect(useSaves.getState().slots[activeId]!.data).toBeNull()
    const other = useSaves.getState().create('Other')!
    expect(useSaves.getState().slots[other]!.data).toBeNull()
    expect(useSaves.getState().slots[activeId]!.data).not.toBeNull()
  })

  it('gives saves unique names and trims them', () => {
    useSaves.getState().create('  Master   Mode ')
    useSaves.getState().create('master mode')
    const names = useSaves.getState().order.map((id) => useSaves.getState().slots[id]!.name)
    expect(names).toEqual(['My game', 'Master Mode', 'master mode (2)'])
  })

  it('renames, ignoring the save’s own current name when checking for clashes', () => {
    const { activeId } = useSaves.getState()
    useSaves.getState().rename(activeId, 'My game')
    expect(useSaves.getState().slots[activeId]!.name).toBe('My game')
    useSaves.getState().rename(activeId, 'Regular')
    expect(useSaves.getState().slots[activeId]!.name).toBe('Regular')
  })

  it('duplicates a save without switching to the copy', () => {
    const { activeId } = useSaves.getState()
    useProgress.getState().setCompleted('a', true)
    const copy = useSaves.getState().duplicate(activeId)!
    expect(useSaves.getState().activeId).toBe(activeId)
    expect(useSaves.getState().order).toEqual([activeId, copy])
    useSaves.getState().switchTo(copy)
    expect(done()).toEqual(['a'])
  })

  it('deleting the active save switches to a neighbour; the last save cannot be deleted', () => {
    const first = useSaves.getState().activeId
    useProgress.getState().setCompleted('a', true)
    const second = useSaves.getState().create('Second')!
    useProgress.getState().setCompleted('b', true)

    expect(useSaves.getState().remove(second)).toBe(true)
    expect(useSaves.getState().activeId).toBe(first)
    expect(done()).toEqual(['a'])
    expect(useSaves.getState().remove(first)).toBe(false)
    expect(useSaves.getState().order).toEqual([first])
  })

  it('stops at the save limit', () => {
    while (useSaves.getState().order.length < MAX_SAVES)
      expect(useSaves.getState().create('x')).not.toBeNull()
    const active = useSaves.getState().activeId
    expect(useSaves.getState().create('one too many')).toBeNull()
    expect(useSaves.getState().duplicate(active)).toBeNull()
    expect(useSaves.getState().order).toHaveLength(MAX_SAVES)
    expect(useSaves.getState().activeId).toBe(active)
    // freeing a slot allows another
    useSaves.getState().remove(useSaves.getState().order[1]!)
    expect(useSaves.getState().create('fits now')).not.toBeNull()
  })

  it('persists the registry to localStorage', () => {
    useSaves.getState().create('Master Mode')
    const saved = JSON.parse(localStorage.getItem('hyrule-tracker:saves:v1')!)
    expect(saved.state.order).toHaveLength(2)
  })
})

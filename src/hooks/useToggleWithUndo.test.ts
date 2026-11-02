import { beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from '../store/progress'
import { useUi } from '../store/ui'
import { toggleWithUndo } from './useToggleWithUndo'

beforeEach(() => {
  localStorage.clear()
  useProgress.getState().reset()
  useUi.setState({ hideCompleted: false, selectedId: 'a', focusId: 'a' })
})

describe('toggleWithUndo', () => {
  it('dismisses the dialog when the item is checked off', () => {
    toggleWithUndo('a')
    expect(useProgress.getState().completed).toHaveProperty('a')
    expect(useUi.getState().selectedId).toBeNull()
  })

  it('dismisses it whether or not completed items are being hidden', () => {
    useUi.setState({ hideCompleted: true })
    toggleWithUndo('a')
    expect(useUi.getState().selectedId).toBeNull()
  })

  it('keeps the dialog open when un-checking, so a mistake can be corrected in place', () => {
    useProgress.getState().setCompleted('a', true)
    toggleWithUndo('a')
    expect(useProgress.getState().completed).not.toHaveProperty('a')
    expect(useUi.getState().selectedId).toBe('a')
  })

  it("leaves a different marker's dialog alone", () => {
    toggleWithUndo('b')
    expect(useUi.getState().selectedId).toBe('a')
  })
})

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
  it('keeps the dialog open after completing when completed items are shown', () => {
    toggleWithUndo('a')
    expect(useUi.getState().selectedId).toBe('a')
  })

  it('closes the dialog as soon as the item is completed when "Hide completed" is on', () => {
    useUi.setState({ hideCompleted: true })
    toggleWithUndo('a')
    expect(useUi.getState().selectedId).toBeNull()
  })

  it('does not close the dialog when un-completing', () => {
    useUi.setState({ hideCompleted: true })
    useProgress.getState().setCompleted('a', true)
    toggleWithUndo('a')
    expect(useUi.getState().selectedId).toBe('a')
  })
})

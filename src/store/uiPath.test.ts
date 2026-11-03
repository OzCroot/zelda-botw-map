import { beforeEach, describe, expect, it } from 'vitest'
import { useUi } from './ui'

beforeEach(() => useUi.setState({ pathId: null, selectedId: null, focusId: null, pathFit: 0 }))

describe('route display', () => {
  it('is off until asked for', () => {
    expect(useUi.getState().pathId).toBeNull()
  })

  it('showPath draws the route, highlights the marker, closes its dialog and asks the map to frame it', () => {
    useUi.setState({ selectedId: 'korok-seed:Seed474' })
    useUi.getState().showPath('korok-seed:Seed474')
    expect(useUi.getState()).toMatchObject({
      pathId: 'korok-seed:Seed474',
      focusId: 'korok-seed:Seed474',
      selectedId: null,
      pathFit: 1,
    })
  })

  it('hidePath removes it and leaves everything else alone', () => {
    useUi.getState().showPath('korok-seed:Seed474')
    useUi.getState().hidePath()
    expect(useUi.getState()).toMatchObject({ pathId: null, focusId: 'korok-seed:Seed474' })
  })
})

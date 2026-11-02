import { describe, expect, it } from 'vitest'
import { areaVisibleAt, landmarkVisibleAt } from './labelVisibility'

describe('label visibility', () => {
  it('shows landmarks from their own level, defaulting to 4', () => {
    expect(landmarkVisibleAt({ minZoom: 5 }, 4.5)).toBe(false)
    expect(landmarkVisibleAt({ minZoom: 5 }, 5)).toBe(true)
    expect(landmarkVisibleAt({}, 3.5)).toBe(false)
    expect(landmarkVisibleAt({}, 4)).toBe(true)
  })
  it('shows region names from the most zoomed-out view through zoom 1', () => {
    const l = { minZoom: -1, maxZoom: 1 }
    expect([-1, 0, 1.5, 2].map((z) => areaVisibleAt(l, z))).toEqual([true, true, true, false])
  })
  it('shows area names for zoom 2 to 3 inclusive, then hands over to landmarks', () => {
    const l = { minZoom: 2, maxZoom: 3 }
    expect([1.5, 2, 3, 3.5, 4].map((z) => areaVisibleAt(l, z))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ])
  })
})

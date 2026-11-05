import { beforeEach, describe, expect, it } from 'vitest'
import { track } from './analytics'

beforeEach(() => {
  delete (window as { dataLayer?: unknown }).dataLayer
})

describe('track', () => {
  it('does nothing until GTM has set up the data layer', () => {
    expect(() => track('marker_completed', { category: 'shrine' })).not.toThrow()
    expect(window.dataLayer).toBeUndefined()
  })

  it('pushes the event with its params once the data layer exists', () => {
    window.dataLayer = []
    track('marker_completed', { category: 'shrine' })
    expect(window.dataLayer).toEqual([{ event: 'marker_completed', category: 'shrine' }])
  })
})

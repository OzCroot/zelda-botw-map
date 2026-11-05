import { describe, expect, it } from 'vitest'
import { isMasterMode, seedNumber } from './markers'

describe('isMasterMode', () => {
  it('is true only for markers tagged Master Mode', () => {
    expect(isMasterMode({ tags: ['DLC', 'Master Mode'] })).toBe(true)
    expect(isMasterMode({ tags: ['DLC'] })).toBe(false)
    expect(isMasterMode({})).toBe(false)
  })
})

describe('seedNumber', () => {
  it('reads the seed number from a Korok seed id', () => {
    expect(seedNumber('korok-seed:Seed474')).toBe('474')
    expect(seedNumber('korok-seed:Seed031')).toBe('031')
  })

  it('is undefined for anything else', () => {
    expect(seedNumber('shrine:Oman Au')).toBeUndefined()
  })
})

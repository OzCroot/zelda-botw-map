import { describe, expect, it } from 'vitest'
import { seedPaths, toMap } from './seedPaths.mjs'

const groups = [
  {
    layers: [
      {
        markers: [
          {
            id: 'Seed474',
            coords: [
              [820, 8278],
              [830, 8303],
              [873, 8307],
            ],
          },
          { id: 'Seed001', coords: [[100, 200]] },
          { id: 'Seed002' },
        ],
      },
    ],
  },
]

describe('seedPaths', () => {
  it('keeps seeds with several points, as map coordinates in order', () => {
    expect(seedPaths(groups)).toEqual(
      new Map([
        [
          'korok-seed:Seed474',
          [
            [20278, 9180],
            [20303, 9170],
            [20307, 9127],
          ],
        ],
      ]),
    )
  })
  it('converts source [lat, lng] to map [x, y]', () => {
    expect(toMap([0, 0])).toEqual([12000, 10000])
  })
})

import { describe, expect, it } from 'vitest'
import { CLOTHING_SET_ORDER, clothingSetOf, OTHER_SET } from './clothingSets'
import { facetKey } from './facets'

describe('clothingSetOf', () => {
  it('groups the pieces of a set together', () => {
    expect(
      ["Tingle's Hood (DLC)", "Tingle's Tights (DLC)", "Tingle's Shirt (DLC)"].map(clothingSetOf),
    ).toEqual(['Tingle', 'Tingle', 'Tingle'])
    expect(['Royal Guard Cap (DLC)', 'Royal Guard Boots (DLC)'].map(clothingSetOf)).toEqual([
      'Royal Guard',
      'Royal Guard',
    ])
    expect(['Salvager Headwear', 'Salvager Vest', 'Salvager Trousers'].map(clothingSetOf)).toEqual([
      'Salvager',
      'Salvager',
      'Salvager',
    ])
    expect(
      ['Cap of the Wild', 'Tunic of the Wild', 'Trousers of the Wild'].map(clothingSetOf),
    ).toEqual(['Of the Wild', 'Of the Wild', 'Of the Wild'])
  })

  it('keeps Phantom Ganon apart from Phantom', () => {
    expect(clothingSetOf('Phantom Armor (DLC)')).toBe('Phantom')
    expect(clothingSetOf('Phantom Ganon Armor (DLC)')).toBe('Phantom Ganon')
    expect(clothingSetOf('Phantom Ganon Skull (DLC)')).toBe('Phantom Ganon')
  })

  it('puts single items under Other', () => {
    for (const n of [
      'Zora Helm',
      "Majora's Mask (DLC)",
      'Old Shirt',
      'Hylian Trousers',
      'Thunder Helm',
    ])
      expect(clothingSetOf(n)).toBe(OTHER_SET)
  })

  it('lists Other last', () => {
    expect(CLOTHING_SET_ORDER.at(-1)).toBe(OTHER_SET)
  })
})

describe('facetKey', () => {
  it('uses the set for clothing and the region for everything else', () => {
    expect(facetKey({ category: 'clothing', region: 'faron', set: 'Tingle' })).toBe('Tingle')
    expect(facetKey({ category: 'clothing', region: 'faron' })).toBe(OTHER_SET)
    expect(facetKey({ category: 'shrine', region: 'faron' })).toBe('faron')
  })
})

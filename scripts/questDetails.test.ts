import { describe, expect, it } from 'vitest'
import { questDetails, wikiUrl } from './questDetails.mjs'

const KOKO_CUISINE = {
  requirements: {
    text: 'Cooking with Koko\n, Raw meat',
    links: [{ name: 'Cooking with Koko', page: 'Cooking with Koko' }],
  },
  questgiver: {
    text: 'Koko, Kakariko Village',
    links: [
      { name: 'Koko', page: 'Koko' },
      { name: 'Kakariko Village', page: 'Kakariko Village (Breath of the Wild)' },
    ],
  },
  specialNotes: {
    text: "Part of the following Side Quest chain:\nKoko's Kitchen\nKoko Cuisine",
    links: [
      { name: "Koko's Kitchen", page: "Koko's Kitchen" },
      { name: 'Koko Cuisine', page: 'Koko Cuisine' },
    ],
  },
}

describe('questDetails', () => {
  it('turns a Map page into rows in display order, with wiki links', () => {
    expect(questDetails(KOKO_CUISINE)).toEqual([
      {
        label: 'Quest giver',
        value: 'Koko, Kakariko Village',
        links: [
          { name: 'Koko', url: 'https://www.zeldadungeon.net/wiki/Koko' },
          {
            name: 'Kakariko Village',
            url: 'https://www.zeldadungeon.net/wiki/Kakariko_Village_(Breath_of_the_Wild)',
          },
        ],
      },
      {
        label: 'Requirements',
        value: 'Cooking with Koko, Raw meat',
        links: [
          { name: 'Cooking with Koko', url: 'https://www.zeldadungeon.net/wiki/Cooking_with_Koko' },
        ],
      },
      {
        label: 'Notes',
        value: "Part of the following Side Quest chain: Koko's Kitchen, Koko Cuisine",
        links: [
          { name: "Koko's Kitchen", url: "https://www.zeldadungeon.net/wiki/Koko's_Kitchen" },
          { name: 'Koko Cuisine', url: 'https://www.zeldadungeon.net/wiki/Koko_Cuisine' },
        ],
      },
    ])
  })

  it('drops "None", empty fields and missing pages', () => {
    expect(
      questDetails({
        requirements: { text: 'None', links: [] },
        specialNotes: { text: '', links: [] },
      }),
    ).toEqual([])
    expect(questDetails({ missing: true })).toEqual([])
    expect(questDetails(undefined)).toEqual([])
  })

  it('only keeps links whose text is in the value', () => {
    const rows = questDetails({
      questgiver: { text: 'Koko', links: [{ name: 'Elsewhere', page: 'Elsewhere' }] },
    })
    expect(rows).toEqual([{ label: 'Quest giver', value: 'Koko' }])
  })
})

describe('questDetails intro and objectives', () => {
  it('joins intro paragraphs as sentences and keeps objectives and needed items', () => {
    const rows = questDetails({
      intro: {
        text: 'Given by the Old Man after completing The Isolated Plateau.\nFind the Great Plateau Tower.',
        links: [],
      },
      objective: { text: "Find Misko's treasure", links: [] },
      neededItems: { text: 'Bomb\n, Fire Arrow', links: [] },
    })
    expect(rows).toEqual([
      {
        label: 'About',
        value:
          'Given by the Old Man after completing The Isolated Plateau. Find the Great Plateau Tower.',
      },
      { label: 'Items needed', value: 'Bomb, Fire Arrow' },
      { label: 'Objective', value: "Find Misko's treasure" },
    ])
  })
})

describe('questDetails with unbolded labels', () => {
  it('pulls "Questgiver:" and "Items needed:" lines out of Requirements', () => {
    const rows = questDetails({
      requirements: {
        text: 'Divine Beast Vah Naboris main quest completed\nBegin The Thunder Helm Side Quest\nQuestgiver: Liana, Gerudo Town\nItems needed: 1 Hearty Durian',
        links: [
          { name: 'The Thunder Helm', page: 'The Thunder Helm' },
          { name: 'Liana', page: 'Liana' },
          { name: 'Gerudo Town', page: 'Gerudo Town' },
        ],
      },
    })
    expect(rows).toEqual([
      {
        label: 'Quest giver',
        value: 'Liana, Gerudo Town',
        links: [
          { name: 'Liana', url: 'https://www.zeldadungeon.net/wiki/Liana' },
          { name: 'Gerudo Town', url: 'https://www.zeldadungeon.net/wiki/Gerudo_Town' },
        ],
      },
      {
        label: 'Requirements',
        value: 'Divine Beast Vah Naboris main quest completed, Begin The Thunder Helm Side Quest',
        links: [
          { name: 'The Thunder Helm', url: 'https://www.zeldadungeon.net/wiki/The_Thunder_Helm' },
        ],
      },
      { label: 'Items needed', value: '1 Hearty Durian' },
    ])
  })
})

describe('questDetails reward sentence', () => {
  it('turns "Rewards you with an Armoranth." on the quest giver into a Reward row', () => {
    const rows = questDetails({
      questgiver: {
        text: "Tumbo, Zora's Domain\nRewards you with an Armoranth.",
        links: [
          { name: 'Tumbo', page: 'Tumbo' },
          { name: "Zora's Domain", page: "Zora's Domain (Breath of the Wild)" },
          { name: 'Armoranth', page: 'Armoranth' },
        ],
      },
    })
    expect(rows).toEqual([
      {
        label: 'Quest giver',
        value: "Tumbo, Zora's Domain",
        links: [
          { name: 'Tumbo', url: 'https://www.zeldadungeon.net/wiki/Tumbo' },
          {
            name: "Zora's Domain",
            url: "https://www.zeldadungeon.net/wiki/Zora's_Domain_(Breath_of_the_Wild)",
          },
        ],
      },
      {
        label: 'Reward',
        value: 'Armoranth',
        links: [{ name: 'Armoranth', url: 'https://www.zeldadungeon.net/wiki/Armoranth' }],
      },
    ])
  })
})

describe('wikiUrl', () => {
  it('uses underscores and encodes what needs it', () => {
    expect(wikiUrl('Stalhorse: Pictured!')).toBe(
      'https://www.zeldadungeon.net/wiki/Stalhorse%3A_Pictured!',
    )
  })
})

import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs helper without types
import { applyManual, shrineDetails, splitItems } from './shrineDetails.mjs'

const link = (name: string) => ({ name, page: name })

describe('shrineDetails', () => {
  it('maps a base-game shrine, putting the treasure first', () => {
    expect(
      shrineDetails({
        blessing: "Dila Maag's Blessing",
        requirements: { text: 'Complete the maze.', links: [] },
        treasure: { text: 'Barbarian Armor', links: [link('Barbarian Armor')] },
        shrineQuest: { text: 'The Desert Labyrinth', links: [link('The Desert Labyrinth')] },
        html: '',
      }),
    ).toEqual({
      blessing: "Dila Maag's Blessing",
      details: [
        { label: 'Treasure', value: 'Barbarian Armor' },
        { label: 'Requirements', value: 'Complete the maze.' },
        { label: 'Shrine quest', value: 'The Desert Labyrinth' },
      ],
    })
  })

  it('drops fields that are empty or just say None', () => {
    expect(
      shrineDetails({
        blessing: 'Path of Light',
        requirements: { text: 'None', links: [] },
        recommendations: { text: '', links: [] },
        enemies: { text: 'Guardian Scout I', links: [] },
      }),
    ).toEqual({
      blessing: 'Path of Light',
      details: [{ label: 'Enemies', value: 'Guardian Scout I' }],
    })
  })

  it('joins a multi-line treasure into one readable line', () => {
    const r = shrineDetails({
      treasure: { text: "Opal,\na Shield of the Mind's Eye\nand an Eightfold Blade", links: [] },
    })
    expect(r.details).toEqual([
      { label: 'Treasure', value: "Opal, a Shield of the Mind's Eye and an Eightfold Blade" },
    ])
  })

  it('recovers lines the wiki bolded whole ("<b>Requirements: Gyro</b>")', () => {
    expect(
      shrineDetails({
        blessing: 'Katosa Aug Apparatus',
        'requirements:Gyro': { text: '', links: [] },
        html: '<p><i>Katosa Aug Apparatus</i><br /><br />\n<b>Requirements: Gyro</b> \n</p>',
      }).details,
    ).toEqual([{ label: 'Requirements', value: 'Gyro' }])

    // "None" inside the bold is still "None": dropped.
    expect(
      shrineDetails({
        requirements: {
          text: 'Complete the four additional Shrines on the Great Plateau',
          links: [],
        },
        'enemies:None': { text: '', links: [] },
        html: '<p><b>Requirements:</b> Complete the four additional Shrines on the Great Plateau<br />\n<b>Enemies: None</b>\n</p>',
      }).details,
    ).toEqual([
      { label: 'Requirements', value: 'Complete the four additional Shrines on the Great Plateau' },
    ])

    // Value with a <br /> inside the bold, and sentences containing quotes.
    expect(
      shrineDetails({
        'requirements:memorizeTheAncientOrb': { text: '', links: [] },
        html: '<p><i>Twin Memories</i><br /><br />\n<b>Requirements:Memorize the ancient orb locations. Shee Vaneer\'s orb locations are the "key" for Shee Vaneth.<br /></b>\n<b>Recommendations:</b> Cold Resistance Level 1\n</p>',
      }).details,
    ).toEqual([
      {
        label: 'Requirements',
        value:
          'Memorize the ancient orb locations. Shee Vaneer\'s orb locations are the "key" for Shee Vaneth.',
      },
    ])
  })

  it('returns null for a shrine with no summary', () => {
    expect(shrineDetails({ missing: true, html: '<div></div>' })).toBeNull()
    expect(shrineDetails(undefined)).toBeNull()
  })
})

describe('applyManual', () => {
  it('sets a description and adds hand-written rows to a shrine the wiki skipped', () => {
    const m = applyManual(
      { name: 'Shrine of Resurrection' },
      {
        description: 'The starting location.',
        details: [
          { label: "The Champions' Ballad (DLC)", value: 'Return here after the Divine Beasts.' },
        ],
      },
    )
    expect(m).toEqual({
      name: 'Shrine of Resurrection',
      description: 'The starting location.',
      details: [
        { label: "The Champions' Ballad (DLC)", value: 'Return here after the Divine Beasts.' },
      ],
    })
  })

  it('lets a manual row replace a scraped row with the same label, and keeps the rest', () => {
    const m = applyManual(
      {
        details: [
          { label: 'Treasure', value: 'old' },
          { label: 'Requirements', value: 'Gyro' },
        ],
      },
      { details: [{ label: 'Treasure', value: 'new' }] },
    )
    expect(m.details).toEqual([
      { label: 'Requirements', value: 'Gyro' },
      { label: 'Treasure', value: 'new' },
    ])
  })

  it('leaves a marker alone when there is no manual entry', () => {
    expect(applyManual({ name: 'x' }, undefined)).toEqual({ name: 'x' })
  })
})

describe('splitItems', () => {
  it('splits a treasure line into its items', () => {
    expect(splitItems('Barbarian Armor')).toEqual(['Barbarian Armor'])
    expect(splitItems("Opal, a Shield of the Mind's Eye and an Eightfold Blade")).toEqual([
      'Opal',
      "Shield of the Mind's Eye",
      'Eightfold Blade',
    ])
    expect(splitItems('50 Rupees')).toEqual(['50 Rupees'])
  })
})

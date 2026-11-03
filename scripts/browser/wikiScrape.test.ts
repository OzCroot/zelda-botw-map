import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

// The browser script has to be one self-contained paste, so rather than importing the helpers we pull their source
// out of the template (between the <helpers> markers) and run them against jsdom's DOM.
const script = readFileSync('scripts/browser/wiki-scrape.template.js', 'utf8')
const source = script.match(/\/\/ <helpers>([\s\S]*?)\/\/ <\/helpers>/)![1]!
const { window } = new JSDOM('')
const helpers = new Function(
  'DOMParser',
  `${source}; return { parseSummary, cleanTitle, candidates, readDescriptions }`,
)(window.DOMParser) as {
  parseSummary: (html: string, withIntro?: boolean) => Record<string, unknown> | null
  cleanTitle: (name: string) => string
  candidates: (name: string) => string[]
  readDescriptions: (json: unknown, titles: string[]) => Record<string, unknown>
}
const { parseSummary, cleanTitle, candidates, readDescriptions } = helpers

// Real responses from the wiki API (the part inside parse.text["*"], minus the trailing parser comments).
const TAHNO_OAH =
  '<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><p><i>Tahno O\'ah\'s Blessing</i><br /><br />\n<b>Requirements:</b> None<br />\n<b>Recommendations:</b> Cold Resistance Level 2<br />\n<b>Shrine Quest:</b> <span class="internal-link" data-target="Secret of the Cedars">Secret of the Cedars</span><br />\n<b>Treasure:</b> <a href="/wiki/Climbing_Boots" title="Climbing Boots">Climbing Boots</a>\n</p>\n<!-- NewPP limit report -->\n</div>'
const KEIVE_TALA =
  '<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><p><b>Requirements:</b> Complete the four additional Shrines on the Great Plateau<br />\n<b>Enemies:</b>\n</p>\n<!-- NewPP limit report -->\n</div>'

describe('shrine summary parser', () => {
  it('reads a base-game shrine: blessing, requirements, recommendations, quest and treasure', () => {
    expect(parseSummary(TAHNO_OAH)).toEqual({
      blessing: "Tahno O'ah's Blessing",
      requirements: { text: 'None', links: [] },
      recommendations: { text: 'Cold Resistance Level 2', links: [] },
      shrineQuest: {
        text: 'Secret of the Cedars',
        links: [{ name: 'Secret of the Cedars', page: 'Secret of the Cedars' }],
      },
      treasure: {
        text: 'Climbing Boots',
        links: [{ name: 'Climbing Boots', page: 'Climbing Boots' }],
      },
    })
  })

  it('reads a DLC shrine, which has no blessing or treasure and an empty Enemies line', () => {
    expect(parseSummary(KEIVE_TALA)).toEqual({
      requirements: {
        text: 'Complete the four additional Shrines on the Great Plateau',
        links: [],
      },
      enemies: { text: '', links: [] },
    })
  })

  it('returns null when there is no summary paragraph', () => {
    expect(parseSummary('<div class="mw-parser-output"></div>')).toBeNull()
  })
})

describe('wiki titles', () => {
  it('cleans marker names into likely page titles', () => {
    expect(cleanTitle('Fire Arrow x10')).toBe('Fire Arrow')
    expect(cleanTitle('Stone Talus (Junior)')).toBe('Stone Talus')
    expect(cleanTitle('Gold Rupee (dog treasure)')).toBe('Gold Rupee')
    expect(cleanTitle('Recovered Memory #1 - Subdued Ceremony (Picture 1)')).toBe(
      'Recovered Memory #1 - Subdued Ceremony',
    )
    expect(cleanTitle('Hateno Village')).toBe('Hateno Village')
  })

  it('tries the name as given first, then the cleaned form, without repeats', () => {
    expect(candidates('Stone Talus (Junior)')).toEqual(['Stone Talus (Junior)', 'Stone Talus'])
    expect(candidates('Hinox')).toEqual(['Hinox'])
  })
})

describe('batched description lookup', () => {
  // Shape of the real response for ?action=query&prop=pageprops&titles=Stone Talus
  const response = {
    batchcomplete: '',
    query: {
      normalized: [{ from: 'goron city', to: 'Goron City' }],
      redirects: [{ from: 'Lynel (Sword)', to: 'Lynel' }],
      pages: {
        '29949': {
          pageid: 29949,
          ns: 0,
          title: 'Stone Talus',
          pageprops: {
            description:
              'Stone Talus are sub-bosses in Breath of the Wild, Age of Calamity, and Tears of the Kingdom.',
          },
        },
        '5': { pageid: 5, ns: 0, title: 'Goron City' }, // exists but has no description
        '6': {
          pageid: 6,
          ns: 0,
          title: 'Lynel',
          pageprops: { description: 'Lynels are centaur-like enemies.' },
        },
        '-1': { ns: 0, title: 'Stone Talus (Junior)', missing: '' },
      },
    },
  }

  it('files each answer under the title that was asked for', () => {
    expect(
      readDescriptions(response, [
        'Stone Talus',
        'goron city',
        'Lynel (Sword)',
        'Stone Talus (Junior)',
      ]),
    ).toEqual({
      'Stone Talus': {
        description:
          'Stone Talus are sub-bosses in Breath of the Wild, Age of Calamity, and Tears of the Kingdom.',
      },
      'goron city': { description: null, page: 'Goron City' }, // normalised, found, no description
      'Lynel (Sword)': { description: 'Lynels are centaur-like enemies.', page: 'Lynel' }, // followed a redirect
      'Stone Talus (Junior)': { missing: true },
    })
  })

  it('treats a title missing from the response, or an invalid one, as missing', () => {
    expect(readDescriptions({ query: { pages: {} } }, ['Nope'])).toEqual({
      Nope: { missing: true },
    })
    expect(
      readDescriptions({ query: { pages: { '-1': { title: 'Bad|Title', invalid: '' } } } }, [
        'Bad|Title',
      ]),
    ).toEqual({ 'Bad|Title': { missing: true } })
  })
})

const KOKO_CUISINE =
  '<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><p><b>Requirements:</b> <span class="internal-link" data-target="Cooking with Koko">Cooking with Koko</span><br />, Raw meat <br />\n<b>Questgiver:</b> <a href="/wiki/Koko" title="Koko">Koko</a>, <a href="/wiki/Kakariko_Village_(Breath_of_the_Wild)" title="Kakariko Village (Breath of the Wild)">Kakariko Village</a><br />\n<b>Special Notes:</b> Part of the following Side Quest chain:\n</p>\n<ol><li><span class="internal-link" data-target="Koko&#39;s Kitchen">Koko\'s Kitchen</span></li>\n<li><span class="internal-link" data-target="Koko Cuisine">Koko Cuisine</span></li></ol>\n<!-- NewPP limit report -->\n</div>'

describe('quest map page parser', () => {
  it('reads requirements, quest giver and the quest chain, with their links', () => {
    const parsed = parseSummary(KOKO_CUISINE) as Record<string, { text: string; links: unknown[] }>
    expect(parsed.questgiver).toEqual({
      text: 'Koko, Kakariko Village',
      links: [
        { name: 'Koko', page: 'Koko' },
        { name: 'Kakariko Village', page: 'Kakariko Village (Breath of the Wild)' },
      ],
    })
    expect(parsed.requirements!.links).toEqual([
      { name: 'Cooking with Koko', page: 'Cooking with Koko' },
    ])
    expect(parsed.specialNotes!.text).toBe(
      "Part of the following Side Quest chain:\nKoko's Kitchen\nKoko Cuisine",
    )
    expect(parsed.specialNotes!.links).toEqual([
      { name: "Koko's Kitchen", page: "Koko's Kitchen" },
      { name: 'Koko Cuisine', page: 'Koko Cuisine' },
    ])
  })
})

describe('quest page intro', () => {
  const MAIN =
    '<div class="mw-parser-output"><p>Given by the Old Man after completing <span class="internal-link" data-target="The Isolated Plateau">The Isolated Plateau</span>.\n</p>\n<p>Find the Great Plateau Tower.\n</p>\n</div>'
  it('keeps unlabelled opening text and following paragraphs when asked', () => {
    expect(parseSummary(MAIN, true)).toEqual({
      intro: {
        text: 'Given by the Old Man after completing The Isolated Plateau.\nFind the Great Plateau Tower.',
        links: [{ name: 'The Isolated Plateau', page: 'The Isolated Plateau' }],
      },
    })
  })
  it('ignores that text by default, so shrine summaries are unchanged', () => {
    expect(parseSummary(MAIN)).toEqual({})
  })
})

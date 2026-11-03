// Turns one scraped quest "Map:" page (see Phase 3 of scripts/browser/wiki-scrape.template.js) into dialog rows:
//   { questgiver: { text: 'Koko, Kakariko Village', links: [{ name: 'Koko', page: 'Koko' }, …] }, … }
//   -> [{ label: 'Quest giver', value: 'Koko, Kakariko Village', links: [{ name: 'Koko', url: 'https://…/wiki/Koko' }] }]
// Rows come out in display order; "None"/empty fields are dropped.

const WIKI = 'https://www.zeldadungeon.net/wiki/'

/** scraped field -> label shown in the dialog, in display order. */
const FIELDS = [
  ['intro', 'About'],
  ['questgiver', 'Quest giver'],
  ['requirements', 'Requirements'],
  ['neededItems', 'Items needed'],
  ['itemsNeeded', 'Items needed'],
  ['requiredItems', 'Items needed'],
  ['objective', 'Objective'],
  ['objectives', 'Objective'],
  ['recommendations', 'Recommended'],
  ['location', 'Location'],
  ['reward', 'Reward'],
  ['rewards', 'Reward'],
  ['treasure', 'Treasure'],
  ['questComplete', 'Completion'],
  ['enemies', 'Enemies'],
  ['specialNotes', 'Notes'],
]

const tidy = (s) => s.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim()
const isNothing = (s) => !s || /^none\.?$/i.test(s)

/** Wiki page title -> its URL ("Kakariko Village (Breath of the Wild)" -> …/Kakariko_Village_(Breath_of_the_Wild)). */
export const wikiUrl = (page) =>
  WIKI + encodeURIComponent(page.replace(/ /g, '_')).replace(/%28/g, '(').replace(/%29/g, ')')

/** The field's lines as one value: "Part of the chain:" + one line per entry -> "Part of the chain: A, B, C". */
function valueOf(text, sentences = false) {
  const [head = '', ...rest] = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (sentences) return tidy([head, ...rest].join(' '))
  const joined = head.endsWith(':') ? `${head} ${rest.join(', ')}` : [head, ...rest].join(', ')
  return tidy(joined.replace(/,\s*,/g, ','))
}

export function questDetails(entry) {
  if (!entry || entry.missing) return []
  const rows = []
  for (const [key, label] of FIELDS) {
    const field = entry[key]
    if (!field || typeof field.text !== 'string') continue
    const value = valueOf(field.text, key === 'intro')
    if (isNothing(value) || value.endsWith(':')) continue
    // Only links whose text really appears in the value, once each, in the order they appear.
    const seen = new Set()
    const links = (field.links ?? [])
      .filter((l) => value.includes(l.name) && !seen.has(l.name) && seen.add(l.name))
      .map((l) => ({ name: l.name, url: wikiUrl(l.page) }))
    rows.push({ label, value, ...(links.length ? { links } : {}) })
  }
  return rows
}

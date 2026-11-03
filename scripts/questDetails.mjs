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

/** Some wiki pages do not bold every label, so "Questgiver: …" or "Items needed: …" ends up as a line inside another field. */
const EMBEDDED = /^(questgiver|quest giver|needed items|items needed|required items):\s*(.*)$/i
const EMBEDDED_KEY = {
  questgiver: 'questgiver',
  'quest giver': 'questgiver',
  'needed items': 'neededItems',
  'items needed': 'neededItems',
  'required items': 'neededItems',
}

/** "Rewards you with an Armoranth." tacked onto another field -> the reward, "Armoranth". */
const REWARD_SENTENCE = /^rewards? you with (?:an?\s+|the\s+)?(.+?)\.?$/i

/** Moves those lines (and the links whose names occur in them) into fields of their own. */
function splitEmbedded(entry) {
  const out = { ...entry }
  for (const [key, field] of Object.entries(entry)) {
    if (!field || typeof field.text !== 'string') continue
    const keep = []
    for (const line of field.text.split('\n')) {
      const sentence = line.trim().match(REWARD_SENTENCE)
      if (sentence && !out.reward) {
        out.reward = {
          text: sentence[1],
          links: (field.links ?? []).filter((l) => sentence[1].includes(l.name)),
        }
        continue
      }
      const found = line.trim().match(EMBEDDED)
      const target = found && EMBEDDED_KEY[found[1].toLowerCase()]
      if (!target || out[target]) {
        keep.push(line)
        continue
      }
      const value = found[2]
      out[target] = {
        text: value,
        links: (field.links ?? []).filter((l) => value.includes(l.name)),
      }
    }
    if (keep.length !== field.text.split('\n').length) {
      const text = keep.join('\n')
      const links = (field.links ?? []).filter((l) => text.includes(l.name))
      out[key] = { text, links }
    }
  }
  return out
}

export function questDetails(scraped) {
  if (!scraped || scraped.missing) return []
  const entry = splitEmbedded(scraped)
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

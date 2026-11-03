// Adds the scraped wiki descriptions to markers in markers.json.
//
//   node scripts/add-wiki-descriptions.mjs <path/to/zeldadungeon-data.json> [src/data/generated/markers.json]
//
// Only fills markers that have no description of their own, and skips the categories in SKIP below (Korok seeds keep
// theirs; shrines get their details from add-shrine-details.mjs). Safe to re-run: descriptions it set on an earlier
// run are replaced, hand-written ones are left alone.
import { readFileSync, writeFileSync } from 'node:fs'
import { questDetails } from './questDetails.mjs'
import { pickDescription } from './wikiDescriptions.mjs'

const [, , sourcePath, outPath = 'src/data/generated/markers.json'] = process.argv
if (!sourcePath)
  throw new Error('usage: add-wiki-descriptions.mjs <zeldadungeon-data.json> [markers.json]')

const { titles, names, quests = {} } = JSON.parse(readFileSync(sourcePath, 'utf8'))
const data = JSON.parse(readFileSync(outPath, 'utf8'))
// Shrines have their own details. Everything else listed is a repeated pickup or enemy type whose wiki intro is generic
// ("Arrows are recurring items in The Legend of Zelda series…"), so it adds nothing to the dialog.
const SKIP = new Set([
  'korok-seed',
  'shrine',
  'arrows',
  'common-gems',
  'rare-gems',
  'big-rupees',
  'small-rupees',
  'cooking-pot',
  'raft',
  'goddess-statue',
  'materials',
  'clothing',
  'bows',
  'spears',
  'one-handed-weapons',
  'two-handed-weapons',
  'shields',
  'rods',
  'guardian',
  'hinox',
  'lynel',
  'stone-talus',
  'molduga',
  'memory',
])

// Descriptions from an earlier run are recognisable because they are exactly what the scrape gives for the marker.
let added = 0
let stubs = 0
let eligible = 0
for (const m of data.markers) {
  if (SKIP.has(m.category)) {
    // Remove what an earlier run added to a category that is now skipped (the hand-written chest note is not ours).
    if (m.description && m.description === pickDescription(titles, names[m.name]))
      delete m.description
    continue
  }
  const previous = pickDescription(titles, names[m.name])
  if (m.description && m.description !== previous) continue // hand-written: keep
  eligible++
  const text = pickDescription(titles, names[m.name])
  if (text) {
    m.description = text
    added++
  } else {
    delete m.description
    stubs++
  }
}

// Quests: requirements, quest giver and notes from the quest's "Map:" page (with links to the wiki pages they mention), shown as detail rows. Replaces rows from an
// earlier run; the "Shrine" back-link that add-shrine-details.mjs adds to shrine quests is kept.
let questsWithDetails = 0
for (const m of data.markers) {
  if (!(m.name in quests)) continue
  const rows = questDetails(quests[m.name])
  const kept = (m.details ?? []).filter((d) => d.label === 'Shrine')
  const details = [...rows, ...kept]
  if (details.length) m.details = details
  else delete m.details
  if (rows.length) questsWithDetails++
}

writeFileSync(outPath, JSON.stringify(data))
console.log(`eligible markers: ${eligible} | descriptions set: ${added} | none/stub only: ${stubs}`)
console.log(`quests with details: ${questsWithDetails}/${Object.keys(quests).length}`)

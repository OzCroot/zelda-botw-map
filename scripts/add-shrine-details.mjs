// Adds the scraped shrine details (blessing, treasure, requirements…) to the shrine markers in markers.json, links
// each shrine to its shrine quest (and back), and adds armor pieces found in shrine chests as tracked clothing items.
//
//   node scripts/add-shrine-details.mjs <path/to/zeldadungeon-shrines.json> [src/data/generated/markers.json]
//
// Accepts either the shrines-only file or the full zeldadungeon-data.json (shrines under "shrines").
// Safe to re-run: it replaces any details it added before.
import { readFileSync, writeFileSync } from 'node:fs'
import { clothingSetOf, OTHER_SET } from '../src/data/clothingSets.ts'
import { applyManual, shrineDetails, splitItems } from './shrineDetails.mjs'

/** Id prefix of the clothing markers this script creates from shrine treasure. */
const TREASURE_PREFIX = 'clothing:shrine-chest:'

const [, , sourcePath, outPath = 'src/data/generated/markers.json'] = process.argv
if (!sourcePath) throw new Error('usage: add-shrine-details.mjs <zeldadungeon-shrines.json> [markers.json]')

const scraped = JSON.parse(readFileSync(sourcePath, 'utf8'))
// Hand-written entries for shrines the wiki summary does not cover (keyed by marker name).
const manual = JSON.parse(readFileSync(new URL('./shrine-details.manual.json', import.meta.url), 'utf8'))
const shrines = scraped.shrines ?? scraped
const data = JSON.parse(readFileSync(outPath, 'utf8'))

// ---- 1. details from the scrape, plus the hand-written entries ---------------------------------------------------------
let matched = 0
let total = 0
const unmatched = []
const shrineMarkers = data.markers.filter((m) => m.category === 'shrine')
for (const m of shrineMarkers) {
  total++
  delete m.blessing
  delete m.details
  const found = shrineDetails(shrines[m.name])
  if (found?.blessing) m.blessing = found.blessing
  if (found?.details.length) m.details = found.details
  applyManual(m, manual[m.name])
  if (found || manual[m.name]) matched++
  else unmatched.push(m.name)
}

// ---- 2. links between shrines, their shrine quests and their armor treasures ---------------------------------------
// Armor pieces that are shrine treasures become tracked clothing items at their shrine (they are in sets, e.g. Climbing
// Boots in the Climbing set), so they count towards the Clothing tracker. Rebuilt on every run.
data.markers = data.markers.filter((m) => !m.id.startsWith(TREASURE_PREFIX))
const questByName = new Map(data.markers.filter((m) => m.category === 'shrine-quest').map((m) => [m.name.toLowerCase(), m]))
for (const q of questByName.values()) if (q.details) q.details = q.details.filter((d) => d.label !== 'Shrine')

const treasures = []
let questLinks = 0
for (const shrine of shrineMarkers) {
  for (const row of shrine.details ?? []) {
    if (row.label === 'Shrine quest') {
      const quest = questByName.get(row.value.toLowerCase())
      if (!quest) continue
      row.marker = quest.id
      quest.details = [...(quest.details ?? []), { label: 'Shrine', value: shrine.name, marker: shrine.id }]
      questLinks++
    } else if (row.label === 'Treasure') {
      const items = splitItems(row.value)
      const armor = items.filter((item) => clothingSetOf(item) !== OTHER_SET)
      for (const item of armor) {
        const id = `${TREASURE_PREFIX}${shrine.name}${armor.length > 1 ? `:${item}` : ''}`
        treasures.push({
          id,
          category: 'clothing',
          name: item,
          x: shrine.x,
          y: shrine.y,
          ...(shrine.region ? { region: shrine.region } : {}),
          description: `Treasure chest in ${shrine.name}.`,
          details: [{ label: 'Found in', value: shrine.name, marker: shrine.id }],
        })
        // A row that is exactly one armor piece links straight to it.
        if (items.length === 1) row.marker = id
      }
    }
  }
}
data.markers.push(...treasures)

writeFileSync(outPath, JSON.stringify(data))
console.log(`shrines with details: ${matched}/${total}`)
console.log(`shrine-quest links: ${questLinks} | armor treasures added as clothing: ${treasures.length}`)
if (unmatched.length) console.log(`no details for: ${unmatched.join(', ')}`)

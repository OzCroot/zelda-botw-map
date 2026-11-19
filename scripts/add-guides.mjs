// Adds the shorthand "guide" text from scripts/guides.json (marker id -> text) to markers.json.
//
//   node scripts/add-guides.mjs [scripts/guides.json] [src/data/generated/markers.json]
//
// Safe to re-run: it overwrites guides it set before and leaves markers without an entry untouched.
import { readFileSync, writeFileSync } from 'node:fs'

const [
  ,
  ,
  guidesPath = new URL('./guides.json', import.meta.url).pathname,
  outPath = 'src/data/generated/markers.json',
] = process.argv
const guides = JSON.parse(readFileSync(guidesPath, 'utf8'))
const data = JSON.parse(readFileSync(outPath, 'utf8'))
const ids = new Set(data.markers.map((m) => m.id))
const unknown = Object.keys(guides).filter((id) => !ids.has(id))
if (unknown.length) throw new Error(`guides for unknown markers: ${unknown.join(', ')}`)
let added = 0
for (const m of data.markers) {
  if (guides[m.id]) {
    m.guide = guides[m.id]
    added++
  }
}
writeFileSync(outPath, JSON.stringify(data))
console.log(`added ${added} guides`)

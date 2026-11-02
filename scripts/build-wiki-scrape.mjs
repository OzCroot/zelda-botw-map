// Builds scripts/browser/fetch-wiki-data.js (the paste-into-the-console scraper) from its template, embedding the
// names to look up from the app's own marker data so the two never drift apart.
//
//   node scripts/build-wiki-scrape.mjs [src/data/generated/markers.json]
import { readFileSync, writeFileSync } from 'node:fs'

const markersPath = process.argv[2] ?? 'src/data/generated/markers.json'
const { markers } = JSON.parse(readFileSync(markersPath, 'utf8'))

const unique = (xs) => [...new Set(xs)].sort((a, b) => a.localeCompare(b))
const shrines = unique(markers.filter((m) => m.category === 'shrine').map((m) => m.name))
// Phase 2 covers everything except shrines (their own phase) and Korok seeds (hundreds of identical, page-less names).
const names = unique(markers.filter((m) => m.category !== 'shrine' && m.category !== 'korok-seed').map((m) => m.name))

const template = readFileSync('scripts/browser/wiki-scrape.template.js', 'utf8')
const out = template.replace('/*SHRINES*/[]', JSON.stringify(shrines)).replace('/*NAMES*/[]', JSON.stringify(names))
if (out === template) throw new Error('placeholders not found in the template')
writeFileSync('scripts/browser/fetch-wiki-data.js', out)
console.log(`fetch-wiki-data.js: ${shrines.length} shrines, ${names.length} other names, ${(out.length / 1024).toFixed(0)} KB`)

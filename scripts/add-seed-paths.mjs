// Adds each Korok seed's route (flower trail, race course…) to markers.json as `path`, a list of [x, y] map points in
// the order to follow them. Only seeds with a route get one; the app shows it on request ("Show path").
//
//   node scripts/add-seed-paths.mjs <path/to/seeds.json> [src/data/generated/markers.json]
//
// Safe to re-run: it replaces any paths it added before.
import { readFileSync, writeFileSync } from 'node:fs'
import { seedPaths } from './seedPaths.mjs'

const [, , sourcePath, outPath = 'src/data/generated/markers.json'] = process.argv
if (!sourcePath) throw new Error('usage: add-seed-paths.mjs <seeds.json> [markers.json]')

const paths = seedPaths(JSON.parse(readFileSync(sourcePath, 'utf8')))
const data = JSON.parse(readFileSync(outPath, 'utf8'))

let added = 0
const moved = []
for (const m of data.markers) {
  delete m.path
  const path = paths.get(m.id)
  if (!path) continue
  m.path = path
  added++
  // The pin sits on the route's first point; flag any seed where that is not so.
  if (path[0][0] !== m.x || path[0][1] !== m.y) moved.push(m.id)
}
const missing = [...paths.keys()].filter((id) => !data.markers.some((m) => m.id === id))

writeFileSync(outPath, JSON.stringify(data))
console.log(`seeds with a path: ${added}/${paths.size}`)
if (moved.length) console.log(`pin is not on the first path point: ${moved.join(', ')}`)
if (missing.length) console.log(`no marker for: ${missing.join(', ')}`)

// One-off data patch: copies the zoom levels of landmark labels, and the subregion (area) labels,
// and the region + subregion (area) labels, from the raw source into src/data/generated/markers.json.
//
//   node scripts/add-label-levels.mjs <path/to/locations.json> [src/data/generated/markers.json]
//
// Safe to re-run: it overwrites `minZoom` on landmarks and rebuilds `labels`.
import { readFileSync, writeFileSync } from 'node:fs'

const [, , sourcePath, outPath = 'src/data/generated/markers.json'] = process.argv
if (!sourcePath) throw new Error('usage: add-label-levels.mjs <locations.json> [markers.json]')

const MAP_W = 24000
const MAP_H = 20000
// Source coordinates are [lat, lng] from the map centre; see fromSource() in src/data/regions.ts.
const toMap = ([lat, lng]) => ({ x: Math.round(MAP_W / 2 + lng), y: Math.round(MAP_H / 2 - lat) })

const groups = JSON.parse(readFileSync(sourcePath, 'utf8'))
const data = JSON.parse(readFileSync(outPath, 'utf8'))

const landmarkZoom = new Map()
for (const layer of groups.find((g) => g.name === 'Landmark').layers)
  for (const m of layer.markers) {
    const { x, y } = toMap(m.coords)
    landmarkZoom.set(`${m.name}|${x},${y}`, layer.minZoom)
  }

let matched = 0
let total = 0
for (const m of data.markers) {
  if (m.category !== 'landmark') continue
  total++
  const z = landmarkZoom.get(`${m.name}|${m.x},${m.y}`)
  if (z === undefined) continue
  m.minZoom = z
  matched++
}
if (matched !== total) throw new Error(`only ${matched}/${total} landmarks matched the source`)

// Regions are the broadest names (source zoom 0-1); subregions follow at 2-3. The map itself zooms out to -1,
// so the lowest level starts there rather than leaving the most zoomed-out view unlabelled.
const MIN_MAP_ZOOM = -1
const labelsOf = (groupName, kind) =>
  groups
    .find((g) => g.name === groupName)
    .layers.flatMap((layer) =>
      layer.markers.map((m) => ({
        id: `${kind}:${m.id}`,
        kind,
        name: m.name,
        ...toMap(m.coords),
        minZoom: kind === 'region' ? MIN_MAP_ZOOM : layer.minZoom,
        maxZoom: layer.maxZoom,
      })),
    )
data.labels = [...labelsOf('Region', 'region'), ...labelsOf('Subregion', 'area')]

writeFileSync(outPath, JSON.stringify(data))
const byZoom = {}
for (const m of data.markers)
  if (m.minZoom !== undefined) byZoom[m.minZoom] = (byZoom[m.minZoom] ?? 0) + 1
console.log(`landmarks by minZoom:`, byZoom, `| labels: ${data.labels.length}`)

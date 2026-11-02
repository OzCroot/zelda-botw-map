/**
 * Normalizes third-party marker JSON into src/data/generated/markers.json.
 *
 *   npm run import-data      # reads data/raw/source/{locations,pins,seeds,treasures,wiki}.json
 *
 * Raw files and generated output are gitignored — they are not ours to redistribute.
 * Save the files from your browser manually; do not automate around bot protection.
 *
 * Source format: list of categories { name, layers: [{ icon?, markers: [{ id, name?, coords, loc?, tags? }] }] }
 * where coords = [lat, lng] (north/east positive, 0,0 = map centre). Korok seeds may carry a
 * path (list of coords) — the first point is used.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CATEGORY_BY_ID } from '../src/data/categories.ts'
import { fromSource } from '../src/data/regions.ts'
import { datasetSchema } from '../src/data/schema.ts'
import type { Marker, RegionInfo } from '../src/types/marker.ts'

const rawDir = join('data', 'raw', 'source')
const outDir = join('src', 'data', 'generated')

interface RawMarker { id: string; name?: string; coords: number[] | number[][]; loc?: string; tags?: string[] }
interface RawLayer { icon?: { url: string }; markers: RawMarker[] }
interface RawCategory { name: string; layers: RawLayer[] }

const read = (f: string): RawCategory[] => JSON.parse(readFileSync(join(rawDir, `${f}.json`), 'utf8'))
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Source category name -> our category id (default: slug of the name). */
const ALIAS: Record<string, string> = {
  Seeds: 'korok-seed',
  'Sheikah Tower': 'sheikah-tower',
  Landmark: 'landmark',
}
const SKIP = new Set(['Region', 'Subregion']) // used for region assignment / labels only

const first = (c: number[] | number[][]): [number, number] => {
  const p = (Array.isArray(c[0]) ? c[0] : c) as number[]
  return [p[0]!, p[1]!]
}

function main() {
  const locations = read('locations')
  const regionSrc = locations.find((c) => c.name === 'Region')?.layers.flatMap((l) => l.markers) ?? []
  const regions: RegionInfo[] = regionSrc.map((m) => {
    const [lat, lng] = first(m.coords)
    return { id: slug(m.id), label: m.name ?? m.id, ...fromSource(lat, lng) }
  })
  const nearestRegion = (x: number, y: number) =>
    regions.reduce((best, r) => (Math.hypot(r.x - x, r.y - y) < Math.hypot(best.x - x, best.y - y) ? r : best)).id

  const markers: Marker[] = []
  const seen = new Set<string>()
  const unknown = new Map<string, number>()

  const ingest = (cats: RawCategory[], isSeeds = false) => {
    for (const cat of cats) {
      if (SKIP.has(cat.name)) continue
      const catId = isSeeds ? 'korok-seed' : (ALIAS[cat.name] ?? slug(cat.name))
      if (!(catId in CATEGORY_BY_ID)) {
        unknown.set(cat.name, (unknown.get(cat.name) ?? 0) + cat.layers.reduce((n, l) => n + l.markers.length, 0))
        continue
      }
      for (const layer of cat.layers) {
        const icon = layer.icon?.url ?? ''
        for (const m of layer.markers) {
          const [lat, lng] = first(m.coords)
          const { x, y } = fromSource(lat, lng)
          let id = `${catId}:${m.id}`
          for (let n = 2; seen.has(id); n++) id = `${catId}:${m.id}#${n}`
          seen.add(id)
          const tags = [...(m.tags ?? [])]
          if (icon.includes('dlc')) tags.push('DLC')
          if (isSeeds) tags.push(cat.name)
          markers.push({
            id,
            category: catId,
            name: isSeeds ? `Korok Seed (${cat.name})` : (m.name ?? m.id),
            x, y,
            region: nearestRegion(x, y),
            description: isSeeds ? m.loc : undefined,
            tags: tags.length ? tags : undefined,
          })
        }
      }
    }
  }

  ingest(locations)
  ingest(read('pins'))
  ingest(read('seeds'), true)
  ingest(read('treasures'))
  ingest(read('wiki'))

  const ds = datasetSchema.parse({ version: new Date().toISOString().slice(0, 10), source: 'imported', regions, markers })
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'markers.json'), JSON.stringify(ds))

  const counts = new Map<string, number>()
  for (const m of markers) counts.set(m.category, (counts.get(m.category) ?? 0) + 1)
  console.log(`Wrote ${markers.length} markers, ${regions.length} regions to ${join(outDir, 'markers.json')}`)
  console.log([...counts].map(([k, v]) => `${k}=${v}`).join('  '))
  if (unknown.size) console.warn('Skipped (no matching category):', Object.fromEntries(unknown))
}
main()

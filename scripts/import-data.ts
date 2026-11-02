/**
 * Normalizes third-party marker JSON into src/data/generated/markers.json.
 *
 *   npm run import-data              # adapter "source" (default), reads data/raw/source/*.json
 *
 * Raw files and generated output are gitignored — they are not ours to redistribute.
 * Save the files from your browser manually; do not automate around bot protection.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { datasetSchema } from '../src/data/schema.ts'
import type { Marker } from '../src/types/marker.ts'

const adapter = process.argv[2] ?? 'source'
const rawDir = join('data', 'raw', adapter)
const outFile = join('src', 'data', 'generated', 'markers.json')

/** raw filename (without .json) -> default category when the record has none */
const SOURCE_FILES: Record<string, string> = {
  locations: 'village',
  pins: 'sidequest',
  seeds: 'korok',
  treasures: 'chest',
  wiki: 'sidequest',
}

type Raw = Record<string, unknown>

/**
 * TODO(source adapter): the exact schema of the source site's files was not available when this was
 * written. This best-effort mapper accepts arrays (or objects containing arrays) of records with
 * x/y (or lng/lat) and a name/title. Adjust once you have the real files.
 */
function toMarkers(file: string, json: unknown): Marker[] {
  const list: Raw[] = Array.isArray(json)
    ? (json as Raw[])
    : Object.values(json as Raw).flatMap((v) => (Array.isArray(v) ? (v as Raw[]) : []))
  const base = file.replace(/\.json$/, '')
  const out: Marker[] = []
  list.forEach((r, i) => {
    const x = Number(r.x ?? r.lng ?? r.lon)
    const y = Number(r.y ?? r.lat)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    out.push({
      id: String(r.id ?? `${base}-${i + 1}`),
      category: String(r.category ?? r.type ?? SOURCE_FILES[base] ?? 'sidequest'),
      name: String(r.name ?? r.title ?? `${base} ${i + 1}`),
      x,
      y,
      description: typeof r.description === 'string' ? r.description : undefined,
      wikiUrl: typeof r.url === 'string' ? r.url : undefined,
    })
  })
  return out
}

function main() {
  if (adapter !== 'source') throw new Error(`Unknown adapter "${adapter}" (only "source" is implemented)`)
  let files: string[] = []
  try {
    files = readdirSync(rawDir).filter((f) => f.endsWith('.json'))
  } catch {
    /* handled below */
  }
  if (!files.length) {
    console.error(`No .json files in ${rawDir}. Save the marker files there first (see README).`)
    process.exit(1)
  }
  const markers = files.flatMap((f) => toMarkers(f, JSON.parse(readFileSync(join(rawDir, f), 'utf8'))))
  const ds = datasetSchema.parse({ version: new Date().toISOString().slice(0, 10), source: adapter, markers })
  mkdirSync(join('src', 'data', 'generated'), { recursive: true })
  writeFileSync(outFile, JSON.stringify(ds))
  console.log(`Wrote ${ds.markers.length} markers to ${outFile}`)
  console.log('Note: coordinates are assumed to be game units (x 0..12000, y 0..10000). Rescale in toMarkers if not.')
}
main()

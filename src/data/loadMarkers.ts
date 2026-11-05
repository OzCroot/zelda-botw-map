import { seedNumber } from '../lib/markers'
import type { AreaLabel, Marker, MarkerDataset, RegionInfo } from '../types/marker'
import sample from './sample/markers.json'
import { CATEGORY_BY_ID } from './categories'
import { clothingSetOf } from './clothingSets'
import { datasetSchema } from './schema'

// The full dataset is a separate hashed asset fetched at startup (see initData), not part of the JS bundle.
const generated = import.meta.glob('./generated/markers.json', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const DLC_CATEGORY: Record<string, string> = { shrine: 'shrine-dlc' }

function prepare(ds: MarkerDataset): MarkerDataset {
  const markers: Marker[] = []
  for (const m of ds.markers) {
    if (!(m.category in CATEGORY_BY_ID)) continue
    let next = m
    // DLC shrines get their own category so they can be shown, hidden and counted separately.
    // (The id is unchanged, so saved progress and deep links keep working.)
    const dlc = DLC_CATEGORY[m.category]
    if (dlc && m.tags?.includes('DLC')) next = { ...next, category: dlc, tags: [...new Set(m.tags)] }
    // Korok seeds are all named alike; show their number (e.g. "Korok Seed #031") so they can be told apart and searched.
    const num = next.category === 'korok-seed' ? seedNumber(next.id) : undefined
    if (num) next = { ...next, name: `Korok Seed #${num.padStart(3, '0')}` }
    // Clothing is browsed by set, which the data doesn't carry; work it out from the name.
    if (next.category === 'clothing' && !next.set) next = { ...next, set: clothingSetOf(next.name) }
    markers.push(next)
  }
  return { ...ds, markers }
}

// Live bindings: start as the small bundled sample, replaced by initData() before the app renders.
export let dataset: MarkerDataset
export let MARKERS: Marker[]
export let MARKER_BY_ID: Map<string, Marker>
export let usingSampleData: boolean
export let AREA_LABELS: AreaLabel[]
export let REGIONS: RegionInfo[]
export let REGION_BY_ID: Record<string, RegionInfo>

function apply(ds: MarkerDataset) {
  dataset = prepare(ds)
  MARKERS = dataset.markers
  MARKER_BY_ID = new Map(MARKERS.map((m) => [m.id, m]))
  usingSampleData = dataset.source === 'sample'
  AREA_LABELS = dataset.labels ?? []
  REGIONS = dataset.regions
  REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]))
}

apply(datasetSchema.parse(sample))

/**
 * Loads the full dataset. Must resolve before anything reads MARKERS-derived state at render time.
 * Tests always use the bundled sample so they don't depend on generated data.
 */
export async function initData(): Promise<void> {
  const url = Object.values(generated)[0]
  if (import.meta.env.MODE === 'test' || !url) return
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw: unknown = await res.json()
    // Validate in dev only; production trusts the generated file instead of re-checking ~3.7k rows on every load.
    apply(import.meta.env.DEV ? datasetSchema.parse(raw) : (raw as MarkerDataset))
  } catch (e) {
    console.warn('Could not load the full marker dataset, using the sample.', e)
  }
}

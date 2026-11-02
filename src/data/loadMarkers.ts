import type { Marker, MarkerDataset } from '../types/marker'
import sample from './sample/markers.json'
import { CATEGORY_BY_ID } from './categories'
import { datasetSchema } from './schema'

// The full dataset is a separate hashed asset fetched at startup (see initData), not part of the JS bundle.
const generated = import.meta.glob('./generated/markers.json', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function prepare(ds: MarkerDataset): MarkerDataset {
  // DLC shrines get their own category so they can be shown, hidden and counted separately.
  // (The id is unchanged, so saved progress and deep links keep working.)
  const markers: Marker[] = ds.markers
    .map((m) =>
      m.category === 'shrine' && m.tags?.includes('DLC')
        ? { ...m, category: 'shrine-dlc', tags: [...new Set(m.tags)] }
        : m,
    )
    .filter((m) => m.category in CATEGORY_BY_ID)
  return { ...ds, markers }
}

// Live bindings: start as the small bundled sample, replaced by initData() before the app renders.
export let dataset: MarkerDataset
export let MARKERS: Marker[]
export let MARKER_BY_ID: Map<string, Marker>
export let usingSampleData: boolean
export let REGIONS: MarkerDataset['regions']
export let REGION_BY_ID: Record<string, MarkerDataset['regions'][number]>

function apply(ds: MarkerDataset) {
  dataset = prepare(ds)
  MARKERS = dataset.markers
  MARKER_BY_ID = new Map(MARKERS.map((m) => [m.id, m]))
  usingSampleData = dataset.source === 'sample'
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

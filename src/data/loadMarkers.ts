import type { Marker, MarkerDataset } from '../types/marker'
import sample from './sample/markers.json'
import { CATEGORY_BY_ID } from './categories'
import { datasetSchema } from './schema'

const generated = import.meta.glob('./generated/markers.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

function load(): MarkerDataset {
  // Tests always use the bundled sample so they don't depend on gitignored data.
  const raw = (import.meta.env.MODE === 'test' ? undefined : Object.values(generated)[0]) ?? sample
  const parsed = datasetSchema.safeParse(raw)
  const ds = parsed.success ? parsed.data : datasetSchema.parse(sample)
  const markers: Marker[] = ds.markers.filter((m) => m.category in CATEGORY_BY_ID)
  return { ...ds, markers }
}

export const dataset = load()
export const MARKERS = dataset.markers
export const MARKER_BY_ID = new Map(MARKERS.map((m) => [m.id, m]))
export const usingSampleData = dataset.source === 'sample'

export const REGIONS = dataset.regions
export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]))

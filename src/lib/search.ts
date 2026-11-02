import Fuse from 'fuse.js'
import { MARKERS } from '../data/loadMarkers'
import { CATEGORY_BY_ID } from '../data/categories'

const fuse = new Fuse(
  MARKERS.map((m) => ({ m, cat: CATEGORY_BY_ID[m.category]?.label ?? '' })),
  { keys: ['m.name', 'cat', 'm.region', 'm.description'], threshold: 0.35 },
)

export function searchMarkers(q: string, limit = 30) {
  if (!q.trim()) return []
  return fuse.search(q, { limit }).map((r) => r.item.m)
}

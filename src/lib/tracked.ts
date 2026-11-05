import { CHECKABLE_CATEGORIES } from '../data/categories'
import { MARKERS } from '../data/loadMarkers'
import type { Marker } from '../types/marker'
import { once } from './once'

// The tracked items never change, so group them once instead of re-filtering ~3.7k markers per bar on every render.
export const getGroups = once(() => {
  const checkable = new Set(CHECKABLE_CATEGORIES.map((c) => c.id))
  const items = MARKERS.filter((m) => checkable.has(m.category))
  const byCategory = new Map<string, Marker[]>()
  const byRegion = new Map<string, Marker[]>()
  for (const m of items) {
    push(byCategory, m.category, m)
    if (m.region) push(byRegion, m.region, m)
  }
  return { items, byCategory, byRegion }
})

function push(map: Map<string, Marker[]>, key: string, m: Marker) {
  const list = map.get(key)
  if (list) list.push(m)
  else map.set(key, [m])
}

export function countDone(list: Marker[], completed: Record<string, number>) {
  let n = 0
  for (const m of list) if (m.id in completed) n++
  return n
}


/** Whole-number percentage, 0 when there is nothing to count. */
export const percent = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0)

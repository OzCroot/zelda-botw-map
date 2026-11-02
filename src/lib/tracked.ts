import { CATEGORIES } from '../data/categories'
import { MARKERS } from '../data/loadMarkers'
import type { Marker } from '../types/marker'
import { once } from './once'

// The tracked items never change, so group them once instead of re-filtering ~3.7k markers per bar on every render.
export const getGroups = once(() => {
  const checkable = new Set(CATEGORIES.filter((c) => c.checkable).map((c) => c.id))
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


import L from 'leaflet'
import { CATEGORY_BY_ID } from '../../data/categories'

const cache = new Map<string, L.DivIcon>()

export function markerIcon(category: string, done: boolean, selected: boolean): L.DivIcon {
  const key = `${category}|${done}|${selected}`
  let icon = cache.get(key)
  if (!icon) {
    const c = CATEGORY_BY_ID[category]
    icon = L.divIcon({
      className: 'bg-transparent',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      html: `<div class="pin${done ? ' pin-done' : ''}${selected ? ' pin-selected' : ''}" style="--c:${c?.color ?? '#fff'}">${done ? '✓' : (c?.glyph ?? '?')}</div>`,
    })
    cache.set(key, icon)
  }
  return icon
}

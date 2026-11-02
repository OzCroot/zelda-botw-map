import L from 'leaflet'
import { CATEGORY_BY_ID, MARKER_ICON_OVERRIDES, iconScale } from '../../data/categories'

const cache = new Map<string, L.DivIcon>()

/**
 * Pin icon. Tries /icons/<name>.svg, then /icons/<name>.png, then falls back to the category glyph.
 */
export function markerIcon(category: string, done: boolean, selected: boolean, markerId?: string): L.DivIcon {
  const override = markerId ? MARKER_ICON_OVERRIDES[markerId] : undefined
  const key = `${category}|${override ?? ''}|${done}|${selected}`
  let icon = cache.get(key)
  if (!icon) {
    const c = CATEGORY_BY_ID[category]
    const name = override ?? c?.icon
    const img =
      name
        ? `<img src="/icons/${name}.svg" alt="" style="transform:scale(${iconScale(name)})" onerror="if(!this.dataset.p){this.dataset.p=1;this.src='/icons/${name}.png'}else{this.remove()}">`
        : ''
    icon = L.divIcon({
      className: 'bg-transparent',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      html: `<div class="pin${done ? ' pin-done' : ''}${selected ? ' pin-selected' : ''}" style="--c:${c?.color ?? '#fff'}">${c?.glyph ?? '?'}${img}</div>`,
    })
    cache.set(key, icon)
  }
  return icon
}

const labelCache = new Map<string, L.DivIcon>()
const esc = (t: string) => t.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`)

/** Text-only map label (used for landmarks): just the name, centred on the point. */
export function labelIcon(name: string): L.DivIcon {
  let icon = labelCache.get(name)
  if (!icon) {
    icon = L.divIcon({
      className: 'landmark-label',
      iconSize: [0, 0],
      html: `<span>${esc(name)}</span>`,
    })
    labelCache.set(name, icon)
  }
  return icon
}

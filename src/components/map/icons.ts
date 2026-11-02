import L from 'leaflet'
import { CATEGORY_BY_ID } from '../../data/categories'

const cache = new Map<string, L.DivIcon>()

/**
 * Pin icon. Tries /icons/<name>.svg, then /icons/<name>.png, then falls back to the category glyph.
 * `iconOverride` lets a marker use a variant (e.g. shrine_dlc).
 */
export function markerIcon(
  category: string,
  done: boolean,
  selected: boolean,
  iconOverride?: string,
): L.DivIcon {
  const key = `${category}|${done}|${selected}|${iconOverride ?? ''}`
  let icon = cache.get(key)
  if (!icon) {
    const c = CATEGORY_BY_ID[category]
    const name = iconOverride ?? c?.icon
    const img =
      name && !done
        ? `<img src="/icons/${name}.svg" alt="" onerror="if(!this.dataset.p){this.dataset.p=1;this.src='/icons/${name}.png'}else{this.remove()}">`
        : ''
    icon = L.divIcon({
      className: 'bg-transparent',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      html: `<div class="pin${done ? ' pin-done' : ''}${selected ? ' pin-selected' : ''}" style="--c:${c?.color ?? '#fff'}">${done ? '✓' : (c?.glyph ?? '?')}${img}</div>`,
    })
    cache.set(key, icon)
  }
  return icon
}

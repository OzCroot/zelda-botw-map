import L from 'leaflet'
import { CATEGORY_BY_ID, MARKER_ICON_OVERRIDES, iconScale } from '../../data/categories'

const cache = new Map<string, L.DivIcon>()

// Icons are .svg unless that file is missing, in which case there is a .png. Remember what each one turned out
// to be so a missing .svg is requested once, not once per pin.
const pngOnly = new Set<string>()
export const markPng = (name: string) => void pngOnly.add(name)
export const iconSrc = (name: string) => `/icons/${name}.${pngOnly.has(name) ? 'png' : 'svg'}`

/**
 * Error handler for pin images (attached once on the map container, in the capture phase, since image errors
 * don't bubble): .svg missing -> try .png and remember it; .png missing too -> drop the image and show the glyph.
 */
export function handlePinImageError(e: Event) {
  const img = e.target
  if (!(img instanceof HTMLImageElement) || !img.dataset.icon) return
  const name = img.dataset.icon
  if (img.src.endsWith('.svg')) {
    markPng(name)
    img.src = iconSrc(name)
  } else img.remove()
}

/**
 * Pin icon. Tries /icons/<name>.svg, then /icons/<name>.png, then falls back to the category glyph.
 */
export function markerIcon(
  category: string,
  done: boolean,
  selected: boolean,
  markerId?: string,
): L.DivIcon {
  const override = markerId ? MARKER_ICON_OVERRIDES[markerId] : undefined
  const key = `${category}|${override ?? ''}|${done}|${selected}`
  let icon = cache.get(key)
  if (!icon) {
    const c = CATEGORY_BY_ID[category]
    const name = override ?? c?.icon
    const img = name
      ? `<img src="${iconSrc(name)}" data-icon="${name}" alt="" style="transform:scale(${iconScale(name)})">`
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
export function labelIcon(name: string, className = 'landmark-label'): L.DivIcon {
  const key = `${className}|${name}`
  let icon = labelCache.get(key)
  if (!icon) {
    icon = L.divIcon({
      className,
      iconSize: [0, 0],
      html: `<span>${esc(name)}</span>`,
    })
    labelCache.set(key, icon)
  }
  return icon
}

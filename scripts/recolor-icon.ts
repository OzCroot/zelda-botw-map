/**
 * Re-applies a colour family from design/icon-palette.json to an SVG.
 *
 *   npm run recolor-icon -- <in.svg> <family> [--glow] [--pad 0.22] [-o out.svg]
 *   e.g. npm run recolor-icon -- public/icons/stamps/shield.svg gold --glow -o out/shield-gold.svg
 *
 * Flat fills are mapped by lightness: the icon's lightest fill becomes the family's lightest tone, and so on
 * (a single-colour icon simply becomes the family's base). Existing toolkit-style glow filters are recoloured;
 * --glow adds a two-layer glow to icons that have none (the canvas is padded so it isn't clipped).
 */
import { readFileSync, writeFileSync } from 'node:fs'

type Family = { base: string; tones: string[]; glow?: string | null; glowDeep?: string | null; outline?: string | null }
const palette = JSON.parse(readFileSync(new URL('../design/icon-palette.json', import.meta.url), 'utf8')) as {
  toolkit: Record<string, Family>
  project: Record<string, Family>
}
const families: Record<string, Family> = { ...palette.toolkit, ...palette.project }

const args = process.argv.slice(2)
const flag = (f: string) => args.includes(f)
const outIdx = args.indexOf('-o')
const out = outIdx >= 0 ? args[outIdx + 1] : undefined
const padIdx = args.indexOf('--pad')
const padFrac = padIdx >= 0 ? Number(args[padIdx + 1]) : 0.22 // canvas padding added around the art for --glow
const valueIdx = new Set([outIdx, padIdx].filter((i) => i >= 0).map((i) => i + 1)) // indexes holding -o / --pad values
const [input, familyName] = args.filter((a, i) => !a.startsWith('-') && !valueIdx.has(i))
if (!input || !familyName || !families[familyName])
  throw new Error(`usage: recolor-icon <in.svg> <family> [--glow] [-o out.svg]\nfamilies: ${Object.keys(families).join(', ')}`)
const fam = families[familyName]!

const NAMED: Record<string, string> = { white: '#FFFFFF', black: '#000000' }
const norm = (c: string) => {
  const l = c.toLowerCase()
  if (NAMED[l]) return NAMED[l]!
  if (/^#[0-9a-f]{3}$/.test(l)) return ('#' + [...l.slice(1)].map((x) => x + x).join('')).toUpperCase()
  return l.toUpperCase()
}
const lum = (h: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const COLOUR = /(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\bwhite\b|\bblack\b)/
const FILL_RE = new RegExp(`((?:fill|stroke)\\s*[=:]\\s*["']?\\s*)${COLOUR.source}`, 'g')

let svg = readFileSync(input, 'utf8')

// 1. flat fills / strokes -> family tones, matched by lightness rank
const seen = new Set<string>()
for (const m of svg.matchAll(FILL_RE)) seen.add(norm(m[2]!))
const src = [...seen].sort((a, b) => lum(b) - lum(a))
const dst = [...new Set(fam.tones.map(norm))].sort((a, b) => lum(b) - lum(a))
const map = new Map<string, string>()
src.forEach((c, i) => {
  if (src.length === 1) return map.set(c, norm(fam.base))
  map.set(c, dst[Math.round((i * (dst.length - 1)) / (src.length - 1))]!)
})
svg = svg.replace(FILL_RE, (_all, pre: string, c: string) => pre + (map.get(norm(c)) ?? c))

// 2. existing glow (feColorMatrix colour columns) -> glow / glowDeep
const hex2 = (h: string) => [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4))
const glowMatrices = [...svg.matchAll(/(<feColorMatrix[^>]*values=")([^"]+)(")/g)].filter((m) => {
  const v = m[2]!.split(/\s+/).map(Number)
  return v.length === 20 && v[3] === 0 && v[18] !== 127 && (v[4] || v[9] || v[14])
})
let hasGlow = glowMatrices.length > 0
if (hasGlow && fam.glow) {
  const toHex = (v: number[]) => '#' + [v[4], v[9], v[14]].map((x) => Math.round(x! * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
  const colours = [...new Set(glowMatrices.map((m) => toHex(m[2]!.split(/\s+/).map(Number))))].sort((a, b) => lum(b) - lum(a))
  const gm = new Map(colours.map((c, i) => [c, i === 0 ? fam.glow! : (fam.glowDeep ?? fam.glow!)]))
  svg = svg.replace(/(<feColorMatrix[^>]*values=")([^"]+)(")/g, (all, a: string, vals: string, z: string) => {
    const v = vals.split(/\s+/).map(Number)
    if (v.length !== 20 || v[3] !== 0 || v[18] === 127 || !(v[4] || v[9] || v[14])) return all
    const to = gm.get(toHex(v))!
    const [r, g, b] = hex2(to)
    return `${a}${[0, 0, 0, 0, r, 0, 0, 0, 0, g, 0, 0, 0, 0, b, 0, 0, 0, 1, 0].join(' ')}${z}`
  })
} else if (hasGlow && !fam.glow) {
  // a flat family (cream/white/black): drop the glow entirely
  svg = svg.replace(/\sfilter="url\(#[^)]+\)"/g, '')
  hasGlow = false
}

// 3. --glow on an icon that has none
let glowScale = 1
if (flag('--glow') && !hasGlow && fam.glow) {
  const vb = /viewBox="([-\d.\s]+)"/.exec(svg)
  if (vb) {
    const [x, y, w, h] = vb[1]!.trim().split(/\s+/).map(Number)
    const size = Math.max(w!, h!)
    const scale = size / 62 // the toolkit's glow is tuned for ~62-unit icons
    const pad = size * padFrac
    svg = svg.replace(vb[0], `viewBox="${x! - pad} ${y! - pad} ${w! + 2 * pad} ${h! + 2 * pad}"`)
    glowScale = scale
  }
  const deep = fam.glowDeep ?? fam.glow
  const defs = `<defs><filter id="palette-glow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0" stdDeviation="${+(6 * glowScale).toFixed(2)}" flood-color="${fam.glow}" flood-opacity="1" result="o"/><feDropShadow in="o" dx="0" dy="0" stdDeviation="${+(1.2 * glowScale).toFixed(2)}" flood-color="${deep}" flood-opacity="1"/></filter></defs>`
  svg = svg.replace(/(<svg\b[^>]*>)([\s\S]*)(<\/svg>)/, `$1${defs}<g filter="url(#palette-glow)">$2</g>$3`)
}

if (out) writeFileSync(out, svg)
else process.stdout.write(svg)
console.error(`${familyName}: ${[...map].map(([a, b]) => `${a}→${b}`).join(' ') || 'no fills'}${hasGlow || flag('--glow') ? ' + glow' : ''}`)

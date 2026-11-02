// Splits public/brand/sheikah-alphabet.svg (one strip: a Latin row and a rune row) into one SVG per letter:
//   public/alphabet/latin/a.svg … z.svg
//   public/alphabet/rune/a.svg … z.svg   (named for the Latin letter each rune stands for)
// Each file keeps the original fill and glow filter and gets a viewBox shared by its whole row, so the
// glyphs share a size and baseline.
//
//   node scripts/split-sheikah-alphabet.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const SRC = 'public/brand/sheikah-alphabet.svg'
const OUT = 'public/alphabet'
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')
const PAD = 12 // room for the glow
const GAP = 2 // Latin: subpaths closer than this (in x) belong to the same glyph

const svg = readFileSync(SRC, 'utf8')
const groups = [...svg.matchAll(/<g filter="[^"]*">\s*<path d="([^"]+)" fill="([^"]+)"\/>/g)].map(
  (m) => ({
    d: m[1],
    fill: m[2],
  }),
)
if (groups.length !== 2) throw new Error(`expected 2 rows, found ${groups.length}`)

/** Split a path of absolute commands (M H V L C Z) into subpaths with their bounding boxes. */
function subpaths(d) {
  const out = []
  for (const part of d.split(/(?=M)/)) {
    const tokens = part.match(/[A-Za-z]|-?\d*\.?\d+/g)
    let x = 0
    let y = 0
    const xs = []
    const ys = []
    const point = (px, py) => {
      x = px
      y = py
      xs.push(x)
      ys.push(y)
    }
    for (let i = 0; i < tokens.length;) {
      const cmd = tokens[i++]
      const n = () => Number(tokens[i++])
      if (cmd === 'M' || cmd === 'L') point(n(), n())
      else if (cmd === 'H') point(n(), y)
      else if (cmd === 'V') point(x, n())
      else if (cmd === 'C') {
        // control points bound the curve, which is plenty to tell glyphs apart
        for (let k = 0; k < 2; k++) {
          xs.push(n())
          ys.push(n())
        }
        point(n(), n())
      } else if (cmd !== 'Z') throw new Error(`unsupported path command ${cmd}`)
    }
    out.push({
      d: part,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    })
  }
  return out
}

const merge = (glyphs, p) => {
  const g = glyphs.at(-1)
  g.parts.push(p)
  g.maxX = Math.max(g.maxX, p.maxX)
  g.minY = Math.min(g.minY, p.minY)
  g.maxY = Math.max(g.maxY, p.maxY)
}
const start = (glyphs, p) =>
  glyphs.push({ parts: [p], minX: p.minX, maxX: p.maxX, minY: p.minY, maxY: p.maxY })

/**
 * Group subpaths into glyphs.
 * - Latin letters don't overlap one another, so subpaths overlapping in x (a letter and its dot, a bowl and its
 *   counter) belong together.
 * - Runes are drawn in fixed 30-unit cells starting at x = 11, and many are made of pieces with gaps between
 *   them, so they are assigned to a cell instead.
 */
function glyphsOf(d, kind) {
  const parts = subpaths(d).sort((a, b) => a.minX - b.minX)
  const glyphs = []
  if (kind === 'rune') {
    const cells = new Map()
    for (const p of parts) {
      const cell = Math.floor((p.minX - 11) / 30)
      if (!cells.has(cell)) cells.set(cell, [])
      cells.get(cell).push(p)
    }
    for (const cell of [...cells.keys()].sort((a, b) => a - b)) {
      const [first, ...rest] = cells.get(cell)
      start(glyphs, first)
      rest.forEach((p) => merge(glyphs, p))
      const g = glyphs.at(-1)
      g.minX = Math.min(...g.parts.map((p) => p.minX))
      g.maxX = Math.max(...g.parts.map((p) => p.maxX))
    }
    return glyphs
  }
  for (const p of parts) {
    const g = glyphs.at(-1)
    if (g && p.minX <= g.maxX + GAP) merge(glyphs, p)
    else start(glyphs, p)
  }
  return glyphs
}

const f = (n) => +n.toFixed(3)

function write(kind, { d, fill }) {
  const glyphs = glyphsOf(d, kind)
  if (glyphs.length !== 26) throw new Error(`${kind}: found ${glyphs.length} glyphs, expected 26`)
  const rowMinY = Math.min(...glyphs.map((g) => g.minY))
  const rowMaxY = Math.max(...glyphs.map((g) => g.maxY))
  const cellW = Math.max(...glyphs.map((g) => g.maxX - g.minX)) + 2 * PAD
  const h = rowMaxY - rowMinY + 2 * PAD
  mkdirSync(`${OUT}/${kind}`, { recursive: true })
  glyphs.forEach((g, i) => {
    const vx = (g.minX + g.maxX) / 2 - cellW / 2
    const vy = rowMinY - PAD
    const box = `${f(vx)} ${f(vy)} ${f(cellW)} ${f(h)}`
    const file = `<svg width="${f(cellW)}" height="${f(h)}" viewBox="${box}" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#glow)">
<path d="${g.parts.map((p) => p.d).join('')}" fill="${fill}"/>
</g>
<defs>
<filter id="glow" x="${f(vx)}" y="${f(vy)}" width="${f(cellW)}" height="${f(h)}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset/>
<feGaussianBlur stdDeviation="5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.308377 0 0 0 0 0.751016 0 0 0 0 1 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="5.5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.0385764 0 0 0 0 0.552554 0 0 0 0 0.841667 0 0 0 1 0"/>
<feBlend mode="hard-light" in2="effect1_dropShadow" result="effect2_dropShadow"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape"/>
<feGaussianBlur stdDeviation="0.5" result="effect3_foregroundBlur"/>
</filter>
</defs>
</svg>
`
    writeFileSync(`${OUT}/${kind}/${LETTERS[i]}.svg`, file)
  })
  console.log(`${kind}: 26 glyphs, ${f(cellW)} x ${f(h)}`)
}

// The strip has the rune row first (rectilinear paths), then the Latin row (curves).
const [runes, latin] = groups
write('rune', runes)
write('latin', latin)

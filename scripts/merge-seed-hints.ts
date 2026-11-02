/**
 * Merges Korok seed finding hints from a browser-exported file into src/data/generated/seed-hints.json.
 *
 *   npm run merge-seed-hints -- /path/to/seeds-raw.json
 *
 * The export is a JSON array of { latitude, longitude, description, media } saved from your own browser.
 * Seeds are matched by position (the export has no shared ID): coordinates are scaled onto ours by their
 * extremes, nearest pairs are taken one-to-one, and a single leftover pair is resolved by elimination.
 * Output is gitignored local data — it is not ours to redistribute.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface Theirs { latitude: number; longitude: number; description?: string | null }
interface Ours { id: string; x: number; y: number }
export interface SeedHint { location?: string; puzzle?: string }

const file = process.argv[2]
if (!file) throw new Error('usage: npm run merge-seed-hints -- <seeds-raw.json>')

const theirs: Theirs[] = JSON.parse(readFileSync(file, 'utf8'))
const ours: Ours[] = JSON.parse(readFileSync(join('src', 'data', 'generated', 'markers.json'), 'utf8')).markers.filter(
  (m: { category: string }) => m.category === 'korok-seed',
)

const min = (a: number[]) => Math.min(...a)
const max = (a: number[]) => Math.max(...a)
const ax = (max(ours.map((o) => o.x)) - min(ours.map((o) => o.x))) / (max(theirs.map((t) => t.longitude)) - min(theirs.map((t) => t.longitude)))
const bx = min(ours.map((o) => o.x)) - ax * min(theirs.map((t) => t.longitude))
const ay = (max(ours.map((o) => o.y)) - min(ours.map((o) => o.y))) / (max(theirs.map((t) => t.latitude)) - min(theirs.map((t) => t.latitude)))
// y grows southwards while latitude grows northwards
const y0 = min(ours.map((o) => o.y)) + ay * max(theirs.map((t) => t.latitude))
const project = (t: Theirs) => ({ x: ax * t.longitude + bx, y: y0 - ay * t.latitude })

const cand: [number, number, number][] = []
theirs.forEach((t, ti) => {
  const p = project(t)
  ours.forEach((o, oi) => {
    const d = Math.hypot(o.x - p.x, o.y - p.y)
    if (d < 150) cand.push([d, oi, ti])
  })
})
cand.sort((a, b) => a[0] - b[0])
const oursTaken = new Map<number, number>() // oi -> ti
const theirsTaken = new Set<number>()
const dist = new Map<number, number>()
for (const [d, oi, ti] of cand) {
  if (oursTaken.has(oi) || theirsTaken.has(ti)) continue
  oursTaken.set(oi, ti)
  theirsTaken.add(ti)
  dist.set(oi, d)
}
// Process of elimination: one seed left on each side must be each other's.
const freeOurs = ours.map((_, i) => i).filter((i) => !oursTaken.has(i))
const freeTheirs = theirs.map((_, i) => i).filter((i) => !theirsTaken.has(i))
if (freeOurs.length === 1 && freeTheirs.length === 1) {
  const [oi] = freeOurs
  const [ti] = freeTheirs
  const p = project(theirs[ti!]!)
  oursTaken.set(oi!, ti!)
  dist.set(oi!, Math.hypot(ours[oi!]!.x - p.x, ours[oi!]!.y - p.y))
  console.log(`resolved by elimination: ${ours[oi!]!.id} (${dist.get(oi!)!.toFixed(0)} units apart)`)
} else console.log(`unresolved: ${freeOurs.length} of ours, ${freeTheirs.length} of theirs`)

/** "**Location:** … **Puzzle:** …" -> parts; plain one-liners are the puzzle hint. */
function parse(text: string): SeedHint {
  const clean = text.replace(/\r/g, '').trim()
  const loc = clean.match(/\*\*Location:\*\*\s*([\s\S]*?)(?=\*\*Puzzle:\*\*|$)/)
  const puz = clean.match(/\*\*Puzzle:\*\*\s*([\s\S]*)$/)
  const tidy = (s?: string) => {
    const t = s?.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim()
    return t && !/^[?\s]+$/.test(t) ? t : undefined
  }
  if (!loc && !puz) return { puzzle: tidy(clean) }
  return { location: tidy(loc?.[1]), puzzle: tidy(puz?.[1]) }
}

const out: Record<string, SeedHint> = {}
for (const [oi, ti] of oursTaken) {
  const h = parse(theirs[ti]!.description ?? '')
  if (h.location || h.puzzle) out[ours[oi]!.id] = h
}
mkdirSync(join('src', 'data', 'generated'), { recursive: true })
writeFileSync(join('src', 'data', 'generated', 'seed-hints.json'), JSON.stringify(out))
const ds = [...dist.values()].sort((a, b) => a - b)
console.log(`matched ${oursTaken.size}/${ours.length}, hints for ${Object.keys(out).length}; median ${ds[ds.length >> 1]!.toFixed(1)}, max ${ds.at(-1)!.toFixed(0)} units`)

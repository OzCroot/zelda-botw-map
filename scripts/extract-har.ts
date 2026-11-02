/**
 * Extracts map tiles and icons from a HAR file you saved from your own browser session
 * (DevTools → Network → "Save all as HAR with content").
 *
 *   npm run extract-har -- path/to/session.har
 *
 *   .../maps/game/tiles/{z}/{x}_{y}.jpg  ->  public/tiles-legacy/{z}/{x}_{y}.jpg (legacy; prefer `npm run cut-tiles`)
 *   .../maps/game/icons/{name}.png       ->  public/icons/{name}.png
 *
 * Output folders are gitignored. Personal use only; the artwork belongs to Nintendo.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

interface Entry {
  request: { url: string }
  response: { status: number; content?: { text?: string; encoding?: string } }
}

const files = process.argv.slice(2)
if (!files.length) {
  console.error('Usage: npm run extract-har -- a.har [b.har ...]')
  process.exit(1)
}

const entries = files.flatMap(
  (f) => (JSON.parse(readFileSync(f, 'utf8')) as { log: { entries: Entry[] } }).log.entries,
)
const TILE = /\/maps\/game\/tiles\/(\d+)\/(\d+_\d+\.jpg)$/
const ICON = /\/maps\/game\/icons\/([a-z0-9_-]+\.(?:png|svg))$/i

let tiles = 0
let icons = 0
let noBody = 0
const zooms = new Map<string, number>()
const written = new Set<string>()

for (const e of entries) {
  if (e.response.status !== 200) continue
  const url = e.request.url.split('?')[0]!
  const tile = TILE.exec(url)
  const icon = ICON.exec(url)
  const dest = tile ? join('public', 'tiles-legacy', tile[1]!, tile[2]!) : icon ? join('public', 'icons', icon[1]!) : null
  if (!dest) continue
  const { text, encoding } = e.response.content ?? {}
  if (!text) {
    noBody++
    continue
  }
  if (written.has(dest)) continue // HARs often list a resource twice
  written.add(dest)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, Buffer.from(text, encoding === 'base64' ? 'base64' : 'utf8'))
  if (tile) {
    tiles++
    zooms.set(tile[1]!, (zooms.get(tile[1]!) ?? 0) + 1)
  } else icons++
}

console.log(`Extracted ${tiles} tiles and ${icons} icons.`)
for (const [z, n] of [...zooms].sort()) console.log(`  zoom ${z}: ${n} / ${4 ** Number(z)} tiles`)
if (noBody) console.warn(`${noBody} entries had no body — re-save the HAR with "content" included.`)

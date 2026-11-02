/**
 * Extracts map icons from a HAR file you saved from your own browser session
 * (DevTools → Network → export HAR with content).
 *
 *   npm run extract-har -- a.har [b.har ...]
 *
 *   .../icons/{name}.png|svg  ->  public/icons/{name}.png|svg
 *
 * The output folder is gitignored. Personal use only; the artwork belongs to Nintendo.
 * (Map tiles are no longer extracted — cut them from a full-size export with `npm run cut-tiles`.)
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
const ICON = /\/icons\/([a-z0-9_-]+\.(?:png|svg))$/i

let icons = 0
let noBody = 0
const written = new Set<string>()

for (const e of entries) {
  if (e.response.status !== 200) continue
  const icon = ICON.exec(e.request.url.split('?')[0]!)
  if (!icon) continue
  const dest = join('public', 'icons', icon[1]!)
  const { text, encoding } = e.response.content ?? {}
  if (!text) {
    noBody++
    continue
  }
  if (written.has(dest)) continue // HARs often list a resource twice
  written.add(dest)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, Buffer.from(text, encoding === 'base64' ? 'base64' : 'utf8'))
  icons++
}

console.log(`Extracted ${icons} icons.`)
if (noBody) console.warn(`${noBody} entries had no body — re-save the HAR with "content" included.`)

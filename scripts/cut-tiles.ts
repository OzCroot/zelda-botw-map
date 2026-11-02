/**
 * Cuts a full-size map export into a slippy-style tile pyramid.
 *
 *   npm run cut-tiles -- ~/Downloads/botw/botw_map.png [outDir=public/tiles] [--lossless-all | --lossy[=82]]
 *
 * Encoding (default hybrid): zoom 5 is lossless WebP — exact copies of the source pixels, and smaller
 * than PNG or near-lossless on this flat-colour map. Zoom 0-4 are resampled from the source anyway, so
 * they use high-quality lossy WebP (q92) instead of paying ~4x the size for "exact" copies of a resample.
 * `--lossless-all` makes every level lossless (~140 MB); `--lossy[=q]` makes every level lossy (~half size).
 *
 * Layout: 750px tiles, max zoom 5 where 1 map unit = 1 source pixel, tiles named {z}/{x}_{y}.webp.
 * Only the real image area is tiled (no padding to a square); partial edge tiles are padded with
 * transparency. For a 24000x20000 source that is a 32x27 grid at zoom 5.
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const lossyArg = args.find((a) => a.startsWith('--lossy'))
const [src, outDir = join('public', 'tiles')] = args.filter((a) => !a.startsWith('--'))
if (!src) {
  console.error('Usage: npm run cut-tiles -- map.png [outDir]')
  process.exit(1)
}

const TILE = 750
const MAX_ZOOM = 5
const losslessAll = args.includes('--lossless-all')
const LOSSY_QUALITY = lossyArg?.includes('=') ? Number(lossyArg.split('=')[1]) : lossyArg ? 82 : 92
const encode = (img: sharp.Sharp, z: number) =>
  losslessAll || (!lossyArg && z === MAX_ZOOM)
    ? img.webp({ lossless: true, effort: 6 })
    : img.webp({ quality: LOSSY_QUALITY })

const base = await sharp(src, { limitInputPixels: false }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels } = base.info
console.log(`source ${W}x${H}`)

let total = 0
for (let z = MAX_ZOOM; z >= 0; z--) {
  const scale = 2 ** (z - MAX_ZOOM)
  const w = Math.round(W * scale)
  const h = Math.round(H * scale)
  const level =
    z === MAX_ZOOM
      ? base
      : await sharp(base.data, { raw: { width: W, height: H, channels }, limitInputPixels: false })
          .resize(w, h, { kernel: 'lanczos3' })
          .raw()
          .toBuffer({ resolveWithObject: true })
  const cols = Math.ceil(w / TILE)
  const rows = Math.ceil(h / TILE)
  mkdirSync(join(outDir, String(z)), { recursive: true })

  const jobs: (() => Promise<unknown>)[] = []
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      jobs.push(() => {
        const left = x * TILE
        const top = y * TILE
        const width = Math.min(TILE, w - left)
        const height = Math.min(TILE, h - top)
        let img = sharp(level.data, { raw: { width: w, height: h, channels }, limitInputPixels: false }).extract({ left, top, width, height })
        if (width < TILE || height < TILE) {
          img = img
            .ensureAlpha()
            .extend({ right: TILE - width, bottom: TILE - height, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        }
        return encode(img, z).toFile(join(outDir, String(z), `${x}_${y}.webp`))
      })
    }
  }
  for (let i = 0; i < jobs.length; i += 8) await Promise.all(jobs.slice(i, i + 8).map((j) => j()))
  total += jobs.length
  console.log(`zoom ${z}: ${cols}x${rows} = ${jobs.length} tiles (${w}x${h})`)
}
console.log(`done: ${total} tiles in ${outDir}`)

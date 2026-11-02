# Hyrule Tracker

A local-first interactive map & completion tracker for *Breath of the Wild*.
React 19 · TypeScript · Tailwind v4 · Leaflet · Zustand · Vite.

- **Local storage** — progress, notes and filters persist in your browser; no account, no server.
- **Export / import** — JSON (with merge-or-replace and a diff preview), CSV, and a short share code.
- **Mobile-first panel** — draggable bottom sheet, 44px touch targets, details in the sheet instead of tiny popups.
- **UX** — fuzzy search (`/`), undo on every check-off, filter presets, hide-completed, region filter, deep links (`?m=<id>`), keyboard shortcuts (`c` complete, `Esc` close), dark/light.
- **Data presented better** — progress dashboard by category/region, virtualized list synced to the map filters, region drill-down.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test && npm run build
```

Out of the box the app uses a small **sample dataset** (`src/data/sample/markers.json`, placeholder points).

## Using real marker data

Marker data and map tiles are third-party content (the source site / Nintendo) and are **gitignored**.
Keep it for personal use; get permission before deploying publicly.

1. In your browser, open each marker file and save it into `data/raw/source/`
   (`locations.json`, `pins.json`, `seeds.json`, `treasures.json`, `wiki.json`).
   The site sits behind a bot check, so download manually rather than via script.
2. `npm run import-data` → writes `src/data/generated/markers.json` (validated with zod).
   The source mapper in `scripts/import-data.ts` is best-effort — adjust `toMarkers()` to the real schema
   and category names (must match ids in `src/data/categories.ts`).
3. Map tiles: cut them from a full-size map export (24000x20000 PNG) you own:
   `npm run cut-tiles -- path/to/botw_map.png` → `public/tiles/{z}/{x}_{y}.webp`
   (750px tiles, zoom 0–5, 32×27 grid at max zoom, 1 map unit = 1 source pixel; ~1,165 tiles, ~43 MB).
   Marker coordinates are `[lat, lng]` from the image centre; `fromSource()` in `src/data/regions.ts` converts them.
   Icons (optional): `npm run extract-har -- session.har` pulls icons out of a browser HAR you saved
   (it also saves legacy source tiles to `public/tiles-legacy/`, which the app doesn't use). All three folders are gitignored.

Optional SVG map icons (towers, shrines, shops, …) can be dropped into `public/icons/<name>.svg`; pins try SVG, then PNG, then a glyph.
The [RotP Object Map](https://objmap.relicsofthepast.dev) (a fork of zeldamods/objmap) serves 13 of them at `/icons/mapicon_*.svg`.

An open alternative source is [zeldamods/objmap](https://github.com/zeldamods/objmap) (GPL-3.0); add an adapter to `import-data.ts`.

## Roadmap (ways to present the data better)

- Heatmap of remaining items; "nearest incomplete" route suggestion
- Completion-over-time chart (timestamps are already stored)
- Printable per-region checklist; PWA/offline
- Publish the normalized dataset as a versioned JSON/npm package if you own redistribution rights

# Hyrule Tracker

A local-first interactive map and completion tracker for *The Legend of Zelda: Breath of the Wild*.
Search the map, check things off as you play, and keep your progress in your own browser — no account, no server.

> **Unofficial fan project.** Not affiliated with or endorsed by Nintendo. *The Legend of Zelda* and *Breath of the Wild*
> are trademarks of Nintendo, and the game's map, art and data belong to them. **This repository contains no game
> assets** — only the app, a small placeholder sample dataset, and tools to build tiles and data from material you supply
> yourself. See [Bring your own data](#bring-your-own-data).

## Features

**Track your progress**
- Check off shrines, Koroks, towers, memories, quests, chests, bosses and more, with an **undo** toast on every change.
- Progress, notes and filters are saved in **local storage**. Nothing leaves your device.
- A **progress dashboard** shows completion overall, by category and by region.
- **Export** your progress as JSON or CSV, and **import** it back with a diff preview and a merge-or-replace choice.
  A short **share code** moves progress between devices.

**Explore the map**
- Smooth, tiled Leaflet map with clustering, 40+ marker categories and optional icon art.
- **Search** is fuzzy and keyboard-first (`/` to focus). Picking a result switches its category on if needed, flies the
  map to the marker and highlights it with a label.
- Filter by category group, use quick presets (*Shrine hunt*, *Korok run*, *Story*, …), hide completed items, or focus on a region.
- A **list view** (virtualized, sortable) stays in sync with the map filters.
- Selecting a marker opens a **details dialog** with a complete/undo button and a personal note.

**Built for phones too**
- Mobile layout with a draggable bottom sheet, 44px touch targets and safe-area padding.
- Dark and light themes.

**Shareable links**

| Link | Effect |
|---|---|
| `?m=<markerId>` | Reveal a marker and open its details |
| `?focus=<markerId>` | Reveal a marker on the map only |
| `?tab=filters\|list\|stats\|data` | Open a panel tab |
| `?q=<text>` | Pre-fill the search box |

Keyboard: `/` search · `c` toggle the selected marker complete · `Esc` close.

## Quick start

Requires **Node.js 22+** and npm.

```bash
git clone https://github.com/OzCroot/zelda-botw-map.git
cd zelda-botw-map
npm install
npm run dev          # http://localhost:5173
```

Out of the box the app runs on a small **placeholder sample dataset** (about 80 invented points) so you can try every feature
immediately. To get the real map, follow the next section.

## Bring your own data

The app needs two things that are not included in this repo. Both folders below are gitignored.

### 1. Marker data

Put a dataset at `src/data/generated/markers.json`. It is picked up automatically in preference to the sample:

```jsonc
{
  "version": "2026-01-01",
  "source": "imported",
  "regions": [{ "id": "hebra", "label": "Hebra", "x": 5300, "y": 4600 }],
  "markers": [
    {
      "id": "shrine:example",
      "category": "shrine",          // an id from src/data/categories.ts
      "name": "Example Shrine",
      "x": 10000, "y": 9000,         // map units — see below
      "region": "hebra",
      "description": "optional",
      "tags": ["DLC"]                // optional
    }
  ]
}
```

- **Coordinates** are pixels of the full-size map image: origin at the top-left, `x` east, `y` south.
- **Categories** (ids, labels, colours, which ones are checkable) live in [`src/data/categories.ts`](src/data/categories.ts).
- The shape is validated with [zod](https://zod.dev) ([`src/data/schema.ts`](src/data/schema.ts)); an invalid file falls back to the sample.

### 2. Map tiles

Provide your own tile pyramid from a full-size map image you have the right to use (the app is configured for **24000 × 20000 px**).
Tiles are 750px WebP files for zoom 0–5, laid out as `public/tiles/{z}/{x}_{y}.webp`.
If your image is a different size, adjust `MAP_W` / `MAP_H` in [`src/data/regions.ts`](src/data/regions.ts).

Without tiles the map still works on a plain grid.

### 3. Icons (optional)

Icons live in `public/icons/` (grouped in subfolders such as `travel/`, `quest/`, `stamps/`, `locations/`) as `<path>.svg` or `.png`. Pins try SVG, then PNG, then fall back to a built-in glyph. Icon paths (relative to that folder, no extension) are the
`icon` fields in [`src/data/categories.ts`](src/data/categories.ts).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests (Vitest) |
| `npm run lint` | Lint with oxlint |
| `npm run format` | Format with Prettier |

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · [shadcn/ui](https://ui.shadcn.com) (Base UI) · Leaflet / react-leaflet · Zustand · zod · Fuse.js · TanStack Virtual

```
src/
  components/   map, panels, filters, list, progress dashboard, settings, shadcn/ui primitives
  data/         categories, schema, dataset loader, map geometry, sample data
  store/        progress (persisted to localStorage) and UI state
  lib/          export/import, share codes, search
  hooks/        URL deep links, filtering, undo-on-toggle
design/         icon colour palette
```

## Roadmap

- Heatmap of remaining items and a "nearest incomplete" route suggestion
- Completion-over-time chart (timestamps are already stored)
- Printable per-region checklists and offline/PWA support
- Clearer names for repeated markers (e.g. individual Korok seeds)

## Acknowledgements

Thanks to the community projects that make map tooling like this possible, notably
[zeldamods/objmap](https://github.com/zeldamods/objmap), an open-source object map for the game.

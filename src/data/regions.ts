/** Map extents in game units (x east, y south). */
export const MAP_W = 12000
export const MAP_H = 10000

export interface Region {
  id: string
  label: string
  /** [x0, y0, x1, y1] bounding box, first match wins. */
  box: [number, number, number, number]
}

/** Coarse bounding boxes — approximate, good enough for stats & drill-down. */
export const REGIONS: Region[] = [
  { id: 'hebra', label: 'Hebra', box: [0, 0, 3600, 3200] },
  { id: 'tabantha', label: 'Tabantha', box: [3600, 0, 6600, 3200] },
  { id: 'akkala', label: 'Akkala', box: [9000, 0, 12000, 3200] },
  { id: 'eldin', label: 'Eldin', box: [6600, 0, 9000, 3200] },
  { id: 'gerudo', label: 'Gerudo', box: [0, 6800, 4200, 10000] },
  { id: 'faron', label: 'Faron', box: [8000, 6800, 12000, 10000] },
  { id: 'lanayru', label: 'Lanayru', box: [8000, 3200, 12000, 6800] },
  { id: 'hateno', label: 'Hateno', box: [6600, 6800, 8000, 10000] },
  { id: 'ridgeland', label: 'Ridgeland', box: [0, 3200, 3600, 6800] },
  { id: 'hyrule', label: 'Central Hyrule', box: [3600, 3200, 8000, 6800] },
  { id: 'dueling', label: 'Dueling Peaks', box: [4200, 6800, 6600, 10000] },
]

export function regionOf(x: number, y: number): string {
  for (const r of REGIONS) {
    const [x0, y0, x1, y1] = r.box
    if (x >= x0 && x < x1 && y >= y0 && y < y1) return r.id
  }
  return 'hyrule'
}

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]))

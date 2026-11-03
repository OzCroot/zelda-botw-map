export type MarkerId = string

export interface Marker {
  id: MarkerId
  category: string
  name: string
  /** Game-space east/west, 0..MAP_W */
  x: number
  /** Game-space north/south (0 = north edge), 0..MAP_H */
  y: number
  layer?: 'surface' | 'sky' | 'depths'
  tags?: string[]
  region?: string
  description?: string
  wikiUrl?: string
  /** Shrines only: the shrine's blessing name, e.g. "Dila Maag's Blessing". */
  blessing?: string
  /** Extra facts shown in the dialog, in order (e.g. Treasure, Requirements). */
  details?: {
    label: string
    value: string
    /** Id of a marker this row links to (shown as a link that reveals it). */ marker?: string
    /** Words in `value` that link to a wiki page (opened in a new tab). */ links?: {
      name: string
      url: string
    }[]
  }[]
  /** Korok seeds with a route (flower trail, race): map points [x, y] in the order to follow them. Shown on request. */
  path?: [number, number][]
  /** Clothing only: the armor set an item belongs to ("Other" if none). */
  set?: string
  /** Landmarks only: lowest map zoom at which the label is shown. */
  minZoom?: number
}

/** Text-only area name (subregion) drawn on the map between minZoom and maxZoom (inclusive). */
export interface AreaLabel {
  id: string
  /** region = broadest names (zoomed far out); area = subregions. */
  kind?: 'region' | 'area'
  name: string
  x: number
  y: number
  minZoom: number
  maxZoom: number
}

export interface Category {
  id: string
  label: string
  group:
    | 'Travel'
    | 'Quests'
    | 'Collectibles'
    | 'Clothing'
    | 'Enemies'
    | 'Places'
    | 'Services'
    | 'Treasure'
  /** short glyph rendered in the map pin */
  glyph: string
  color: string
  /** whether the user can check it off */
  checkable: boolean
  /** shown on the map by default */
  defaultOn?: boolean
  /** optional PNG name in public/icons/ (without extension) */
  icon?: string
}

export interface RegionInfo {
  id: string
  label: string
  /** label position in map units */
  x: number
  y: number
}

export interface MarkerDataset {
  regions: RegionInfo[]
  labels?: AreaLabel[]
  version: string
  source: string
  markers: Marker[]
}

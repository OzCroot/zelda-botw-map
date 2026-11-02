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
  region?: string
  description?: string
  wikiUrl?: string
}

export interface Category {
  id: string
  label: string
  group: 'Collectibles' | 'Challenges' | 'Places' | 'Quests' | 'Enemies'
  /** short glyph rendered in the map pin */
  glyph: string
  color: string
  /** whether the user can check it off */
  checkable: boolean
}

export interface MarkerDataset {
  version: string
  source: string
  markers: Marker[]
}

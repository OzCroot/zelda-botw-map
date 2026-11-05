import type { Marker } from '../types/marker'

/** Markers tagged this only exist in Master Mode, and are hidden unless that is switched on. */
export const isMasterMode = (m: Pick<Marker, 'tags'>): boolean => !!m.tags?.includes('Master Mode')

/** The number in a Korok seed's id ("korok-seed:Seed474" -> "474"), or undefined for any other marker. */
export const seedNumber = (id: string): string | undefined => /Seed(\d+)$/.exec(id)?.[1]

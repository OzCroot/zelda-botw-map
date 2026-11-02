import type { AreaLabel, Marker } from '../types/marker'

/** Used when a landmark has no level of its own (e.g. the sample data): the source's main landmark level. */
export const DEFAULT_LANDMARK_ZOOM = 4

export const landmarkVisibleAt = (m: Pick<Marker, 'minZoom'>, zoom: number) =>
  zoom >= (m.minZoom ?? DEFAULT_LANDMARK_ZOOM)

/** maxZoom is inclusive, so a label with maxZoom 3 stays through zoom 3.5 and is gone at 4. */
export const areaVisibleAt = (l: Pick<AreaLabel, 'minZoom' | 'maxZoom'>, zoom: number) =>
  zoom >= l.minZoom && zoom < l.maxZoom + 1

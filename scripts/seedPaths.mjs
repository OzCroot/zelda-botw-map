// Korok seeds whose finding puzzle is a route (a trail of flowers, a race from start to goal ring) list several
// coordinates in the source data, in the order to follow them. This picks those out as map-space points.

const MAP_W = 24000
const MAP_H = 20000
/** Source [lat, lng] -> map units (same conversion as the marker positions). */
export const toMap = ([lat, lng]) => [Math.round(MAP_W / 2 + lng), Math.round(MAP_H / 2 - lat)]

/** Source groups (seeds.json) -> Map of marker id ("korok-seed:Seed474") -> [[x, y], …] for seeds with 2+ points. */
export function seedPaths(groups) {
  const paths = new Map()
  for (const group of groups)
    for (const layer of group.layers ?? [])
      for (const m of layer.markers ?? []) {
        if (Array.isArray(m.coords) && m.coords.length > 1)
          paths.set(`korok-seed:${m.id}`, m.coords.map(toMap))
      }
  return paths
}

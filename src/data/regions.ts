/**
 * Map extent in "map units": 1 unit = 1 pixel of the highest-zoom tile layer.
 * The tile set is a square 24000px image (32x32 tiles of 750px at max zoom 5).
 */
export const MAP_SIZE = 24000
export const TILE_SIZE = 750
export const MAX_NATIVE_ZOOM = 5

/**
 * Source data uses [lat, lng] with north/east positive and (0,0) at the map centre.
 * Converts to map units where (0,0) is the top-left corner and y grows southwards.
 * ASSUMPTION: origin is the exact centre of the square image — verify against real tiles.
 */
export const ORIGIN = MAP_SIZE / 2
export const fromSource = (lat: number, lng: number) => ({ x: ORIGIN + lng, y: ORIGIN - lat })

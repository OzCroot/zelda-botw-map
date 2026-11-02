/**
 * Map extent in "map units": 1 unit = 1 pixel of the full-size map export.
 * The export is 24000x20000, tiled as 750px tiles (32x27 at max zoom 5, 1 unit = 1px there).
 */
export const MAP_W = 24000
export const MAP_H = 20000
export const TILE_SIZE = 750
export const MAX_NATIVE_ZOOM = 5

/**
 * Source data uses [lat, lng] with north/east positive and (0,0) at the centre of the map image.
 * Converts to map units where (0,0) is the image's top-left corner and y grows southwards.
 * Verified against the real export: towers and shrines land on the expected terrain.
 */
export const fromSource = (lat: number, lng: number) => ({ x: MAP_W / 2 + lng, y: MAP_H / 2 - lat })

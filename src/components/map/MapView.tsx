import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { MAP_H, MAP_W, MAX_NATIVE_ZOOM, TILE_SIZE } from '../../data/regions'
import { MARKER_BY_ID, MARKERS } from '../../data/loadMarkers'
import { useVisibleMarkers } from '../../hooks/useVisibleMarkers'
import { useProgress } from '../../store/progress'
import { useUi } from '../../store/ui'
import { markerIcon } from './icons'

// Tile grid: zoom 0 = one TILE_SIZE-wide tile covering the whole map width; 1 map unit = 1px at max native zoom.
const K = TILE_SIZE / MAP_W
const CRS = L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(K, 0, -K, 0) })
const BOUNDS: L.LatLngBoundsExpression = [
  [-MAP_H, 0],
  [0, MAP_W],
]
const toLatLng = (x: number, y: number): L.LatLngExpression => [-y, x]

function Controller() {
  const map = useMap()
  const flyTo = useUi((s) => s.flyTo)
  const region = useUi((s) => s.region)

  useEffect(() => {
    // Open on the playable area (marker extent) rather than the whole padded tile square.
    const xs = MARKERS.map((m) => m.x)
    const ys = MARKERS.map((m) => m.y)
    if (!xs.length) {
      map.fitBounds(BOUNDS)
      return
    }
    map.fitBounds(
      [
        [-Math.max(...ys), Math.min(...xs)],
        [-Math.min(...ys), Math.max(...xs)],
      ],
      { padding: [24, 24], animate: false },
    )
  }, [map])

  // Clicking empty map clears the highlight.
  useMapEvents({ click: () => useUi.getState().clearFocus() })

  // Search results / deep links ask the map to show a marker at a zoom where it stands alone.
  useEffect(() => {
    const m = flyTo ? MARKER_BY_ID.get(flyTo.id) : null
    if (!m || !flyTo) return
    // Wait a frame so sibling layers (tiles) are attached before the view changes.
    const raf = requestAnimationFrame(() => {
      const zoom = Math.max(map.getZoom(), MAX_NATIVE_ZOOM)
      // A link opened on page load jumps straight there; later reveals animate.
      if (flyTo.n === 1 && performance.now() < 4000) map.setView(toLatLng(m.x, m.y), zoom, { animate: false })
      else map.flyTo(toLatLng(m.x, m.y), zoom, { duration: 0.8 })
    })
    return () => cancelAnimationFrame(raf)
  }, [map, flyTo])

  useEffect(() => {
    if (!region) return
    const pts = MARKERS.filter((m) => m.region === region)
    if (!pts.length) return
    const xs = pts.map((m) => m.x)
    const ys = pts.map((m) => m.y)
    map.flyToBounds(
      [
        [-Math.max(...ys), Math.min(...xs)],
        [-Math.min(...ys), Math.max(...xs)],
      ],
      { duration: 0.6, padding: [40, 40] },
    )
  }, [map, region])

  return null
}

export function MapView() {
  const visible = useVisibleMarkers()
  const completed = useProgress((s) => s.completed)
  const focusId = useUi((s) => s.focusId)
  const select = useUi((s) => s.select)
  const focused = focusId ? MARKER_BY_ID.get(focusId) : undefined

  return (
    <MapContainer
      crs={CRS}
      center={[-MAP_H / 2, MAP_W / 2]}
      zoom={1}
      minZoom={-1}
      maxZoom={MAX_NATIVE_ZOOM + 2}
      maxBounds={[
        [-MAP_H - 3000, -3000],
        [3000, MAP_W + 3000],
      ]}
      zoomSnap={0.5}
      zoomControl={false}
      attributionControl={false}
      className="map-grid h-full w-full"
    >
      <Controller />
      <TileLayer
        url="/tiles/{z}/{x}_{y}.webp"
        tileSize={TILE_SIZE}
        noWrap
        bounds={BOUNDS}
        minZoom={-1}
        minNativeZoom={0}
        maxNativeZoom={MAX_NATIVE_ZOOM}
        errorTileUrl="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={40} showCoverageOnHover={false}>
        {visible.map((m) => (
          <Marker
            key={m.id}
            position={toLatLng(m.x, m.y)}
            icon={markerIcon(
              m.category,
              m.id in completed,
              m.id === focusId,
              m.tags?.includes('DLC') ? 'shrine_dlc' : undefined,
            )}
            title={m.name}
            eventHandlers={{ click: () => select(m.id) }}
          />
        ))}
      </MarkerClusterGroup>
      {focused && (
        // Drawn outside the cluster group so the revealed marker is never hidden inside a cluster.
        <Marker
          key={focused.id}
          position={toLatLng(focused.x, focused.y)}
          icon={markerIcon(
            focused.category,
            focused.id in completed,
            true,
            focused.tags?.includes('DLC') ? 'shrine_dlc' : undefined,
          )}
          zIndexOffset={2000}
          eventHandlers={{ click: () => select(focused.id) }}
        >
          <Tooltip permanent direction="top" offset={[0, -22]}>
            {focused.name}
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  )
}

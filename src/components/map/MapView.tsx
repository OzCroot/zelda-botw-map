import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
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
  const selectedId = useUi((s) => s.selectedId)
  const region = useUi((s) => s.region)

  useEffect(() => {
    const m = selectedId ? MARKER_BY_ID.get(selectedId) : null
    if (m) map.flyTo(toLatLng(m.x, m.y), Math.max(map.getZoom(), 3), { duration: 0.6 })
  }, [map, selectedId])

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
  return null
}

export function MapView() {
  const visible = useVisibleMarkers()
  const completed = useProgress((s) => s.completed)
  const selectedId = useUi((s) => s.selectedId)
  const select = useUi((s) => s.select)

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
              m.id === selectedId,
              m.tags?.includes('DLC') ? 'shrine_dlc' : undefined,
            )}
            title={m.name}
            eventHandlers={{ click: () => select(m.id) }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}

import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { MAP_H, MAP_W, REGION_BY_ID } from '../../data/regions'
import { MARKER_BY_ID } from '../../data/loadMarkers'
import { useVisibleMarkers } from '../../hooks/useVisibleMarkers'
import { useProgress } from '../../store/progress'
import { useUi } from '../../store/ui'
import { markerIcon } from './icons'

// Standard slippy-tile layout: zoom 0 = one 256px tile covering a square of MAP_W units.
const K = 256 / MAP_W
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
    const r = REGION_BY_ID[region]
    if (r)
      map.flyToBounds(
        [
          [-r.box[3], r.box[0]],
          [-r.box[1], r.box[2]],
        ],
        { duration: 0.6 },
      )
  }, [map, region])

  useEffect(() => {
    map.fitBounds(BOUNDS)
  }, [map])
  return null
}

export function MapView() {
  const visible = useVisibleMarkers()
  const completed = useProgress((s) => s.completed)
  const selectedId = useUi((s) => s.selectedId)
  const select = useUi((s) => s.select)
  const theme = useUi((s) => s.theme)

  return (
    <MapContainer
      crs={CRS}
      center={[-MAP_H / 2, MAP_W / 2]}
      zoom={1}
      minZoom={0}
      maxZoom={6}
      maxBounds={[
        [-MAP_H - 1500, -1500],
        [1500, MAP_W + 1500],
      ]}
      zoomSnap={0.5}
      zoomControl={false}
      attributionControl={false}
      className={`h-full w-full ${theme === 'dark' ? 'map-grid-dark' : 'map-grid-light'}`}
    >
      <Controller />
      <TileLayer
        url="/tiles/{z}/{x}/{y}.png"
        tileSize={256}
        noWrap
        bounds={BOUNDS}
        maxNativeZoom={5}
        errorTileUrl="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={40} showCoverageOnHover={false}>
        {visible.map((m) => (
          <Marker
            key={m.id}
            position={toLatLng(m.x, m.y)}
            icon={markerIcon(m.category, m.id in completed, m.id === selectedId)}
            title={m.name}
            eventHandlers={{ click: () => select(m.id) }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}

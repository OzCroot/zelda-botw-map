import L from 'leaflet'
import { memo, useEffect, useMemo, useState } from 'react'
import type { Marker as MarkerData } from '../../types/marker'
import {
  ImageOverlay,
  MapContainer,
  Marker,
  Pane,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { MAP_H, MAP_W, MAX_NATIVE_ZOOM, TILE_SIZE } from '../../data/regions'
import { AREA_LABELS, MARKER_BY_ID, MARKERS } from '../../data/loadMarkers'
import { areaVisibleAt, landmarkVisibleAt } from '../../lib/labelVisibility'
import { useVisibleMarkers } from '../../hooks/useVisibleMarkers'
import { useProgress } from '../../store/progress'
import { useUi } from '../../store/ui'
import { ClusterLayer } from './ClusterLayer'
import { labelIcon, markerIcon } from './icons'

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
  useMapEvents({
    click: () => {
      useUi.getState().clearFocus()
      if (matchMedia('(max-width: 639px)').matches) useUi.getState().setMenuOpen(false)
    },
  })

  // Search results / deep links ask the map to show a marker at a zoom where it stands alone.
  useEffect(() => {
    const m = flyTo ? MARKER_BY_ID.get(flyTo.id) : null
    if (!m || !flyTo) return
    // Wait a frame so sibling layers (tiles) are attached before the view changes.
    const raf = requestAnimationFrame(() => {
      const zoom = Math.max(map.getZoom(), MAX_NATIVE_ZOOM)
      // A link opened on page load jumps straight there; later reveals animate.
      if (flyTo.n === 1 && performance.now() < 4000)
        map.setView(toLatLng(m.x, m.y), zoom, { animate: false })
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

/** Current zoom and a padded viewport, refreshed when panning or zooming ends. */
function useViewport() {
  const map = useMap()
  const read = () => ({ zoom: map.getZoom(), bounds: map.getBounds().pad(0.5) })
  const [view, setView] = useState(read)
  useMapEvents({ moveend: () => setView(read()) })
  return view
}

const LandmarkPin = memo(function LandmarkPin({ marker: m }: { marker: MarkerData }) {
  const select = useUi((s) => s.select)
  return (
    <Marker
      position={toLatLng(m.x, m.y)}
      icon={labelIcon(m.name)}
      keyboard={false}
      eventHandlers={{ click: () => select(m.id) }}
    />
  )
})

// Only labels near the viewport and at their own zoom level get DOM nodes, instead of all ~590 at all times.
function Landmarks({ markers }: { markers: MarkerData[] }) {
  const { zoom, bounds } = useViewport()
  const shown = useMemo(
    () => markers.filter((m) => landmarkVisibleAt(m, zoom) && bounds.contains(toLatLng(m.x, m.y))),
    [markers, zoom, bounds],
  )
  return shown.map((m) => <LandmarkPin key={m.id} marker={m} />)
}

/** Region names (far out) then subregion names (zoom 2-3), before individual landmarks take over. */
function AreaLabels() {
  const { zoom, bounds } = useViewport()
  const shown = useMemo(
    () => AREA_LABELS.filter((l) => areaVisibleAt(l, zoom) && bounds.contains(toLatLng(l.x, l.y))),
    [zoom, bounds],
  )
  return shown.map((l) => (
    <Marker
      key={l.id}
      position={toLatLng(l.x, l.y)}
      icon={labelIcon(l.name, l.kind === 'region' ? 'region-label' : 'area-label')}
      interactive={false}
      keyboard={false}
    />
  ))
}

export function MapView() {
  const visible = useVisibleMarkers()
  const landmarksOn = useUi((s) => !!s.enabled.landmark)
  const landmarks = useMemo(() => visible.filter((m) => m.category === 'landmark'), [visible])
  const pins = useMemo(() => visible.filter((m) => m.category !== 'landmark'), [visible])
  const focusId = useUi((s) => s.focusId)
  const focusDone = useProgress((s) => (focusId ? focusId in s.completed : false))
  const hideCompleted = useUi((s) => s.hideCompleted)
  const select = useUi((s) => s.select)
  // Landmarks are plain labels outside the cluster group, so their highlight is drawn here. Every other marker is
  // highlighted on its own pin inside the cluster group (see ClusterLayer), so it never appears twice.
  const focusedMarker = focusId && !(hideCompleted && focusDone) ? MARKER_BY_ID.get(focusId) : undefined
  const focused = focusedMarker?.category === 'landmark' ? focusedMarker : undefined

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
      <ZoomControl position="bottomright" />
      {/* Sits under the tiles; its CSS box-shadow darkens the backdrop around the map edge. */}
      <Pane name="map-shadow" style={{ zIndex: 150 }}>
        <ImageOverlay
          url="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
          bounds={BOUNDS}
          className="map-edge-shadow"
          interactive={false}
        />
      </Pane>
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
      {/* Landmarks are plain text labels in a pane below the marker pane so pins overflow them. */}
      <Pane name="landmarks" style={{ zIndex: 450 }}>
        <Landmarks markers={landmarks} />
      </Pane>
      <ClusterLayer markers={pins} toLatLng={toLatLng} />
      {/* Above the pins (z 600) so region names stay readable over clusters; non-interactive so clicks fall through. */}
      <Pane name="area-labels" style={{ zIndex: 640, pointerEvents: 'none' }}>
        {landmarksOn && <AreaLabels />}
      </Pane>
      {focused && (
        // A landmark isn't in the cluster group, so its highlight is a separate pin.
        <Marker
          key={focused.id}
          position={toLatLng(focused.x, focused.y)}
          icon={markerIcon(focused.category, focusDone, true, focused.id)}
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

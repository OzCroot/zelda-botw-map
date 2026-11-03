import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { Marker, Pane, Polyline, useMap } from 'react-leaflet'
import { MAX_NATIVE_ZOOM } from '../../data/regions'
import { MARKER_BY_ID } from '../../data/loadMarkers'
import { useUi } from '../../store/ui'

const toLatLng = ([x, y]: [number, number]): L.LatLngTuple => [-y, x]

/** Numbered stop on the route. The last one is the goal (where the Korok appears / the race ends). */
const stopIcon = (n: number, last: boolean) =>
  L.divIcon({
    className: 'bg-transparent',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="path-stop${last ? ' path-stop-goal' : ''}">${n}</div>`,
  })

/**
 * The route of the marker whose "Show path" was pressed: a dark casing for contrast on any terrain, a soft muted-gold glow,
 * and a dashed line along it. The first point is the marker's own pin, so only the stops after
 * it are numbered.
 */
export function PathLayer() {
  const map = useMap()
  const pathId = useUi((s) => s.pathId)
  const fit = useUi((s) => s.pathFit)
  const path = pathId ? MARKER_BY_ID.get(pathId)?.path : undefined
  const points = useMemo(() => path?.map(toLatLng), [path])

  // Frame the whole route when it is asked for (not when it merely re-renders).
  useEffect(() => {
    if (!fit || !points) return
    map.flyToBounds(L.latLngBounds(points), {
      padding: [110, 110],
      maxZoom: MAX_NATIVE_ZOOM + 0.5,
      duration: 0.8,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new request (fit) should move the map
  }, [map, fit])

  if (!points) return null
  const round = { lineCap: 'round', lineJoin: 'round' } as const
  return (
    <>
      <Pane name="paths" style={{ zIndex: 430, pointerEvents: 'none' }}>
        <Polyline
          positions={points}
          interactive={false}
          className="seed-path-casing"
          pathOptions={{ ...round, color: '#10161f', weight: 9, opacity: 0.7 }}
        />
        <Polyline
          positions={points}
          interactive={false}
          className="seed-path-glow"
          pathOptions={{ ...round, color: '#b8975a', weight: 4.5, opacity: 0.95 }}
        />
        <Polyline
          positions={points}
          interactive={false}
          className="seed-path-dash"
          pathOptions={{ ...round, color: '#e9dfc3', weight: 2.5, opacity: 1, dashArray: '2 12' }}
        />
      </Pane>
      <Pane name="path-stops" style={{ zIndex: 620, pointerEvents: 'none' }}>
        {points.slice(1).map((p, i, rest) => (
          <Marker
            key={i}
            position={p}
            icon={stopIcon(i + 2, i === rest.length - 1)}
            interactive={false}
            keyboard={false}
          />
        ))}
      </Pane>
    </>
  )
}

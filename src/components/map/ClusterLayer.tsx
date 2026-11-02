import L from 'leaflet'
import 'leaflet.markercluster'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { useProgress } from '../../store/progress'
import { useUi } from '../../store/ui'
import type { Marker as MarkerData } from '../../types/marker'
import { handlePinImageError, markerIcon } from './icons'

/**
 * Clustered pins managed imperatively. Rendering ~3,600 <Marker> elements through React made every
 * filter or checkbox change rebuild them all; here each change only touches the pins that differ.
 */
export function ClusterLayer({
  markers,
  toLatLng,
}: {
  markers: MarkerData[]
  toLatLng: (x: number, y: number) => L.LatLngExpression
}) {
  const map = useMap()
  const completed = useProgress((s) => s.completed)
  const focusId = useUi((s) => s.focusId)
  const group = useRef<L.MarkerClusterGroup | null>(null)
  const pins = useRef(new Map<string, { pin: L.Marker; data: MarkerData }>())
  // Latest values, read when pins are created so the membership effect doesn't depend on them.
  const latest = useRef({ completed, focusId, toLatLng })
  useEffect(() => {
    latest.current = { completed, focusId, toLatLng }
  })

  useEffect(() => {
    const g = new L.MarkerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 40,
      showCoverageOnHover: false,
    })
    group.current = g
    map.addLayer(g)
    const container = map.getContainer()
    container.addEventListener('error', handlePinImageError, true)
    const all = pins.current
    return () => {
      container.removeEventListener('error', handlePinImageError, true)
      map.removeLayer(g)
      all.clear()
      group.current = null
    }
  }, [map])

  // Membership: add pins that became visible, remove ones that no longer are.
  useEffect(() => {
    const g = group.current
    if (!g) return
    const all = pins.current
    const next = new Set(markers.map((m) => m.id))
    const gone: L.Marker[] = []
    for (const [id, { pin }] of all)
      if (!next.has(id)) {
        gone.push(pin)
        all.delete(id)
      }
    const added: L.Marker[] = []
    const { completed, focusId, toLatLng } = latest.current
    for (const m of markers) {
      if (all.has(m.id)) continue
      const pin = L.marker(toLatLng(m.x, m.y), {
        icon: markerIcon(m.category, m.id in completed, m.id === focusId, m.id),
        title: m.name,
      })
      pin.on('click', () => useUi.getState().select(m.id))
      all.set(m.id, { pin, data: m })
      added.push(pin)
    }
    if (gone.length) g.removeLayers(gone)
    if (added.length) g.addLayers(added)
  }, [markers])

  // Appearance: swap icons only on pins whose done/selected state changed.
  useEffect(() => {
    for (const { pin, data: m } of pins.current.values()) {
      const icon = markerIcon(m.category, m.id in completed, m.id === focusId, m.id)
      if (pin.options.icon !== icon) pin.setIcon(icon)
    }
  }, [completed, focusId, markers])

  return null
}

import { useMemo } from 'react'
import { MARKERS } from '../data/loadMarkers'
import { useProgress } from '../store/progress'
import { useUi } from '../store/ui'

export function useVisibleMarkers() {
  const enabled = useUi((s) => s.enabled)
  const hideCompleted = useUi((s) => s.hideCompleted)
  const region = useUi((s) => s.region)
  const masterMode = useUi((s) => s.masterMode)
  const hiddenRegions = useUi((s) => s.hiddenRegions)
  const completed = useProgress((s) => s.completed)
  return useMemo(
    () =>
      MARKERS.filter(
        (m) =>
          enabled[m.category] &&
          (masterMode || !m.tags?.includes('Master Mode')) &&
          !(m.region && hiddenRegions[m.category]?.includes(m.region)) &&
          (!region || m.region === region) &&
          !(hideCompleted && m.id in completed),
      ),
    [enabled, masterMode, hiddenRegions, hideCompleted, region, completed],
  )
}

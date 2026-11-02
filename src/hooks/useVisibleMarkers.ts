import { MARKERS } from '../data/loadMarkers'
import { useProgress } from '../store/progress'
import { useUi } from '../store/ui'
import type { Marker } from '../types/marker'

type Inputs = [
  enabled: Record<string, boolean>,
  masterMode: boolean,
  hiddenRegions: Record<string, string[]>,
  hideCompleted: boolean,
  region: string | null,
  completed: Record<string, number>,
]

// The map and the list both ask for the visible markers. Keep the last result so the (~3.7k marker) filter
// runs once per change of inputs instead of once per component.
let last: { inputs: Inputs; result: Marker[] } | undefined

function filterVisible(inputs: Inputs): Marker[] {
  if (last && last.inputs.every((v, i) => v === inputs[i])) return last.result
  const [enabled, masterMode, hiddenRegions, hideCompleted, region, completed] = inputs
  const result = MARKERS.filter(
    (m) =>
      enabled[m.category] &&
      (masterMode || !m.tags?.includes('Master Mode')) &&
      !(m.region && hiddenRegions[m.category]?.includes(m.region)) &&
      (!region || m.region === region) &&
      !(hideCompleted && m.id in completed),
  )
  last = { inputs, result }
  return result
}

export function useVisibleMarkers(): Marker[] {
  const enabled = useUi((s) => s.enabled)
  const hideCompleted = useUi((s) => s.hideCompleted)
  const region = useUi((s) => s.region)
  const masterMode = useUi((s) => s.masterMode)
  const hiddenRegions = useUi((s) => s.hiddenRegions)
  const completed = useProgress((s) => s.completed)
  return filterVisible([enabled, masterMode, hiddenRegions, hideCompleted, region, completed])
}
